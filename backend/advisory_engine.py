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

        # 1. Waterlogging Risk Rule
        if risk_predictions.get("waterlogging_risk") in ["High", "Critical"]:
            drivers = top_shap_features.get("waterlogging_risk", [])
            primary_driver = drivers[0] if drivers else "high rainfall"
            
            if crop == "Banana":
                action = "Construct 60cm deep peripheral drainage trenches between rows. Delay planned fertigation applications to avoid nutrient leaching."
            else: # Coconut
                action = "Clear basin drainage channels around palms. Apply 2 kg gypsum per palm after water recedes to rebuild soil aeration."
            
            advisories.append({
                "risk_type": "Waterlogging Risk",
                "severity": risk_predictions["waterlogging_risk"],
                "primary_driver": primary_driver,
                "advisory": action,
                "urgency": "Immediate (Within 24h)"
            })

        # 2. Disease Conducive Risk Rule
        if risk_predictions.get("disease_risk") in ["High", "Critical"]:
            disease_name = "Sigatoka Leaf Spot" if crop == "Banana" else "Bud Rot / Leaf Rot"
            
            if crop == "Banana":
                action = "Prune and safely burn infected leaves displaying yellow/brown streaks. Apply copper oxychloride (2.5 g/L) or mineral oil spray as per TNAU schedules."
            else:
                action = "Apply 1% Bordeaux mixture to the crown region. Ensure proper crown cleaning before monsoon intensification."

            advisories.append({
                "risk_type": f"Disease Risk ({disease_name})",
                "severity": risk_predictions["disease_risk"],
                "primary_driver": "Sustained high humidity and favorable microclimate temperatures",
                "advisory": action,
                "urgency": "High (Within 48h)"
            })

        # 3. Heat & Water Stress Rules
        if risk_predictions.get("heat_stress_risk") in ["High", "Critical"]:
            if crop == "Coconut" and stage == "Flowering/Button Formation":
                action = "Root feed TNAU Coconut Tonic (200 ml/palm) to reduce button shedding. Apply coir pith mulching in a 1.8m radius basin."
            else:
                action = "Increase drip irrigation frequency during early morning hours. Apply kaolin spray (3%) on leaves to lessen transpiration loss."

            advisories.append({
                "risk_type": "Heat & Transpiration Stress",
                "severity": risk_predictions["heat_stress_risk"],
                "primary_driver": "Extreme daytime temperatures exceeding crop threshold",
                "advisory": action,
                "urgency": "Moderate"
            })

        return advisories