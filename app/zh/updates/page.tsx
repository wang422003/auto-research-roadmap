import type { Metadata } from "next";
import FieldUpdatesPage from "../../updates/field-updates-page";

const SITE_URL = "https://wang422003.github.io/auto-research-roadmap";

export const metadata: Metadata = {
  title: "Living Field Updates — Auto Research Atlas 中文版",
  description:
    "持续追加、按证据等级审计的外部 Auto Research / Vibe Research 进展、验证、Benchmark 与 Open Gap 更新。",
  alternates: {
    canonical: `${SITE_URL}/zh/updates/`,
    languages: {
      en: `${SITE_URL}/updates/`,
      "zh-CN": `${SITE_URL}/zh/updates/`,
    },
  },
  openGraph: {
    title: "Living Field Updates — Auto Research Atlas 中文版",
    description: "Auto Research 有何新进展？公开证据究竟有多强？",
    type: "website",
    url: `${SITE_URL}/zh/updates/`,
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    images: [
      {
        url: `${SITE_URL}/updates-og.png`,
        width: 1200,
        height: 630,
        alt: "Auto Research Atlas — Field Updates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Living Field Updates — Auto Research Atlas 中文版",
    description: "持续追加、按证据等级审计的外部 Auto Research 进展。",
    images: [`${SITE_URL}/updates-og.png`],
  },
};

export default function ChineseUpdatesRoute() {
  return <FieldUpdatesPage locale="zh" />;
}
