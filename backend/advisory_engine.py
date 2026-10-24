from typing import Dict, List, Any
from rules import RISK_THRESHOLDS


class AgronomicAdvisoryEngine:
    def __init__(self):
        self.rules = RISK_THRESHOLDS

    def generate_advisory(
        self,
        crop: str,
        stage: str,
        risk_predictions: Dict[str, str],
        top_shap_features: Dict[str, List[str]]
    ) -> List[Dict[str, Any]]:

        advisories = []

        # -----------------------------
        # WATERLOGGING RISK
        # -----------------------------
        if risk_predictions.get("waterlogging_risk") in ["High", "Critical"]:

            drivers = top_shap_features.get("waterlogging_risk", [])
            primary_driver = drivers[0] if drivers else "high rainfall"

            if crop == "Rose":
                action = (
                    "Clear field drainage channels between raised beds immediately. "
                    "Ensure proper bed drainage to protect the root zone from "
                    "waterlogging and root-related damage."
                )

            elif crop == "Coconut":
                action = (
                    "Clear basin drainage channels around palms. "
                    "Ensure excess water drains away from the root zone "
                    "after heavy rainfall."
                )

            else:
                action = (
                    "Improve field drainage and remove standing water "
                    "from the crop root zone."
                )

            advisories.append({
                "risk_type": "Waterlogging Risk",
                "severity": risk_predictions["waterlogging_risk"],
                "primary_driver": primary_driver,
                "advisory": action,
                "urgency": "Immediate (Within 24h)"
            })

        # -----------------------------
        # DISEASE RISK
        # -----------------------------
        if risk_predictions.get("disease_risk") in ["High", "Critical"]:

            if crop == "Rose":
                disease_name = "Black Spot / Powdery Mildew"

                action = (
                    "Remove and safely dispose of infected leaves and plant parts. "
                    "Avoid overhead irrigation and maintain good air circulation "
                    "through proper pruning."
                )

            elif crop == "Coconut":
                disease_name = "Bud Rot / Leaf Rot"

                action = (
                    "Inspect and clean the crown region and improve drainage. "
                    "Remove severely affected plant material and follow "
                    "locally recommended disease-management practices."
                )

            else:
                disease_name = "Crop Disease"

                action = (
                    "Inspect affected plants, remove infected material where "
                    "appropriate, and improve field sanitation and airflow."
                )

            advisories.append({
                "risk_type": f"Disease Risk ({disease_name})",
                "severity": risk_predictions["disease_risk"],
                "primary_driver": (
                    "Sustained high humidity and favorable microclimate temperatures"
                ),
                "advisory": action,
                "urgency": "High (Within 48h)"
            })

        # -----------------------------
        # HEAT STRESS RISK
        # -----------------------------
        if risk_predictions.get("heat_stress_risk") in ["High", "Critical"]:

            if (
                crop == "Rose"
                and stage in [
                    "Pruning/Bud Initiation",
                    "Flowering/Harvesting"
                ]
            ):
                action = (
                    "Provide suitable shade protection where available and "
                    "schedule irrigation during cooler morning hours. "
                    "Use mulching to help conserve root-zone moisture."
                )

            elif (
                crop == "Coconut"
                and stage == "Flowering/Button Formation"
            ):
                action = (
                    "Maintain adequate soil moisture through irrigation and "
                    "apply organic mulch around the palm basin to reduce "
                    "moisture loss and protect the root zone."
                )

            else:
                action = (
                    "Increase irrigation during cooler morning hours where "
                    "needed and apply suitable mulching to reduce "
                    "transpiration and conserve soil moisture."
                )

            advisories.append({
                "risk_type": "Heat & Transpiration Stress",
                "severity": risk_predictions["heat_stress_risk"],
                "primary_driver": (
                    "Extreme daytime temperatures exceeding crop threshold"
                ),
                "advisory": action,
                "urgency": "Moderate"
            })

        # -----------------------------
        # WATER STRESS RISK
        # -----------------------------
        if risk_predictions.get("water_stress_risk") in ["High", "Critical"]:

            if crop == "Rose":
                action = (
                    "Check root-zone soil moisture and irrigate when needed, "
                    "preferably during cooler morning hours. Apply suitable "
                    "mulch to help conserve soil moisture."
                )
            elif crop == "Coconut":
                action = (
                    "Check soil moisture around the palm basin and provide "
                    "supplementary irrigation when needed. Apply organic mulch "
                    "to reduce moisture loss."
                )
            else:
                action = (
                    "Check soil moisture and provide suitable irrigation "
                    "when needed to reduce water stress."
                )

            drivers = top_shap_features.get("water_stress_risk", [])
            primary_driver = (
                drivers[0] if drivers
                else "Low soil moisture or prolonged dry conditions"
            )

            advisories.append({
                "risk_type": "Water Stress Risk",
                "severity": risk_predictions["water_stress_risk"],
                "primary_driver": primary_driver,
                "advisory": action,
                "urgency": "High (Assess within 24h)"
            })


        return advisories
