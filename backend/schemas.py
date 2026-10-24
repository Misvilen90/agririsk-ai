from pydantic import BaseModel, Field
from typing import List, Dict


class FarmProfileInput(BaseModel):
    crop_type: str = Field(
        ...,
        examples=["Rose", "Coconut"],
        description="Supported crops: Rose or Coconut"
    )

    growth_stage: str = Field(
        ...,
        examples=["Active_Harvesting", "Bud_Initiation"],
        description="Crop stage; mapped to the model's training categories"
    )

    latitude: float = Field(..., example=10.658)
    longitude: float = Field(..., example=77.012)

    clay_content_pct: float = Field(38.0, ge=0, le=100)
    sand_content_pct: float = Field(25.0, ge=0, le=100)
    bulk_density: float = Field(1.4, gt=0)
    drainage_class: str = Field("Poorly Drained")

    # Existing API fields
    precip_48h_mm: float = Field(58.0, ge=0)
    temp_max_c: float = Field(37.5)
    temp_min_c: float = Field(22.0)
    relative_humidity_pct: float = Field(88.0, ge=0, le=100)
    consecutive_dry_days: int = Field(0, ge=0)

    # Additional inputs required by the trained ML pipeline.
    # Supply actual measurements or values from a trusted weather source.
    precip_mm: float = Field(
        ...,
        ge=0,
        description="Daily precipitation in mm"
    )
    wind_speed_ms: float = Field(
        ...,
        ge=0,
        description="Wind speed in metres per second"
    )
    precip_3d_sum: float = Field(
        ...,
        ge=0,
        description="Three-day cumulative precipitation in mm"
    )
    temp_max_3d_mean: float = Field(
        ...,
        description="Three-day mean maximum temperature in Celsius"
    )
    rh_3d_mean: float = Field(
        ...,
        ge=0,
        le=100,
        description="Three-day mean relative humidity percentage"
    )


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
