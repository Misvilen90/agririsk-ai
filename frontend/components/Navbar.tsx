"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-3.5 ${scrolled
        ? "bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#132B1E]/10 shadow-sm"
        : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">

        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="AgriRisk AI Logo"
              fill
              sizes="36px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-[#132B1E]">
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

        {/* Center: Floating Navigation Pill */}
        <div className="hidden md:flex items-center gap-6 bg-[#EAE5D9]/80 backdrop-blur-md border border-[#132B1E]/10 rounded-full px-6 py-2 shadow-sm">
          {[
            { label: "RISK INTELLIGENCE", href: "#platform" },
            { label: "• SHAP AI", href: "#how-it-works" },
            { label: "SOIL & WEATHER", href: "#intelligence" },
            { label: "ACTION PLAN", href: "#action" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[11px] font-bold tracking-[0.15em] text-[#132B1E]/80 hover:text-[#132B1E] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right: Sign In & Primary Action Button */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="#signin"
            className="text-xs font-bold tracking-widest text-[#132B1E] uppercase hover:text-[#7A5230] transition-colors"
          >
            SIGN IN
          </Link>
          <Link
            href="#analyze"
            id="nav-analyze-btn"
            className="px-5 py-2.5 rounded-full bg-[#132B1E] text-white text-xs font-bold tracking-wider uppercase transition-all duration-300 hover:bg-[#224433] hover:shadow-lg hover:shadow-[#132B1E]/20 hover:-translate-y-0.5 flex items-center gap-1.5"
          >
            <span>FIELD RISK SCAN</span>
            <span className="text-sm leading-none">↗</span>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
          id="mobile-menu-btn"
        >
          <span
            className={`block w-6 h-0.5 bg-[#132B1E] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#132B1E] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#132B1E] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
          />
        </button>

      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="md:hidden px-6 pt-4 pb-6 bg-[#FAF7F0] border-b border-[#132B1E]/10 flex flex-col gap-3 mt-2">
          {[
            { label: "RISK INTELLIGENCE", href: "#platform" },
            { label: "SHAP AI", href: "#how-it-works" },
            { label: "SOIL & WEATHER", href: "#intelligence" },
            { label: "ACTION PLAN", href: "#action" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-xs font-bold tracking-widest text-[#132B1E] py-1"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="#analyze"
            onClick={() => setMenuOpen(false)}
            className="w-full text-center px-5 py-3 rounded-full bg-[#132B1E] text-white text-xs font-bold uppercase tracking-wider mt-2"
          >
            FIELD RISK SCAN ↗
          </Link>
        </div>
      )}
    </nav>
  );
}
