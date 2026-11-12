// ─────────────────────────────────────────────────────────────────
//  AgriRisk AI — API client
//
//  Talks to the FastAPI backend and adapts its responses to the shape
//  the UI components use (see AnalysisResult in ./types).
//
//    GPS mode    → POST /api/v1/analyze-location  (backend fetches
//                  NASA POWER weather + SoilGrids soil)
//    Manual mode → POST /api/v1/analyze-field
//
//  Errors are thrown with a readable message. There is deliberately NO
//  mock fallback: a failed request must never look like a real result.
// ─────────────────────────────────────────────────────────────────

import type {
  AnalysisPayload,
  AnalysisResult,
  RiskKey,
  RiskLevel,
  ShapFeature,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

// GPS mode makes the backend call two external services, so allow longer.
const TIMEOUT_MS = { location: 90_000, manual: 30_000 } as const;

// The backend requires coordinates. Manual mode has no GPS fix, so send the
// centre of Tamil Nadu (the model does not use latitude/longitude as inputs;
// they are only stored in the query log).
const MANUAL_MODE_COORDS = { latitude: 11.1271, longitude: 78.6569 };

// ── Backend response types (backend/schemas.py) ─────────────────
type BackendRiskKey = "waterlogging" | "heat_stress" | "water_stress" | "disease";
type BackendLevel = "Low" | "Moderate" | "High";

interface BackendDriver {
  feature_name: string;
  observed_value: number;
  impact_percentage: number;
  effect: string;
}

interface BackendResponse {
  crop_type: string;
  growth_stage: string;
  risk_scores: Record<BackendRiskKey, number>;
  risk_levels: Record<BackendRiskKey, BackendLevel>;
  explanations: { risk_type: BackendRiskKey; top_drivers: BackendDriver[] }[];
  advisories: {
    risk_type: string;
    severity: string;
    primary_driver: string;
    advisory: string;
    urgency: string;
  }[];
  // Only present for /analyze-location
  data_notes?: string[];
  weather_date?: string | null;
}

export interface AnalysisOutcome {
  result: AnalysisResult;
  /** Informational notes from the backend (e.g. default soil values used). */
  notes: string[];
}

// ── Adapters ────────────────────────────────────────────────────
const LEVEL_TO_NUM: Record<BackendLevel, RiskLevel> = {
  Low: 0,
  Moderate: 1,
  High: 2,
};

const BACKEND_TO_UI_KEY: Record<BackendRiskKey, RiskKey> = {
  waterlogging: "waterlogging",
  heat_stress: "heat_stress",
  water_stress: "water_stress",
  disease: "disease_conduciveness",
};

const BACKEND_KEYS = Object.keys(BACKEND_TO_UI_KEY) as BackendRiskKey[];

function isBackendResponse(x: unknown): x is BackendResponse {
  const r = x as Partial<BackendResponse> | null;
  return (
    !!r &&
    typeof r.risk_scores === "object" && r.risk_scores !== null &&
    typeof r.risk_levels === "object" && r.risk_levels !== null &&
    Array.isArray(r.explanations) &&
    Array.isArray(r.advisories) &&
    BACKEND_KEYS.every(
      (k) =>
        typeof r.risk_scores![k] === "number" &&
        r.risk_levels![k] in LEVEL_TO_NUM,
    )
  );
}

function adapt(b: BackendResponse): AnalysisResult {
  const risk_predictions = Object.fromEntries(
    BACKEND_KEYS.map((k) => [BACKEND_TO_UI_KEY[k], LEVEL_TO_NUM[b.risk_levels[k]]]),
  ) as unknown as AnalysisResult["risk_predictions"];

  // Primary threat: highest predicted level, ties broken by High-risk probability.
  const primary = [...BACKEND_KEYS].sort(
    (a, c) =>
      LEVEL_TO_NUM[b.risk_levels[c]] - LEVEL_TO_NUM[b.risk_levels[a]] ||
      b.risk_scores[c] - b.risk_scores[a],
  )[0];

  // Drivers of the primary threat. The backend reports an unsigned share of
  // total attribution plus a direction; convert to a signed value (fraction).
  const drivers =
    b.explanations.find((e) => e.risk_type === primary)?.top_drivers ?? [];
  const xai_explanation: ShapFeature[] = drivers
    .filter((d) => !d.effect.startsWith("had no"))
    .map((d) => ({
      feature: d.feature_name.replace(/^num__/, ""),
      shap_value:
        (d.effect.startsWith("decreased") ? -1 : 1) * (d.impact_percentage / 100),
    }));

  const advisory_plan = b.advisories.map((a) => `${a.risk_type}: ${a.advisory}`);
  if (advisory_plan.length === 0) {
    advisory_plan.push(
      "No risk is rated High right now, so no urgent action is required. Keep monitoring field conditions.",
    );
  }

  return {
    risk_predictions,
    risk_scores: Object.fromEntries(
      BACKEND_KEYS.map((k) => [BACKEND_TO_UI_KEY[k], b.risk_scores[k]]),
    ) as unknown as AnalysisResult["risk_scores"],
    primary_threat: BACKEND_TO_UI_KEY[primary],
    xai_explanation,
    advisory_plan,
  };
}

/** Turn FastAPI error payloads (string or validation array) into one message. */
function extractError(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msg = detail
      .map((d: { loc?: unknown[]; msg?: string }) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "";
        const m = (d.msg ?? "").replace(/^Value error, /, "");
        return field && field !== "body" ? `${String(field)}: ${m}` : m;
      })
      .join("; ");
    if (msg) return msg;
  }
  return fallback;
}

// ── Main API function ───────────────────────────────────────────
export async function analyzeField(
  payload: AnalysisPayload,
): Promise<AnalysisOutcome> {
  let path: string;
  let body: Record<string, unknown>;

  if (payload.mode === "location") {
    path = "/api/v1/analyze-location";
    body = {
      crop_type: payload.crop_type,
      growth_stage: payload.growth_stage,
      latitude: payload.latitude,
      longitude: payload.longitude,
    };
  } else {
    path = "/api/v1/analyze-field";
    body = {
      crop_type: payload.crop_type,
      growth_stage: payload.growth_stage,
      ...MANUAL_MODE_COORDS,
      clay_content_pct: payload.clay_pct,
      sand_content_pct: payload.sand_pct,
      bulk_density: payload.bulk_density,
      precip_mm: payload.precip_mm,
      temp_max_c: payload.temp_max_c,
      temp_min_c: payload.temp_min_c,
      relative_humidity_pct: payload.rh_pct,
      wind_speed_ms: payload.wind_speed_ms,
      precip_3d_sum: payload.precip_3d_sum,
      temp_max_3d_mean: payload.temp_max_3d_mean,
      rh_3d_mean: payload.rh_3d_mean,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS[payload.mode]);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("The analysis timed out. Please try again.");
    }
    throw new Error(
      `Cannot reach the AgriRisk API at ${API_URL}. Is the backend running?`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractError(json, `Request failed (${res.status}).`));
  }
  if (!isBackendResponse(json)) {
    throw new Error("The API returned an unexpected response.");
  }
  return { result: adapt(json), notes: json.data_notes ?? [] };
}
