import requests
import pandas as pd

def fetch_nasa_weather(lat, lon, start_date, end_date):
    """
    Fetches daily agro-climatology data from NASA POWER API.
    Dates must be in format: YYYYMMDD
    """
    base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    
    # Parameters for climate risk assessment:
    # PRECTOTCORR: Corrected Precipitation (mm/day)
    # T2M_MAX / T2M_MIN: Max & Min Temperature at 2m (C)
    # RH2M: Relative Humidity at 2m (%)
    # WS2M: Wind Speed at 2m (m/s)
    params = {
        "parameters": "PRECTOTCORR,T2M_MAX,T2M_MIN,RH2M,WS2M",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": start_date,
        "end": end_date,
        "format": "JSON"
    }

    print(f"Querying NASA POWER for ({lat}, {lon})...")
    response = requests.get(base_url, params=params)
    
    if response.status_code != 200:
        raise Exception(f"NASA API Request Failed: {response.status_code}, {response.text}")
        
    data = response.json()
    records = data["properties"]["parameter"]
    
    df = pd.DataFrame(records)
    df.index.name = "date"
    df.reset_index(inplace=True)
    df["latitude"] = lat
    df["longitude"] = lon
    
    return df

if __name__ == "__main__":
    # Example: 1 year of daily records for Pollachi (Coconut Belt)
    df_pollachi = fetch_nasa_weather(
        lat=10.6583, 
        lon=77.0094, 
        start_date="20240101", 
        end_date="20241231"
    )
    
    print(df_pollachi.head())
    df_pollachi.to_csv("pollachi_weather_raw.csv", index=False)
    print("Saved to pollachi_weather_raw.csv successfully!")