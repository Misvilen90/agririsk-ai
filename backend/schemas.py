from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

# --- INPUT SCHEMAS ---
class FarmProfileInput(BaseModel):
    crop_type: str = Field(..., example="Banana", description="Target crop: 'Banana' or 'Coconut'")
    growth_stage: str = Field(..., example="Shooting", description="Crop phenological stage")
    latitude: float = Field(..., example=10.658, description="Field latitude")
    longitude: float = Field(..., example=77.012, description="Field longitude")
    
    # Soil physical parameters (defaults or fetched via SoilGrids)
    clay_content_pct: float = Field(38.0, example=38.0)
    sand_content_pct: float = Field(25.0, example=25.0)
    bulk_density: float = Field(1.4, example=1.4)
    drainage_class: str = Field("Poorly Drained", example="Poorly Drained")
    
    # Dynamic weather window parameters (from NASA POWER/OpenWeather)
    precip_48h_mm: float = Field(72.5, example=72.5)
    temp_max_c: float = Field(36.2, example=36.2)
    temp_min_c: float = Field(26.0, example=26.0)
    relative_humidity_pct: float = Field(88.0, example=88.0)
    consecutive_dry_days: int = Field(0, example=0)

# --- OUTPUT SCHEMAS ---
class DriverDetail(BaseModel):
    feature_name: str
    observed_value: float
    impact_percentage: float
    effect: str

class RiskExplanation(BaseModel):
    risk_type: str
    top_drivers: List[DriverDetail]

class AdvisoryItem(BaseModel):
    risk_type: str
    severity: str
    primary_driver: str
    advisory: str
    urgency: str

class MultiRiskResponse(BaseModel):
    crop_type: str
    growth_stage: str
    risk_scores: Dict[str, float]
    risk_levels: Dict[str, str]
    explanations: List[RiskExplanation]
    advisories: List[AdvisoryItem]