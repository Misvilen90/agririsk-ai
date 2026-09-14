# TNAU Agronomic Rules Reference Data
RISK_THRESHOLDS = {
    "Banana": {
        "Waterlogging": {
            "rain_48h_mm": 60.0,
            "clay_percentage": 35.0,
            "drainage_classes": ["Poorly Drained", "Somewhat Poorly Drained"]
        },
        "Heat_Stress": {
            "temp_max_c": 38.0,
            "critical_stages": ["Shooting", "Bunching"]
        },
        "Water_Stress": {
            "consecutive_dry_days": 7,
            "sand_percentage": 50.0,
            "evapotranspiration_mm": 5.0
        },
        "Disease_Sigatoka": {
            "rh_percentage": 85.0,
            "temp_min_c": 24.0,
            "temp_max_c": 30.0,
            "duration_hours": 48
        }
    },
    "Coconut": {
        "Waterlogging": {
            "rain_48h_mm": 80.0,
            "clay_percentage": 40.0,
            "drainage_classes": ["Poorly Drained"]
        },
        "Heat_Stress": {
            "temp_max_c": 39.0,
            "critical_stages": ["Flowering/Button Formation"]
        },
        "Water_Stress": {
            "consecutive_dry_days": 12,
            "sand_percentage": 60.0
        },
        "Disease_Bud_Rot": {
            "rh_percentage": 90.0,
            "temp_min_c": 20.0,
            "temp_max_c": 28.0,
            "duration_hours": 48
        }
    }
}