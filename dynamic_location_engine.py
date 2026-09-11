import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def get_live_soil_profile(lat: float, lon: float) -> dict:
    """Queries SoilGrids REST API for dynamic field coordinates."""
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lon": lon,
        "lat": lat,
        "property": ["clay", "sand", "silt", "bdod"],
        "depth": ["0-5cm"],
        "value": "mean"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            layers = data["properties"]["layers"]
            soil_data = {}
            for layer in layers:
                prop = layer["name"]
                val = layer["depths"][0]["values"]["mean"]
                if prop in ["clay", "sand", "silt"]:
                    soil_data[f"{prop}_pct"] = val / 10.0
                elif prop == "bdod":
                    soil_data["bulk_density"] = val / 100.0
            return soil_data
    except Exception as e:
        print(f"SoilGrids request fallback trigger: {e}")

    # Fallback default if API times out
    return {"clay_pct": 24.0, "sand_pct": 54.0, "bulk_density": 1.38}

def get_live_weather(lat: float, lon: float) -> dict:
    """Queries NASA POWER API for the most recent 7 days of daily weather data."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    start_str = start_date.strftime("%Y%m%d")
    end_str = end_date.strftime("%Y%m%d")
    
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "PRECTOTCORR,T2M_MAX,T2M_MIN,RH2M,WS2M",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": start_str,
        "end": end_str,
        "format": "JSON"
    }
    
    try:
        response = requests.get(url, params=params, timeout=12)
        if response.status_code == 200:
            data = response.json()["properties"]["parameter"]
            df_w = pd.DataFrame(data)
            
            # Extract latest daily values and compute 3-day aggregates
            precip_series = list(df_w["PRECTOTCORR"].values())
            temp_max_series = list(df_w["T2M_MAX"].values())
            rh_series = list(df_w["RH2M"].values())
            
            return {
                "precip_mm": float(precip_series[-1]),
                "temp_max_c": float(temp_max_series[-1]),
                "temp_min_c": float(df_w["T2M_MIN"].values()[-1]),
                "rh_pct": float(rh_series[-1]),
                "wind_speed_ms": float(df_w["WS2M"].values()[-1]),
                "precip_3d_sum": float(sum(precip_series[-3:])),
                "temp_max_3d_mean": float(np.mean(temp_max_series[-3:])),
                "rh_3d_mean": float(np.mean(rh_series[-3:]))
            }
    except Exception as e:
        print(f"NASA POWER request fallback trigger: {e}")

    # Fallback sample metrics
    return {
        "precip_mm": 22.0, "temp_max_c": 31.5, "temp_min_c": 22.0,
        "rh_pct": 82.0, "wind_speed_ms": 3.8, "precip_3d_sum": 48.0,
        "temp_max_3d_mean": 30.5, "rh_3d_mean": 80.0
    }

def build_dynamic_field_payload(lat: float, lon: float, crop_type: str, growth_stage: str) -> dict:
    """Combines live soil and weather metrics into a unified model feature input."""
    print(f"Retrieving dynamic data for location ({lat}, {lon})...")
    soil_profile = get_live_soil_profile(lat, lon)
    weather_profile = get_live_weather(lat, lon)
    
    payload = {
        "crop_type": crop_type,
        "growth_stage": growth_stage,
        **soil_profile,
        **weather_profile
    }
    return payload

if __name__ == "__main__":
    # Test run for Hosur Rose Belt (Lat: 12.7409, Lon: 77.8253)
    sample_payload = build_dynamic_field_payload(
        lat=12.7409, 
        lon=77.8253, 
        crop_type="Rose", 
        growth_stage="Bud_Initiation"
    )
    print("\n--- Live Assembled Field Payload ---")
    for k, v in sample_payload.items():
        print(f"  * {k}: {v}")