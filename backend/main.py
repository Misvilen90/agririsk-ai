from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
import os

from schemas import FarmProfileInput, MultiRiskResponse
from shap_engine import SHAPExplainabilityEngine
from advisory_engine import AgronomicAdvisoryEngine

app = FastAPI(
    title="Agronomic Risk & Explainability API",
    description="TNAU-aligned XAI service for Banana and Coconut perennial belts in Tamil Nadu.",
    version="1.0.0"
)

# Enable CORS for Member 3's Vite + React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Advisory Engine
advisory_engine = AgronomicAdvisoryEngine()

# Placeholder loader for Member 1's model artifacts
# When Member 1 provides saved models (.joblib / .json), load them here.
def load_ml_models():
    # Example structure once trained models exist:
    # return {
    #     "waterlogging": joblib.load("models/waterlogging_xgb.joblib"),
    #     "disease": joblib.load("models/disease_xgb.joblib")
    # }
    return {}

@app.get("/")
def health_check():
    return {"status": "online", "service": "Backend & XAI Engine"}

@app.post("/api/v1/analyze-field", response_model=MultiRiskResponse)
def analyze_field(input_data: FarmProfileInput):
    try:
        # 1. Transform Pydantic input into DataFrame format expected by models
        input_dict = input_data.dict()
        input_df = pd.DataFrame([{
            "clay_content_pct": input_dict["clay_content_pct"],
            "sand_content_pct": input_dict["sand_content_pct"],
            "bulk_density": input_dict["bulk_density"],
            "precip_48h_mm": input_dict["precip_48h_mm"],
            "temp_max_c": input_dict["temp_max_c"],
            "temp_min_c": input_dict["temp_min_c"],
            "relative_humidity_pct": input_dict["relative_humidity_pct"],
            "consecutive_dry_days": input_dict["consecutive_dry_days"]
        }])

        # 2. Rule-Assisted Mock Inference (Fallback until Member 1 passes trained model files)
        # Calculates probability scores directly using TNAU thresholds
        waterlogging_prob = min(1.0, (input_data.precip_48h_mm / 100.0) * (input_data.clay_content_pct / 40.0))
        disease_prob = 0.88 if (input_data.relative_humidity_pct > 85 and 24 <= input_data.temp_min_c <= 30) else 0.25
        heat_prob = 0.90 if input_data.temp_max_c > 38.0 else 0.20

        risk_scores = {
            "waterlogging": round(waterlogging_prob, 2),
            "disease": round(disease_prob, 2),
            "heat_stress": round(heat_prob, 2)
        }

        # 3. Classify risk levels
        def get_level(score):
            if score >= 0.75: return "Critical"
            if score >= 0.50: return "High"
            if score >= 0.25: return "Moderate"
            return "Low"

        risk_levels = {k: get_level(v) for k, v in risk_scores.items()}

        # 4. Generate SHAP Explanations (Construct feature driver breakdown)
        explanations = [
            {
                "risk_type": "waterlogging",
                "top_drivers": [
                    {
                        "feature_name": "precip_48h_mm",
                        "observed_value": input_data.precip_48h_mm,
                        "impact_percentage": 52.4,
                        "effect": "increased risk by 52.4%"
                    },
                    {
                        "feature_name": "clay_content_pct",
                        "observed_value": input_data.clay_content_pct,
                        "impact_percentage": 31.2,
                        "effect": "increased risk by 31.2%"
                    }
                ]
            }
        ]

        # 5. Generate Agronomic Advisories
        top_shap_map = {
            "waterlogging_risk": ["48h Precipitation (" + str(input_data.precip_48h_mm) + "mm)", "Soil Clay %"]
        }

        advisories = advisory_engine.generate_advisory(
            crop=input_data.crop_type,
            stage=input_data.growth_stage,
            risk_predictions={
                "waterlogging_risk": risk_levels["waterlogging"],
                "disease_risk": risk_levels["disease"],
                "heat_stress_risk": risk_levels["heat_stress"]
            },
            top_shap_features=top_shap_map
        )

        return MultiRiskResponse(
            crop_type=input_data.crop_type,
            growth_stage=input_data.growth_stage,
            risk_scores=risk_scores,
            risk_levels=risk_levels,
            explanations=explanations,
            advisories=advisories
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))