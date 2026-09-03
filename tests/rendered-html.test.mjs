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
