"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Pre-defined quick-action chips ──────────────────────────────
const QUICK_ACTIONS = [
  "What is waterlogging risk?",
  "Explain SHAP values",
  "Best practices for Rose · Bud Initiation",
  "Tamil Nadu soil types overview",
  "When does heat stress affect Coconut?",
  "How does bulk density affect drainage?",
];

// ── Simulated AI knowledge base ─────────────────────────────────
const BOT_RESPONSES: Record<string, string> = {
  "What is waterlogging risk?":
    "🌧️ **Waterlogging Risk** occurs when soil pores become saturated with water, starving plant roots of oxygen. AgriRisk AI detects this by combining cumulative 3-day rainfall, clay content (high clay = poor drainage), and bulk density. In Rose crops, waterlogging at the Bud Initiation stage can cause flower abortion and root rot within 48h.",

  "Explain SHAP values":
    "🔍 **SHAP (SHapley Additive exPlanations)** values quantify how much each input feature contributes to a specific risk prediction.\n\n• **Positive SHAP** (red bars) → feature is pushing risk **up**\n• **Negative SHAP** (green bars) → feature is pushing risk **down**\n\nFor example, a SHAP of +0.42 for `precip_3d_sum` means cumulative rainfall is the biggest driver of waterlogging risk in your field.",

  "Best practices for Rose · Bud Initiation":
    "🌹 **Rose at Bud Initiation** is the most critical and vulnerable stage:\n\n1. Keep soil moisture consistent — avoid both drought stress and waterlogging\n2. If humidity > 80%, apply preventive fungicide (Mancozeb or Copper-based)\n3. Temperature > 32°C can scorch buds — consider afternoon shade nets\n4. Avoid overhead irrigation; use drip irrigation to keep foliage dry\n5. Monitor for Black Spot symptoms daily at this stage",

  "Tamil Nadu soil types overview":
    "🪨 **Tamil Nadu's primary agricultural soils:**\n\n• **Red Loam** (Coimbatore region) — well-drained, ideal for Rose\n• **Black Cotton Soil** (Thanjavur) — high clay, poor drainage, waterlogging risk\n• **Sandy Loam** (Coastal zones) — fast-draining, drought-prone\n• **Laterite Soil** (Western Ghats) — leaches nutrients quickly\n\nAgriRisk AI uses SoilGrids to fetch precise clay%, sand%, and bulk density for your coordinates automatically.",

  "When does heat stress affect Coconut?":
    "🥥 **Coconut Heat Stress Thresholds:**\n\n• Temperature > **36°C** during **Inflorescence / Button** stage causes **button shedding** — immature coconuts drop before maturing\n• Sustained heat with low humidity causes **spadix browning**\n• **Nut Maturity** stage is more resilient but extreme heat (>40°C) can reduce oil content\n\nAgriRisk AI triggers a Heat Stress alert when the 3-day average max temp exceeds crop-specific thresholds.",

  "How does bulk density affect drainage?":
    "🌱 **Bulk Density** (g/cm³) measures soil compaction:\n\n• **< 1.2 g/cm³** — loose, well-aerated soil, good root growth\n• **1.2–1.5 g/cm³** — moderate compaction, some drainage restriction\n• **> 1.5 g/cm³** — compacted soil, root penetration impaired, waterlogging risk HIGH\n\nCombined with high clay content, elevated bulk density is one of the strongest predictors of waterlogging in our ML model (confirmed by SHAP analysis).",
};

const DEFAULT_REPLY =
  "🤖 I'm **AgriRisk AI Assistant**. I'm here to help you understand field risks, SHAP explanations, and agronomic best practices for Rose and Coconut crops in Tamil Nadu. Try one of the quick actions above, or type your question!";

// ── Types ───────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

// ── Message renderer (basic markdown support) ────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  // Convert **bold** and newlines
  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j}>{part}</strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#132B1E] flex items-center justify-center text-xs shrink-0 mr-2 mt-0.5 shadow-md">
          🌿
        </div>
      )}
      <div
        className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
            ? "bg-[#132B1E] text-white rounded-br-md"
            : "bg-[#EBE4D5] text-[#132B1E] rounded-bl-md border border-[#132B1E]/10"
          }`}
      >
        {renderText(msg.text)}
        <div
          suppressHydrationWarning
          className={`text-[10px] mt-1.5 ${isUser ? "text-white/40" : "text-[#224433]/50"
            }`}
        >
          {msg.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-[#7A5230] flex items-center justify-center text-xs shrink-0 ml-2 mt-0.5 shadow-md text-white font-bold">
          U
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-[#132B1E] flex items-center justify-center text-xs shrink-0 shadow-md">
        🌿
      </div>
      <div className="bg-[#EBE4D5] border border-[#132B1E]/10 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#132B1E]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[#132B1E]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[#132B1E]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

// ── Main AgentWidget Component ───────────────────────────────────
export default function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "👋 Hello! I'm the **AgriRisk AI Assistant**. I can explain risk predictions, SHAP values, and agronomic advice for Rose & Coconut crops in Tamil Nadu.\n\nAsk me anything or tap a quick action below!",
      timestamp: new Date(),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasUnread(false);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputVal("");
      setIsTyping(true);

      // Simulate AI thinking time (600ms – 1.4s)
      const delay = 600 + Math.random() * 800;
      setTimeout(() => {
        const responseText =
          BOT_RESPONSES[text.trim()] ??
          DEFAULT_REPLY;

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: responseText,
          timestamp: new Date(),
        };
        setIsTyping(false);
        setMessages((prev) => [...prev, botMsg]);
        if (!isOpen) setHasUnread(true);
      }, delay);
    },
    [isOpen]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputVal);
  };

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-5 sm:right-8 z-[9999] w-[90vw] sm:w-[380px] transition-all duration-500 ease-out origin-bottom-right ${isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-90 translate-y-4 pointer-events-none"
          }`}
        role="dialog"
        aria-label="AgriRisk AI Chat Assistant"
      >
        <div className="bg-[#FAF7F0] border border-[#132B1E]/15 rounded-[2rem] shadow-2xl shadow-[#132B1E]/20 overflow-hidden flex flex-col"
          style={{ height: "520px" }}
        >
          {/* Panel Header */}
          <div className="bg-[#132B1E] px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#4A6B46] flex items-center justify-center text-lg shadow-md">
                🌿
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  AgriRisk AI Assistant
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] animate-pulse" />
                  <span className="text-[10px] text-white/60 font-medium">
                    Online · TNAU Agronomic Engine
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0 scroll-smooth">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 py-2 border-t border-[#132B1E]/10 shrink-0">
            <p className="text-[10px] text-[#224433]/60 font-bold uppercase tracking-widest mb-2">
              Quick Actions
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_ACTIONS.slice(0, 4).map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-[#EBE4D5] border border-[#132B1E]/15 text-[11px] font-medium text-[#132B1E] hover:bg-[#132B1E] hover:text-white hover:border-[#132B1E] transition-all duration-200 whitespace-nowrap"
                >
                  {action.length > 28 ? action.slice(0, 28) + "…" : action}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 border-t border-[#132B1E]/10 flex items-center gap-2 shrink-0 bg-[#FAF7F0]"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about risks, SHAP, or crops..."
              id="agent-chat-input"
              className="flex-1 bg-[#EBE4D5] border border-[#132B1E]/15 rounded-full px-4 py-2.5 text-sm text-[#132B1E] placeholder-[#224433]/40 focus:outline-none focus:border-[#132B1E] focus:ring-2 focus:ring-[#132B1E]/10 transition-all"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
              id="agent-send-btn"
              className="w-10 h-10 rounded-full bg-[#132B1E] text-white flex items-center justify-center text-sm hover:bg-[#224433] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0 hover:-translate-y-0.5"
            >
              ➔
            </button>
          </form>
        </div>
      </div>

      {/* ── Floating Trigger Button ─────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        id="agent-widget-btn"
        aria-label="Open AgriRisk AI Assistant"
        aria-expanded={isOpen}
        className={`fixed bottom-5 right-5 sm:right-8 z-[9999] w-16 h-16 rounded-full shadow-2xl transition-all duration-500
          flex items-center justify-center group
          ${isOpen
            ? "bg-[#224433] rotate-[360deg] scale-90"
            : "bg-[#132B1E] hover:scale-110 hover:shadow-[#132B1E]/40"
          }`}
      >
        {/* Pulse ring when closed */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#132B1E] animate-ping opacity-20" />
            <span className="absolute -inset-1 rounded-full border-2 border-[#132B1E]/30 animate-pulse" />
          </>
        )}

        {/* Icon: leaf when closed, X when open */}
        <span className={`text-2xl transition-all duration-300 ${isOpen ? "scale-0 opacity-0 absolute" : "scale-100 opacity-100"}`}>
          🌿
        </span>
        <span className={`text-white text-xl font-bold transition-all duration-300 ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute"}`}>
          ✕
        </span>

        {/* Unread indicator dot */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#A93226] border-2 border-white animate-bounce" />
        )}
      </button>

      {/* ── Tooltip (hover, only when closed) ──────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-[5.5rem] right-5 sm:right-8 z-[9998] pointer-events-none">
          <div className="bg-[#132B1E] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask AgriRisk AI
          </div>
        </div>
      )}
    </>
  );
}
