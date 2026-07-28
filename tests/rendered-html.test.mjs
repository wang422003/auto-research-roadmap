import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
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

test("server-renders the English technical report", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Auto Research Atlas — External Progress &amp; Research Roadmap<\/title>/i);
  assert.match(html, /Auto Research \/(?:<!-- -->)?/);
  assert.match(html, /Autonomy–Evidence Map/);
  assert.match(html, /class="mobile-section-nav"/);
  assert.match(html, /class="system-cards"/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("server-renders the Chinese report from the shared bilingual surface", async () => {
  const response = await render("/zh/");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Auto Research Atlas — 外部进展与 Research Roadmap<\/title>/i);
  assert.match(html, /lang="zh-CN"/);
  assert.match(html, /七个可落地选题/);
  assert.match(html, /报告章节|class="mobile-section-nav"/);
  assert.match(html, /href="\.\.\/"[^>]*hreflang="en"/i);
});
