import joblib
import pandas as pd
import numpy as np
import shap

def explain_field_risk(sample_input: dict, target_risk: str = "risk_waterlogging"):
    """
    Computes local feature attributions using SHAP TreeExplainer.
    
    sample_input: dict containing all context and weather features
    target_risk: one of ['risk_waterlogging', 'risk_heat_stress', 'risk_water_stress', 'risk_disease']
    """
    # Load serialized artifacts
    models = joblib.load("agririsk_xgb_models.joblib")
    preprocessor = joblib.load("feature_preprocessor.joblib")
    
    model = models[target_risk]
    df_sample = pd.DataFrame([sample_input])
    
    # Transform input
    X_transformed = preprocessor.transform(df_sample)
    
    # Retrieve transformed feature names
    num_cols = preprocessor.transformers_[0][2]
    cat_cols_encoded = preprocessor.transformers_[1][1].get_feature_names_out(
        preprocessor.transformers_[1][2]
    )
    feature_names = list(num_cols) + list(cat_cols_encoded)
    
    # Initialize TreeExplainer
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_transformed)
    
    # Get predicted class (0: Low, 1: Moderate, 2: High)
    pred_class = int(model.predict(X_transformed)[0])
    
    # Extract feature impacts for the predicted class
    # For multi-class, shap_values is a list of arrays (one per class) or 3D array
    if isinstance(shap_values, list):
        class_shap = shap_values[pred_class][0]
    elif len(shap_values.shape) == 3:
        class_shap = shap_values[0, :, pred_class]
    else:
        class_shap = shap_values[0]

    # Rank features by positive contribution to this risk level
    contributions = []
    for name, val in zip(feature_names, class_shap):
        contributions.append({
            "feature": name,
            "shap_impact": round(float(val), 4)
        })
        
    contributions.sort(key=lambda x: x["shap_impact"], reverse=True)
    
    return {
        "target_risk": target_risk,
        "predicted_level": pred_class,
        "top_drivers": contributions[:4]  # Top 4 factors pushing this prediction
    }

if __name__ == "__main__":
    # Test case: Banana field in Thanjavur during intense rainfall
    sample_field = {
        "precip_mm": 45.0,
        "temp_max_c": 30.5,
        "temp_min_c": 24.0,
        "rh_pct": 88.0,
        "wind_speed_ms": 4.5,
        "precip_3d_sum": 78.0,
        "temp_max_3d_mean": 31.0,
        "rh_3d_mean": 86.0,
        "crop_type": "Banana",
        "growth_stage": "Shooting_Flowering",
        "clay_pct": 36.5,
        "sand_pct": 32.0,
        "bulk_density": 1.46
    }
    
    result = explain_field_risk(sample_field, target_risk="risk_waterlogging")
    print("\n--- SHAP Local Explanation Result ---")
    print(f"Risk Target: {result['target_risk']}")
    print(f"Predicted Severity: {result['predicted_level']} (0=Low, 1=Moderate, 2=High)")
    print("Primary Field Drivers:")
    for driver in result["top_drivers"]:
        print(f"  * {driver['feature']}: impact score {driver['shap_impact']}")