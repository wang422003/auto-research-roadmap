import type { Metadata } from "next";
import Report from "../page";

export const metadata: Metadata = {
  title: "Auto Research Atlas — 外部进展与 Research Roadmap",
  description: "Auto Research / Vibe Research 外部进展、Evidence Maturity、Benchmarks 与研究选题路线图。",
  alternates: { canonical: "./", languages: { en: "../", "zh-CN": "./" } },
};

export default function ChineseReport() {
  return <Report locale="zh" />;
}
