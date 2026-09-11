import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.model_selection import train_test_split

def generate_performance_charts():
    # Set plot styling
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
    
    # 1. Load Dataset and Saved Artifacts
    df = pd.read_csv("agririsk_perennial_master.csv")
    models = joblib.load("agririsk_xgb_models.joblib")
    preprocessor = joblib.load("feature_preprocessor.joblib")

    targets = ["risk_waterlogging", "risk_heat_stress", "risk_water_stress", "risk_disease"]
    context_features = [
        "precip_mm", "temp_max_c", "temp_min_c", "rh_pct", "wind_speed_ms",
        "precip_3d_sum", "temp_max_3d_mean", "rh_3d_mean",
        "crop_type", "growth_stage", "clay_pct", "sand_pct", "bulk_density"
    ]

    # Split dataset
    X = df[context_features]
    y = df[targets]
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    X_test_trans = preprocessor.transform(X_test)

    # Get transformed feature names for plots
    num_cols = preprocessor.transformers_[0][2]
    cat_cols_encoded = preprocessor.transformers_[1][1].get_feature_names_out(
        preprocessor.transformers_[1][2]
    )
    feature_names = list(num_cols) + list(cat_cols_encoded)

    # -----------------------------------------------------------------
    # CHART 1: 2x2 Grid of Confusion Matrices for All 4 Risk Targets
    # -----------------------------------------------------------------
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    fig.suptitle("AgriRisk AI: Confusion Matrices Across Multi-Risk Targets", fontsize=16, fontweight='bold')

    class_labels = ["Low (0)", "Moderate (1)", "High (2)"]

    for idx, target in enumerate(targets):
        ax = axes[idx // 2, idx % 2]
        y_true = y_test[target].values
        y_pred = models[target].predict(X_test_trans)
        
        cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2])
        
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax,
                    xticklabels=class_labels, yticklabels=class_labels, cbar=False)
        
        title_clean = target.replace("risk_", "").replace("_", " ").title()
        ax.set_title(f"Target: {title_clean} Risk", fontsize=12, fontweight='bold')
        ax.set_xlabel("Predicted Severity Level", fontsize=10)
        ax.set_ylabel("Actual Severity Level", fontsize=10)

    plt.tight_layout()
    plt.savefig("agririsk_confusion_matrices.png", dpi=300)
    print("Saved: agririsk_confusion_matrices.png")
    plt.close()

    # -----------------------------------------------------------------
    # CHART 2: Global XGBoost Feature Importance (Waterlogging Model)
    # -----------------------------------------------------------------
    plt.figure(figsize=(10, 6))
    
    # Extract feature importances from Waterlogging model
    importances = models["risk_waterlogging"].feature_importances_
    feat_imp_df = pd.DataFrame({
        "Feature": feature_names,
        "Importance": importances
    }).sort_values(by="Importance", ascending=True)

    colors = ['#2ca02c' if 'crop' in f or 'stage' in f or 'clay' in f or 'sand' in f else '#1f77b4' 
              for f in feat_imp_df["Feature"]]

    plt.barh(feat_imp_df["Feature"], feat_imp_df["Importance"], color=colors)
    plt.title("XGBoost Feature Importance: Waterlogging Model\n(Green = Soil/Phenology Context | Blue = Weather Metrics)", 
              fontsize=13, fontweight='bold')
    plt.xlabel("Relative Gini Importance Score", fontsize=11)
    plt.ylabel("Model Input Feature", fontsize=11)
    
    plt.tight_layout()
    plt.savefig("agririsk_feature_importance.png", dpi=300)
    print("Saved: agririsk_feature_importance.png")
    plt.close()

    print("\nChart generation completed successfully!")

if __name__ == "__main__":
    generate_performance_charts()