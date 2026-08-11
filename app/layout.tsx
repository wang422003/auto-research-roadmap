import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wang422003.github.io/auto-research-roadmap/"),
  title: "Auto Research Atlas — External Progress & Research Roadmap",
  description: "A source-grounded technical report on Auto Research and Vibe Research progress from 2025-07-28 to 2026-07-28.",
  icons: {
    icon: "https://wang422003.github.io/auto-research-roadmap/og.png",
    shortcut: "https://wang422003.github.io/auto-research-roadmap/og.png",
  },
  openGraph: {
    title: "Auto Research Atlas",
    description: "What actually progressed — and what is still a demo?",
    type: "website",
    images: [{ url: "og.png", width: 1200, height: 630, alt: "Auto Research Atlas" }],
  },
  twitter: { card: "summary_large_image", title: "Auto Research Atlas", description: "External progress, evidence maturity, benchmarks and a three-track research roadmap.", images: ["og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${GeistSans.variable} ${GeistMono.variable}`}>{children}</body></html>;
}
