import joblib
import pandas as pd
import numpy as np
import shap
import matplotlib.pyplot as plt

def generate_global_shap_plots():
    # 1. Load Dataset and Saved Artifacts
    df = pd.read_csv("agririsk_perennial_master.csv")
    xgb_models = joblib.load("agririsk_xgb_models.joblib")
    preprocessor = joblib.load("feature_preprocessor.joblib")

    targets = ["risk_waterlogging", "risk_heat_stress", "risk_water_stress", "risk_disease"]
    context_features = [
        "precip_mm", "temp_max_c", "temp_min_c", "rh_pct", "wind_speed_ms",
        "precip_3d_sum", "temp_max_3d_mean", "rh_3d_mean",
        "crop_type", "growth_stage", "clay_pct", "sand_pct", "bulk_density"
    ]

    # Preprocess feature array
    X = df[context_features]
    X_trans = preprocessor.transform(X)

    # Reconstruct human-readable feature names
    num_cols = preprocessor.transformers_[0][2]
    cat_cols_encoded = preprocessor.transformers_[1][1].get_feature_names_out(
        preprocessor.transformers_[1][2]
    )
    feature_names = list(num_cols) + list(cat_cols_encoded)

    # 2. Generate SHAP Beeswarm Plot for Waterlogging Risk
    target_risk = "risk_waterlogging"
    model = xgb_models[target_risk]

    print(f"Calculating SHAP values across full dataset for {target_risk}...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_trans)

    plt.figure(figsize=(10, 6))
    
    # Handle multi-class SHAP outputs (targeting High Risk Class = index 2)
    if isinstance(shap_values, list):
        sv = shap_values[2]
    elif len(shap_values.shape) == 3:
        sv = shap_values[:, :, 2]
    else:
        sv = shap_values

    # Plot Beeswarm Summary
    shap.summary_plot(
        sv, 
        X_trans, 
        feature_names=feature_names, 
        show=False,
        max_display=10
    )

    plt.title(f"Global SHAP Impact Analysis: Waterlogging High-Risk Drivers", fontsize=12, fontweight='bold')
    plt.tight_layout()
    
    output_filename = "agririsk_global_shap_waterlogging.png"
    plt.savefig(output_filename, dpi=300, bbox_inches='tight')
    plt.close()

    print(f"Successfully generated and saved: {output_filename}")

if __name__ == "__main__":
    generate_global_shap_plots()