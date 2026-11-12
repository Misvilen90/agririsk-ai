"""API tests. Run: python -m pytest test_api.py -q   (needs pytest + httpx)

External services (NASA POWER, SoilGrids) are mocked; models are the real ones.
"""
import urllib.error
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import location_data
import main
from database import Base, QueryLog

BODY = dict(
    crop_type="Coconut", growth_stage="Nut_Maturity", latitude=10.6, longitude=77.0,
    clay_content_pct=35, sand_content_pct=30, bulk_density=1.3, precip_mm=20,
    temp_max_c=34, temp_min_c=22, relative_humidity_pct=75, wind_speed_ms=4,
    precip_3d_sum=60, temp_max_3d_mean=33, rh_3d_mean=78,
)
LOC = dict(crop_type="Rose", growth_stage="Bud_Initiation", latitude=10.6, longitude=77.0)


def power_payload(days=10, missing_last=0):
    end = datetime.now(timezone.utc) - timedelta(days=1)
    keys = [(end - timedelta(days=i)).strftime("%Y%m%d") for i in range(days)][::-1]
    def series(v):
        d = {k: v for k in keys}
        for k in keys[len(keys) - missing_last:]:
            d[k] = -999.0
        return d
    return {"properties": {"parameter": {
        "PRECTOTCORR": series(12.0), "T2M_MAX": series(33.0), "T2M_MIN": series(23.0),
        "RH2M": series(80.0), "WS2M": series(3.5)}}}


SOIL_PAYLOAD = {"properties": {"layers": [
    {"name": "clay", "depths": [{"values": {"mean": 350}}]},
    {"name": "sand", "depths": [{"values": {"mean": 300}}]},
    {"name": "bdod", "depths": [{"values": {"mean": 130}}]},
]}}


@pytest.fixture()
def client(tmp_path):
    eng = create_engine(f"sqlite:///{tmp_path/'t.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(eng)
    Session = sessionmaker(bind=eng, autoflush=False)
    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()
    main.app.dependency_overrides[main.get_db] = override
    c = TestClient(main.app)
    c.Session = Session
    yield c
    main.app.dependency_overrides.clear()


def mock_net(monkeypatch, power=None, soil=None):
    def fake(url):
        if "power.larc" in url:
            if isinstance(power, Exception):
                raise power
            return power or power_payload()
        if isinstance(soil, Exception):
            raise soil
        return soil or SOIL_PAYLOAD
    monkeypatch.setattr(location_data, "_get_json", fake)


def test_health(client):
    j = client.get("/").json()
    assert j["status"] == "online" and "Rose" in j["growth_stages_by_crop"]


def test_analyze_field_ok_and_logged(client):
    r = client.post("/api/v1/analyze-field", json=BODY)
    assert r.status_code == 200, r.text
    j = r.json()
    assert set(j["risk_scores"]) == {"waterlogging", "heat_stress", "water_stress", "disease"}
    assert all(v in ("Low", "Moderate", "High") for v in j["risk_levels"].values())
    assert len(j["explanations"]) == 4
    with client.Session() as s:
        assert s.query(QueryLog).count() == 1


@pytest.mark.parametrize("crop,stage", [(c, s) for c, ss in main.STAGES_BY_CROP.items() for s in ss])
def test_every_crop_stage_combo(client, crop, stage):
    assert client.post("/api/v1/analyze-field", json={**BODY, "crop_type": crop, "growth_stage": stage}).status_code == 200


def test_invalid_stage_for_crop(client):
    r = client.post("/api/v1/analyze-field", json={**BODY, "growth_stage": "Bud_Initiation"})
    assert r.status_code == 400


def test_location_ok(client, monkeypatch):
    mock_net(monkeypatch)
    r = client.post("/api/v1/analyze-location", json=LOC)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["inputs_used"]["clay_content_pct"] == 35.0
    assert j["inputs_used"]["bulk_density"] == 1.3
    assert j["inputs_used"]["precip_3d_sum"] == 36.0
    assert j["data_notes"] == [] and j["weather_date"]
    assert len(j["explanations"]) == 4


def test_location_skips_missing_days(client, monkeypatch):
    mock_net(monkeypatch, power=power_payload(missing_last=2))
    r = client.post("/api/v1/analyze-location", json=LOC)
    assert r.status_code == 200, r.text


def test_location_soil_failure_falls_back(client, monkeypatch):
    mock_net(monkeypatch, soil=urllib.error.URLError("down"))
    j = client.post("/api/v1/analyze-location", json=LOC).json()
    assert j["inputs_used"]["clay_content_pct"] == 38.0
    assert j["data_notes"] and "default" in j["data_notes"][0]


def test_location_soil_null_falls_back(client, monkeypatch):
    nulls = {"properties": {"layers": [
        {"name": n, "depths": [{"values": {"mean": None}}]} for n in ("clay", "sand", "bdod")]}}
    mock_net(monkeypatch, soil=nulls)
    j = client.post("/api/v1/analyze-location", json=LOC).json()
    assert j["data_notes"]


def test_location_weather_failure_is_502(client, monkeypatch):
    mock_net(monkeypatch, power=urllib.error.URLError("down"))
    r = client.post("/api/v1/analyze-location", json=LOC)
    assert r.status_code == 502 and "NASA POWER" in r.json()["detail"]


def test_location_no_valid_weather_is_502(client, monkeypatch):
    mock_net(monkeypatch, power=power_payload(missing_last=10))
    assert client.post("/api/v1/analyze-location", json=LOC).status_code == 502


def test_location_bad_stage_is_400(client, monkeypatch):
    mock_net(monkeypatch)
    r = client.post("/api/v1/analyze-location", json={**LOC, "growth_stage": "Nut_Maturity"})
    assert r.status_code == 400


def test_location_bad_coords_is_422(client):
    assert client.post("/api/v1/analyze-location", json={**LOC, "latitude": 999}).status_code == 422


def test_cors_allows_frontend_origin(client):
    r = client.options("/api/v1/analyze-field", headers={
        "Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
