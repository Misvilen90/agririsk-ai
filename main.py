import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

# Load Dynamic Location Engine helper if available
try:
    from dynamic_location_engine import build_dynamic_field_payload
    HAS_DYNAMIC_ENGINE = True
except ImportError:
    HAS_DYNAMIC_ENGINE = False

app = FastAPI(
    title="AgriRisk AI Backend API",
    description="Field-Level Climate Risk Prediction Engine (Perennial Crops: Rose & Coconut)",
    version="2.0.0"
)

# Load Model Artifacts
try:
    dt_models = joblib.load("agririsk_dt_models.joblib")
    xgb_models = joblib.load("agririsk_xgb_models.joblib")
    ensemble_weights = joblib.load("agririsk_ensemble_weights.joblib")
    preprocessor = joblib.load("feature_preprocessor.joblib")
    print("All ML models, ensemble weights, and preprocessors loaded successfully!")
except Exception as e:
    print(f"Error loading model artifacts: {e}")

class FieldAnalysisRequest(BaseModel):
    crop_type: str = Field(..., json_schema_extra={"example": "Rose"})  # "Rose" or "Coconut"
    growth_stage: str = Field(..., json_schema_extra={"example": "Bud_Initiation"})
    latitude: Optional[float] = Field(None, json_schema_extra={"example": 12.7409})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": 77.8253})
    
    # Optional Manual Overrides (if dynamic API fetch is bypassed)
    clay_pct: Optional[float] = 24.0
    sand_pct: Optional[float] = 56.0
    bulk_density: Optional[float] = 1.36
    precip_mm: Optional[float] = 18.0
    temp_max_c: Optional[float] = 31.0
    temp_min_c: Optional[float] = 21.0
    rh_pct: Optional[float] = 84.0
    wind_speed_ms: Optional[float] = 3.5
    precip_3d_sum: Optional[float] = 42.0
    temp_max_3d_mean: Optional[float] = 30.5
    rh_3d_mean: Optional[float] = 82.0
    
def generate_agronomic_advisory(crop_type: str, growth_stage: str, risk_scores: Dict[str, int]) -> List[str]:
    """Domain-rule advisory engine for Rose and Coconut."""
    advisories = []
    
    # Waterlogging Advisory
    if risk_scores.get("risk_waterlogging") == 2:
        if crop_type == "Rose":
            advisories.append("HIGH WATERLOGGING: Open 45cm drainage trenches immediately to prevent root rot (Phytophthora) and stem dieback.")
        else:
            advisories.append("HIGH WATERLOGGING: Clear basin bunds and open perimeter field channels to evacuate standing water around palm bases.")
    elif risk_scores.get("risk_waterlogging") == 1:
        advisories.append("MODERATE WATERLOGGING: Avoid flood irrigation; monitor root zone soil moisture.")

    # Heat Stress Advisory
    if risk_scores.get("risk_heat_stress") == 2:
        if crop_type == "Rose":
            advisories.append("HIGH HEAT STRESS: Erect 30-50% shade nets or activate micro-sprinklers to prevent flower bud scorching.")
        else:
            advisories.append("HIGH HEAT STRESS: Apply 45cm coir-pith mulching around palm basins and initiate root feeding with 1% potassium nitrate.")
            
    # Disease Conducive Advisory
    if risk_scores.get("risk_disease") == 2:
        if crop_type == "Rose":
            advisories.append("HIGH DISEASE RISK: High humidity detected. Prune inner dense shoots and spray Mancozeb (0.2%) for Black Spot control.")
        else:
            advisories.append("HIGH DISEASE RISK: Apply 1% Bordeaux mixture to palm crown to protect against Bud Rot disease.")

    if not advisories:
        advisories.append("ALL METRICS NORMAL: Continue standard field management and scheduled fertilizer fertigation.")
        
    return advisories

@app.post("/api/analyze-field")
def analyze_field(payload: FieldAnalysisRequest):
    # 1. Resolve Dynamic GPS or Fallback Data
    if payload.latitude and payload.longitude and HAS_DYNAMIC_ENGINE:
        field_data = build_dynamic_field_payload(
            lat=payload.latitude,
            lon=payload.longitude,
            crop_type=payload.crop_type,
            growth_stage=payload.growth_stage
        )
    else:
        field_data = payload.dict()

    # 2. Extract context features and apply ColumnTransformer
    context_features = [
        "precip_mm", "temp_max_c", "temp_min_c", "rh_pct", "wind_speed_ms",
        "precip_3d_sum", "temp_max_3d_mean", "rh_3d_mean",
        "crop_type", "growth_stage", "clay_pct", "sand_pct", "bulk_density"
    ]
    
    input_df = pd.DataFrame([field_data])[context_features]
    transformed_features = preprocessor.transform(input_df)

    targets = ["risk_waterlogging", "risk_heat_stress", "risk_water_stress", "risk_disease"]
    predicted_risk_levels = {}
    
    # 3. Parallel Soft-Voting Weighted Ensemble Inference
    for target in targets:
        dt = dt_models[target]
        xgb = xgb_models[target]
        w_dt = ensemble_weights[target]["w_dt"]
        w_xgb = ensemble_weights[target]["w_xgb"]

        dt_probs = dt.predict_proba(transformed_features)[0]
        xgb_probs = xgb.predict_proba(transformed_features)[0]

        final_probs = (w_dt * dt_probs) + (w_xgb * xgb_probs)
        predicted_risk_levels[target] = int(np.argmax(final_probs))

    # 4. Identify Primary Threat & Calculate SHAP Explanations
    primary_threat = max(predicted_risk_levels, key=predicted_risk_levels.get)
    primary_model = xgb_models[primary_threat]

    num_cols = preprocessor.transformers_[0][2]
    cat_cols_encoded = preprocessor.transformers_[1][1].get_feature_names_out(
        preprocessor.transformers_[1][2]
    )
    feature_names = list(num_cols) + list(cat_cols_encoded)

    explainer = shap.TreeExplainer(primary_model)
    shap_vals = explainer.shap_values(transformed_features)

    # Multi-class SHAP extraction (Class 2 = High Risk, Class 1 = Moderate)
    if isinstance(shap_vals, list):
        target_class_idx = predicted_risk_levels[primary_threat]
        sv_local = shap_vals[target_class_idx][0]
    elif len(shap_vals.shape) == 3:
        target_class_idx = predicted_risk_levels[primary_threat]
        sv_local = shap_vals[0, :, target_class_idx]
    else:
        sv_local = shap_vals[0]

    top_indices = np.argsort(np.abs(sv_local))[-4:][::-1]
    top_drivers = [
        {"feature": str(feature_names[i]), "shap_impact": round(float(sv_local[i]), 4)}
        for i in top_indices
    ]

    # 5. Generate Agronomic Advisory
    advisories = generate_agronomic_advisory(payload.crop_type, payload.growth_stage, predicted_risk_levels)

    return {
        "status": "success",
        "crop_context": {
            "crop_type": payload.crop_type,
            "growth_stage": payload.growth_stage,
            "coordinates": {"latitude": payload.latitude, "longitude": payload.longitude}
        },
        "risk_predictions": predicted_risk_levels,
        "primary_threat": primary_threat,
        "xai_explanation": {
            "model_type": "Weighted Stacking Ensemble (DT + XGBoost)",
            "top_drivers": top_drivers
        },
        "advisory_plan": advisories
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)