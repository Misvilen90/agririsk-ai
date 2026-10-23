"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative bg-[#FAF7F0] border-t border-[#132B1E]/12 pt-16 pb-12 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">

        {/* ── Top Main Footer Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">

          {/* Brand & CTA (6 cols) */}
          <div className="md:col-span-6 space-y-6">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="relative w-9 h-9 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="AgriRisk AI Logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xl tracking-tight text-[#132B1E]">
                    AGRI<span className="font-serif italic text-[#7A5230]">risk</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E6DFD3] text-[#7A5230] border border-[#7A5230]/20">
                    AI
                  </span>
                </div>
                <span className="text-[9px] font-bold tracking-[0.15em] text-[#6B482B]/70 uppercase -mt-0.5">
                  FIELD INTELLIGENCE SYSTEM
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#224433]/90 leading-relaxed max-w-sm">
              Comprehensive field intelligence for smarter agricultural decisions.
              Predict soil, micro-climate, and pathogen risks across every stage of crop growth.
            </p>

            <div>
              <Link
                href="#analyze"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#132B1E] text-white text-xs font-bold tracking-widest uppercase
                  hover:bg-[#224433] hover:shadow-lg hover:shadow-[#132B1E]/20 hover:-translate-y-0.5
                  transition-all duration-300 group"
              >
                <span>ANALYZE MY FIELD</span>
                <span className="text-sm transition-transform group-hover:translate-x-1">➔</span>
              </Link>
            </div>
          </div>

          {/* Product Links (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#7A5230]">
              PRODUCT
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-[#224433]">
              <li>
                <Link href="#platform" className="hover:text-[#132B1E] transition-colors">
                  Risk Intelligence
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-[#132B1E] transition-colors">
                  SHAP AI
                </Link>
              </li>
              <li>
                <Link href="#intelligence" className="hover:text-[#132B1E] transition-colors">
                  Soil & Weather Telemetry
                </Link>
              </li>
              <li>
                <Link href="#action" className="hover:text-[#132B1E] transition-colors">
                  Action Plan
                </Link>
              </li>
              <li>
                <Link href="#analyze" className="hover:text-[#132B1E] transition-colors">
                  Field Risk Scan
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#7A5230]">
              RESOURCES
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-[#224433]">
              <li>
                <a href="#documentation" className="hover:text-[#132B1E] transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#research" className="hover:text-[#132B1E] transition-colors">
                  Research & Papers
                </a>
              </li>
              <li>
                <a href="#models" className="hover:text-[#132B1E] transition-colors">
                  Climate Models
                </a>
              </li>
              <li>
                <a href="#api" className="hover:text-[#132B1E] transition-colors">
                  API Access
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom Bar ── */}
        <div className="pt-8 border-t border-[#132B1E]/12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#224433]">
          <span>© 2026 AgriRisk AI</span>
          <span className="font-serif italic text-[#132B1E] font-medium">
            Built for smarter, field-level farming decisions.
          </span>
        </div>

      </div>
    </footer>
  );
}
