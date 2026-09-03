import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const slugs = new Set(["foundations", "evaluation", "practice"]);
const blockTypes = new Set(["paragraph", "bullets", "callout", "claim", "comparison", "diagram"]);
const kinds = new Set(["Paper", "Repository", "Project", "Docs"]);

function check(condition, message) {
  if (!condition) throw new Error(`[research-os] ${message}`);
}
function text(value, label) {
  check(typeof value === "string" && value.trim(), `${label} must be a non-empty string`);
}
function localized(value, label) {
  check(value && typeof value === "object" && !Array.isArray(value), `${label} must be bilingual`);
  text(value.en, `${label}.en`); text(value.zh, `${label}.zh`);
}
function list(value, label, allowEmpty = true) {
  check(Array.isArray(value), `${label} must be an array`);
  check(allowEmpty || value.length > 0, `${label} must not be empty`);
  const seen = new Set();
  value.forEach((item, index) => { text(item, `${label}[${index}]`); check(!seen.has(item), `${label} contains duplicate ${item}`); seen.add(item); });
}
function date(value, label) {
  text(value, label);
  check(/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), `${label} must be YYYY-MM-DD`);
}
function obj(value, label) {
  check(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value;
}

function validateBlock(block, label, claimIds) {
  obj(block, label); text(block.type, `${label}.type`); check(blockTypes.has(block.type), `${label}.type is invalid`);
  if (block.type === "paragraph") localized(block.text, `${label}.text`);
  if (block.type === "bullets") { check(Array.isArray(block.items) && block.items.length, `${label}.items must not be empty`); block.items.forEach((item, i) => localized(item, `${label}.items[${i}]`)); }
  if (block.type === "callout") { check(["accent", "warning", "neutral"].includes(block.tone), `${label}.tone is invalid`); localized(block.label, `${label}.label`); localized(block.text, `${label}.text`); }
  if (block.type === "claim") { text(block.claimId, `${label}.claimId`); check(claimIds.has(block.claimId), `${label}.claimId is unknown`); }
  if (block.type === "comparison") {
    check(Array.isArray(block.columns) && block.columns.length >= 2, `${label}.columns must contain at least two items`); block.columns.forEach((c, i) => localized(c, `${label}.columns[${i}]`));
    check(Array.isArray(block.rows) && block.rows.length, `${label}.rows must not be empty`); block.rows.forEach((row, i) => { localized(row.label, `${label}.rows[${i}].label`); check(Array.isArray(row.values) && (row.values.length === block.columns.length - 1 || row.values.length === block.columns.length), `${label}.rows[${i}].values do not match columns`); row.values.forEach((v, j) => localized(v, `${label}.rows[${i}].values[${j}]`)); });
  }
  if (block.type === "diagram") {
    localized(block.title, `${label}.title`); check(Array.isArray(block.nodes) && block.nodes.length, `${label}.nodes must not be empty`); const ids = new Set();
    block.nodes.forEach((node, i) => { text(node.id, `${label}.nodes[${i}].id`); check(!ids.has(node.id), `${label}.nodes duplicate ${node.id}`); ids.add(node.id); localized(node.label, `${label}.nodes[${i}].label`); localized(node.description, `${label}.nodes[${i}].description`); });
    check(Array.isArray(block.edges), `${label}.edges must be an array`); block.edges.forEach((edge, i) => { text(edge.from, `${label}.edges[${i}].from`); text(edge.to, `${label}.edges[${i}].to`); check(ids.has(edge.from) && ids.has(edge.to), `${label}.edges[${i}] references unknown node`); });
  }
}

export function validateResearchOs(source) {
  obj(source, "source"); text(source.schemaVersion, "schemaVersion"); check(Array.isArray(source.articles) && source.articles.length === 3, "exactly three articles are required");
  const seenSlugs = new Set();
  source.articles.forEach((article, ai) => {
    const label = `articles[${ai}]`; obj(article, label); text(article.slug, `${label}.slug`); check(slugs.has(article.slug), `${label}.slug is invalid`); check(!seenSlugs.has(article.slug), `duplicate slug ${article.slug}`); seenSlugs.add(article.slug);
    text(article.revision, `${label}.revision`); date(article.lastReviewed, `${label}.lastReviewed`); date(article.sourceCutoff, `${label}.sourceCutoff`); localized(article.title, `${label}.title`); localized(article.dek, `${label}.dek`); localized(article.audience, `${label}.audience`);
    check(Array.isArray(article.claims), `${label}.claims must be an array`); const claimIds = new Set();
    article.claims.forEach((claim, ci) => { const cl = `${label}.claims[${ci}]`; obj(claim, cl); text(claim.id, `${cl}.id`); check(!claimIds.has(claim.id), `${cl}.id is duplicated`); claimIds.add(claim.id); ["statement", "taskDefinition", "sampleSizeDenominator", "evaluator", "comparisonBasis"].forEach((field) => localized(claim[field], `${cl}.${field}`)); check(["Author-reported", "Independently Validated"].includes(claim.claimAuthority), `${cl}.claimAuthority is invalid`); list(claim.referenceIds, `${cl}.referenceIds`, false); });
    check(Array.isArray(article.references) && article.references.length, `${label}.references must not be empty`); const referenceIds = new Set();
    article.references.forEach((reference, ri) => { const rl = `${label}.references[${ri}]`; obj(reference, rl); text(reference.id, `${rl}.id`); check(!referenceIds.has(reference.id), `${rl}.id is duplicated`); referenceIds.add(reference.id); text(reference.title, `${rl}.title`); text(reference.url, `${rl}.url`); check(reference.url.startsWith("https://"), `${rl}.url must use HTTPS`); try { new URL(reference.url); } catch { check(false, `${rl}.url is invalid`); } check(kinds.has(reference.kind), `${rl}.kind is invalid`); check(reference.authority === (reference.kind === "Paper" ? "Primary" : "Official"), `${rl}.authority does not match source kind`); });
    check(Array.isArray(article.sections) && article.sections.length, `${label}.sections must not be empty`); const sectionIds = new Set();
    article.sections.forEach((section, si) => { const sl = `${label}.sections[${si}]`; obj(section, sl); text(section.id, `${sl}.id`); check(!sectionIds.has(section.id), `${sl}.id is duplicated`); sectionIds.add(section.id); localized(section.heading, `${sl}.heading`); list(section.referenceIds, `${sl}.referenceIds`); section.referenceIds.forEach((id) => check(referenceIds.has(id), `${sl} references unknown source ${id}`)); check(Array.isArray(section.blocks) && section.blocks.length, `${sl}.blocks must not be empty`); section.blocks.forEach((block, bi) => validateBlock(block, `${sl}.blocks[${bi}]`, claimIds)); });
    article.claims.forEach((claim, ci) => claim.referenceIds.forEach((id) => check(referenceIds.has(id), `${label}.claims[${ci}] references unknown source ${id}`)));
    check(Array.isArray(article.caseStudies), `${label}.caseStudies must be an array`); const caseIds = new Set();
    article.caseStudies.forEach((item, ci) => { const cl = `${label}.caseStudies[${ci}]`; obj(item, cl); text(item.id, `${cl}.id`); check(!caseIds.has(item.id), `${cl}.id is duplicated`); caseIds.add(item.id); localized(item.title, `${cl}.title`); localized(item.scope, `${cl}.scope`); localized(item.boundary, `${cl}.boundary`); list(item.referenceIds, `${cl}.referenceIds`); item.referenceIds.forEach((id) => check(referenceIds.has(id), `${cl} references unknown source ${id}`)); });
    list(article.relatedRoutes, `${label}.relatedRoutes`, false); article.relatedRoutes.forEach((route) => check(route.startsWith("/"), `${label}.relatedRoutes must be internal routes`));
  });
  check(seenSlugs.size === 3, "all three Research OS slugs are required");
  return { articles: source.articles.length };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const source = JSON.parse(await readFile(new URL("../content/research-os.json", import.meta.url), "utf8"));
  const result = validateResearchOs(source);
  console.log(`Validated ${result.articles} Research OS articles.`);
}
