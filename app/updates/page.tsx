import type { Metadata } from "next";
import FieldUpdatesPage from "./field-updates-page";

const SITE_URL = "https://wang422003.github.io/auto-research-roadmap";

export const metadata: Metadata = {
  title: "Living Field Updates — Auto Research Atlas",
  description:
    "Versioned, evidence-graded updates on external Auto Research and Vibe Research progress, validation, benchmarks, and open gaps.",
  alternates: {
    canonical: `${SITE_URL}/updates/`,
    languages: {
      en: `${SITE_URL}/updates/`,
      "zh-CN": `${SITE_URL}/zh/updates/`,
    },
  },
  openGraph: {
    title: "Living Field Updates — Auto Research Atlas",
    description:
      "What changed in Auto Research—and how strong is the public evidence?",
    type: "website",
    url: `${SITE_URL}/updates/`,
    locale: "en_US",
    alternateLocale: ["zh_CN"],
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
    title: "Living Field Updates — Auto Research Atlas",
    description:
      "Versioned, evidence-graded updates on external Auto Research progress.",
    images: [`${SITE_URL}/updates-og.png`],
  },
};

export default function UpdatesRoute() {
  return <FieldUpdatesPage locale="en" />;
}
