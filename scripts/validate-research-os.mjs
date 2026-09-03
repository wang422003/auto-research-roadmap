import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const slugs = new Set(["foundations", "evaluation", "practice"]);
const blockTypes = new Set(["paragraph", "bullets", "callout", "claim", "comparison", "diagram", "reading-guide"]);
const kinds = new Set(["Paper", "Repository", "Project", "Docs"]);
const authorities = new Set(["Primary", "Official"]);
const evidenceMaturities = new Set(["A", "B", "C", "D"]);
const readingTracks = new Set(["direct", "foundations", "systems", "evaluation", "lab"]);
const publicationStatuses = new Set(["Peer-reviewed", "Preprint", "SSRN"]);
const recommendedReadingPath = ["roadmap-survey", "kamios", "xscientist", "autoresearch-eval", "robin"];
const quantitativeTokenPattern = /(?:\b\d+(?:[.,]\d+)?\b|\b(?:percent|percentage|accuracy|f1|rmse|mae|pass\s*rate|sample\s*size|denominator|n\s*=)\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:task|tasks|paper|papers|model|models|domain|domains|trajectory|trajectories|experiment|experiments|assay|assays|review|reviews|stage|stages|entry|entries|step|steps|candidate|candidates|configuration|configurations|worker|workers|hour|hours|day|days)\b)/i;

function check(condition, message) {
  if (!condition) throw new Error(`[research-os] ${message}`);
}

function text(value, label) {
  check(typeof value === "string" && value.trim(), `${label} must be a non-empty string`);
}

function localized(value, label) {
  check(value && typeof value === "object" && !Array.isArray(value), `${label} must be bilingual`);
  text(value.en, `${label}.en`);
  text(value.zh, `${label}.zh`);
}

function list(value, label, allowEmpty = true) {
  check(Array.isArray(value), `${label} must be an array`);
  check(allowEmpty || value.length, `${label} must not be empty`);
  const seen = new Set();
  value.forEach((item, index) => {
    text(item, `${label}[${index}]`);
    check(!seen.has(item), `${label} contains duplicate ${item}`);
    seen.add(item);
  });
}

function date(value, label) {
  text(value, label);
  const parsed = Date.parse(`${value}T00:00:00Z`);
  check(/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed), `${label} must be YYYY-MM-DD`);
  check(new Date(parsed).toISOString().slice(0, 10) === value, `${label} is not a valid calendar date`);
}

function obj(value, label) {
  check(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  return value;
}

function validateBlock(block, label, claimIds) {
  obj(block, label);
  text(block.type, `${label}.type`);
  check(blockTypes.has(block.type), `${label}.type is invalid`);
  if (block.type === "paragraph") localized(block.text, `${label}.text`);
  if (block.type === "bullets") {
    check(Array.isArray(block.items) && block.items.length, `${label}.items must not be empty`);
    block.items.forEach((item, index) => localized(item, `${label}.items[${index}]`));
  }
  if (block.type === "callout") {
    check(["accent", "warning", "neutral"].includes(block.tone), `${label}.tone is invalid`);
    localized(block.label, `${label}.label`);
    localized(block.text, `${label}.text`);
  }
  if (block.type === "claim") {
    text(block.claimId, `${label}.claimId`);
    check(claimIds.has(block.claimId), `${label}.claimId is unknown`);
  }
  if (block.type === "comparison") {
    check(Array.isArray(block.columns) && block.columns.length >= 2, `${label}.columns must contain at least two items`);
    block.columns.forEach((column, index) => localized(column, `${label}.columns[${index}]`));
    check(Array.isArray(block.rows) && block.rows.length, `${label}.rows must not be empty`);
    block.rows.forEach((row, rowIndex) => {
      localized(row.label, `${label}.rows[${rowIndex}].label`);
      check(Array.isArray(row.values) && (row.values.length === block.columns.length - 1 || row.values.length === block.columns.length), `${label}.rows[${rowIndex}].values do not match columns`);
      row.values.forEach((value, valueIndex) => localized(value, `${label}.rows[${rowIndex}].values[${valueIndex}]`));
    });
  }
  if (block.type === "diagram") {
    localized(block.title, `${label}.title`);
    check(Array.isArray(block.nodes) && block.nodes.length, `${label}.nodes must not be empty`);
    const ids = new Set();
    block.nodes.forEach((node, nodeIndex) => {
      text(node.id, `${label}.nodes[${nodeIndex}].id`);
      check(!ids.has(node.id), `${label}.nodes duplicate ${node.id}`);
      ids.add(node.id);
      localized(node.label, `${label}.nodes[${nodeIndex}].label`);
      localized(node.description, `${label}.nodes[${nodeIndex}].description`);
    });
    check(Array.isArray(block.edges), `${label}.edges must be an array`);
    block.edges.forEach((edge, edgeIndex) => {
      text(edge.from, `${label}.edges[${edgeIndex}].from`);
      text(edge.to, `${label}.edges[${edgeIndex}].to`);
      check(ids.has(edge.from) && ids.has(edge.to), `${label}.edges[${edgeIndex}] references unknown node`);
    });
  }
  if (block.type === "reading-guide") {
    check(["full", "compact"].includes(block.mode), `${label}.mode is invalid`);
  }
}

function hasReplicationCaveat(value) {
  const english = value.en.toLowerCase();
  const chinese = value.zh.toLowerCase();
  const englishPhrase = english.includes("independent replication");
  const chinesePhrase = chinese.includes("independent replication") || chinese.includes("独立复现");
  const englishNegation = /(?:does not|doesn't|not automatically|not equal|not established|not imply|cannot be inferred|not evidence of|not proof of|doesn't establish|not\s+(?:an?\s+)?independent replication)/i.test(english);
  const chineseNegation = /(?:不能|不等于|不自动|未建立|不意味着|不表示|不代表|不是|并非|不等同|不能证明)/i.test(chinese);
  return englishPhrase && englishNegation && chinesePhrase && chineseNegation;
}

function hasQuantitativeText(value) {
  return quantitativeTokenPattern.test(`${value.en} ${value.zh}`);
}

function validateReadingList(value, articlesBySlug, label = "readingList") {
  const readingList = obj(value, label);
  text(readingList.revision, `${label}.revision`);
  date(readingList.lastReviewed, `${label}.lastReviewed`);
  date(readingList.sourceCutoff, `${label}.sourceCutoff`);
  check(readingList.lastReviewed <= readingList.sourceCutoff, `${label}.lastReviewed must not be after sourceCutoff`);
  localized(readingList.framing, `${label}.framing`);
  check(hasReplicationCaveat(readingList.framing), `${label}.framing must state that peer review does not imply Independent Replication`);
  check(!hasQuantitativeText(readingList.framing), `${label}.framing contains an unbound quantitative claim`);

  check(Array.isArray(readingList.entries) && readingList.entries.length, `${label}.entries must not be empty`);
  const entryIds = new Set();
  const priorities = new Set();
  const urlVersionPairs = new Set();
  const entriesById = new Map();

  readingList.entries.forEach((entry, entryIndex) => {
    const entryLabel = `${label}.entries[${entryIndex}]`;
    obj(entry, entryLabel);
    text(entry.id, `${entryLabel}.id`);
    check(!entryIds.has(entry.id), `${label}.entries contains duplicate id ${entry.id}`);
    entryIds.add(entry.id);
    entriesById.set(entry.id, entry);

    text(entry.articleSlug, `${entryLabel}.articleSlug`);
    check(articlesBySlug.has(entry.articleSlug), `${entryLabel}.articleSlug references an unknown article`);
    const article = articlesBySlug.get(entry.articleSlug);
    const referencesById = new Map(article.references.map((reference) => [reference.id, reference]));

    text(entry.referenceId, `${entryLabel}.referenceId`);
    const primary = referencesById.get(entry.referenceId);
    check(primary, `${entryLabel}.referenceId references an unknown source`);
    check(primary.kind === "Paper" && primary.authority === "Primary", `${entryLabel}.referenceId must point to a Primary Paper reference`);

    list(entry.companionReferenceIds, `${entryLabel}.companionReferenceIds`);
    entry.companionReferenceIds.forEach((referenceId) => {
      const companion = referencesById.get(referenceId);
      check(companion, `${entryLabel}.companionReferenceIds references an unknown source ${referenceId}`);
      check(companion.kind !== "Paper" && companion.authority === "Official", `${entryLabel}.companionReferenceIds must point to Official non-paper references`);
    });

    text(entry.track, `${entryLabel}.track`);
    check(readingTracks.has(entry.track), `${entryLabel}.track is invalid`);
    check(typeof entry.priority === "number" && Number.isInteger(entry.priority) && entry.priority > 0, `${entryLabel}.priority must be a positive integer`);
    check(!priorities.has(entry.priority), `${label}.entries contains duplicate priority ${entry.priority}`);
    priorities.add(entry.priority);

    date(entry.releaseDate, `${entryLabel}.releaseDate`);
    text(entry.paperVersion, `${entryLabel}.paperVersion`);
    date(entry.paperVersionDate, `${entryLabel}.paperVersionDate`);
    check(entry.releaseDate <= entry.paperVersionDate, `${entryLabel}.releaseDate must not be after paperVersionDate`);
    check(entry.releaseDate <= readingList.sourceCutoff, `${entryLabel}.releaseDate is after sourceCutoff`);
    check(entry.paperVersionDate <= readingList.sourceCutoff, `${entryLabel}.paperVersionDate is after sourceCutoff`);
    const urlVersionPair = `${primary.url}\u0000${entry.paperVersion}`;
    check(!urlVersionPairs.has(urlVersionPair), `${label}.entries contains duplicate Paper URL + paperVersion`);
    urlVersionPairs.add(urlVersionPair);

    check(publicationStatuses.has(entry.publicationStatus), `${entryLabel}.publicationStatus is invalid`);
    check(evidenceMaturities.has(entry.evidenceMaturity), `${entryLabel}.evidenceMaturity is invalid`);
    localized(entry.whyRead, `${entryLabel}.whyRead`);
    localized(entry.evidenceBoundary, `${entryLabel}.evidenceBoundary`);

    if (entry.claimIds !== undefined) {
      list(entry.claimIds, `${entryLabel}.claimIds`);
      const claimIds = new Set(article.claims.map((claim) => claim.id));
      entry.claimIds.forEach((claimId) => check(claimIds.has(claimId), `${entryLabel}.claimIds references an unknown article claim ${claimId}`));
    }
    const claimsBound = Array.isArray(entry.claimIds) && entry.claimIds.length > 0;
    if (!claimsBound) {
      check(!hasQuantitativeText(entry.whyRead), `${entryLabel}.whyRead contains an unbound quantitative claim`);
      check(!hasQuantitativeText(entry.evidenceBoundary), `${entryLabel}.evidenceBoundary contains an unbound quantitative claim`);
    }

    ["supersedes", "correctionOf"].forEach((relation) => {
      check(entry[relation] === null || typeof entry[relation] === "string", `${entryLabel}.${relation} must be a string or null`);
      if (entry[relation] !== null) text(entry[relation], `${entryLabel}.${relation}`);
    });
    check(!(typeof entry.supersedes === "string" && typeof entry.correctionOf === "string"), `${entryLabel} cannot set both supersedes and correctionOf`);
  });

  const expectedPriorities = Array.from({ length: readingList.entries.length }, (_, index) => index + 1);
  check(expectedPriorities.every((priority) => priorities.has(priority)), `${label}.entries priorities must be continuous from 1 to ${readingList.entries.length}`);

  readingList.entries.forEach((entry, entryIndex) => {
    const entryLabel = `${label}.entries[${entryIndex}]`;
    ["supersedes", "correctionOf"].forEach((relation) => {
      const targetId = entry[relation];
      if (targetId === null) return;
      check(entriesById.has(targetId), `${entryLabel}.${relation} references an unknown entry ${targetId}`);
      check(targetId !== entry.id, `${entryLabel}.${relation} cannot reference itself`);
      const target = entriesById.get(targetId);
      const olderByDate = target.paperVersionDate < entry.paperVersionDate;
      const sameDateEarlierInInventory = target.paperVersionDate === entry.paperVersionDate && target.priority < entry.priority;
      check(olderByDate || sameDateEarlierInInventory, `${entryLabel}.${relation} must point to an earlier entry`);
    });
  });

  check(Array.isArray(readingList.groups) && readingList.groups.length === readingTracks.size, `${label}.groups must contain exactly ${readingTracks.size} groups`);
  const groupIds = new Set();
  const groupedEntryIds = new Set();
  readingList.groups.forEach((group, groupIndex) => {
    const groupLabel = `${label}.groups[${groupIndex}]`;
    obj(group, groupLabel);
    text(group.id, `${groupLabel}.id`);
    check(readingTracks.has(group.id), `${groupLabel}.id is invalid`);
    check(!groupIds.has(group.id), `${label}.groups contains duplicate id ${group.id}`);
    groupIds.add(group.id);
    localized(group.title, `${groupLabel}.title`);
    localized(group.summary, `${groupLabel}.summary`);
    check(!hasQuantitativeText(group.summary), `${groupLabel}.summary contains an unbound quantitative claim`);
    list(group.entryIds, `${groupLabel}.entryIds`, false);
    group.entryIds.forEach((entryId) => {
      check(entryIds.has(entryId), `${groupLabel}.entryIds references an unknown entry ${entryId}`);
      check(!groupedEntryIds.has(entryId), `${label}.groups assign entry ${entryId} more than once`);
      check(entriesById.get(entryId).track === group.id, `${groupLabel}.entryIds entry ${entryId} has a mismatched track`);
      groupedEntryIds.add(entryId);
    });
  });
  check(groupIds.size === readingTracks.size, `${label}.groups must include every controlled track`);
  check(groupedEntryIds.size === entryIds.size, `${label}.groups must cover every reading entry exactly once`);

  check(Array.isArray(readingList.recommendedPath) && readingList.recommendedPath.length === 5, `${label}.recommendedPath must contain exactly five entries`);
  const pathIds = new Set();
  readingList.recommendedPath.forEach((entryId, index) => {
    text(entryId, `${label}.recommendedPath[${index}]`);
    check(entryIds.has(entryId), `${label}.recommendedPath references an unknown entry ${entryId}`);
    check(!pathIds.has(entryId), `${label}.recommendedPath contains duplicate entry ${entryId}`);
    pathIds.add(entryId);
  });
  check(readingList.recommendedPath.every((entryId, index) => entryId === recommendedReadingPath[index]), `${label}.recommendedPath must use the fixed order: ${recommendedReadingPath.join(" -> ")}`);

  return { entries: readingList.entries.length, groups: readingList.groups.length };
}

export function validateResearchOs(source) {
  obj(source, "source");
  text(source.schemaVersion, "schemaVersion");
  check(Array.isArray(source.articles) && source.articles.length === 3, "exactly three articles are required");
  const seenSlugs = new Set();
  const articlesBySlug = new Map();

  source.articles.forEach((article, articleIndex) => {
    const label = `articles[${articleIndex}]`;
    obj(article, label);
    text(article.slug, `${label}.slug`);
    check(slugs.has(article.slug), `${label}.slug is invalid`);
    check(!seenSlugs.has(article.slug), `duplicate slug ${article.slug}`);
    seenSlugs.add(article.slug);
    articlesBySlug.set(article.slug, article);
    text(article.revision, `${label}.revision`);
    date(article.lastReviewed, `${label}.lastReviewed`);
    date(article.sourceCutoff, `${label}.sourceCutoff`);
    localized(article.title, `${label}.title`);
    localized(article.dek, `${label}.dek`);
    localized(article.audience, `${label}.audience`);

    check(Array.isArray(article.claims), `${label}.claims must be an array`);
    const claimIds = new Set();
    article.claims.forEach((claim, claimIndex) => {
      const claimLabel = `${label}.claims[${claimIndex}]`;
      obj(claim, claimLabel);
      text(claim.id, `${claimLabel}.id`);
      check(!claimIds.has(claim.id), `${claimLabel}.id is duplicated`);
      claimIds.add(claim.id);
      ["statement", "taskDefinition", "sampleSizeDenominator", "evaluator", "comparisonBasis"].forEach((field) => localized(claim[field], `${claimLabel}.${field}`));
      check(["Author-reported", "Independently Validated"].includes(claim.claimAuthority), `${claimLabel}.claimAuthority is invalid`);
      list(claim.referenceIds, `${claimLabel}.referenceIds`, false);
    });

    check(Array.isArray(article.references) && article.references.length, `${label}.references must not be empty`);
    const referenceIds = new Set();
    article.references.forEach((reference, referenceIndex) => {
      const referenceLabel = `${label}.references[${referenceIndex}]`;
      obj(reference, referenceLabel);
      text(reference.id, `${referenceLabel}.id`);
      check(!referenceIds.has(reference.id), `${referenceLabel}.id is duplicated`);
      referenceIds.add(reference.id);
      text(reference.title, `${referenceLabel}.title`);
      text(reference.url, `${referenceLabel}.url`);
      check(reference.url.startsWith("https://"), `${referenceLabel}.url must use HTTPS`);
      try {
        new URL(reference.url);
      } catch {
        check(false, `${referenceLabel}.url is invalid`);
      }
      check(kinds.has(reference.kind), `${referenceLabel}.kind is invalid`);
      check(authorities.has(reference.authority), `${referenceLabel}.authority is invalid`);
      check(reference.kind === "Paper" ? reference.authority === "Primary" : reference.authority === "Official", `${referenceLabel}.authority does not match source kind`);
    });

    check(Array.isArray(article.sections) && article.sections.length, `${label}.sections must not be empty`);
    const sectionIds = new Set();
    article.sections.forEach((section, sectionIndex) => {
      const sectionLabel = `${label}.sections[${sectionIndex}]`;
      obj(section, sectionLabel);
      text(section.id, `${sectionLabel}.id`);
      check(!sectionIds.has(section.id), `${sectionLabel}.id is duplicated`);
      sectionIds.add(section.id);
      localized(section.heading, `${sectionLabel}.heading`);
      list(section.referenceIds, `${sectionLabel}.referenceIds`);
      section.referenceIds.forEach((id) => check(referenceIds.has(id), `${sectionLabel} references unknown source ${id}`));
      check(Array.isArray(section.blocks) && section.blocks.length, `${sectionLabel}.blocks must not be empty`);
      section.blocks.forEach((block, blockIndex) => validateBlock(block, `${sectionLabel}.blocks[${blockIndex}]`, claimIds));
    });
    article.claims.forEach((claim, claimIndex) => claim.referenceIds.forEach((id) => check(referenceIds.has(id), `${label}.claims[${claimIndex}] references unknown source ${id}`)));

    check(Array.isArray(article.caseStudies), `${label}.caseStudies must be an array`);
    const caseIds = new Set();
    article.caseStudies.forEach((item, caseIndex) => {
      const caseLabel = `${label}.caseStudies[${caseIndex}]`;
      obj(item, caseLabel);
      text(item.id, `${caseLabel}.id`);
      check(!caseIds.has(item.id), `${caseLabel}.id is duplicated`);
      caseIds.add(item.id);
      localized(item.title, `${caseLabel}.title`);
      localized(item.scope, `${caseLabel}.scope`);
      localized(item.boundary, `${caseLabel}.boundary`);
      list(item.referenceIds, `${caseLabel}.referenceIds`);
      item.referenceIds.forEach((id) => check(referenceIds.has(id), `${caseLabel} references unknown source ${id}`));
    });

    list(article.relatedRoutes, `${label}.relatedRoutes`, false);
    article.relatedRoutes.forEach((route) => check(route.startsWith("/"), `${label}.relatedRoutes must be internal routes`));
  });

  check(seenSlugs.size === 3, "all three Research OS slugs are required");
  validateReadingList(source.readingList, articlesBySlug);
  return { articles: source.articles.length };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const source = JSON.parse(await readFile(new URL("../content/research-os.json", import.meta.url), "utf8"));
  const result = validateResearchOs(source);
  console.log(`Validated ${result.articles} Research OS articles.`);
  console.log(`Validated ${source.readingList.entries.length} Research OS reading entries.`);
}
