import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, f1_score

def train_weighted_stacking_ensemble():
    # Load updated master dataset (Rose & Coconut)
    df = pd.read_csv("agririsk_perennial_master.csv")

    targets = ["risk_waterlogging", "risk_heat_stress", "risk_water_stress", "risk_disease"]
    context_features = [
        "precip_mm", "temp_max_c", "temp_min_c", "rh_pct", "wind_speed_ms",
        "precip_3d_sum", "temp_max_3d_mean", "rh_3d_mean",
        "crop_type", "growth_stage", "clay_pct", "sand_pct", "bulk_density"
    ]

    categorical_cols = ["crop_type", "growth_stage"]
    numeric_cols = [c for c in context_features if c not in categorical_cols]

    # Preprocessor for feature encoding
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", numeric_cols),
            ("cat", OneHotEncoder(sparse_output=False, handle_unknown="ignore"), categorical_cols)
        ]
    )

    X = df[context_features]
    y = df[targets]

    # Fit preprocessor on full dataset for consistent feature mapping
    X_trans = preprocessor.fit_transform(X)

    dt_models = {}
    xgb_models = {}
    ensemble_weights = {}

    print("=" * 75)
    print(" AGRIRISK AI: STRATIFIED 5-FOLD CROSS-VALIDATION & WEIGHTED STACKING ")
    print("=" * 75)

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for target in targets:
        y_target = y[target].values
        
        dt_oof_preds = np.zeros((len(df), 3))
        xgb_oof_preds = np.zeros((len(df), 3))

        # 1. Perform 5-Fold Cross-Validation
        for train_idx, val_idx in skf.split(X_trans, y_target):
            X_tr, X_va = X_trans[train_idx], X_trans[val_idx]
            y_tr, y_va = y_target[train_idx], y_target[val_idx]

            # Fit Decision Tree
            dt = DecisionTreeClassifier(max_depth=5, random_state=42)
            dt.fit(X_tr, y_tr)
            dt_oof_preds[val_idx] = dt.predict_proba(X_va)

            # Fit XGBoost
            xgb = XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42)
            xgb.fit(X_tr, y_tr)
            xgb_oof_preds[val_idx] = xgb.predict_proba(X_va)

        # 2. Evaluate Out-of-Fold Metrics
        dt_class_preds = np.argmax(dt_oof_preds, axis=1)
        xgb_class_preds = np.argmax(xgb_oof_preds, axis=1)

        dt_f1 = f1_score(y_target, dt_class_preds, average="weighted")
        xgb_f1 = f1_score(y_target, xgb_class_preds, average="weighted")

        # 3. Calculate Optimal Soft-Voting Weights based on relative F1 scores
        total_f1 = dt_f1 + xgb_f1
        w_dt = dt_f1 / total_f1
        w_xgb = xgb_f1 / total_f1

        # 4. Weighted Stacking Prediction
        weighted_oof_probs = (w_dt * dt_oof_preds) + (w_xgb * xgb_oof_preds)
        weighted_preds = np.argmax(weighted_oof_probs, axis=1)
        
        weighted_acc = accuracy_score(y_target, weighted_preds)
        weighted_f1 = f1_score(y_target, weighted_preds, average="weighted")

        # Train final production models on full dataset
        final_dt = DecisionTreeClassifier(max_depth=5, random_state=42).fit(X_trans, y_target)
        final_xgb = XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42).fit(X_trans, y_target)

        dt_models[target] = final_dt
        xgb_models[target] = final_xgb
        ensemble_weights[target] = {"w_dt": round(float(w_dt), 4), "w_xgb": round(float(w_xgb), 4)}

        print(f"\nTarget: {target}")
        print(f"  * 5-Fold Decision Tree F1 : {dt_f1:.4f}")
        print(f"  * 5-Fold XGBoost F1       : {xgb_f1:.4f}")
        print(f"  * Derived Weights         : DT = {w_dt:.3f} | XGB = {w_xgb:.3f}")
        print(f"  * Weighted Stacked Acc    : {weighted_acc * 100:.2f}% (F1: {weighted_f1:.4f})")

    # Save artifacts and learned weights
    joblib.dump(dt_models, "agririsk_dt_models.joblib")
    joblib.dump(xgb_models, "agririsk_xgb_models.joblib")
    joblib.dump(ensemble_weights, "agririsk_ensemble_weights.joblib")
    joblib.dump(preprocessor, "feature_preprocessor.joblib")

    print("\n" + "=" * 75)
    print("All models, preprocessors, and learned ensemble weights saved!")
    print("=" * 75)

if __name__ == "__main__":
    train_weighted_stacking_ensemble()