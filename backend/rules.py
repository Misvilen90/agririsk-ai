# Agronomic Rules Reference Data for Rose and Coconut
#
# IMPORTANT:
# Rose thresholds are initial agronomic heuristics and require
# field/agronomic validation where noted.
# Do not label unvalidated Rose values as TNAU-specific.
#
# Coconut rules are retained from the existing project structure.

RISK_THRESHOLDS = {
    "Rose": {
        "Waterlogging": {
            # Initial heuristic; requires field agronomic validation.
            "rain_48h_mm": 50.0,
            "clay_percentage": 35.0,
            "drainage_classes": [
                "Poorly Drained",
                "Somewhat Poorly Drained"
            ]
        },

        "Heat_Stress": {
            # Initial heuristic; requires field agronomic validation.
            "temp_max_c": 36.0,
            "critical_stages": [
                "Pruning/Bud Initiation",
                "Flowering/Harvesting"
            ]
        },

        "Water_Stress": {
            # Initial heuristic.
            "consecutive_dry_days": 5,
            "sand_percentage": 50.0,
            "evapotranspiration_mm": 6.0
        },

        "Disease_Black_Spot": {
            # Agro-environmentally verified conducive conditions.
            "rh_percentage": 85.0,
            "temp_min_c": 18.0,
            "temp_max_c": 26.0,
            "duration_hours": 48
        }
    },

    "Coconut": {
        "Waterlogging": {
            "rain_48h_mm": 80.0,
            "clay_percentage": 40.0,
            "drainage_classes": [
                "Poorly Drained"
            ]
        },

        "Heat_Stress": {
            "temp_max_c": 39.0,
            "critical_stages": [
                "Flowering/Button Formation"
            ]
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