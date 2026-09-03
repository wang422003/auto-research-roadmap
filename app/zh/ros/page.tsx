import type { Metadata } from "next";
import ResearchOsPage from "../../ros/research-os-page";

const SITE_URL = "https://wang422003.github.io/auto-research-roadmap";

export const metadata: Metadata = {
  title: "Research Operating System — Auto Research Atlas 中文版",
  description: "面向可检查、可执行、可问责 Research Loop 的中立 Working Synthesis。",
  alternates: { canonical: `${SITE_URL}/zh/ros/`, languages: { en: `${SITE_URL}/ros/`, "zh-CN": `${SITE_URL}/zh/ros/` } },
  openGraph: { title: "Research Operating System — Auto Research Atlas 中文版", description: "State、Execution 与 Control & Accountability 的 Research OS 视角。", type: "website", url: `${SITE_URL}/zh/ros/`, locale: "zh_CN", alternateLocale: ["en_US"], images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Auto Research Atlas" }] },
  twitter: { card: "summary_large_image", title: "Research Operating System — Auto Research Atlas 中文版", description: "面向可问责 Research Loop 的 Working Synthesis。", images: [`${SITE_URL}/og.png`] },
};

export default function ChineseResearchOsHubRoute() {
  return <ResearchOsPage locale="zh" />;
}
