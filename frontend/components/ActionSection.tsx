"use client";

import { useEffect, useRef, useState } from "react";

const riskActions = [
  {
    id: "waterlogging",
    riskTitle: "WATERLOGGING RISK",
    defaultLevel: 82,
    contributors: [
      { icon: "🌧️", label: "Heavy rainfall accumulation (84mm in 72h)" },
      { icon: "🪨", label: "Poor soil drainage capacity (Clay Loam)" },
      { icon: "🌱", label: "Current growth stage vulnerability (Maize V4)" },
    ],
    actions: [
      "Delay Nitrogen fertilizer application by 48h to prevent runoff loss",
      "Clear blocked field drainage furrow B & perimeter outlet pathways",
      "Monitor standing water depth at designated low spots daily",
      "Inspect sub-surface tile drain outlets for flow obstructions",
    ],
  },
  {
    id: "heat-stress",
    riskTitle: "HEAT STRESS",
    defaultLevel: 58,
    contributors: [
      { icon: "☀️", label: "Peak daily temperature exceeding 35°C threshold" },
      { icon: "💧", label: "Low relative humidity during midday hours" },
      { icon: "🌿", label: "Early reproductive growth phase sensitivity" },
    ],
    actions: [
      "Schedule canopy cooling misting during peak solar hours",
      "Apply potassium-based foliar spray to improve heat tolerance",
      "Ensure subsurface soil moisture is maintained above 60%",
      "Shift field operations to early morning or late evening",
    ],
  },
  {
    id: "disease-risk",
    riskTitle: "DISEASE RISK",
    defaultLevel: 64,
    contributors: [
      { icon: "🌫️", label: "Extended leaf wetness duration (>14 consecutive hours)" },
      { icon: "🌡️", label: "Favorable temperature range (22°C – 26°C) for spore germination" },
      { icon: "🌱", label: "Dense crop canopy restricting interior airflow" },
    ],
    actions: [
      "Apply preventive bio-fungicide targeted for rust/blight",
      "Optimize row spacing ventilation if undertaking canopy trimming",
      "Inspect leaf undersides in high-density field sections",
      "Delay overhead sprinkler irrigation to reduce foliage wetness",
    ],
  },
];

export default function ActionSection() {
  const [visible, setVisible] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(0);
  const [adjustedLevel, setAdjustedLevel] = useState<number>(82);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSelectRisk = (idx: number) => {
    setSelectedRisk(idx);
    setAdjustedLevel(riskActions[idx].defaultLevel);
  };

  const current = riskActions[selectedRisk];

  // Helper to calculate status badge details based on level
  const getSeverityMeta = (level: number) => {
    if (level >= 75) {
      return {
        badgeText: "CRITICAL",
        badgeColor: "bg-[#6B4423]/20 text-[#6B4423] border-[#6B4423]/40",
        barGradient: "from-[#6B4423] to-[#8B5E3C]",
        statusNote: "Immediate field intervention required within 24 hours.",
      };
    } else if (level >= 50) {
      return {
        badgeText: "MODERATE",
        badgeColor: "bg-[#4A6B46]/20 text-[#183324] border-[#4A6B46]/40",
        barGradient: "from-[#4A6B46] to-[#6B4423]",
        statusNote: "Heightened risk. Monitor conditions and prepare mitigation.",
      };
    } else {
      return {
        badgeText: "LOW / SAFE",
        badgeColor: "bg-[#4A6B46]/10 text-[#3B5438] border-[#4A6B46]/20",
        barGradient: "from-[#4A6B46] to-[#4A6B46]",
        statusNote: "Field conditions within safe operational thresholds.",
      };
    }
  };

  const severityMeta = getSeverityMeta(adjustedLevel);

  return (
    <section
      id="action"
      ref={sectionRef}
      className="relative bg-[#F4EFE6] py-16 lg:py-24 overflow-hidden text-[#183324]"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-10">

        {/* ── Centered Header ── */}
        <div
          className={`text-center max-w-3xl mx-auto mb-14 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBE4D5] border border-[#183324]/15 text-[11px] font-mono font-bold tracking-widest uppercase text-[#6B4423] mb-6 shadow-sm">
            03 / ACTIONABLE PRESCRIPTION
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-[#183324] leading-tight tracking-tight mb-4 font-serif">
            KNOW THE RISK.
            <br />
            <span className="font-serif italic font-normal text-[#4A6B46]">
              TAKE THE RIGHT ACTION.
            </span>
          </h2>

          <p className="text-base text-[#3B5438] leading-relaxed max-w-xl mx-auto">
            Personalized recommendations based on your field's current risk conditions. Adjust the risk level below to see simulated prescription changes.
          </p>
        </div>

        {/* ── Interactive Risk Selector Tabs ── */}
        <div
          className={`flex flex-wrap items-center justify-center gap-3 mb-8 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          {riskActions.map((risk, idx) => (
            <button
              key={risk.id}
              onClick={() => handleSelectRisk(idx)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 border flex items-center gap-2 ${selectedRisk === idx
                ? "bg-[#183324] text-white border-[#183324] shadow-md shadow-[#183324]/20 scale-105"
                : "bg-[#EBE4D5] text-[#183324] border-[#183324]/15 hover:bg-[#DDD8CC] hover:border-[#183324]/30"
                }`}
            >
              <span>{risk.contributors[0].icon}</span>
              <span>{risk.riskTitle}</span>
            </button>
          ))}
        </div>

        {/* ── Main Recommendation Card ── */}
        <div
          className={`relative bg-[#EBE4D5] border border-[#183324]/15 rounded-[2.5rem] p-8 lg:p-12 shadow-xl transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
        >
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#183324]/12 gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#6B4423] block mb-1">
                CURRENT FIELD STATUS
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#183324] tracking-tight flex items-center gap-2">
                <span>⚠️</span>
                HIGH {current.riskTitle}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-mono font-extrabold px-3.5 py-1 rounded-full border transition-all duration-300 ${severityMeta.badgeColor}`}
              >
                {severityMeta.badgeText}
              </span>
              <span className="text-3xl font-black font-mono text-[#183324]">
                {adjustedLevel}%
              </span>
            </div>
          </div>

          {/* ── Interactive Risk Level Adjuster ── */}
          <div className="mb-8 bg-[#F4EFE6] border border-[#183324]/12 rounded-2xl p-5 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <label htmlFor="risk-level-slider" className="text-xs font-bold uppercase tracking-widest text-[#183324] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6B4423]" />
                ADJUST RISK LEVEL (SIMULATOR)
              </label>

              {/* Preset buttons */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#6B4423] font-bold uppercase mr-1">Presets:</span>
                {[
                  { label: "Low", value: 30 },
                  { label: "Moderate", value: 55 },
                  { label: "High", value: 82 },
                  { label: "Critical", value: 95 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setAdjustedLevel(preset.value)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${adjustedLevel === preset.value
                      ? "bg-[#183324] text-white"
                      : "bg-[#EBE4D5] text-[#183324] hover:bg-[#183324]/10"
                      }`}
                  >
                    {preset.label} ({preset.value}%)
                  </button>
                ))}
              </div>
            </div>

            {/* Range Slider */}
            <div className="space-y-2">
              <input
                id="risk-level-slider"
                type="range"
                min="10"
                max="100"
                value={adjustedLevel}
                onChange={(e) => setAdjustedLevel(Number(e.target.value))}
                className="w-full h-2.5 bg-[#EBE4D5] rounded-lg appearance-none cursor-pointer accent-[#183324]"
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-[#3B5438]/70">
                <span>10% (Low)</span>
                <span>50% (Moderate)</span>
                <span>75% (High)</span>
                <span>100% (Severe)</span>
              </div>
            </div>
          </div>

          {/* Risk Severity Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-[#3B5438] mb-2">
              <span>Simulated Severity Index</span>
              <span className="font-mono font-bold text-[#183324]">{adjustedLevel} / 100</span>
            </div>
            <div className="w-full h-3.5 bg-[#183324]/10 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${severityMeta.barGradient} transition-all duration-500 ease-out`}
                style={{ width: `${adjustedLevel}%` }}
              />
            </div>
            <p className="text-[11px] font-mono text-[#6B4423] mt-1.5 font-medium">
              💡 {severityMeta.statusNote}
            </p>
          </div>

          {/* Two-column layout: Contributors vs Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Left: Main Contributors */}
            <div className="bg-[#F4EFE6] border border-[#183324]/12 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#183324] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6B4423]" />
                Main Contributors
              </h4>
              <div className="space-y-3">
                {current.contributors.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#EBE4D5] p-3.5 rounded-xl border border-[#183324]/10">
                    <span className="text-lg shrink-0 mt-0.5">{c.icon}</span>
                    <span className="text-xs text-[#3B5438] font-medium leading-relaxed">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Recommended Actions */}
            <div className="bg-[#F4EFE6] border border-[#183324]/12 rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#183324] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#183324]" />
                RECOMMENDED ACTIONS
              </h4>
              <div className="space-y-3">
                {current.actions.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#183324] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-xs text-[#183324] font-semibold leading-relaxed">{act}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* CTA Footer */}
          <div className="pt-6 border-t border-[#183324]/12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#3B5438]/80">
              Recommendations auto-update as weather & field telemetry change.
            </p>
            <button
              id="view-full-plan-btn"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#183324] text-[#F4EFE6] text-xs font-bold tracking-widest uppercase
                hover:bg-[#6B4423] hover:shadow-lg hover:shadow-[#183324]/20 hover:-translate-y-0.5
                transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span>VIEW FULL ACTION PLAN</span>
              <span className="text-sm transition-transform group-hover:translate-x-1">➔</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}

