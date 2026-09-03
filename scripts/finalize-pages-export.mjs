import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = path.join(PROJECT_ROOT, "out");

const routes = [
  { label: "English report", relativePath: "index.html", language: "en" },
  { label: "Chinese report", relativePath: path.join("zh", "index.html"), language: "zh-CN" },
  { label: "English updates", relativePath: path.join("updates", "index.html"), language: "en" },
  { label: "Chinese updates", relativePath: path.join("zh", "updates", "index.html"), language: "zh-CN" },
  { label: "English Research OS", relativePath: path.join("ros", "index.html"), language: "en" },
  { label: "Chinese Research OS", relativePath: path.join("zh", "ros", "index.html"), language: "zh-CN" },
  ...["foundations", "evaluation", "practice"].flatMap((slug) => [
    { label: `English Research OS ${slug}`, relativePath: path.join("ros", slug, "index.html"), language: "en" },
    { label: `Chinese Research OS ${slug}`, relativePath: path.join("zh", "ros", slug, "index.html"), language: "zh-CN" },
  ]),
];

function rootHtmlTag(html, label) {
  const rootTags = html.match(/<html\b[^>]*>/gi) ?? [];
  if (rootTags.length !== 1 || !html.startsWith(`<!DOCTYPE html>${rootTags[0]}`)) {
    throw new Error(`${label}: expected exactly one root html element immediately after the doctype`);
  }
  return rootTags[0];
}

function rootLanguage(html, label) {
  const tag = rootHtmlTag(html, label);
  const languages = [...tag.matchAll(/\blang="([^"]+)"/gi)];
  if (languages.length !== 1) {
    throw new Error(`${label}: expected exactly one lang attribute on the root html element`);
  }
  return languages[0][1];
}

const loadedRoutes = await Promise.all(
  routes.map(async (route) => {
    const filePath = path.join(OUT_ROOT, route.relativePath);
    return { ...route, filePath, html: await readFile(filePath, "utf8") };
  }),
);

const finalizedRoutes = loadedRoutes.map((route) => {
  const currentLanguage = rootLanguage(route.html, route.label);
  if (currentLanguage !== "en") {
    throw new Error(`${route.label}: expected the fresh Next.js export to declare root lang="en", received ${JSON.stringify(currentLanguage)}`);
  }

  if (route.language === "en") return route;

  const sourceTag = rootHtmlTag(route.html, route.label);
  const replacementTag = sourceTag.replace('lang="en"', `lang="${route.language}"`);
  if (replacementTag === sourceTag) {
    throw new Error(`${route.label}: root lang replacement did not occur exactly once`);
  }

  const html = route.html.replace(sourceTag, replacementTag);
  if (rootLanguage(html, route.label) !== route.language) {
    throw new Error(`${route.label}: finalized root language does not match ${route.language}`);
  }
  return { ...route, html };
});

await Promise.all(
  finalizedRoutes
    .filter((route) => route.language !== "en")
    .map((route) => writeFile(route.filePath, route.html, "utf8")),
);

console.log("Finalized GitHub Pages root languages: en for English routes; zh-CN for Chinese routes.");
