"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const dataIndicators = [
  { label: "Weather", icon: "☁️", value: "32°C / Humid" },
  { label: "Soil", icon: "🪨", value: "Clay-Loam · pH 6.8" },
  { label: "Crop", icon: "🌹", value: "Rose · Commercial" },
  { label: "Growth Stage", icon: "🌿", value: "Bud Initiation" },
];

const riskBadges = [
  { label: "Waterlogging", level: "HIGH", color: "#A93226" },
  { label: "Heat Stress", level: "MED", color: "#6B4423" },
  { label: "Water Stress", level: "LOW", color: "#3B5438" },
  { label: "Disease Risk", level: "MED", color: "#6B4423" },
];

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [indicatorVisible, setIndicatorVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIndicatorVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="hero"
      className="relative bg-[#F4EFE6] overflow-hidden flex flex-col"
    >
      {/* Background paper texture feel */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #183324 1px, transparent 0)`,
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Ambient botanical glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#4A6B46]/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[450px] h-[450px] bg-[#6B4423]/6 rounded-full blur-3xl translate-x-1/3 pointer-events-none" />

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto px-6 lg:px-10 w-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full pt-20 pb-6 lg:pt-24 lg:pb-8 items-center">

          {/* ── LEFT COLUMN: EDITORIAL HEADER ── */}
          <div className="flex flex-col justify-center">

            {/* Vintage Botanical Badge */}
            <div
              className={`inline-flex items-center gap-2 mb-6 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              style={{ transitionDelay: "100ms" }}
            >
              <span className="px-3.5 py-1 rounded-full bg-[#EBE4D5] border border-[#183324]/15 text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B4423] flex items-center gap-1.5">
                <span>🌾</span> FULL-SPECTRUM CROP GROWTH & RISK INTELLIGENCE
              </span>
            </div>

            {/* Main Editorial Heading */}
            <h1
              className={`font-serif text-4xl md:text-5xl lg:text-6xl text-[#183324] leading-[1.15] tracking-tight mb-6 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              style={{ transitionDelay: "200ms" }}
            >
              Multi-Factor{" "}
              <span className="italic text-[#4A6B46] font-normal">Crop Growth & Field Risk</span>{" "}
              <span className="relative">
                Intelligence.
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[#183324] via-[#6B4423] to-[#4A6B46] rounded-full opacity-40" />
              </span>
            </h1>

            {/* Description */}
            <p
              className={`text-base lg:text-lg text-[#3B5438] leading-relaxed max-w-lg mb-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              style={{ transitionDelay: "350ms" }}
            >
              Beyond single-variable climate forecasts — evaluate every critical factor affecting crop development, from soil physics and nutrient pH to micro-climate extremes, stage-specific crop sensitivities, and disease outbreaks.
            </p>

            {/* CTA Button */}
            <div
              className={`flex items-center gap-4 mb-10 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              style={{ transitionDelay: "500ms" }}
            >
              <Link
                href="#analyze"
                id="hero-analyze-btn"
                className="px-8 py-3.5 rounded-full bg-[#183324] text-[#F4EFE6] text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#6B4423] hover:shadow-xl hover:shadow-[#183324]/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group"
              >
                <span>ANALYZE MY FIELD</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Data indicators strip */}
            <div
              className={`pt-6 border-t border-[#183324]/15 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              style={{ transitionDelay: "650ms" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-[#6B4423] font-bold uppercase tracking-[0.25em]">
                  🌱 Evaluates All Crop Growth Factors
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dataIndicators.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EBE4D5] border border-[#183324]/12 text-xs text-[#183324] font-medium"
                  >
                    <span>{d.icon}</span>
                    <span className="font-bold">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: BOTANICAL FRAME & OVERLAYS ── */}
          <div
            className={`relative flex items-center justify-center transition-all duration-1000 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            style={{ transitionDelay: "400ms" }}
          >
            {/* Outer decorative frame ring */}
            <div className="relative w-full max-w-[540px]">
              <div className="absolute -inset-2 rounded-[2.5rem] border border-[#6B4423]/20 z-0" />
              <div className="absolute -inset-4 rounded-[3rem] border border-[#183324]/10 z-0" />

              {/* Main Image Container */}
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-[#183324]/20 z-10 border border-[#183324]/15">
                <Image
                  src="/Hero section.jpg"
                  alt="AgriRisk AI — Smart field monitoring"
                  width={640}
                  height={430}
                  className="w-full h-auto object-cover sepia-[0.1]"
                  priority
                />

                {/* Film overlay gradient */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#183324]/40 to-transparent" />

                {/* Floating live badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4EFE6]/90 backdrop-blur-md border border-[#183324]/15 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#3B5438] animate-pulse" />
                  <span className="text-xs font-bold text-[#183324] tracking-wider uppercase">Live Telemetry</span>
                </div>
              </div>

              {/* Floating Risk Card */}
              <div
                className={`absolute -bottom-6 -left-6 z-20 bg-[#EBE4D5] border border-[#183324]/15 rounded-2xl shadow-xl p-4 min-w-[190px] transition-all duration-700 ${indicatorVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                style={{ transitionDelay: "1000ms" }}
              >
                <p className="text-[10px] font-bold text-[#6B4423] uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1">
                  <span>🍃</span> Risk Analysis
                </p>
                <div className="flex flex-col gap-1.5">
                  {riskBadges.map((risk) => (
                    <div key={risk.label} className="flex items-center justify-between gap-4">
                      <span className="text-xs text-[#183324] font-medium">{risk.label}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: risk.color }}
                      >
                        {risk.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Weather Card */}
              <div
                className={`absolute -top-5 -right-5 z-20 bg-[#183324] text-[#F4EFE6] rounded-2xl shadow-xl p-4 min-w-[160px] border border-[#6B4423]/30 transition-all duration-700 ${indicatorVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                  }`}
                style={{ transitionDelay: "900ms" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-[#6B4423] flex items-center gap-1">
                  <span>☕</span> Field Context
                </p>
                {dataIndicators.slice(0, 2).map((d) => (
                  <div key={d.label} className="flex items-center gap-2 mb-1.5 last:mb-0">
                    <span className="text-base leading-none">{d.icon}</span>
                    <div>
                      <p className="text-[9px] text-[#F4EFE6]/60 uppercase font-semibold tracking-wide leading-tight">{d.label}</p>
                      <p className="text-xs font-semibold text-[#F4EFE6] leading-tight">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
