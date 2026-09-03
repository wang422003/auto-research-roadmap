import type { Metadata } from "next";
import ResearchOsPage from "./research-os-page";

const SITE_URL = "https://wang422003.github.io/auto-research-roadmap";

export const metadata: Metadata = {
  title: "Research Operating System — Auto Research Atlas",
  description: "A neutral working synthesis for inspectable, executable, and accountable research loops.",
  alternates: { canonical: `${SITE_URL}/ros/`, languages: { en: `${SITE_URL}/ros/`, "zh-CN": `${SITE_URL}/zh/ros/` } },
  openGraph: { title: "Research Operating System — Auto Research Atlas", description: "State, Execution, and Control & Accountability for Vibe Research.", type: "website", url: `${SITE_URL}/ros/`, locale: "en_US", alternateLocale: ["zh_CN"], images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Auto Research Atlas" }] },
  twitter: { card: "summary_large_image", title: "Research Operating System — Auto Research Atlas", description: "A working synthesis for accountable research loops.", images: [`${SITE_URL}/og.png`] },
};

export default function ResearchOsHubRoute() {
  return <ResearchOsPage locale="en" />;
}
