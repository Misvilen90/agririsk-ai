from advisory_engine import AgronomicAdvisoryEngine

engine = AgronomicAdvisoryEngine()

test_advisory = engine.generate_advisory(
    crop="Banana",
    stage="Shooting",
    risk_predictions={"waterlogging_risk": "High", "disease_risk": "High"},
    top_shap_features={
        "waterlogging_risk": ["48h Rainfall (82mm)", "Soil Clay %"]
    }
)

print(test_advisory)