def generate_recommendations(crop_type: str, growth_stage: str, risk_profile: dict) -> list:
    advisories = []
    
    # 1. Waterlogging Actions
    if risk_profile.get("risk_waterlogging") == 2:
        if crop_type == "Banana":
            advisories.append("High Waterlogging: Deepen side drainage channels to 60 cm to prevent corm asphyxiation. Postpone nitrogen/potash application.")
        elif crop_type == "Coconut":
            advisories.append("High Waterlogging: Open basin bunds to release ponded water around tree trunks to curb Phytophthora root rot.")
    elif risk_profile.get("risk_waterlogging") == 1:
        advisories.append("Moderate Waterlogging: Clear debris from primary drainage furrows; monitor soil saturation.")

    # 2. Heat Stress Actions
    if risk_profile.get("risk_heat_stress") == 2:
        if crop_type == "Banana":
            advisories.append("Extreme Heat: Apply dry leaf mulching around base; initiate micro-sprinkler or overhead misting during 12 PM - 3 PM.")
        elif crop_type == "Coconut":
            advisories.append("Extreme Heat: Irrigate with 50-80 L/tree every 2 days; apply 5 cm coir pith mulch in 1.8 m radius to curb button shedding.")

    # 3. Water Stress Actions
    if risk_profile.get("risk_water_stress") == 2:
        advisories.append("Critical Water Deficit: Increase drip irrigation runtime by 35%. Avoid deep tillage to preserve root zone moisture.")

    # 4. Disease Risk Actions
    if risk_profile.get("risk_disease") == 2:
        if crop_type == "Banana":
            advisories.append("High Sigatoka Risk: De-leaf infected lower leaves; apply prophylactic spray of Propiconazole (0.1%) or mineral oil emulsion.")
        elif crop_type == "Coconut":
            advisories.append("High Bud Rot / Stem Bleeding Risk: Apply 1% Bordeaux mixture to the crown and check leaf armpits.")

    if not advisories:
        advisories.append("Current climate conditions are optimal. Continue standard fertigation and routine weeding.")

    return advisories