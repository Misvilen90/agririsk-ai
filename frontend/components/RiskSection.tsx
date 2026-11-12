"use client";

import { useEffect, useRef, useState } from "react";

const risks = [
  {
    id: "waterlogging",
    number: "01",
    icon: "🌧️",
    iconBg: "bg-[#132B1E]",
    alertBadge: "HIGH SATURATION WARNING",
    alertColor: "bg-[#E2DDD0] text-[#132B1E] border-[#132B1E]/20",
    title: "Waterlogging Risk",
    subtitle: "RAIN + DRAINAGE + SOIL SATURATION",
    description:
      "Detects soil root-zone anaerobic conditions caused by poor drainage, high clay composition, and intense cumulative rainfall.",
    factors: ["Rainfall Intensity (84mm)", "Tile Drainage Rate", "Clay Saturation"],
  },
  {
    id: "heat-stress",
    number: "02",
    icon: "☀️",
    iconBg: "bg-[#7A5230]",
    alertBadge: "THERMAL ALERT",
    alertColor: "bg-[#F0EBE1] text-[#7A5230] border-[#7A5230]/30",
    title: "Heat Stress",
    subtitle: "TEMPERATURE + CROP GROWTH STAGE",
    description:
      "Monitors extreme thermal exposure during sensitive growth phases (such as maize silking or wheat grain filling) to prevent yield blast.",
    factors: ["Peak Temp (>35°C)", "Growth Stage V4", "Canopy Humidity"],
  },
  {
    id: "water-stress",
    number: "03",
    icon: "💧",
    iconBg: "bg-[#224433]",
    alertBadge: "DEFICIT WARNING",
    alertColor: "bg-[#E6DFD3] text-[#224433] border-[#224433]/20",
    title: "Water Stress",
    subtitle: "SOIL MOISTURE + RAINFALL DEFICIT",
    description:
      "Flags critical moisture deficits using root-zone soil dryness indices, rainfall deficits, and evapotranspiration rates.",
    factors: ["Root Moisture (32%)", "7-Day Rain Deficit", "Transpiration Rate"],
  },
  {
    id: "disease-risk",
    number: "04",
    icon: "🌿",
    iconBg: "bg-[#6B482B]",
    alertBadge: "PATHOGEN ALERT",
    alertColor: "bg-[#EFECE3] text-[#6B482B] border-[#6B482B]/30",
    title: "Disease Risk",
    subtitle: "HUMIDITY + TEMP SWINGS + LEAF WETNESS",
    description:
      "Predicts micro-climate conditions favorable for foliar pathogens by tracking extended leaf wetness duration and canopy airflow.",
    factors: ["Leaf Wetness (>14h)", "Canopy Humidity 81%", "Temp Swing"],
  },
];

export default function RiskSection() {
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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="platform"
      ref={sectionRef}
      className="relative bg-[#FAF7F0] py-20 lg:py-28 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10">

        {/* ── Centered Header ── */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 lg:mb-20 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAE5D9]/80 border border-[#132B1E]/15 text-[11px] font-mono font-bold tracking-widest uppercase text-[#132B1E] mb-6 shadow-sm">
            01 / RISK INTELLIGENCE
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-[#132B1E] leading-tight tracking-tight mb-5">
            Understand what's happening
            <br />
            <span className="font-serif italic font-normal text-[#224433]">
              before it becomes
            </span>{" "}
            crop damage.
          </h2>

          <p className="text-base text-[#224433]/90 leading-relaxed max-w-2xl mx-auto">
            Our multi-modal risk engine continuously cross-analyzes weather forecasts, soil sensor
            readings, growth stage biology, and terrain features at individual field resolutions.
          </p>
        </div>

        {/* ── 2 × 2 Card Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {risks.map((risk, i) => (
            <div
              key={risk.id}
              className={`group relative bg-[#EFECE3] border border-[#132B1E]/12 rounded-[2rem] p-8 lg:p-9
                flex flex-col justify-between overflow-hidden
                hover:border-[#132B1E]/25 hover:shadow-xl hover:-translate-y-1
                transition-all duration-500 ease-out
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${100 + i * 110}ms` }}
            >
              {/* Top row: Icon + Alert Badge */}
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`w-12 h-12 rounded-2xl ${risk.iconBg} text-white flex items-center justify-center text-xl shadow-md transition-transform duration-300 group-hover:scale-110`}
                >
                  {risk.icon}
                </div>
                <span
                  className={`px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider uppercase ${risk.alertColor}`}
                >
                  {risk.alertBadge}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-[#132B1E] tracking-tight mb-1.5">
                  {risk.title}
                </h3>
                <p className="text-[10px] font-bold text-[#7A5230] tracking-widest uppercase">
                  {risk.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-[#224433]/90 leading-relaxed mb-6">
                {risk.description}
              </p>

              {/* Bottom: Key Field Factors Analyzed */}
              <div className="pt-4 border-t border-[#132B1E]/10 space-y-2">
                <span className="text-[9px] font-bold text-[#6B482B] uppercase tracking-widest block">
                  KEY FIELD FACTORS ANALYZED:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {risk.factors.map((f) => (
                    <span
                      key={f}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] border border-[#132B1E]/10 text-[11px] font-medium text-[#132B1E]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
