"use client";

import { useEffect, useRef, useState } from "react";

const weatherMetrics = [
  { label: "Temperature", value: "34°C", icon: "🌡️", change: "Above Avg" },
  { label: "Rainfall", value: "42mm", icon: "🌧️", change: "Heavy" },
  { label: "Humidity", value: "81%", icon: "💧", change: "High" },
  { label: "Wind Speed", value: "12 km/h", icon: "💨", change: "Moderate" },
];

const soilMetrics = [
  { label: "Soil Type", value: "Clay Loam", icon: "🪨", detail: "Slow Drainage" },
  { label: "Moisture Level", value: "68%", icon: "💦", detail: "Near Saturation" },
  { label: "Drainage Class", value: "Moderate", icon: "🌊", detail: "Retention High" },
  { label: "Topography", value: "Flat (1.2°)", icon: "🏞️", detail: "Pool Risk" },
];

const pipelineSteps = [
  {
    step: "01",
    title: "🌾 CROP CONTEXT",
    subtitle: "Growth Stage & Vulnerability Profile",
    description: "Aligns weather thresholds with current crop phenology (e.g., Flowering stage sensitivity).",
    tag: "Crop Model",
  },
  {
    step: "02",
    title: "🤖 AGRIRISK AI",
    subtitle: "Multi-Modal Neural Fusion Engine",
    description: "Synthesizes soil mechanics, atmospheric predictions, and historical yield anomalies.",
    tag: "Core AI Engine",
  },
  {
    step: "03",
    title: "🎯 FIELD RISK SCORE",
    subtitle: "Actionable Field-Level Predictions",
    description: "Delivers granular risk percentages, impact factors, and immediate mitigation steps.",
    tag: "Output",
  },
];

export default function IntelligenceSection() {
  const [visible, setVisible] = useState(false);
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

  return (
    <section
      id="intelligence"
      ref={sectionRef}
      className="relative bg-[#FAF7F0] py-16 lg:py-24 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10">

        {/* ── Centered Header ── */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAE5D9]/80 border border-[#132B1E]/15 text-[11px] font-mono font-bold tracking-widest uppercase text-[#132B1E] mb-6 shadow-sm">
            02 / SOIL & WEATHER TELEMETRY
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-[#132B1E] leading-tight tracking-tight mb-5">
            Every field responds differently to weather.
            <br />
            <span className="font-serif italic font-normal text-[#224433]">
              We combine environmental and field-level context.
            </span>
          </h2>

          <p className="text-base text-[#224433]/90 leading-relaxed max-w-xl mx-auto">
            Raw weather data isn't enough. AgriRisk AI fuses real-time climate telemetry with
            field-specific soil parameters and crop phenology to compute true vulnerability.
          </p>
        </div>

        {/* ── Top Telemetry Data Cards (Weather & Soil) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

          {/* Card 1: WEATHER DATA */}
          <div
            className={`bg-[#EFECE3] border border-[#132B1E]/12 rounded-[2rem] p-7 lg:p-8
              hover:border-[#132B1E]/25 hover:shadow-xl transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
          >
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#132B1E]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#132B1E] text-white flex items-center justify-center text-xl shadow-md">
                  🌦️
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#132B1E] tracking-tight">WEATHER DATA</h3>
                  <p className="text-xs text-[#224433]/80">Real-time atmospheric telemetry</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#7A5230] bg-[#FAF7F0] border border-[#132B1E]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                Live Feed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {weatherMetrics.map((item) => (
                <div
                  key={item.label}
                  className="bg-[#FAF7F0] border border-[#132B1E]/10 p-4 rounded-2xl flex flex-col justify-between hover:border-[#132B1E]/25 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-[#224433] mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-bold font-mono text-[#132B1E]">{item.value}</span>
                    <span className="text-[10px] font-medium text-[#7A5230]">{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: SOIL & FIELD DATA */}
          <div
            className={`bg-[#EFECE3] border border-[#132B1E]/12 rounded-[2rem] p-7 lg:p-8
              hover:border-[#132B1E]/25 hover:shadow-xl transition-all duration-500 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
          >
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#132B1E]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7A5230] text-white flex items-center justify-center text-xl shadow-md">
                  🪨
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#132B1E] tracking-tight">SOIL & FIELD</h3>
                  <p className="text-xs text-[#224433]/80">Field-level soil & physical characteristics</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#132B1E] bg-[#FAF7F0] border border-[#132B1E]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                Calibrated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {soilMetrics.map((item) => (
                <div
                  key={item.label}
                  className="bg-[#FAF7F0] border border-[#132B1E]/10 p-4 rounded-2xl flex flex-col justify-between hover:border-[#132B1E]/25 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-[#224433] mb-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-lg font-bold font-mono text-[#132B1E] truncate">{item.value}</span>
                  </div>
                  <span className="text-[10px] text-[#224433]/70 mt-0.5">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── SVG Merger & Flow Pipeline ── */}
        <div className="relative mb-8 flex flex-col items-center">
          <div className="hidden lg:block w-full max-w-2xl h-16 relative">
            <svg width="100%" height="100%" viewBox="0 0 600 60" fill="none" className="overflow-visible">
              <defs>
                <marker
                  id="downArrowheadRef"
                  markerWidth="8"
                  markerHeight="8"
                  refX="4"
                  refY="6"
                  orient="auto"
                >
                  <polygon points="0 0, 8 0, 4 6" fill="#7A5230" />
                </marker>
              </defs>

              <path
                d="M 150 0 L 150 30 Q 150 45, 170 45 L 280 45 Q 300 45, 300 52"
                stroke="#132B1E"
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
                markerEnd="url(#downArrowheadRef)"
                fill="none"
              />
              <path
                d="M 450 0 L 450 30 Q 450 45, 430 45 L 320 45 Q 300 45, 300 52"
                stroke="#132B1E"
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
                markerEnd="url(#downArrowheadRef)"
                fill="none"
              />
              <circle cx="300" cy="52" r="4" fill="#132B1E" />
            </svg>
          </div>

          <div className="lg:hidden flex flex-col items-center my-2">
            <div className="w-7 h-7 rounded-full bg-[#132B1E]/10 text-[#7A5230] font-bold text-sm flex items-center justify-center">
              ↓
            </div>
          </div>
        </div>

        {/* ── Vertical Pipeline Flow ── */}
        <div className="relative max-w-3xl mx-auto space-y-4">
          {pipelineSteps.map((step, idx) => (
            <div key={step.title} className="relative flex flex-col items-center">

              <div
                className={`w-full group bg-[#EFECE3] border border-[#132B1E]/12 rounded-3xl p-6 lg:p-7
                  hover:border-[#132B1E]/30 hover:shadow-xl hover:-translate-y-0.5
                  transition-all duration-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${250 + idx * 150}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#132B1E] text-[#FAF7F0] flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                    {step.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-lg text-[#132B1E] tracking-tight">{step.title}</h4>
                      <span className="text-[10px] font-mono font-bold text-[#7A5230] bg-[#FAF7F0] border border-[#132B1E]/10 px-2 py-0.5 rounded-full">
                        {step.tag}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#7A5230] mb-1">{step.subtitle}</p>
                    <p className="text-xs text-[#224433]/90 leading-relaxed max-w-xl">{step.description}</p>
                  </div>
                </div>

                <div className="sm:shrink-0 self-end sm:self-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#132B1E] group-hover:text-[#7A5230] transition-colors">
                    <span>Fused Data</span>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                      <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>

              {idx < pipelineSteps.length - 1 && (
                <div className="h-8 flex flex-col items-center justify-center my-1">
                  <div className="w-px h-full bg-gradient-to-b from-[#132B1E]/30 to-[#7A5230]/60" />
                  <div className="text-[#7A5230] text-xs font-bold -mt-2">
                    ↓
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
