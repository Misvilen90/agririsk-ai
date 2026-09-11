import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score

def run_smote_benchmark():
    df = pd.read_csv("agririsk_perennial_master.csv")
    preprocessor = joblib.load("feature_preprocessor.joblib")

    targets = ["risk_waterlogging", "risk_heat_stress", "risk_water_stress", "risk_disease"]
    context_features = [
        "precip_mm", "temp_max_c", "temp_min_c", "rh_pct", "wind_speed_ms",
        "precip_3d_sum", "temp_max_3d_mean", "rh_3d_mean",
        "crop_type", "growth_stage", "clay_pct", "sand_pct", "bulk_density"
    ]

    X = df[context_features]
    y = df[targets]

    X_trans = preprocessor.transform(X)
    X_train, X_test, y_train, y_test = train_test_split(X_trans, y, test_size=0.2, random_state=42)

    print("=" * 80)
    print(" AGRIRISK AI: SMOTE OVERSAMPLING & COMPREHENSIVE PERFORMANCE REPORT ")
    print("=" * 80)

    smote = SMOTE(random_state=42)

    for target in targets:
        y_tr = y_train[target].values
        y_ts = y_test[target].values

        # 1. Apply SMOTE on training set
        X_tr_smote, y_tr_smote = smote.fit_resample(X_train, y_tr)

        # 2. Train Decision Tree and XGBoost on SMOTE-balanced data
        dt = DecisionTreeClassifier(max_depth=5, random_state=42).fit(X_tr_smote, y_tr_smote)
        xgb = XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42).fit(X_tr_smote, y_tr_smote)

        # 3. Soft-Voting Weighted Prediction
        dt_probs = dt.predict_proba(X_test)
        xgb_probs = xgb.predict_proba(X_test)
        
        # Soft voting blend
        ensemble_probs = (0.4 * dt_probs) + (0.6 * xgb_probs)
        final_preds = np.argmax(ensemble_probs, axis=1)

        acc = accuracy_score(y_ts, final_preds)
        weighted_f1 = f1_score(y_ts, final_preds, average="weighted")

        clean_target_name = target.replace("risk_", "").replace("_", " ").title()
        print(f"\nTarget: {clean_target_name} Risk")
        print(f"Overall Accuracy : {acc * 100:.2f}%")
        print(f"Weighted F1-Score: {weighted_f1:.4f}")
        print("-" * 50)
        print("Detailed Classification Metric Breakdown:")
        print(classification_report(y_ts, final_preds, target_names=["Low (0)", "Moderate (1)", "High (2)"]))

if __name__ == "__main__":
    run_smote_benchmark()