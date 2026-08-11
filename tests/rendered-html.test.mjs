import assert from "node:assert/strict";
import test from "node:test";

const ORIGIN = "http://localhost";

async function render(pathname = "/") {
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
  assert.equal(target.pathname, expectedPathname);
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
  assert.match(html, /2026-07-28/);
  assert.match(withoutReactMarkers(html), /2\s+New/);
  assert.match(html, /Auto Research for Materials/);
  assert.match(html, /Long-Horizon Autonomous Architecture Research/);
  assert.match(html, /Verification Gap/);
  assert.match(html, /Primary References/);
  assertLanguageSwitch(html, "/zh/updates/", "en", "/updates/");
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});
