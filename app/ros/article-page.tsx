import DocumentLanguage from "../document-language";
import { sitePath } from "../site-path";
import { getLocalized } from "@/content/field-updates";
import type {
  ResearchOsArticle,
  ResearchOsBlock,
  ResearchOsClaim,
  ResearchOsSection,
} from "@/content/research-os";

type Locale = "en" | "zh";

const SITE_URL = "https://wang422003.github.io/auto-research-roadmap";

function localRoute(locale: Locale, route: string): string {
  if (locale === "zh") {
    if (route === "/zh/" || route.startsWith("/zh/")) return route;
    return route === "/" ? "/zh/" : `/zh${route}`;
  }
  return route.startsWith("/zh/") ? route.slice(3) : route;
}

function label(locale: Locale, en: string, zh: string): string {
  return locale === "zh" ? zh : en;
}

function ClaimCard({ claim, locale }: { claim: ResearchOsClaim; locale: Locale }) {
  const fields = [
    [label(locale, "Task Definition", "Task Definition"), getLocalized(claim.taskDefinition, locale)],
    [label(locale, "Sample / Denominator", "Sample / Denominator"), getLocalized(claim.sampleSizeDenominator, locale)],
    [label(locale, "Evaluator", "Evaluator"), getLocalized(claim.evaluator, locale)],
    [label(locale, "Comparison Basis", "Comparison Basis"), getLocalized(claim.comparisonBasis, locale)],
  ];
  return (
    <article className="ros-claim-card" id={`claim-${claim.id}`}>
      <div className="ros-claim-topline"><span>Quantitative Claim</span><b>{claim.claimAuthority}</b></div>
      <h3>{getLocalized(claim.statement, locale)}</h3>
      <dl>{fields.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
    </article>
  );
}

function renderBlock(
  block: ResearchOsBlock,
  article: ResearchOsArticle,
  locale: Locale,
  index: number,
  seenClaims?: Set<string>,
) {
  const t = (en: string, zh: string) => label(locale, en, zh);
  switch (block.type) {
    case "paragraph":
      return <p key={`paragraph-${index}`}>{getLocalized(block.text, locale)}</p>;
    case "bullets":
      return <ul key={`bullets-${index}`}>{block.items.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{getLocalized(item, locale)}</li>)}</ul>;
    case "callout":
      return <aside className={`ros-callout ros-callout-${block.tone}`} key={`callout-${index}`}><span>{getLocalized(block.label, locale)}</span><p>{getLocalized(block.text, locale)}</p></aside>;
    case "claim": {
      const claim = article.claims.find((candidate) => candidate.id === block.claimId);
      if (!claim) return null;
      if (seenClaims?.has(claim.id)) {
        return (
          <a className="ros-claim-reference" href={`#claim-${claim.id}`} key={`claim-reference-${index}`}>
            <span>{t("Evidence card", "Evidence Card")}</span>
            <strong>{t("Claim shown above — jump to the evidence card.", "Claim 已在上方展示，跳转到 Evidence Card。")}</strong>
            <i aria-hidden="true">↗</i>
          </a>
        );
      }
      seenClaims?.add(claim.id);
      return <ClaimCard claim={claim} locale={locale} key={`claim-${index}`} />;
    }
    case "comparison":
      return <div className="ros-comparison" key={`comparison-${index}`} role="region" aria-label={t("Comparison", "Comparison")}><div className="ros-comparison-head">{block.columns.map((column, columnIndex) => <span key={columnIndex}>{getLocalized(column, locale)}</span>)}</div>{block.rows.map((row, rowIndex) => <div className="ros-comparison-row" key={rowIndex}><strong data-label={getLocalized(block.columns[0], locale)}>{getLocalized(row.label, locale)}</strong>{row.values.map((value, valueIndex) => <p data-label={block.columns[valueIndex + 1] ? getLocalized(block.columns[valueIndex + 1], locale) : undefined} key={valueIndex}>{getLocalized(value, locale)}</p>)}</div>)}</div>;
    case "diagram":
      return <div className="ros-diagram" key={`diagram-${index}`}><h3>{getLocalized(block.title, locale)}</h3><ol>{block.nodes.map((node, nodeIndex) => <li key={node.id}><span>{String(nodeIndex + 1).padStart(2, "0")}</span><div><strong>{getLocalized(node.label, locale)}</strong><p>{getLocalized(node.description, locale)}</p></div></li>)}</ol><div className="ros-diagram-edges" aria-label={t("Flow", "Flow")}>{block.edges.map((edge) => <span key={`${edge.from}-${edge.to}`}>{edge.from} <i aria-hidden="true">→</i> {edge.to}</span>)}</div></div>;
    default:
      return null;
  }
}

function Section({ section, article, locale, index, seenClaims }: { section: ResearchOsSection; article: ResearchOsArticle; locale: Locale; index: number; seenClaims: Set<string> }) {
  return (
    <section className="ros-article-section" id={section.id}>
      <div className="ros-section-label">{String(index + 1).padStart(2, "0")} / {article.slug}</div>
      <h2>{getLocalized(section.heading, locale)}</h2>
      <div className="ros-section-body">{section.blocks.map((block, blockIndex) => renderBlock(block, article, locale, blockIndex, seenClaims))}</div>
      {section.referenceIds.length ? <div className="ros-inline-sources"><span>{locale === "zh" ? "Sources" : "Sources"}</span>{section.referenceIds.map((id) => { const ref = article.references.find((candidate) => candidate.id === id); return ref ? <a href={ref.url} target="_blank" rel="noreferrer noopener" key={id}>{ref.title} ↗</a> : null; })}</div> : null}
    </section>
  );
}

export default function ResearchOsArticlePage({ article, locale }: { article: ResearchOsArticle; locale: Locale }) {
  const isZh = locale === "zh";
  const t = (en: string, zh: string) => (isZh ? zh : en);
  const reportPath = isZh ? "/zh/" : "/";
  const updatesPath = isZh ? "/zh/updates/" : "/updates/";
  const currentPath = localRoute(locale, `/ros/${article.slug}/`);
  const alternatePath = localRoute(isZh ? "en" : "zh", `/ros/${article.slug}/`);
  const seenClaims = new Set<string>();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: getLocalized(article.title, locale),
    description: getLocalized(article.dek, locale),
    dateModified: article.lastReviewed,
    inLanguage: isZh ? "zh-CN" : "en",
    url: `${SITE_URL}${currentPath}`,
    isPartOf: { "@type": "CollectionPage", name: "Research Operating System", url: `${SITE_URL}${localRoute(locale, "/ros/")}` },
    breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Report", item: `${SITE_URL}${localRoute(locale, reportPath)}` }, { "@type": "ListItem", position: 2, name: "Updates", item: `${SITE_URL}${localRoute(locale, updatesPath)}` }, { "@type": "ListItem", position: 3, name: "Research OS", item: `${SITE_URL}${localRoute(locale, "/ros/")}` }, { "@type": "ListItem", position: 4, name: getLocalized(article.title, locale), item: `${SITE_URL}${currentPath}` }] },
  };

  return (
    <>
      <DocumentLanguage lang={isZh ? "zh-CN" : "en"} />
      <a className="updates-skip-link" href="#ros-article-main">{t("Skip to article", "跳到文章正文")}</a>
      <header className="site-header ros-header">
        <div className="header-row ros-header-row">
          <a className="brand" href={sitePath(reportPath)}><span className="brand-mark">AR</span><span>Auto Research Atlas</span></a>
          <nav className="ros-desktop-nav" aria-label={t("Research OS navigation", "Research OS 导航")}>
            <a href={sitePath(reportPath)}>{t("Report", "主报告")}</a>
            <a href={sitePath(updatesPath)}>{t("Updates", "更新")}</a>
            <a href={sitePath(localRoute(locale, "/ros/"))}>Research OS</a>
            <a href="#article-evidence">{t("Evidence", "证据")}</a>
          </nav>
          <div className="header-actions"><a className="language-switch" href={sitePath(alternatePath)} hrefLang={isZh ? "en" : "zh-CN"}>{isZh ? "EN" : "中文"}</a></div>
        </div>
        <nav className="ros-mobile-nav" aria-label={t("Article sections", "文章章节")}>
          <a href={sitePath(reportPath)}>{t("Report", "主报告")}</a><a href={sitePath(updatesPath)}>{t("Updates", "更新")}</a><a href={sitePath(localRoute(locale, "/ros/"))}>Research OS</a><a href="#article-evidence">{t("Evidence", "证据")}</a>
        </nav>
      </header>

      <main className="ros-main ros-article-main" id="ros-article-main" lang={isZh ? "zh-CN" : "en"}>
        <div className="ros-breadcrumb"><a href={sitePath(reportPath)}>{t("Report", "主报告")}</a><span>→</span><a href={sitePath(updatesPath)}>{t("Updates", "更新")}</a><span>→</span><a href={sitePath(localRoute(locale, "/ros/"))}>Research OS</a><span>→</span><strong>{article.slug}</strong></div>
        <section className="ros-article-hero">
          <div className="ros-hero-kicker">Research Operating System · {article.slug} · <time dateTime={article.lastReviewed}>{article.lastReviewed}</time></div>
          <h1>{getLocalized(article.title, locale)}</h1>
          <p className="ros-article-dek">{getLocalized(article.dek, locale)}</p>
          <div className="ros-article-meta"><span>{t("Last reviewed", "Last Reviewed")} <time dateTime={article.lastReviewed}>{article.lastReviewed}</time></span><span>{t("Source cutoff", "Source Cutoff")} <time dateTime={article.sourceCutoff}>{article.sourceCutoff}</time></span><span>{t("Revision", "Revision")} {article.revision}</span><span>{getLocalized(article.audience, locale)}</span></div>
        </section>

        <div className="ros-article-layout">
          <aside className="ros-toc" aria-label={t("On this page", "本页目录")}>
            <nav className="ros-toc-desktop-nav" aria-label={t("On this page", "本页目录")}>{article.sections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span>{getLocalized(section.heading, locale)}</a>)}</nav>
            <details className="ros-toc-mobile"><summary>{t("On this page", "本页目录")}</summary><nav aria-label={t("On this page", "本页目录")}>{article.sections.map((section, index) => <a href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span>{getLocalized(section.heading, locale)}</a>)}</nav></details>
          </aside>
          <article className="ros-article-prose">{article.sections.map((section, index) => <Section key={section.id} section={section} article={article} locale={locale} index={index} seenClaims={seenClaims} />)}</article>
          <aside className="ros-evidence-rail" id="article-evidence"><div className="ros-rail-sticky"><span className="ros-section-label">Evidence Rail</span><h2>{t("What to verify", "需要验证什么")}</h2><p>{t("Claims stay attached to their task, denominator, evaluator, and source authority.", "每个 Claim 都绑定 Task、Denominator、Evaluator 与 Source Authority。")}</p>{article.claims.length ? <div className="ros-rail-claims">{article.claims.map((claim) => <a href={`#claim-${claim.id}`} key={claim.id}><span>{claim.claimAuthority}</span><strong>{getLocalized(claim.statement, locale)}</strong></a>)}</div> : <div className="ros-rail-empty">{t("This article is conceptual; see the linked references and case-study boundary.", "本文以概念为主，请查看链接的 Reference 与 Case-study Boundary。")}</div>}{article.caseStudies.length ? <div className="ros-rail-case"><span>{t("Case study", "Case Study")}</span>{article.caseStudies.map((item) => <div key={item.id}><h3>{getLocalized(item.title, locale)}</h3><p>{getLocalized(item.boundary, locale)}</p></div>)}</div> : null}</div></aside>
        </div>

        <section className="ros-reference-section" id="references"><div className="ros-section-label">References</div><h2>{t("Primary references", "Primary References")}</h2><ol>{article.references.map((reference, index) => <li key={reference.id}><a href={reference.url} target="_blank" rel="noreferrer noopener"><span>{String(index + 1).padStart(2, "0")}</span><strong>{reference.title}</strong><small>{reference.kind} · {reference.authority}</small><i aria-hidden="true">↗</i></a></li>)}</ol></section>
        <section className="ros-related-section"><div><span className="ros-section-label">Continue</span><h2>{t("Keep the loop visible.", "让 Loop 始终可见。")}</h2></div><div className="ros-related-links">{article.relatedRoutes.map((route) => <a href={sitePath(localRoute(locale, route))} key={route}>{route.replace(/^\/(zh\/)?/, "").replaceAll("/", " · ") || "Report"} ↗</a>)}</div></section>
        <footer className="ros-footer"><div><span className="brand-mark">AR</span><strong>Auto Research Atlas</strong></div><p>{t("Research OS is a neutral working synthesis; linked systems retain their original evidence grades.", "Research OS 是中立的 Working Synthesis；链接 System 保留其原始 Evidence Grade。")}</p><a href="#ros-article-main">{t("Back to top", "返回顶部")} ↑</a></footer>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </>
  );
}
