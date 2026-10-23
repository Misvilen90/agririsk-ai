"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  type CropType,
  type GrowthStage,
  type AnalysisResult,
  type LocationPayload,
  type ManualPayload,
  GROWTH_STAGES,
  GROWTH_STAGE_LABELS,
  RISK_META,
  RISK_LABELS,
  RISK_COLORS,
  FEATURE_LABELS,
  TN_BOUNDS,
} from "@/lib/types";
import { analyzeField } from "@/lib/api";

// ── Slider field definition ─────────────────────────────────────
interface SliderField {
  key: keyof Omit<ManualPayload, "mode" | "crop_type" | "growth_stage">;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
}

const SLIDER_FIELDS: SliderField[] = [
  { key: "clay_pct", label: "Clay Content", unit: "%", min: 0, max: 100, step: 1, defaultVal: 35 },
  { key: "sand_pct", label: "Sand Content", unit: "%", min: 0, max: 100, step: 1, defaultVal: 30 },
  { key: "bulk_density", label: "Bulk Density", unit: "g/cm³", min: 0.8, max: 2.0, step: 0.05, defaultVal: 1.3 },
  { key: "precip_mm", label: "Daily Rainfall", unit: "mm", min: 0, max: 200, step: 1, defaultVal: 20 },
  { key: "temp_max_c", label: "Max Temperature", unit: "°C", min: 15, max: 50, step: 0.5, defaultVal: 34 },
  { key: "temp_min_c", label: "Min Temperature", unit: "°C", min: 5, max: 40, step: 0.5, defaultVal: 22 },
  { key: "rh_pct", label: "Relative Humidity", unit: "%", min: 0, max: 100, step: 1, defaultVal: 75 },
  { key: "wind_speed_ms", label: "Wind Speed", unit: "m/s", min: 0, max: 30, step: 0.5, defaultVal: 4 },
  { key: "precip_3d_sum", label: "3-Day Rainfall", unit: "mm", min: 0, max: 500, step: 1, defaultVal: 60 },
  { key: "temp_max_3d_mean", label: "3-Day Avg Max Temp", unit: "°C", min: 15, max: 50, step: 0.5, defaultVal: 33 },
  { key: "rh_3d_mean", label: "3-Day Avg Humidity", unit: "%", min: 0, max: 100, step: 1, defaultVal: 78 },
];

const buildDefaultManual = (): Record<string, number> =>
  Object.fromEntries(SLIDER_FIELDS.map((f) => [f.key, f.defaultVal]));

// ── Custom SHAP Tooltip ─────────────────────────────────────────
const ShapTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { feature: string } }>;
}) => {
  if (!active || !payload?.length) return null;
  const { value, payload: p } = payload[0];
  return (
    <div className="bg-[#183324] text-[#FAF7F0] text-xs px-3.5 py-2.5 rounded-xl shadow-2xl border border-white/20">
      <span className="font-bold text-[#E6DFD3]">{FEATURE_LABELS[p.feature] ?? p.feature}</span>
      <br />
      <span className={value >= 0 ? "text-[#F87171] font-mono font-bold" : "text-[#6EE7B7] font-mono font-bold"}>
        SHAP Impact: {value >= 0 ? "+" : ""}{value.toFixed(3)}
      </span>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────
export default function ScanSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Mode toggle
  const [mode, setMode] = useState<"location" | "manual">("location");

  // Crop & growth stage
  const [cropType, setCropType] = useState<CropType | "">("");
  const [growthStage, setGrowthStage] = useState<GrowthStage | "">("");

  // Location mode — GPS state
  type GpsStatus = "idle" | "acquiring" | "acquired" | "error" | "out_of_bounds";
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLon, setGpsLon] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState("");

  // Manual mode
  const [manualVals, setManualVals] = useState<Record<string, number>>(
    buildDefaultManual()
  );

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // API state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [apiError, setApiError] = useState("");

  // Intersection observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Reset growth stage when crop changes
  useEffect(() => { setGrowthStage(""); }, [cropType]);

  // ── GPS acquire handler ──────────────────────────────────────
  const handleGetGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsStatus("acquiring");
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const inBounds =
          latitude >= TN_BOUNDS.lat.min && latitude <= TN_BOUNDS.lat.max &&
          longitude >= TN_BOUNDS.lon.min && longitude <= TN_BOUNDS.lon.max;
        if (inBounds) {
          setGpsLat(latitude);
          setGpsLon(longitude);
          setGpsStatus("acquired");
          setErrors((prev) => { const n = { ...prev }; delete n.gps; return n; });
        } else {
          setGpsLat(latitude);
          setGpsLon(longitude);
          setGpsStatus("out_of_bounds");
          setGpsError(
            `Detected location (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E) is outside Tamil Nadu geographic bounds.`
          );
        }
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(
          err.code === 1
            ? "GPS access denied. Please allow location permissions in your browser."
            : err.code === 2
              ? "Could not detect GPS coordinates. Check device GPS signal."
              : "Location request timed out. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ── Validation ──────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};

    if (!cropType) errs.cropType = "Please select a target crop type.";
    if (!growthStage) errs.growthStage = "Please select the active growth stage.";

    if (mode === "location") {
      if (gpsStatus === "out_of_bounds") {
        errs.gps = "Detected location is outside Tamil Nadu geographic bounds.";
      } else if (gpsStatus !== "acquired" || gpsLat === null || gpsLon === null) {
        errs.gps = "Please acquire your field's GPS location.";
      }
    } else {
      const clay = manualVals.clay_pct ?? 0;
      const sand = manualVals.sand_pct ?? 0;
      if (clay + sand > 100)
        errs.clayPlusSand = "Clay + Sand composition cannot exceed 100%.";
      const tMax = manualVals.temp_max_c ?? 0;
      const tMin = manualVals.temp_min_c ?? 0;
      if (tMax <= tMin)
        errs.tempRange = "Max temperature must exceed min temperature.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [cropType, growthStage, mode, gpsStatus, gpsLat, gpsLon, manualVals]);

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setResult(null);
      setApiError("");

      const steps =
        mode === "location"
          ? [
            "Querying NASA POWER Climate Telemetry & SoilGrids...",
            "Computing 3-day micro-climate aggregates...",
            "Running multi-model risk classification ensemble...",
            "Calculating SHAP explainability attributions...",
          ]
          : [
            "Validating manual field parameters...",
            "Executing agronomic risk inference ensemble...",
            "Computing SHAP feature importance vectors...",
            "Synthesizing tailored agronomic action plan...",
          ];

      steps.forEach((text, idx) => {
        setTimeout(() => setLoadingStep(text), idx * 700);
      });

      const payload =
        mode === "location"
          ? ({
            mode: "location",
            crop_type: cropType as CropType,
            growth_stage: growthStage as GrowthStage,
            latitude: gpsLat!,
            longitude: gpsLon!,
          } satisfies LocationPayload)
          : ({
            mode: "manual",
            crop_type: cropType as CropType,
            growth_stage: growthStage as GrowthStage,
            ...(manualVals as Omit<ManualPayload, "mode" | "crop_type" | "growth_stage">),
          } satisfies ManualPayload);

      try {
        const { result: res, isMock: mock } = await analyzeField(payload);
        setResult(res);
        setIsMock(mock);
        if (mock) setApiError("Backend offline — displaying fallback demonstration results.");
      } catch {
        setApiError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    },
    [validate, mode, cropType, growthStage, gpsLat, gpsLon, manualVals]
  );

  const updateManual = (key: string, val: number) =>
    setManualVals((prev) => ({ ...prev, [key]: val }));

  const availableStages = cropType ? GROWTH_STAGES[cropType] : [];

  // ── Render ─────────────────────────────────────────────────
  return (
    <section
      id="analyze"
      ref={sectionRef}
      className="relative bg-[#FAF7F0] py-20 lg:py-28 overflow-hidden text-[#183324]"
    >
      {/* Background Vintage Botanical Grid & Warm Atmosphere */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #183324 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Atmospheric Warm Botanical Glows */}
      <div className="absolute top-10 right-0 w-[550px] h-[550px] bg-[#7A5230]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-[#183324]/6 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 lg:px-10 relative z-10">

        {/* ── Section Header ── */}
        <div
          className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBE4D5] border border-[#183324]/20 text-[11px] font-mono font-bold tracking-widest uppercase text-[#6B4423] mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#3B5438] animate-pulse" />
            FIELD RISK SCANNER
          </div>
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-[#183324] leading-tight tracking-tight mb-4">
            Know your field.{" "}
            <span className="italic font-normal text-[#4A6B46]">
              Predict your risk.
            </span>
          </h2>
          <p className="text-base text-[#3B5438] leading-relaxed max-w-xl mx-auto">
            Acquire your field’s GPS telemetry to auto-pull NASA POWER meteorological metrics and SoilGrids physical matrices, or manually simulate custom agro-climatic scenarios.
          </p>
        </div>

        {/* ── Mode Switcher Console ── */}
        <div
          className={`flex items-center justify-center mb-8 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <div className="flex p-1.5 bg-[#E4DCCE] border border-[#183324]/20 rounded-2xl shadow-md gap-2">
            {(["location", "manual"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setResult(null); setErrors({}); }}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 ${mode === m
                  ? "bg-[#183324] text-[#FAF7F0] shadow-md scale-[1.01]"
                  : "text-[#183324]/80 hover:text-[#183324] hover:bg-[#183324]/10"
                  }`}
              >
                <span className="text-sm">{m === "location" ? "📍" : "🔬"}</span>
                {m === "location" ? "GPS Location Mode" : "Manual Agro-Simulator"}
              </button>
            ))}
          </div>
        </div>

        {mode === "location" && (
          <p className="text-center text-xs text-[#6B4423] font-medium mb-8 -mt-3 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B4423] animate-ping" />
            Backend auto-fetches real-time weather &amp; soil from NASA POWER &amp; SoilGrids
          </p>
        )}

        {/* ── Main Form Card ── */}
        <div
          className={`relative bg-[#EBE4D5] border-2 border-[#183324]/20 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-[#183324]/10 ring-1 ring-white/60 transition-all duration-700 delay-150 overflow-hidden ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
        >
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Row 1: Crop Profile & GPS Telemetry ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

              {/* Crop Information Panel */}
              <div className="bg-[#FAF7F0] border border-[#183324]/15 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[#183324]/12">
                    <span className="text-lg">🌾</span>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B4423]">
                      TARGET CROP PROFILE
                    </h3>
                  </div>

                  <label className="block text-xs font-bold text-[#183324] mb-2.5">
                    Crop Species <span className="text-[#A93226]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {(["Rose", "Coconut"] as CropType[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCropType(c)}
                        className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${cropType === c
                          ? "bg-[#183324] text-white border-[#183324] shadow-lg shadow-[#183324]/20 scale-[1.02]"
                          : "bg-[#EFECE3] text-[#183324] border-[#183324]/15 hover:border-[#183324]/40 hover:bg-[#E6DFD3]"
                          }`}
                      >
                        <span className="text-lg">{c === "Rose" ? "🌹" : "🥥"}</span>
                        <span>{c}</span>
                      </button>
                    ))}
                  </div>
                  {errors.cropType && (
                    <p className="text-[#A93226] text-xs mb-3 font-medium flex items-center gap-1">
                      <span>⚠️</span> {errors.cropType}
                    </p>
                  )}

                  {/* Growth Stage Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-[#183324] mb-2.5">
                      Phenology / Growth Stage <span className="text-[#A93226]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={growthStage}
                        onChange={(e) => setGrowthStage(e.target.value as GrowthStage)}
                        disabled={!cropType}
                        id="growth-stage-select"
                        className="w-full bg-[#EFECE3] border-2 border-[#183324]/20 rounded-xl px-4 py-3.5 text-sm font-semibold text-[#183324] focus:outline-none focus:border-[#183324] focus:ring-4 focus:ring-[#183324]/10 transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed appearance-none"
                      >
                        <option value="" disabled className="text-[#183324]/60">
                          {cropType ? "Select Active Growth Stage" : "Select a crop first"}
                        </option>
                        {availableStages.map((s) => (
                          <option key={s} value={s} className="text-[#183324]">
                            {GROWTH_STAGE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#183324]/60 text-xs">
                        ▼
                      </div>
                    </div>
                    {errors.growthStage && (
                      <p className="text-[#A93226] text-xs mt-2 font-medium flex items-center gap-1">
                        <span>⚠️</span> {errors.growthStage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#183324]/10 text-[11px] font-mono text-[#6B4423] flex items-center gap-1.5 font-medium">
                  <span>ℹ️</span> TNAU physiological sensitivity models active
                </div>
              </div>

              {/* Location Mode / Manual Mode Parameter Box */}
              <div className="bg-[#FAF7F0] border border-[#183324]/15 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                {mode === "location" ? (
                  <>
                    <div>
                      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#183324]/12">
                        <span className="text-lg">📍</span>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B4423]">
                          GPS FIELD TELEMETRY
                        </h3>
                      </div>
                      <p className="text-xs text-[#3B5438] mb-5 leading-relaxed">
                        Tap the button below to detect your field&apos;s GPS coordinates. The ML engine will automatically retrieve NASA POWER micro-climate data &amp; SoilGrids parameters.
                      </p>

                      {/* ── GPS Acquire Button ── */}
                      <button
                        type="button"
                        id="gps-acquire-btn"
                        onClick={handleGetGps}
                        disabled={gpsStatus === "acquiring"}
                        className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border-2 font-bold text-sm transition-all duration-300 ${gpsStatus === "acquired"
                          ? "bg-[#3B5438]/12 border-[#3B5438] text-[#183324] shadow-sm"
                          : gpsStatus === "out_of_bounds" || gpsStatus === "error"
                            ? "bg-[#A93226]/10 border-[#A93226] text-[#A93226] hover:bg-[#A93226]/15"
                            : gpsStatus === "acquiring"
                              ? "bg-[#EBE4D5] border-[#183324]/25 text-[#183324]/70 cursor-wait"
                              : "bg-[#183324] hover:bg-[#7A5230] text-white border-[#183324] shadow-lg shadow-[#183324]/20 hover:shadow-xl hover:-translate-y-0.5"
                          }`}
                      >
                        {gpsStatus === "acquiring" ? (
                          <>
                            <svg className="animate-spin h-5 w-5 shrink-0 text-[#183324]" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="font-mono text-xs tracking-wider">Acquiring GPS Signal...</span>
                          </>
                        ) : gpsStatus === "acquired" ? (
                          <>
                            <span className="text-base">✅</span>
                            <span>GPS Locked — Tap to Re-Acquire</span>
                          </>
                        ) : gpsStatus === "out_of_bounds" || gpsStatus === "error" ? (
                          <>
                            <span className="text-base">⚠️</span>
                            <span>Retry GPS Detection</span>
                          </>
                        ) : (
                          <>
                            <span className="text-base">📡</span>
                            <span>Use My GPS Location</span>
                          </>
                        )}
                      </button>

                      {/* ── GPS Error Alert ── */}
                      {(gpsStatus === "error" || gpsStatus === "out_of_bounds") && gpsError && (
                        <div className="mt-3.5 p-3.5 bg-[#A93226]/10 border border-[#A93226]/30 rounded-xl text-xs text-[#A93226] font-medium flex items-start gap-2.5">
                          <span className="shrink-0 mt-0.5">⚠️</span>
                          <span>{gpsError}</span>
                        </div>
                      )}

                      {/* ── Validation error ── */}
                      {errors.gps && (
                        <p className="text-[#A93226] text-xs mt-2.5 font-medium flex items-center gap-1">
                          <span>⚠️</span> {errors.gps}
                        </p>
                      )}

                      {/* ── Acquired Coordinates Card ── */}
                      {gpsLat !== null && gpsLon !== null && (
                        <div className={`mt-4 p-4 rounded-xl border-2 flex items-start gap-4 transition-all duration-300 ${gpsStatus === "acquired"
                          ? "bg-[#E8E1D3] border-[#3B5438]/40 shadow-sm"
                          : "bg-[#A93226]/8 border-[#A93226]/30"
                          }`}>
                          <span className="text-2xl shrink-0 mt-0.5">
                            {gpsStatus === "acquired" ? "📍" : "🚫"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${gpsStatus === "acquired" ? "text-[#3B5438]" : "text-[#A93226]"
                                }`}>
                                {gpsStatus === "acquired" ? "DETECTED COORDINATES" : "BOUND CHECK ERROR"}
                              </span>
                              {gpsStatus === "acquired" && (
                                <span className="px-2 py-0.5 rounded bg-[#3B5438] text-white text-[9px] font-mono font-bold">
                                  LOCKED
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 font-mono">
                              <div className="bg-[#FAF7F0] px-3 py-1.5 rounded-lg border border-[#183324]/15">
                                <span className="text-[9px] text-[#6B4423] block font-bold">LATITUDE</span>
                                <span className="text-xs font-bold text-[#183324]">{gpsLat.toFixed(6)}°N</span>
                              </div>
                              <div className="bg-[#FAF7F0] px-3 py-1.5 rounded-lg border border-[#183324]/15">
                                <span className="text-[9px] text-[#6B4423] block font-bold">LONGITUDE</span>
                                <span className="text-xs font-bold text-[#183324]">{gpsLon.toFixed(6)}°E</span>
                              </div>
                            </div>
                            {gpsStatus === "acquired" && (
                              <p className="text-[10px] text-[#3B5438] mt-2 font-mono font-medium flex items-center gap-1">
                                <span>✓</span> Tamil Nadu Bounds Verified (8.0°–13.5°N · 76.0°–80.5°E)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Regional Scope Footer */}
                    <div className="mt-4 pt-3 border-t border-[#183324]/10 flex items-center justify-between text-[11px] font-mono text-[#6B4423]">
                      <span className="flex items-center gap-1.5">
                        <span>🔒</span> Ephemeral &amp; Confidential
                      </span>
                      <span>Tamil Nadu Region</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#183324]/12">
                        <span className="text-lg">🔬</span>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B4423]">
                          MANUAL AGRO-SIMULATOR
                        </h3>
                      </div>
                      <p className="text-xs text-[#3B5438] mb-4 leading-relaxed">
                        Fine-tune specific soil texture fractions, micro-climate metrics, and cumulative rainfall to simulate custom scenarios.
                      </p>

                      {/* Warnings */}
                      {errors.clayPlusSand && (
                        <div className="mb-4 p-3 bg-[#A93226]/10 border border-[#A93226]/30 rounded-xl text-xs text-[#A93226] font-bold flex items-center gap-2">
                          <span>⚠️</span> {errors.clayPlusSand}
                        </div>
                      )}
                      {errors.tempRange && (
                        <div className="mb-4 p-3 bg-[#A93226]/10 border border-[#A93226]/30 rounded-xl text-xs text-[#A93226] font-bold flex items-center gap-2">
                          <span>⚠️</span> {errors.tempRange}
                        </div>
                      )}

                      {/* Clay + Sand live balance bar */}
                      {(manualVals.clay_pct + manualVals.sand_pct) > 0 && (
                        <div className={`p-3 rounded-xl border text-xs font-mono font-bold flex flex-col gap-1.5 ${manualVals.clay_pct + manualVals.sand_pct > 100
                          ? "bg-[#A93226]/10 border-[#A93226]/30 text-[#A93226]"
                          : "bg-[#E8E1D3] border-[#3B5438]/30 text-[#3B5438]"
                          }`}>
                          <div className="flex justify-between items-center">
                            <span>Clay + Sand Composition</span>
                            <span>{(manualVals.clay_pct + manualVals.sand_pct).toFixed(0)}% / 100% Max</span>
                          </div>
                          <div className="w-full h-2 bg-[#FAF7F0] rounded-full overflow-hidden border border-[#183324]/15">
                            <div
                              className={`h-full rounded-full transition-all duration-200 ${manualVals.clay_pct + manualVals.sand_pct > 100
                                ? "bg-[#A93226]"
                                : "bg-[#3B5438]"
                                }`}
                              style={{ width: `${Math.min(100, manualVals.clay_pct + manualVals.sand_pct)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#183324]/10 text-[11px] font-mono text-[#6B4423]">
                      11 Agronomic parameter sliders available below
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Manual Mode: All 11 Scientific Sliders ── */}
            {mode === "manual" && (
              <div className="mb-8 bg-[#FAF7F0] border-2 border-[#183324]/15 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#183324]/12">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B4423]">
                    🔬 FIELD PARAMETERS MATRIX (11 FEATURES)
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualVals(buildDefaultManual())}
                    className="text-[11px] font-mono text-[#6B4423] hover:text-[#183324] underline font-bold"
                  >
                    Reset Defaults
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {SLIDER_FIELDS.map((field) => {
                    const val = manualVals[field.key] ?? field.defaultVal;
                    const pct = ((val - field.min) / (field.max - field.min)) * 100;
                    return (
                      <div key={field.key} className="bg-[#EFECE3] border border-[#183324]/12 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <label
                            htmlFor={`slider-${field.key}`}
                            className="text-xs font-bold text-[#183324]"
                          >
                            {field.label}
                          </label>
                          <span className="text-xs font-mono font-bold text-white bg-[#183324] px-2.5 py-0.5 rounded-lg shadow-sm">
                            {val.toFixed(field.step < 1 ? 2 : 0)} {field.unit}
                          </span>
                        </div>
                        <div className="relative pt-1 pb-1">
                          <div className="w-full h-2.5 bg-[#FAF7F0] rounded-full overflow-hidden border border-[#183324]/15">
                            <div
                              className="h-full bg-gradient-to-r from-[#183324] to-[#7A5230] rounded-full transition-all duration-150"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <input
                            id={`slider-${field.key}`}
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={val}
                            onChange={(e) =>
                              updateManual(field.key, parseFloat(e.target.value))
                            }
                            className="w-full h-4 absolute top-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-[#3B5438]/70 mt-1">
                          <span>{field.min}{field.unit}</span>
                          <span>{field.max}{field.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Submit Action Button ── */}
            <div className="pt-6 border-t border-[#183324]/15 flex flex-col items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                id="analyze-field-btn"
                className="w-full sm:w-auto px-12 py-4 rounded-full bg-[#183324] hover:bg-[#7A5230] text-[#FAF7F0] font-bold tracking-[0.2em] text-xs uppercase shadow-xl shadow-[#183324]/20 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 min-w-[300px]"
              >
                {loading ? (
                  <span className="flex items-center gap-3 font-mono">
                    <svg className="animate-spin h-4 w-4 text-[#FAF7F0] shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="truncate">{loadingStep || "Analyzing..."}</span>
                  </span>
                ) : (
                  <>
                    <span>ANALYZE MY FIELD</span>
                    <span className="text-sm">➔</span>
                  </>
                )}
              </button>
              <span className="text-xs text-[#3B5438] flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B5438] animate-pulse" />
                {mode === "location"
                  ? "Powered by NASA POWER Climate API & SoilGrids"
                  : "Manual simulation mode — free & instant"}
              </span>
            </div>
          </form>

          {/* ── API Error Banner ── */}
          {apiError && (
            <div className="mt-6 p-4 bg-[#7A5230]/10 border border-[#7A5230]/30 rounded-2xl text-xs text-[#7A5230] font-medium flex items-start gap-2.5">
              <span className="text-base shrink-0">⚠️</span>
              <span>{apiError}</span>
            </div>
          )}
        </div>

        {/* ── Results Panel ── */}
        {result && (
          <div
            ref={resultsRef}
            className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <ResultsPanel
              result={result}
              isMock={isMock}
              cropType={cropType as CropType}
              growthStage={growthStage as GrowthStage}
              onReset={() => { setResult(null); setApiError(""); }}
            />
          </div>
        )}

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
//  ResultsPanel — Dark Forest Green Aesthetic matching website theme
// ─────────────────────────────────────────────────────────────────
function ResultsPanel({
  result,
  isMock,
  cropType,
  growthStage,
  onReset,
}: {
  result: AnalysisResult;
  isMock: boolean;
  cropType: CropType;
  growthStage: GrowthStage;
  onReset: () => void;
}) {
  const { risk_predictions, primary_threat, xai_explanation, advisory_plan } = result;
  const primaryMeta = RISK_META[primary_threat];
  const primaryLevel = risk_predictions[primary_threat];

  // Prepare SHAP chart data
  const shapData = xai_explanation
    .slice(0, 4)
    .map((f) => ({
      feature: f.feature,
      label: FEATURE_LABELS[f.feature] ?? f.feature,
      value: parseFloat(f.shap_value.toFixed(3)),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const RISK_KEYS = Object.keys(risk_predictions) as (keyof typeof risk_predictions)[];

  return (
    <div className="bg-[#183324] text-[#FAF7F0] rounded-[2.5rem] p-8 lg:p-12 shadow-2xl border-2 border-[#7A5230]/40 relative overflow-hidden">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#183324] via-[#6B4423] to-[#4A6B46]" />

      {/* ── Results Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 mb-8 border-b border-white/10 gap-4">
        <div>
          {isMock && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A5230]/40 border border-[#7A5230]/60 text-[10px] font-mono font-bold text-[#FAF7F0] uppercase tracking-wider mb-3">
              ⚠️ Demo Mode — Backend Offline
            </div>
          )}
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#E6DFD3]/70 uppercase block mb-1">
            SCAN RESULT GENERATED
          </span>
          <h3 className="font-serif text-2xl lg:text-3xl font-bold text-white tracking-tight">
            {cropType} Field — {GROWTH_STAGE_LABELS[growthStage]}
          </h3>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="px-4 py-2 rounded-full text-xs font-mono font-bold border shadow-lg"
            style={{
              backgroundColor: `${RISK_COLORS[primaryLevel]}30`,
              borderColor: `${RISK_COLORS[primaryLevel]}70`,
              color: primaryLevel === 2 ? "#F87171" : primaryLevel === 1 ? "#FBBF24" : "#6EE7B7",
            }}
          >
            {primaryMeta.icon} PRIMARY THREAT: {primaryMeta.shortLabel} ({RISK_LABELS[primaryLevel].toUpperCase()})
          </span>
        </div>
      </div>

      {/* ── Two-Column: Risk Predictions + SHAP Attribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* 4 Risk Badges */}
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E6DFD3]/70 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A5230]" />
            FOUR-AXIS RISK PREDICTIONS
          </h4>
          <div className="space-y-3">
            {RISK_KEYS.map((key) => {
              const level = risk_predictions[key];
              const meta = RISK_META[key];
              const isPrimary = key === primary_threat;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isPrimary
                    ? "bg-white/10 border-white/20 shadow-md"
                    : "bg-white/5 border-white/10"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {meta.label}
                      </span>
                      {isPrimary && (
                        <span className="text-[9px] font-mono text-[#E6DFD3] uppercase tracking-wider font-semibold">
                          ★ Primary Threat
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                    style={{
                      backgroundColor: `${RISK_COLORS[level]}25`,
                      color: level === 2 ? "#F87171" : level === 1 ? "#FBBF24" : "#6EE7B7",
                      border: `1px solid ${RISK_COLORS[level]}50`,
                    }}
                  >
                    ● {RISK_LABELS[level].toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SHAP Bar Chart */}
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E6DFD3]/70 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            XAI — SHAP FEATURE ATTRIBUTION
          </h4>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-inner">
            <p className="text-[10px] text-white/60 font-mono mb-3">
              Top 4 causal drivers for <span className="text-[#E6DFD3] font-bold">{primaryMeta.label}</span>:
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={shapData}
                layout="vertical"
                margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v: number) =>
                    (v >= 0 ? "+" : "") + v.toFixed(2)
                  }
                  tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fill: "rgba(255, 255, 255, 0.85)", fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ShapTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {shapData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={entry.value >= 0 ? "#EF4444" : "#22C55E"}
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-white/60 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#EF4444]" /> Risk Driver (+)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#22C55E]" /> Mitigating Factor (-)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Agronomic Advisory Plan ── */}
      <div className="mb-8">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E6DFD3]/70 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B5438]" />
          TNAU AGRONOMIC INTERVENTION PROTOCOL
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {advisory_plan.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 bg-white/5 border border-white/10 p-4 rounded-xl shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-[#3B5438] border border-white/20 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 text-white">
                {i + 1}
              </div>
              <span className="text-xs lg:text-sm text-white/90 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Results Footer ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
        <span className="text-[11px] text-white/50 font-mono">
          Model: Gradient Boosting + SHAP Kernel Explainer · Decision Protocol v2.4
        </span>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-full border border-white/30 text-xs font-bold text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200 uppercase tracking-widest"
        >
          ← Run New Scan
        </button>
      </div>
    </div>
  );
}
