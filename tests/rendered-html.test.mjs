import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ORIGIN = "http://localhost";
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES_BASE_PATH = "/auto-research-roadmap";
const USE_PAGES_EXPORT = process.env.PAGES_STATIC_EXPORT === "true";

async function render(pathname = "/") {
  if (USE_PAGES_EXPORT) {
    const relativeRoute = pathname.replace(/^\/+|\/+$/g, "");
    const html = await readFile(path.join(PROJECT_ROOT, "out", relativeRoute, "index.html"), "utf8");
    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`${ORIGIN}${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]+)"`, "i"));
  assert.ok(match, `Expected ${name} on ${tag}`);
  return match[1];
}

function assertLanguageSwitch(html, pathname, expectedLanguage, expectedPathname) {
  const switchTag = html.match(/<a\b[^>]*class="[^"]*\blanguage-switch\b[^"]*"[^>]*>/i)?.[0];
  assert.ok(switchTag, `Expected a language switch on ${pathname}`);
  assert.equal(attribute(switchTag, "hrefLang").toLowerCase(), expectedLanguage.toLowerCase());

  const target = new URL(attribute(switchTag, "href"), `${ORIGIN}${pathname}`);
  const normalizedPathname = target.pathname.startsWith(PAGES_BASE_PATH)
    ? target.pathname.slice(PAGES_BASE_PATH.length) || "/"
    : target.pathname;
  assert.equal(normalizedPathname, expectedPathname);
}

function withoutReactMarkers(html) {
  return html.replace(/<!--.*?-->/gs, "");
}

function htmlRegexLiteral(value) {
  return new RegExp(
    value
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replaceAll("&", "(?:&|&amp;)")
  );
}

test("server-renders the English technical report", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Auto Research Atlas — External Progress &amp; Research Roadmap<\/title>/i);
  assert.match(html, /Auto Research \/(?:<!-- -->)?/);
  assert.match(html, /Autonomy–Evidence Map/);
  assert.match(html, /Technical Report · v1\.1 · 2026-07-28/i);
  assert.match(html, /<strong>25<\/strong>\s*<span>curated entries<\/span>/i);
  assert.match(html, /class="mobile-section-nav"/);
  assert.match(html, /class="system-cards"/);
  assertLanguageSwitch(html, "/", "zh-CN", "/zh/");
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("server-renders the Chinese report from the shared bilingual surface", async () => {
  const response = await render("/zh/");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Auto Research Atlas — 外部进展与 Research Roadmap<\/title>/i);
  assert.match(html, /lang="zh-CN"/);
  assert.match(html, /Technical Report · v1\.1 · 2026-07-28/i);
  assert.match(html, /<strong>25<\/strong>\s*<span>精选条目<\/span>/i);
  assert.match(html, /七个可落地选题/);
  assert.match(html, /报告章节|class="mobile-section-nav"/);
  assertLanguageSwitch(html, "/zh/", "en", "/");
});

test("server-renders dated English field updates and their evidence contract", async () => {
  const response = await render("/updates/");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Living Field Updates — Auto Research Atlas<\/title>/i);
  assert.match(html, /<time\b[^>]*dateTime="2026-[^"]+"[^>]*>/i);
  assert.match(html, /2026-08-11/);
  assert.match(html, /2026-09-03/);
  assert.match(html, /AutoResearchEval/);
  assert.match(html, /ScienceFlow/);
  assert.match(html, /BixBench3/);
  assert.match(html, /PRIS/);
  assert.match(html, /Additional Signals/);
  assert.match(html, /Carried context/);
  assert.match(html, /AutoResearch:\s*Insight/);
  assert.match(html, /2026-07-28/);
  assert.match(withoutReactMarkers(html), /2\s+New/);
  assert.match(html, /Auto Research for Materials/);
  assert.match(html, /Long-Horizon Autonomous Architecture Research/);
  assert.match(html, /Verification Gap/);
  assert.match(html, /Primary References/);
  assertLanguageSwitch(html, "/updates/", "zh-CN", "/zh/updates/");
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("server-renders dated Chinese field updates and preserves the nested language route", async () => {
  const response = await render("/zh/updates/");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Living Field Updates — Auto Research Atlas 中文版<\/title>/i);
  assert.match(html, /<time\b[^>]*dateTime="2026-[^"]+"[^>]*>/i);
  assert.match(html, /2026-08-11/);
  assert.match(html, /2026-09-03/);
  assert.match(html, /AutoResearchEval/);
  assert.match(html, /ScienceFlow/);
  assert.match(html, /Additional Signals/);
  assert.match(html, /Carried context/);
  assert.match(html, /2026-07-28/);
  assert.match(withoutReactMarkers(html), /2\s+New/);
  assert.match(html, /Auto Research for Materials/);
  assert.match(html, /Long-Horizon Autonomous Architecture Research/);
  assert.match(html, /Verification Gap/);
  assert.match(html, /Primary References/);
  assertLanguageSwitch(html, "/zh/updates/", "en", "/updates/");
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

for (const [pathname, expectedTitle, language, alternatePath] of [
  ["/ros/", /Research Operating System — Auto Research Atlas/, "en", "/zh/ros/"],
  ["/zh/ros/", /Research Operating System — Auto Research Atlas 中文版/, "zh-CN", "/ros/"],
  ["/ros/foundations/", /What Is a Research Operating System\?/, "en", "/zh/ros/foundations/"],
  ["/ros/evaluation/", /How to Evaluate a Research Operating System\?/, "en", "/zh/ros/evaluation/"],
  ["/ros/practice/", /Vibe Research in Practice/, "en", "/zh/ros/practice/"],
  ["/zh/ros/foundations/", /什么是 Research Operating System/, "zh-CN", "/ros/foundations/"],
  ["/zh/ros/evaluation/", /如何评估一个 Research Operating System/, "zh-CN", "/ros/evaluation/"],
  ["/zh/ros/practice/", /Vibe Research 如何真正运行/, "zh-CN", "/ros/practice/"],
]) {
  test(`server-renders Research OS route ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>.*${expectedTitle.source}.*</title>`, "i"));
    assert.match(html, new RegExp(`lang="${language}"`));
    assert.match(html, /Research Operating System/);
    if (pathname.endsWith("/ros/")) assert.match(html, /Reading Series|Articles/);
    else assert.match(html, /Primary references|Primary References|References/);
    assertLanguageSwitch(html, pathname, language === "en" ? "zh-CN" : "en", alternatePath);
    assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
  });
}

const READING_TITLES = [
  "KamiOS",
  "Research State",
  "XScientist",
  "Rethinking Scientific Discovery in the Agentic Era",
  "AI for Auto-Research: Roadmap & User Guide",
  "AutoResearch AI",
  "Vibe Researching as Wolf Coming",
  "A Visionary Look at Vibe Researching",
  "The AI Scientist",
  "Agent Laboratory",
  "Kosmos: An AI Scientist for Autonomous Discovery",
  "AutoResearchEval",
  "Beyond Final Scores",
  "FIRE-Bench",
  "AutoResearchBench",
  "SciAgentArena",
  "ResearchArena",
  "The AI co-scientist",
  "A multi-agent system for automating scientific discovery",
  "AutoLabs",
  "An agentic artificially intelligent X-ray scientist",
];

test("server-renders the Research OS reading path on both hub locales", async () => {
  for (const [pathname, language, alternatePath, localizedMarker] of [
    ["/ros/", "en", "/zh/ros/", "Research OS is still an emerging framing"],
    ["/zh/ros/", "zh-CN", "/ros/", "Research OS 仍是一个 emerging framing"],
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Research OS Reading List/);
    assert.match(html, /KamiOS/);
    assert.match(html, /Research State/);
    assert.match(html, /XScientist/);
    assert.match(html, /SCION/);
    assert.match(html, /Evidence Grade/);
    assert.match(html, /Peer-reviewed does not imply Independent Replication/);
    assert.match(html, /Recommended path/);
    assert.match(html, /Open the full reading inventory|打开完整 Reading Inventory/);
    const readingInventoryPath = pathname.startsWith("/zh/")
      ? "/zh/ros/foundations/#closest-literature"
      : "/ros/foundations/#closest-literature";
    assert.match(
      html,
      new RegExp(`href="(?:\\/auto-research-roadmap)?${readingInventoryPath.replaceAll("/", "\\/")}"`),
    );
    assert.match(html, new RegExp(localizedMarker));
    assertLanguageSwitch(html, pathname, language === "en" ? "zh-CN" : "en", alternatePath);
  }
});

for (const [pathname, language, alternatePath] of [
  ["/ros/foundations/", "en", "/zh/ros/foundations/"],
  ["/zh/ros/foundations/", "zh-CN", "/ros/foundations/"],
]) {
  test(`server-renders the complete Research OS reading inventory on ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /id="closest-literature"/);
    assert.match(html, /#closest-literature/);
    assert.match(html, /Last reviewed|Last Reviewed/);
    assert.match(html, /Source cutoff|Source Cutoff/);
    assert.match(html, /Peer-reviewed does not imply Independent Replication/);
    for (const title of READING_TITLES) assert.match(html, htmlRegexLiteral(title), title);
    const externalCards = (html.match(/target="_blank" rel="noreferrer noopener"/g) ?? []).length;
    assert.ok(externalCards >= 21, "the full inventory should expose every Paper link");
    assert.match(html, new RegExp(`lang="${language}"`));
    assertLanguageSwitch(html, pathname, language === "en" ? "zh-CN" : "en", alternatePath);
  });
}
