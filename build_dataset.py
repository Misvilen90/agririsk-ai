import pandas as pd
import numpy as np

def generate_perennial_dataset(weather_csv_path, output_csv_path):
    df_raw = pd.read_csv(weather_csv_path)
    
    # Standardize column naming
    df_raw.rename(columns={
        "PRECTOTCORR": "precip_mm",
        "T2M_MAX": "temp_max_c",
        "T2M_MIN": "temp_min_c",
        "RH2M": "rh_pct",
        "WS2M": "wind_speed_ms"
    }, inplace=True)

    records = []
    
    # Updated Crops: Rose (Horticultural Perennial) and Coconut (Plantation Perennial)
    crops = ["Rose", "Coconut"]
    growth_stages = {
        "Rose": ["Pruning_Vegetative", "Bud_Initiation", "Active_Harvesting"],
        "Coconut": ["Vegetative_Young", "Inflorescence_Button", "Nut_Maturity"]
    }
    
    # Soil Profiles:
    # Rose: Hosur well-drained red sandy clay loam (clay ~24%, sand ~56%, bulk density ~1.36)
    # Coconut: Pollachi red loam (clay ~22%, sand ~52%, bulk density ~1.38)
    crop_soil_map = {
        "Rose": {"clay_pct": 24.0, "sand_pct": 56.0, "bulk_density": 1.36},
        "Coconut": {"clay_pct": 22.0, "sand_pct": 52.0, "bulk_density": 1.38}
    }

    for crop in crops:
        stages = growth_stages[crop]
        soil = crop_soil_map[crop]
        
        df = df_raw.copy()
        df["crop_type"] = crop
        df["clay_pct"] = soil["clay_pct"]
        df["sand_pct"] = soil["sand_pct"]
        df["bulk_density"] = soil["bulk_density"]
        
        # Assign simulated stage distribution across records
        stage_indices = np.random.choice(stages, size=len(df))
        df["growth_stage"] = stage_indices
        
        # Rolling aggregates
        df["precip_3d_sum"] = df["precip_mm"].rolling(window=3, min_periods=1).sum()
        df["temp_max_3d_mean"] = df["temp_max_c"].rolling(window=3, min_periods=1).mean()
        df["rh_3d_mean"] = df["rh_pct"].rolling(window=3, min_periods=1).mean()

        # -------------------------------------------------------------
        # Domain Ground-Truth Risk Labeling (Rose & Coconut Dynamics)
        # 0 = Low Risk, 1 = Moderate Risk, 2 = High Risk
        # -------------------------------------------------------------
        
        # 1. Waterlogging Risk (Rose is extremely sensitive to root asphyxiation)
        def calc_waterlogging(row):
            effective_water = row["precip_3d_sum"] * (row["clay_pct"] / 22.0)
            if row["crop_type"] == "Rose":
                if effective_water > 60:  # Rose lower threshold due to shallow root rot sensitivity
                    return 2
                elif effective_water > 35:
                    return 1
            else:
                if effective_water > 80:
                    return 2
                elif effective_water > 45:
                    return 1
            return 0
            
        # 2. Heat Stress Risk (Bud scorching in Rose vs Button shedding in Coconut)
        def calc_heat_stress(row):
            temp = row["temp_max_3d_mean"]
            stage = row["growth_stage"]
            
            if row["crop_type"] == "Rose":
                if temp >= 35.0 or (temp >= 32.0 and stage == "Bud_Initiation"):
                    return 2  # Causes flower size reduction and petal burn
                elif temp >= 30.0:
                    return 1
            else:
                sensitive_stage = stage == "Inflorescence_Button"
                if temp >= 38.0 or (temp >= 36.0 and sensitive_stage):
                    return 2
                elif temp >= 35.0:
                    return 1
            return 0

        # 3. Water Stress Risk
        def calc_water_stress(row):
            if row["precip_3d_sum"] < 2.0 and row["temp_max_3d_mean"] > 33.0:
                if row["sand_pct"] > 50.0:
                    return 2
                return 1
            elif row["precip_3d_sum"] < 5.0 and row["temp_max_3d_mean"] > 30.0:
                return 1
            return 0

        # 4. Disease-Conducive Risk (Black Spot / Powdery Mildew in Rose)
        def calc_disease_risk(row):
            if row["crop_type"] == "Rose":
                # Black Spot & Powdery Mildew trigger: Moderate temp + High Humidity
                if row["rh_3d_mean"] > 80.0 and (18.0 <= row["temp_max_c"] <= 28.0):
                    if row["precip_3d_sum"] > 15.0:
                        return 2
                    return 1
            else:
                # Coconut Bud Rot
                if row["rh_3d_mean"] > 82.0 and (24.0 <= row["temp_max_c"] <= 32.0):
                    if row["precip_3d_sum"] > 25.0:
                        return 2
                    return 1
            return 0

        df["risk_waterlogging"] = df.apply(calc_waterlogging, axis=1)
        df["risk_heat_stress"] = df.apply(calc_heat_stress, axis=1)
        df["risk_water_stress"] = df.apply(calc_water_stress, axis=1)
        df["risk_disease"] = df.apply(calc_disease_risk, axis=1)

        records.append(df)

    final_df = pd.concat(records, ignore_index=True)
    final_df.to_csv(output_csv_path, index=False)
    print(f"Dataset updated with Rose & Coconut! Shape: {final_df.shape}")
    print(f"Saved to: {output_csv_path}")

if __name__ == "__main__":
    generate_perennial_dataset("pollachi_weather_raw.csv", "agririsk_perennial_master.csv")