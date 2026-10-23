"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { FEATURE_LABELS } from "@/lib/types";

const fieldInputs = [
  { id: "weather", icon: "🌦️", label: "Weather", detail: "Rainfall & temp patterns" },
  { id: "soil", icon: "🪨", label: "Soil", detail: "Clay content & drainage" },
  { id: "crop", icon: "🌱", label: "Crop", detail: "Vulnerability profile" },
  { id: "growth", icon: "🌿", label: "Growth", detail: "Current phenology stage" },
];

// Static SHAP demo data matching spec (feature → shap_value)
const SHAP_DEMO_DATA = [
  { feature: "precip_3d_sum", shap_value: 0.42 },
  { feature: "clay_pct", shap_value: 0.28 },
  { feature: "bulk_density", shap_value: 0.18 },
  { feature: "rh_3d_mean", shap_value: -0.12 },
];

const pillars = [
  {
    title: "Transparent",
    desc: "Every prediction is broken down into clear, quantified SHAP contribution scores — no black-box decision-making.",
    icon: "🔍",
  },
  {
    title: "Field-specific",
    desc: "Calculates risk using precise micro-climate telemetry and field soil composition unique to your coordinates.",
    icon: "📍",
  },
  {
    title: "Actionable",
    desc: "Focus your interventions on the highest-impact factors, saving water, fertilizer, and operational costs.",
    icon: "⚡",
  },
];

// Custom tooltip for the Recharts bar chart
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
    <div className="bg-[#183324] text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-white/10">
      <span className="font-bold">
        {FEATURE_LABELS[p.feature] ?? p.feature}
      </span>
      <br />
      <span className={value >= 0 ? "text-[#F87171]" : "text-[#6EE7B7]"}>
        SHAP: {value >= 0 ? "+" : ""}{value.toFixed(3)}
      </span>
    </div>
  );
};

export default function ExplainSection() {
  const [visible, setVisible] = useState(false);
  const [activeFactor, setActiveFactor] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative bg-[#F4EFE6] pt-4 pb-20 lg:pt-6 lg:pb-28 overflow-hidden text-[#183324]"
    >
      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">

        {/* ── Centered Header ── */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 lg:mb-20 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBE4D5] border border-[#183324]/15 text-[11px] font-mono font-bold tracking-widest uppercase text-[#6B4423] mb-6 shadow-sm">
            WHY THIS RISK?
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-[#183324] leading-tight tracking-tight mb-5 font-serif">
            Don&apos;t just see the risk.
            <br />
            <span className="font-serif italic font-normal text-[#4A6B46]">
              Understand why.
            </span>
          </h2>

          <p className="text-base text-[#3B5438] leading-relaxed max-w-xl mx-auto">
            AgriRisk AI uses Explainable AI (SHAP) to reveal the exact
            micro-environmental factors driving every risk prediction.
          </p>
        </div>

        {/* ── Main XAI Interactive Diagram Card ── */}
        <div
          className={`relative bg-[#EBE4D5] border border-[#183324]/15 rounded-[2.5rem] p-8 lg:p-12 shadow-xl mb-16 lg:mb-20 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

            {/* LEFT: FIELD DATA (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#183324] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#6B4423]" />
                  FIELD DATA
                </span>
                <span className="text-[10px] font-mono text-[#6B4423] font-bold">Inputs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                {fieldInputs.map((item, idx) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveFactor(idx)}
                    onMouseLeave={() => setActiveFactor(null)}
                    className={`group relative bg-[#F4EFE6] border p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 cursor-pointer ${activeFactor === idx
                      ? "border-[#183324] shadow-md translate-x-1"
                      : "border-[#183324]/12 hover:border-[#183324]/30"
                      }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EBE4D5] flex items-center justify-center text-xl shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-[#183324]">{item.label}</h4>
                        <span className="text-[10px] font-mono font-bold text-[#6B4423] bg-[#EBE4D5] px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-[#3B5438] truncate">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MIDDLE: FLOW CONNECTOR (2 cols) */}
            <div className="hidden md:flex md:col-span-2 flex-col items-center justify-center py-4">
              <div className="relative w-full flex flex-col items-center justify-center">
                <svg width="100%" height="120" viewBox="0 0 100 120" fill="none" className="overflow-visible">
                  <defs>
                    <marker id="xaiArrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                      <polygon points="0 0, 8 4, 0 8" fill="#183324" />
                    </marker>
                  </defs>
                  <path d="M 10 15 C 50 15, 50 60, 88 60" stroke="#183324" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" markerEnd="url(#xaiArrowhead)" fill="none" />
                  <path d="M 10 45 C 40 45, 50 60, 88 60" stroke="#183324" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" markerEnd="url(#xaiArrowhead)" fill="none" />
                  <path d="M 10 75 C 40 75, 50 60, 88 60" stroke="#183324" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" markerEnd="url(#xaiArrowhead)" fill="none" />
                  <path d="M 10 105 C 50 105, 50 60, 88 60" stroke="#183324" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" markerEnd="url(#xaiArrowhead)" fill="none" />
                  <circle cx="88" cy="60" r="4" fill="#183324" />
                </svg>
                <div className="flex items-center gap-1.5 mt-2 text-[#6B4423] font-bold text-xs">
                  <span className="text-[10px] uppercase tracking-widest">EXPLANATION</span>
                  <span className="text-base">➔</span>
                </div>
              </div>
            </div>

            {/* RIGHT: RECHARTS SHAP BAR CHART (5 cols) */}
            <div className="md:col-span-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#183324] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#183324]" />
                  AI EXPLANATION
                </span>
                <span className="text-[10px] font-mono text-[#6B4423] font-bold">
                  SHAP Factor Attribution
                </span>
              </div>

              {/* Dark card wrapping the chart */}
              <div className="bg-[#183324] text-white p-6 lg:p-7 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="flex items-start justify-between pb-5 mb-5 border-b border-white/15">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                      TARGET PREDICTION
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-white mt-0.5">
                      Waterlogging Risk
                    </h3>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-[#A93226]/30 text-[#F87171] border border-[#A93226]/40">
                    HIGH · 78%
                  </span>
                </div>

                {/* Recharts Horizontal Bar Chart */}
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={SHAP_DEMO_DATA.map((d) => ({
                      ...d,
                      label: FEATURE_LABELS[d.feature] ?? d.feature,
                      value: d.shap_value,
                    }))}
                    layout="vertical"
                    margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) =>
                        (v >= 0 ? "+" : "") + v.toFixed(2)
                      }
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={110}
                      tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine
                      x={0}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={1}
                    />
                    <Tooltip content={<ShapTooltip />} />
                    <Bar
                      dataKey="value"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={22}
                      isAnimationActive={visible}
                    >
                      {SHAP_DEMO_DATA.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={entry.shap_value >= 0 ? "#EF4444" : "#22C55E"}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-mono">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" />
                    Positive SHAP — Risk Driver
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-mono">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]" />
                    Negative SHAP — Mitigating
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 font-mono">
                  <span>Confidence: 94.2%</span>
                  <span>shap.TreeExplainer · Demo Data</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 3 Value Pillars ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((item, idx) => (
            <div
              key={item.title}
              className={`group bg-[#EBE4D5] border border-[#183324]/12 rounded-3xl p-8
                hover:border-[#183324]/25 hover:shadow-lg hover:-translate-y-1
                transition-all duration-500 ease-out
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${400 + idx * 150}ms` }}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F4EFE6] border border-[#183324]/10 flex items-center justify-center text-2xl mb-6 transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-[#183324] mb-2 tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm text-[#3B5438] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
