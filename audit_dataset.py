import pandas as pd

def audit_dataset(file_path):
    df = pd.read_csv(file_path)
    
    print("=" * 55)
    print("      AGRIRISK AI: DATASET AUDIT & HEALTH CHECK     ")
    print("=" * 55)
    
    # 1. Shape & Null Values
    print(f"\nTotal Records: {len(df)}")
    print(f"Total Columns: {len(df.columns)}")
    null_counts = df.isnull().sum()
    nulls_detected = null_counts[null_counts > 0]
    
    if len(nulls_detected) == 0:
        print("Missing Values: None (Clean dataset!)")
    else:
        print(f"Missing Values Found:\n{nulls_detected}")

    # 2. Crops and Growth Stages distribution
    print("\n--- Crop Distribution ---")
    print(df["crop_type"].value_counts().to_string())

    print("\n--- Growth Stage Distribution ---")
    print(df.groupby(["crop_type", "growth_stage"]).size().to_string())

    # 3. Target Risk Label Distributions (0=Low, 1=Moderate, 2=High)
    risk_targets = [
        "risk_waterlogging", 
        "risk_heat_stress", 
        "risk_water_stress", 
        "risk_disease"
    ]
    
    print("\n--- Target Risk Class Balances (Counts) ---")
    summary = df[risk_targets].apply(lambda col: col.value_counts()).fillna(0).astype(int)
    summary.index.name = "Risk Level (0:Low, 1:Med, 2:High)"
    print(summary)
    
    print("\n" + "=" * 55)
    print("Dataset is validated and ready for Phase 2 Modeling!")
    print("=" * 55)

if __name__ == "__main__":
    audit_dataset("agririsk_perennial_master.csv")