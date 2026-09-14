import shap
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple

class SHAPExplainabilityEngine:
    def __init__(self, models: Dict[str, Any]):
        """
        :param models: Dictionary containing trained tree-based models
                       e.g., {'waterlogging': model_obj, 'heat_stress': model_obj}
        """
        self.models = models
        self.explainers = {}
        
        # Initialize TreeExplainer for each loaded model
        for risk_name, model in self.models.items():
            self.explainers[risk_name] = shap.TreeExplainer(model)

    def explain_field_risk(
        self, 
        risk_type: str, 
        input_dataframe: pd.DataFrame, 
        top_n: int = 3
    ) -> Dict[str, Any]:
        """
        Computes SHAP values for a single field prediction and returns top drivers.
        """
        if risk_type not in self.explainers:
            raise ValueError(f"No explainer registered for risk type: {risk_type}")

        explainer = self.explainers[risk_type]
        shap_values = explainer(input_dataframe)

        # Handle multi-class vs single binary/regression output
        if len(shap_values.shape) == 3:
            # Multi-class: Pick predicted class index or highest risk class
            vals = shap_values.values[0, :, 1]
        else:
            vals = shap_values.values[0]

        feature_names = input_dataframe.columns.tolist()
        feature_values = input_dataframe.iloc[0].values

        # Pair features with SHAP impact values
        attributions = []
        for name, val, shap_val in zip(feature_names, feature_values, vals):
            attributions.append({
                "feature": name,
                "value": float(val),
                "shap_value": float(shap_val),
                "abs_shap": abs(float(shap_val))
            })

        # Sort features by highest absolute SHAP impact
        attributions.sort(key=lambda x: x["abs_shap"], reverse=True)
        top_drivers = attributions[:top_n]

        # Calculate percentage impact for UI rendering
        total_abs_impact = sum([a["abs_shap"] for a in attributions]) or 1.0
        
        formatted_drivers = []
        for d in top_drivers:
            impact_pct = round((d["abs_shap"] / total_abs_impact) * 100, 1)
            direction = "increased" if d["shap_value"] > 0 else "decreased"
            formatted_drivers.append({
                "feature_name": d["feature"],
                "observed_value": d["value"],
                "impact_percentage": impact_pct,
                "effect": f"{direction} risk by {impact_pct}%"
            })

        return {
            "risk_type": risk_type,
            "base_value": float(
                explainer.expected_value 
                if isinstance(explainer.expected_value, (int, float)) 
                else explainer.expected_value[0]
            ),
            "top_drivers": formatted_drivers,
            "raw_shap_list": attributions
        }