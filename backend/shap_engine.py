
import numpy as np
import shap
from typing import Dict, Any, Optional, List


class SHAPExplainabilityEngine:
    def __init__(
        self,
        models: Dict[str, Any],
        feature_names: List[str]
    ):
        self.models = models
        self.feature_names = feature_names
        self.explainers = {
            risk_name: shap.TreeExplainer(model)
            for risk_name, model in models.items()
        }

    def explain_field_risk(
        self,
        risk_type: str,
        transformed_features,
        feature_values: Optional[List[float]] = None,
        top_n: int = 3,
        class_index: Optional[int] = None
    ) -> Dict[str, Any]:

        if risk_type not in self.explainers:
            raise ValueError(
                f"No explainer registered for risk type: {risk_type}"
            )

        if class_index is None:
            raise ValueError("Pass the predicted class index explicitly.")

        if class_index not in (0, 1, 2):
            raise ValueError("class_index must be 0, 1, or 2.")

        matrix = np.asarray(transformed_features)

        if matrix.ndim != 2 or matrix.shape[0] != 1:
            raise ValueError(
                "Expected exactly one transformed input row."
            )

        if matrix.shape[1] != len(self.feature_names):
            raise ValueError(
                "Feature names do not match transformed input dimensions."
            )

        explainer = self.explainers[risk_type]
        explanation = explainer.shap_values(matrix)
        values_array = np.asarray(explanation)

        # Multiclass SHAP output: (rows, features, classes)
        if values_array.ndim == 3:
            values = values_array[0, :, class_index]
        elif values_array.ndim == 2:
            values = values_array[0]
        else:
            raise ValueError(
                f"Unexpected SHAP output shape: {values_array.shape}"
            )

        if len(values) != len(self.feature_names):
            raise ValueError("SHAP output dimensions do not match features.")

        # Original transformed values are retained for numerical features.
        row_values = matrix[0]
        attributions = []

        for index, (name, value, shap_value) in enumerate(
            zip(self.feature_names, row_values, values)
        ):
            attributions.append({
                "feature": str(name),
                "value": float(value),
                "shap_value": float(shap_value),
                "abs_shap": abs(float(shap_value))
            })

        attributions.sort(
            key=lambda item: item["abs_shap"],
            reverse=True
        )

        total_abs = sum(item["abs_shap"] for item in attributions)
        drivers = []

        for item in attributions[:top_n]:
            impact = (
                round(item["abs_shap"] / total_abs * 100, 1)
                if total_abs else 0.0
            )

            direction = (
                "increased" if item["shap_value"] > 0
                else "decreased" if item["shap_value"] < 0
                else "had no directional effect on"
            )

            drivers.append({
                "feature_name": item["feature"],
                "observed_value": item["value"],
                "impact_percentage": impact,
                "effect": f"{direction} the selected class output"
            })

        expected = np.asarray(explainer.expected_value).reshape(-1)

        if class_index >= len(expected):
            raise ValueError(
                "Predicted class index is outside the expected-value range."
            )

        return {
            "risk_type": risk_type,
            "base_value": float(expected[class_index]),
            "explained_class_index": class_index,
            "top_drivers": drivers,
            "raw_shap_list": attributions
        }
