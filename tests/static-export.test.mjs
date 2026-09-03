import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = path.join(PROJECT_ROOT, "out");
const BASE_PATH = "/auto-research-roadmap";
const SITE_ORIGIN = "https://wang422003.github.io";

async function readExportedRoute(relativePath) {
  const filePath = path.join(OUT_ROOT, relativePath, "index.html");
  await access(filePath);
  return { filePath, html: await readFile(filePath, "utf8") };
}

function rootHtmlLanguage(html, routeLabel) {
  const rootTag = html.match(/^<!DOCTYPE html><html\b[^>]*>/i)?.[0];
  assert.ok(rootTag, `${routeLabel} should start with a root html element`);

  const languageAttributes = [...rootTag.matchAll(/\blang="([^"]+)"/gi)];
  assert.equal(languageAttributes.length, 1, `${routeLabel} should declare exactly one root html language`);
  return languageAttributes[0][1];
}

function referencedAssetUrls(html) {
  return [...html.matchAll(/\b(?:href|src)="([^"]+)"/gi)].map((match) => match[1]);
}

async function assertPrefixedBuildAssets(html, routeLabel) {
  const urls = referencedAssetUrls(html);
  const buildAssets = urls.filter((url) => url.startsWith(`${BASE_PATH}/_next/`));
  const stylesheet = buildAssets.find((url) => /\.css(?:\?|$)/.test(url));
  const script = buildAssets.find((url) => /\.js(?:\?|$)/.test(url));

  assert.ok(stylesheet, `${routeLabel} should reference a basePath-prefixed stylesheet`);
  assert.ok(script, `${routeLabel} should reference a basePath-prefixed script`);
  assert.doesNotMatch(html, /(?:href|src)="\/_next\//, `${routeLabel} contains an unprefixed build asset`);
  assert.doesNotMatch(html, /\/auto-research-roadmap\/auto-research-roadmap\//, `${routeLabel} contains a duplicated basePath`);

  for (const url of [stylesheet, script]) {
    const pathname = new URL(url, SITE_ORIGIN).pathname;
    const exportedPath = pathname.slice(BASE_PATH.length + 1);
    await access(path.join(OUT_ROOT, exportedPath));
  }
}

for (const [routeLabel, relativePath, canonicalPath, languagePath, languageCode] of [
  ["English updates", "updates", "/updates/", "/zh/updates/#2026-09-03", "zh-CN"],
  ["Chinese updates", path.join("zh", "updates"), "/zh/updates/", "/updates/#2026-09-03", "en"],
  ["English Research OS", "ros", "/ros/", "/zh/ros/", "zh-CN"],
  ["Chinese Research OS", path.join("zh", "ros"), "/zh/ros/", "/ros/", "en"],
  ...["foundations", "evaluation", "practice"].flatMap((slug) => [
    ["English Research OS " + slug, path.join("ros", slug), `/ros/${slug}/`, `/zh/ros/${slug}/`, "zh-CN"],
    ["Chinese Research OS " + slug, path.join("zh", "ros", slug), `/zh/ros/${slug}/`, `/ros/${slug}/`, "en"],
  ]),
]) {
  test(`static export contains ${routeLabel} with correctly prefixed assets`, async () => {
    const { html } = await readExportedRoute(relativePath);

    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="${SITE_ORIGIN}${BASE_PATH}${canonicalPath.replaceAll("/", "\\/")}"\\s*\\/?>`, "i"),
    );
    const imageName = relativePath.includes("ros") ? "og" : "updates-og";
    assert.match(html, new RegExp(`<meta property="og:image" content="${SITE_ORIGIN}${BASE_PATH}\\/${imageName}\\.png"\\s*\\/?>`, "i"));
    const languageSwitch = html.match(/<a\b[^>]*class="[^"]*\blanguage-switch\b[^"]*"[^>]*>/i)?.[0];
    assert.ok(languageSwitch, `${routeLabel} should render a language switch`);
    assert.ok(
      languageSwitch.includes(`href="${BASE_PATH}${languagePath}"`),
      `${routeLabel} language switch should preserve the project basePath and dated anchor`,
    );
    assert.ok(
      languageSwitch.toLowerCase().includes(`hreflang="${languageCode.toLowerCase()}"`),
      `${routeLabel} language switch should declare ${languageCode}`,
    );
    await access(path.join(OUT_ROOT, `${imageName}.png`));
    await assertPrefixedBuildAssets(html, routeLabel);
  });
}

for (const [routeLabel, relativePath, expectedLanguage] of [
  ["English report", "", "en"],
  ["Chinese report", "zh", "zh-CN"],
  ["English updates", "updates", "en"],
  ["Chinese updates", path.join("zh", "updates"), "zh-CN"],
  ["English Research OS", "ros", "en"],
  ["Chinese Research OS", path.join("zh", "ros"), "zh-CN"],
  ...["foundations", "evaluation", "practice"].flatMap((slug) => [
    ["English Research OS " + slug, path.join("ros", slug), "en"],
    ["Chinese Research OS " + slug, path.join("zh", "ros", slug), "zh-CN"],
  ]),
]) {
  test(`static export declares ${expectedLanguage} on the ${routeLabel} root html element`, async () => {
    const { html } = await readExportedRoute(relativePath);
    assert.equal(rootHtmlLanguage(html, routeLabel), expectedLanguage);
  });
}

test("static export preserves the Research OS reading inventory content", async () => {
  const routes = [
    ["English hub", "ros", "Research OS Reading List"],
    ["Chinese hub", path.join("zh", "ros"), "Research OS Reading List"],
    ["English foundations", path.join("ros", "foundations"), "closest-literature"],
    ["Chinese foundations", path.join("zh", "ros", "foundations"), "closest-literature"],
  ];
  for (const [label, relativePath, marker] of routes) {
    const { html } = await readExportedRoute(relativePath);
    assert.match(html, new RegExp(marker));
    assert.match(html, /KamiOS/);
    assert.match(html, /Research State/);
    assert.match(html, /XScientist/);
    assert.match(html, /SCION/);
    assert.match(html, /Peer-reviewed does not imply Independent Replication/);
    assert.match(html, /#closest-literature/);
    if (label.includes("foundations")) {
      const cardIds = [...html.matchAll(/id="reading-([^"]+)"/g)].map((match) => match[1]);
      assert.equal(new Set(cardIds).size, 21, `${label} should export all 21 unique reading cards`);
    }
  }
});
