"""Fetch the model inputs for a GPS point from public data sources.

Weather: NASA POWER daily point API (community AG).
Soil:    ISRIC SoilGrids v2.0 (0-5 cm topsoil, mean prediction).

Only the standard library is used. Soil data is best-effort: if SoilGrids is
unavailable or has no value for the point, the schema defaults are used and a
note is returned so the caller can tell the user.
"""
import json
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

TIMEOUT_S = 20
POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
POWER_PARAMS = ["PRECTOTCORR", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M"]
POWER_MISSING = -999.0

# Same defaults as schemas.FarmProfileInput, used only if soil lookup fails.
SOIL_DEFAULTS = {
    "clay_content_pct": 38.0,
    "sand_content_pct": 25.0,
    "bulk_density": 1.4,
}


class LocationDataError(Exception):
    """Raised when weather data cannot be obtained for the location."""


@dataclass
class LocationInputs:
    model_inputs: Dict[str, float]
    weather_date: str
    notes: List[str] = field(default_factory=list)


def _get_json(url: str) -> dict:
    req = urllib.request.Request(
        url, headers={"Accept": "application/json", "User-Agent": "agririsk-ai/1.4"}
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _fetch_weather(lat: float, lon: float, today: Optional[datetime] = None):
    today = today or datetime.now(timezone.utc)
    end = today - timedelta(days=1)
    start = end - timedelta(days=9)
    query = urllib.parse.urlencode({
        "parameters": ",".join(POWER_PARAMS),
        "community": "AG",
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
    })
    try:
        data = _get_json(f"{POWER_URL}?{query}")
        series = data["properties"]["parameter"]
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, KeyError, TypeError) as exc:
        raise LocationDataError(
            "Could not retrieve weather data from NASA POWER "
            f"({type(exc).__name__}). Please try again, or use the manual simulator."
        ) from exc

    # Keep only days where every parameter has a real value, oldest -> newest.
    days = []
    try:
        for day in sorted(series["PRECTOTCORR"].keys()):
            row = {p: series[p].get(day) for p in POWER_PARAMS}
            if all(isinstance(v, (int, float)) and v != POWER_MISSING for v in row.values()):
                days.append((day, row))
    except (KeyError, AttributeError, TypeError) as exc:
        raise LocationDataError("NASA POWER returned an unexpected response.") from exc

    if len(days) < 3:
        raise LocationDataError(
            "NASA POWER has no recent weather data for this location. "
            "Use the manual simulator instead."
        )

    last3 = days[-3:]
    latest_day, latest = last3[-1]
    inputs = {
        "precip_mm": max(0.0, float(latest["PRECTOTCORR"])),
        "temp_max_c": float(latest["T2M_MAX"]),
        "temp_min_c": float(latest["T2M_MIN"]),
        "relative_humidity_pct": min(100.0, max(0.0, float(latest["RH2M"]))),
        "wind_speed_ms": max(0.0, float(latest["WS2M"])),
        "precip_3d_sum": max(0.0, sum(float(r["PRECTOTCORR"]) for _, r in last3)),
        "temp_max_3d_mean": sum(float(r["T2M_MAX"]) for _, r in last3) / 3,
        "rh_3d_mean": min(100.0, max(0.0, sum(float(r["RH2M"]) for _, r in last3) / 3)),
    }
    if inputs["temp_min_c"] > inputs["temp_max_c"]:
        inputs["temp_min_c"] = inputs["temp_max_c"]
    iso = f"{latest_day[:4]}-{latest_day[4:6]}-{latest_day[6:]}"
    return inputs, iso


def _fetch_soil(lat: float, lon: float):
    """Return (soil_inputs, None) or (None, reason)."""
    query = urllib.parse.urlencode(
        [("lon", f"{lon:.4f}"), ("lat", f"{lat:.4f}"),
         ("property", "clay"), ("property", "sand"), ("property", "bdod"),
         ("depth", "0-5cm"), ("value", "mean")]
    )
    try:
        data = _get_json(f"{SOILGRIDS_URL}?{query}")
        raw = {}
        for layer in data["properties"]["layers"]:
            raw[layer["name"]] = layer["depths"][0]["values"]["mean"]
        clay, sand, bdod = raw["clay"], raw["sand"], raw["bdod"]
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, KeyError,
            IndexError, TypeError) as exc:
        return None, f"SoilGrids unavailable ({type(exc).__name__})"

    if any(v is None for v in (clay, sand, bdod)):
        return None, "SoilGrids has no soil data for this point"

    # SoilGrids units: clay/sand in g/kg, bdod in cg/cm3.
    soil = {
        "clay_content_pct": float(clay) / 10.0,
        "sand_content_pct": float(sand) / 10.0,
        "bulk_density": float(bdod) / 100.0,
    }
    if (
        not (0 <= soil["clay_content_pct"] <= 100)
        or not (0 <= soil["sand_content_pct"] <= 100)
        or soil["clay_content_pct"] + soil["sand_content_pct"] > 100
        or not (0.3 <= soil["bulk_density"] <= 2.5)
    ):
        return None, "SoilGrids returned implausible values"
    return soil, None


def fetch_location_inputs(lat: float, lon: float) -> LocationInputs:
    with ThreadPoolExecutor(max_workers=2) as pool:
        weather_f = pool.submit(_fetch_weather, lat, lon)
        soil_f = pool.submit(_fetch_soil, lat, lon)
        weather, weather_date = weather_f.result()  # raises LocationDataError
        soil, soil_problem = soil_f.result()

    notes: List[str] = []
    if soil is None:
        soil = dict(SOIL_DEFAULTS)
        notes.append(
            f"{soil_problem}; typical default soil values were used "
            "(clay 38%, sand 25%, bulk density 1.4 g/cm³)."
        )
    inputs = {k: round(v, 3) for k, v in {**weather, **soil}.items()}
    return LocationInputs(model_inputs=inputs, weather_date=weather_date, notes=notes)
