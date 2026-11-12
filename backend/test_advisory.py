from advisory_engine import AgronomicAdvisoryEngine

engine = AgronomicAdvisoryEngine()

result = engine.generate_advisory(
    crop="Rose",
    stage="Bud_Initiation",
    risk_predictions={
        "waterlogging_risk": "High",
        "disease_risk": "High",
        "heat_stress_risk": "High",
        "water_stress_risk": "Low",
    },
    top_shap_features={
        "waterlogging_risk": ["num__precip_3d_sum (value=90.0)"],
    },
)

assert [a["risk_type"] for a in result] == [
    "Waterlogging Risk",
    "Disease Risk (Black Spot / Powdery Mildew)",
    "Heat & Transpiration Stress",
], result
assert "shade" in result[2]["advisory"].lower()  # stage-specific heat advice

print("advisory engine OK:", len(result), "advisories")
