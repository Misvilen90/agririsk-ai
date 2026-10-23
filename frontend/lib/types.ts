// ─────────────────────────────────────────────────────────────────
//  AgriRisk AI — Shared TypeScript Types
//  Matches the backend API contract exactly.
// ─────────────────────────────────────────────────────────────────

// ── Input: Crop & Growth Stage ─────────────────────────────────
export type CropType = "Rose" | "Coconut";

export type RoseGrowthStage =
  | "Pruning_Vegetative"
  | "Bud_Initiation"
  | "Active_Harvesting";

export type CoconutGrowthStage =
  | "Vegetative_Young"
  | "Inflorescence_Button"
  | "Nut_Maturity";

export type GrowthStage = RoseGrowthStage | CoconutGrowthStage;

// ── Risk Levels ─────────────────────────────────────────────────
export type RiskLevel = 0 | 1 | 2; // 0 = Low, 1 = Moderate, 2 = High

export const RISK_LABELS: Record<RiskLevel, string> = {
  0: "Low",
  1: "Moderate",
  2: "High",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  0: "#3B5438", // green
  1: "#7A5230", // amber
  2: "#A93226", // red
};

// ── Dynamic Growth Stage Map ────────────────────────────────────
export const GROWTH_STAGES: Record<CropType, GrowthStage[]> = {
  Rose: ["Pruning_Vegetative", "Bud_Initiation", "Active_Harvesting"],
  Coconut: ["Vegetative_Young", "Inflorescence_Button", "Nut_Maturity"],
};

// Human-readable labels for growth stages
export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  Pruning_Vegetative: "Pruning / Vegetative",
  Bud_Initiation: "Bud Initiation",
  Active_Harvesting: "Active Harvesting",
  Vegetative_Young: "Vegetative (Young)",
  Inflorescence_Button: "Inflorescence / Button",
  Nut_Maturity: "Nut Maturity",
};

// ── Tamil Nadu GPS Bounds ────────────────────────────────────────
export const TN_BOUNDS = {
  lat: { min: 8.0, max: 13.5 },
  lon: { min: 76.0, max: 80.5 },
} as const;

// ── API Payload: Location Mode ───────────────────────────────────
export interface LocationPayload {
  mode: "location";
  crop_type: CropType;
  growth_stage: GrowthStage;
  latitude: number;
  longitude: number;
}

// ── API Payload: Manual Simulator Mode ──────────────────────────
export interface ManualPayload {
  mode: "manual";
  crop_type: CropType;
  growth_stage: GrowthStage;
  // Soil
  clay_pct: number;
  sand_pct: number;
  bulk_density: number;
  // Daily weather
  precip_mm: number;
  temp_max_c: number;
  temp_min_c: number;
  rh_pct: number;
  wind_speed_ms: number;
  // 3-day aggregates
  precip_3d_sum: number;
  temp_max_3d_mean: number;
  rh_3d_mean: number;
}

export type AnalysisPayload = LocationPayload | ManualPayload;

// ── API Response ────────────────────────────────────────────────
export type RiskKey =
  | "waterlogging"
  | "heat_stress"
  | "water_stress"
  | "disease_conduciveness";

export interface RiskPredictions {
  waterlogging: RiskLevel;
  heat_stress: RiskLevel;
  water_stress: RiskLevel;
  disease_conduciveness: RiskLevel;
}

export interface ShapFeature {
  feature: string;
  shap_value: number;
}

export interface AnalysisResult {
  risk_predictions: RiskPredictions;
  primary_threat: RiskKey;
  xai_explanation: ShapFeature[];
  advisory_plan: string[];
}

// ── Risk display metadata ────────────────────────────────────────
export const RISK_META: Record<
  RiskKey,
  { label: string; icon: string; shortLabel: string }
> = {
  waterlogging: { label: "Waterlogging Risk", icon: "🌧️", shortLabel: "Waterlogging" },
  heat_stress: { label: "Heat Stress", icon: "☀️", shortLabel: "Heat Stress" },
  water_stress: { label: "Water Stress", icon: "💧", shortLabel: "Water Stress" },
  disease_conduciveness: {
    label: "Disease Conduciveness",
    icon: "🌿",
    shortLabel: "Disease Risk",
  },
};

// ── Feature name pretty-print map ────────────────────────────────
export const FEATURE_LABELS: Record<string, string> = {
  clay_pct: "Clay Content",
  sand_pct: "Sand Content",
  bulk_density: "Bulk Density",
  precip_mm: "Daily Rainfall",
  temp_max_c: "Max Temperature",
  temp_min_c: "Min Temperature",
  rh_pct: "Relative Humidity",
  wind_speed_ms: "Wind Speed",
  precip_3d_sum: "3-Day Rainfall",
  temp_max_3d_mean: "3-Day Avg Max Temp",
  rh_3d_mean: "3-Day Avg Humidity",
  crop_type: "Crop Type",
  growth_stage: "Growth Stage",
};
