import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from schemas import (
    FarmProfileInput,
    LocationAnalysisResponse,
    LocationInput,
    MultiRiskResponse,
)
from location_data import LocationDataError, fetch_location_inputs
from advisory_engine import AgronomicAdvisoryEngine
from shap_engine import SHAPExplainabilityEngine
from database import SessionLocal, init_db, QueryLog


# ---------------------------------------------------------
# 1. LOAD TRAINED MODELS AND PREPROCESSOR
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

preprocessor = joblib.load(PROJECT_ROOT / "feature_preprocessor.joblib")
dt_models = joblib.load(PROJECT_ROOT / "agririsk_dt_models.joblib")
xgb_models = joblib.load(PROJECT_ROOT / "agririsk_xgb_models.joblib")
ensemble_weights = joblib.load(
    PROJECT_ROOT / "agririsk_ensemble_weights.joblib"
)

FEATURE_NAMES = list(preprocessor.get_feature_names_out())

shap_engine = SHAPExplainabilityEngine(
    models=dt_models,
    feature_names=FEATURE_NAMES
)

MODEL_TO_API = {
    "risk_waterlogging": "waterlogging",
    "risk_heat_stress": "heat_stress",
    "risk_water_stress": "water_stress",
    "risk_disease": "disease",
}

CLASS_LEVELS = {
    0: "Low",
    1: "Moderate",
    2: "High",
}

SUPPORTED_CROPS = {"Rose", "Coconut"}

# Growth stages the preprocessor was trained on, grouped by crop.
STAGES_BY_CROP = {
    "Rose": ["Pruning_Vegetative", "Bud_Initiation", "Active_Harvesting"],
    "Coconut": ["Vegetative_Young", "Inflorescence_Button", "Nut_Maturity"],
}

SUPPORTED_GROWTH_STAGES = {
    stage for stages in STAGES_BY_CROP.values() for stage in stages
}


# ---------------------------------------------------------
# 2. DATABASE INITIALIZATION
# ---------------------------------------------------------

init_db()


def get_db():
    """Provide one SQLite session per API request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------
# 3. FASTAPI APPLICATION
# ---------------------------------------------------------

app = FastAPI(
    title="Agronomic Risk & Explainability API",
    description=(
        "ML ensemble and SHAP-supported advisory service "
        "for Rose and Coconut crops."
    ),
    version="1.4.0"
)

# Comma-separated list of allowed frontend origins (override in production).
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

advisory_engine = AgronomicAdvisoryEngine()


# ---------------------------------------------------------
# 4. HEALTH CHECK
# ---------------------------------------------------------

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "ML Ensemble, SHAP, Advisory & SQLite API",
        "supported_crops": sorted(SUPPORTED_CROPS),
        "supported_growth_stages": sorted(SUPPORTED_GROWTH_STAGES),
        "growth_stages_by_crop": STAGES_BY_CROP,
        "risk_types": list(MODEL_TO_API.values()),
        "database": "SQLite",
    }


# ---------------------------------------------------------
# 5. FIELD ANALYSIS ENDPOINT
# ---------------------------------------------------------

@app.post("/api/v1/analyze-field", response_model=MultiRiskResponse)
def analyze_field(
    input_data: FarmProfileInput,
    db: Session = Depends(get_db),
):
    return run_analysis(input_data, db)


@app.post("/api/v1/analyze-location", response_model=LocationAnalysisResponse)
def analyze_location(
    location: LocationInput,
    db: Session = Depends(get_db),
):
    """GPS mode: fetch weather (NASA POWER) and soil (SoilGrids) for the
    coordinates, then run the same analysis as /analyze-field."""
    try:
        fetched = fetch_location_inputs(location.latitude, location.longitude)
    except LocationDataError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        farm = FarmProfileInput(
            crop_type=location.crop_type,
            growth_stage=location.growth_stage,
            latitude=location.latitude,
            longitude=location.longitude,
            **fetched.model_inputs,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Fetched field data failed validation: {exc}",
        ) from exc

    base = run_analysis(farm, db)
    return LocationAnalysisResponse(
        **base.model_dump(),
        inputs_used=fetched.model_inputs,
        data_notes=fetched.notes,
        weather_date=fetched.weather_date,
    )


def run_analysis(input_data: FarmProfileInput, db: Session) -> MultiRiskResponse:
    try:
        # 5.1 Validate model-supported inputs
        if input_data.crop_type not in SUPPORTED_CROPS:
            raise HTTPException(
                status_code=400,
                detail="crop_type must be 'Rose' or 'Coconut'.",
            )

        if input_data.growth_stage not in SUPPORTED_GROWTH_STAGES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported growth_stage. Use one of: "
                    + ", ".join(sorted(SUPPORTED_GROWTH_STAGES))
                ),
            )

        if input_data.growth_stage not in STAGES_BY_CROP[input_data.crop_type]:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"growth_stage '{input_data.growth_stage}' is not valid "
                    f"for {input_data.crop_type}. Use one of: "
                    + ", ".join(STAGES_BY_CROP[input_data.crop_type])
                ),
            )

        # 5.2 Map API fields to the exact 13 model input columns
        model_input = pd.DataFrame([{
            "precip_mm": input_data.precip_mm,
            "temp_max_c": input_data.temp_max_c,
            "temp_min_c": input_data.temp_min_c,
            "rh_pct": input_data.relative_humidity_pct,
            "wind_speed_ms": input_data.wind_speed_ms,
            "precip_3d_sum": input_data.precip_3d_sum,
            "temp_max_3d_mean": input_data.temp_max_3d_mean,
            "rh_3d_mean": input_data.rh_3d_mean,
            "crop_type": input_data.crop_type,
            "growth_stage": input_data.growth_stage,
            "clay_pct": input_data.clay_content_pct,
            "sand_pct": input_data.sand_content_pct,
            "bulk_density": input_data.bulk_density,
        }])

        # 5.3 Transform features using the saved preprocessor
        transformed = preprocessor.transform(model_input)

        # 5.4 Generate weighted ensemble predictions and SHAP explanations
        risk_scores = {}
        risk_levels = {}
        explanations = []
        top_shap_map = {}
        advisory_predictions = {}

        for model_key, api_key in MODEL_TO_API.items():
            dt_model = dt_models[model_key]
            xgb_model = xgb_models[model_key]

            dt_probabilities = dt_model.predict_proba(transformed)[0]
            xgb_probabilities = xgb_model.predict_proba(transformed)[0]

            weights = ensemble_weights[model_key]
            ensemble_probabilities = (
                weights["w_dt"] * dt_probabilities
                + weights["w_xgb"] * xgb_probabilities
            )

            predicted_class = int(np.argmax(ensemble_probabilities))

            # Score = ensemble probability of the High Risk class.
            risk_scores[api_key] = round(
                float(ensemble_probabilities[2]), 4
            )
            risk_levels[api_key] = CLASS_LEVELS[predicted_class]

            # SHAP explains the selected class of the Decision Tree model,
            # not the complete weighted ensemble.
            shap_result = shap_engine.explain_field_risk(
                risk_type=model_key,
                transformed_features=transformed,
                top_n=3,
                class_index=predicted_class,
            )

            explanations.append({
                "risk_type": api_key,
                "top_drivers": shap_result["top_drivers"],
            })

            top_shap_map[f"{api_key}_risk"] = [
                (
                    f"{driver['feature_name']} "
                    f"(value={driver['observed_value']})"
                )
                for driver in shap_result["top_drivers"]
            ]

            advisory_predictions[f"{api_key}_risk"] = risk_levels[api_key]

        # 5.5 Generate crop-specific agronomic advisories
        advisories = advisory_engine.generate_advisory(
            crop=input_data.crop_type,
            stage=input_data.growth_stage,
            risk_predictions=advisory_predictions,
            top_shap_features=top_shap_map,
        )

        # 5.6 Construct the existing API response schema
        response = MultiRiskResponse(
            crop_type=input_data.crop_type,
            growth_stage=input_data.growth_stage,
            risk_scores=risk_scores,
            risk_levels=risk_levels,
            explanations=explanations,
            advisories=advisories,
        )

        # 5.7 Persist the complete response to SQLite
        # The existing table has dedicated columns for only three risks.
        # All four scores and explanations remain in the response JSON.
        query_record = QueryLog(
            crop_type=input_data.crop_type,
            growth_stage=input_data.growth_stage,
            latitude=input_data.latitude,
            longitude=input_data.longitude,
            waterlogging_score=risk_scores["waterlogging"],
            disease_score=risk_scores["disease"],
            heat_stress_score=risk_scores["heat_stress"],
            generated_advisory=response.model_dump_json(),
        )

        db.add(query_record)
        db.commit()
        db.refresh(query_record)

        return response

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Field analysis failed: {str(exc)}",
        ) from exc
