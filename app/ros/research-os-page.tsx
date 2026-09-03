import DocumentLanguage from "../document-language";
import { sitePath } from "../site-path";
import { getLocalized, latestFieldUpdate } from "@/content/field-updates";
import { researchOsArticles } from "@/content/research-os";

type Locale = "en" | "zh";

const SITE_URL = "https://wang422003.github.io/auto-research-roadmap";

const layerCopy = {
  en: [
    { id: "state", label: "State", body: "Research Brief, Evidence, Memory, Artifacts, Provenance, Git" },
    { id: "execution", label: "Execution", body: "Tools, Sandbox, Evaluator, Replay, Budget" },
    { id: "control", label: "Control & Accountability", body: "Agent Topology, Handoff, Human Intervention, Review, Governance" },
  ],
  zh: [
    { id: "state", label: "State", body: "Research Brief、Evidence、Memory、Artifact、Provenance、Git" },
    { id: "execution", label: "Execution", body: "Tools、Sandbox、Evaluator、Replay、Budget" },
    { id: "control", label: "Control & Accountability", body: "Agent Topology、Handoff、Human Intervention、Review、Governance" },
  ],
} as const;

const boundaries = {
  en: [
    ["Auto Research", "Agents carry a larger share of the Iterative Research Loop.", "Does not imply Novelty, Judgment, or Replication."],
    ["Vibe Research", "Humans keep Direction, Taste, and Critical Judgment; Agents supply Throughput.", "A collaboration mode, not an Autonomy Grade."],
    ["Research Operating System", "The substrate that stores State, drives Execution, and constrains Accountability.", "Can support human-led or more Autonomous workflows."],
  ],
  zh: [
    ["Auto Research", "Agent 承担更大范围的 Iterative Research Loop。", "不自动意味着 Novelty、Judgment 或 Replication。"],
    ["Vibe Research", "Human 保留 Direction、Taste 与 Critical Judgment；Agent 提供 Throughput。", "它是协作模式，不是 Autonomy Grade。"],
    ["Research Operating System", "保存 State、驱动 Execution、约束 Accountability 的系统底座。", "既可支持 Human-led，也可支持更 Autonomous 的 Workflow。"],
  ],
} as const;

const ladder = {
  en: [
    ["Research Assistant", "Operational"],
    ["Metric-driven Loop", "Bounded evidence"],
    ["Artifact-backed Human-on-the-loop", "Most credible current form"],
    ["Narrow Instrument Operator", "Real-world demonstrations"],
    ["Trustworthy Autonomous AI Scientist", "Not demonstrated"],
  ],
  zh: [
    ["Research Assistant", "Operational"],
    ["Metric-driven Loop", "Bounded Evidence"],
    ["Artifact-backed Human-on-the-loop", "当前最可信形态"],
    ["Narrow Instrument Operator", "Real-world Demonstration"],
    ["Trustworthy Autonomous AI Scientist", "尚未验证"],
  ],
} as const;

function pathFor(locale: Locale, route: string): string {
  if (locale === "zh") {
    if (route === "/zh/" || route.startsWith("/zh/")) return route;
    return `/zh${route}`;
  }
  return route.startsWith("/zh/") ? route.slice(3) : route;
}

export default function ResearchOsPage({ locale }: { locale: Locale }) {
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => (isZh ? zh : en);
  const latestDate = latestFieldUpdate.publishedAt;
  const latestUpdateNumber = latestFieldUpdate.id.match(/^update-(\d+)/i)?.[1];
  const latestUpdateLabel = latestUpdateNumber
    ? `Update ${latestUpdateNumber}`
    : latestFieldUpdate.id;
  const latestUpdatePath = isZh ? `/zh/updates/#${latestDate}` : `/updates/#${latestDate}`;
  const currentPath = pathFor(locale, "/ros/");
  const languagePath = pathFor(locale === "zh" ? "en" : "zh", "/ros/");
  const layers = layerCopy[locale];
  const boundaryRows = boundaries[locale];
  const ladderRows = ladder[locale];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("Research Operating System — Auto Research Atlas", "Research Operating System — Auto Research Atlas 中文版"),
    description: t("A working synthesis for inspectable, executable, and accountable research loops.", "面向可检查、可执行、可问责 Research Loop 的 Working Synthesis。"),
    inLanguage: isZh ? "zh-CN" : "en",
    url: `${SITE_URL}${currentPath}`,
    hasPart: researchOsArticles.map((article) => ({
      "@type": "Article",
      headline: getLocalized(article.title, locale),
      url: `${SITE_URL}${pathFor(locale, `/ros/${article.slug}/`)}`,
      dateModified: article.lastReviewed,
    })),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [{ "@type": "ListItem", position: 1, name: "Report", item: `${SITE_URL}${pathFor(locale, isZh ? "/zh/" : "/")}` }, { "@type": "ListItem", position: 2, name: "Research OS", item: `${SITE_URL}${currentPath}` }],
    },
  };

  return (
    <>
      <DocumentLanguage lang={isZh ? "zh-CN" : "en"} />
      <a className="updates-skip-link" href="#ros-main">{t("Skip to Research OS", "跳到 Research OS 正文")}</a>
      <header className="site-header ros-header">
        <div className="header-row ros-header-row">
          <a className="brand" href={sitePath(isZh ? "/zh/" : "/")}><span className="brand-mark">AR</span><span>Auto Research Atlas</span></a>
          <nav className="ros-desktop-nav" aria-label={t("Research OS navigation", "Research OS 导航")}>
            <a href={sitePath(isZh ? "/zh/" : "/")}>{t("Report", "主报告")}</a>
            <a href={sitePath(isZh ? "/zh/updates/" : "/updates/")}>{t("Updates", "更新")}</a>
            <a aria-current="page" href={sitePath(currentPath)}>Research OS</a>
            <a href="#layers">{t("Layers", "Layers")}</a>
            <a href="#articles">{t("Articles", "文章")}</a>
          </nav>
          <div className="header-actions"><a className="language-switch" href={sitePath(languagePath)} hrefLang={isZh ? "en" : "zh-CN"}>{isZh ? "EN" : "中文"}</a></div>
        </div>
        <nav className="ros-mobile-nav" aria-label={t("Research OS sections", "Research OS 章节")}>
          <a href={sitePath(isZh ? "/zh/" : "/")}>{t("Report", "主报告")}</a>
          <a href={sitePath(isZh ? "/zh/updates/" : "/updates/")}>{t("Updates", "更新")}</a>
          <a href="#layers">{t("Layers", "Layers")}</a>
          <a href="#articles">{t("Articles", "文章")}</a>
        </nav>
      </header>

      <main className="ros-main" id="ros-main" lang={isZh ? "zh-CN" : "en"}>
        <section className="ros-hub-hero" id="top">
          <div className="ros-hero-kicker"><span className="live-dot" /> Research Operating System · <time dateTime={latestDate}>{latestDate}</time></div>
          <div className="ros-hero-grid">
            <div>
              <h1>{t("The durable substrate behind Vibe Research.", "Vibe Research 背后的持久系统底座。")}</h1>
              <p className="ros-dek">{t("A Research Operating System is the durable substrate that turns a research objective into an inspectable, executable, and accountable loop.", "Research Operating System 是把 Research Objective 变成可检查、可执行、可问责 Loop 的持久底座。")}</p>
              <div className="ros-hero-actions"><a className="button primary" href="#articles">{t("Read the series", "阅读系列文章")}</a><a className="button" href={sitePath(latestUpdatePath)}>{t("Latest field update", "最新领域更新")}</a></div>
            </div>
            <aside className="ros-definition-card"><span>{t("Working definition", "Working Definition")}</span><strong>{t("State → Execution → Control & Accountability", "State → Execution → Control & Accountability")}</strong><p>{t("This is a working synthesis for system design, not a settled academic taxonomy.", "这是用于 System Design 的 Working Synthesis，不是已经统一的 Academic Taxonomy。")}</p></aside>
          </div>
        </section>

        <section className="ros-section ros-boundary" id="boundary">
          <div className="ros-section-label">01 / Boundary</div>
          <h2>{t("Three concepts, one visible boundary.", "三个概念，一条可见边界。")}</h2>
          <p className="ros-intro">{t("Keep the collaboration mode, the autonomy ambition, and the system substrate separate. This prevents a polished interface from being mistaken for scientific accountability.", "把协作模式、Autonomy Ambition 与系统底座分开，避免把精致 Interface 误认为 Scientific Accountability。")}</p>
          <div className="ros-boundary-table" role="region" aria-label={t("Concept boundary table", "概念边界表")}>
            {boundaryRows.map(([concept, primary, boundary]) => <article key={concept}><h3>{concept}</h3><p>{primary}</p><small>{boundary}</small></article>)}
          </div>
        </section>

        <section className="ros-section ros-layers" id="layers">
          <div className="ros-section-label">02 / System Model</div>
          <h2>{t("Three layers make the loop durable.", "三层结构让 Loop 变得持久。")}</h2>
          <p className="ros-intro">{t("A Research OS is more than orchestration. It preserves state, constrains execution, and makes accountability legible across handoffs.", "Research OS 不只是 Orchestration。它保存 State、约束 Execution，并让跨 Handoff 的 Accountability 可读。")}</p>
          <ol className="ros-layer-stack">
            {layers.map((layer, index) => <li key={layer.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{layer.label}</h3><p>{layer.body}</p></div><i aria-hidden="true">↘</i></li>)}
          </ol>
          <div className="ros-layer-note"><strong>{t("Design test", "设计检验")}</strong><span>{t("If deleting the chat transcript destroys the experiment history, the system has context, not durable research state.", "如果删除 Chat Transcript 就会摧毁 Experiment History，那么系统拥有的是 Context，而不是 Durable Research State。")}</span></div>
        </section>

        <section className="ros-section ros-ladder" id="ladder">
          <div className="ros-section-label">03 / Capability Ladder</div>
          <h2>{t("Capability is a ladder, not a binary.", "Capability 是阶梯，不是二元标签。")}</h2>
          <div className="ros-ladder-list">{ladderRows.map(([stage, status], index) => <article key={stage} className={index === 2 ? "is-current" : index === 4 ? "is-open" : ""}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{stage}</h3><p>{status}</p></div></article>)}</div>
        </section>

        <section className="ros-section ros-articles" id="articles">
          <div className="ros-section-label">04 / Reading Series</div>
          <h2>{t("Three articles for building and testing the substrate.", "三篇文章：构建并检验系统底座。")}</h2>
          <div className="ros-article-grid">{researchOsArticles.map((article, index) => <a className="ros-article-card" href={sitePath(pathFor(locale, `/ros/${article.slug}/`))} key={article.slug}><span>0{index + 1} · {article.slug}</span><h3>{getLocalized(article.title, locale)}</h3><p>{getLocalized(article.dek, locale)}</p><i aria-hidden="true">↗</i></a>)}</div>
        </section>

        <section className="ros-latest-update" aria-labelledby="ros-latest-title">
          <div><span className="ros-section-label">Latest Field Update · {latestDate}</span><h2 id="ros-latest-title">{getLocalized(latestFieldUpdate.title, locale)}</h2><p>{t("Read the dated evidence archive before interpreting the Research OS lens.", "先阅读带日期的 Evidence Archive，再使用 Research OS Lens。")}</p></div>
          <a className="button primary" href={sitePath(latestUpdatePath)}>{t(`Open ${latestUpdateLabel}`, `打开 ${latestUpdateLabel}`)} ↗</a>
        </section>

        <footer className="ros-footer"><div><span className="brand-mark">AR</span><strong>Auto Research Atlas</strong></div><p>{t("Research OS is a neutral working synthesis. DeepScientist appears only as a public architecture case study.", "Research OS 是中立的 Working Synthesis。DeepScientist 仅作为公开 Architecture Case Study 出现。")}</p><a href="#top">{t("Back to top", "返回顶部")} ↑</a></footer>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
