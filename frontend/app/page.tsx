import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RiskSection from "@/components/RiskSection";
import ExplainSection from "@/components/ExplainSection";
import IntelligenceSection from "@/components/IntelligenceSection";
import ActionSection from "@/components/ActionSection";
import ScanSection from "@/components/ScanSection";
import Footer from "@/components/Footer";
import AgentWidget from "@/components/AgentWidget";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <RiskSection />
        <ExplainSection />
        <IntelligenceSection />
        <ActionSection />
        <ScanSection />
      </main>
      <Footer />
      {/* Floating AI Agent — fixed position, always above all content */}
      <AgentWidget />
    </>
  );
}
