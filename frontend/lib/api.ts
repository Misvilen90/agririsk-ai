// ─────────────────────────────────────────────────────────────────
//  AgriRisk AI — API Client
//  POST /api/analyze-field  →  AnalysisResult
//
//  • Reads NEXT_PUBLIC_API_URL from env (falls back to localhost:8000)
//  • Hard timeout of 30 s; returns mock fallback if backend is down
//  • Strips the `mode` discriminant before sending to backend
// ─────────────────────────────────────────────────────────────────

import type {
  AnalysisPayload,
  AnalysisResult,
  RiskLevel,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TIMEOUT_MS = 30_000;

// ── Mock fallback returned when backend is unreachable ───────────
const MOCK_RESULT: AnalysisResult = {
  risk_predictions: {
    waterlogging: 2 as RiskLevel,
    heat_stress: 1 as RiskLevel,
    water_stress: 0 as RiskLevel,
    disease_conduciveness: 1 as RiskLevel,
  },
  primary_threat: "waterlogging",
  xai_explanation: [
    { feature: "precip_3d_sum", shap_value: 0.42 },
    { feature: "clay_pct", shap_value: 0.28 },
    { feature: "bulk_density", shap_value: 0.18 },
    { feature: "rh_3d_mean", shap_value: -0.12 },
  ],
  advisory_plan: [
    "Clear blocked field drainage furrows and perimeter outlet pathways immediately.",
    "Delay nitrogen fertilizer application by 48 hours to prevent runoff loss.",
    "Monitor standing water depth at designated low spots daily.",
    "Inspect sub-surface tile drain outlets for flow obstructions.",
    "Consider emergency bed-forming to channel excess water away from root zone.",
  ],
};

// ── Main API function ─────────────────────────────────────────────
export async function analyzeField(
  payload: AnalysisPayload
): Promise<{ result: AnalysisResult; isMock: boolean }> {
  // Strip the discriminant `mode` field before sending to backend
  const { mode: _mode, ...body } = payload;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}/api/analyze-field`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`API error ${res.status}: ${errorText}`);
    }

    const result: AnalysisResult = await res.json();
    return { result, isMock: false };
  } catch (err) {
    clearTimeout(timeoutId);

    // Log but don't crash — return mock fallback
    console.warn(
      "[AgriRisk AI] Backend unavailable, using fallback mock result:",
      err instanceof Error ? err.message : err
    );
    return { result: MOCK_RESULT, isMock: true };
  }
}
