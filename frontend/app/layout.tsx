import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgriRisk AI — Multi-Factor Crop Growth & Field Risk Intelligence",
  description:
    "AI-powered agricultural intelligence system analyzing soil physics & pH, micro-climate extremes, crop phenology, and pathogen pressure to predict risks and protect crop growth.",
  keywords: [
    "AgriRisk AI",
    "crop growth intelligence",
    "agricultural AI",
    "field risk prediction",
    "soil and climate analysis",
    "smart farming",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F4EFE6] font-sans text-[#183324]">
        {children}
      </body>
    </html>
  );
}
