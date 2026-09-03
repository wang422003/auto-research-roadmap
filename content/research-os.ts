import rawSource from "./research-os.json";
import type { ClaimAuthority, EvidenceMaturity, LocalizedText } from "./field-updates";

export type ResearchOsSlug = "foundations" | "evaluation" | "practice";
export type ResearchOsReferenceKind = "Paper" | "Repository" | "Project" | "Docs";
export type ResearchOsAuthority = "Primary" | "Official";

export interface ResearchOsParagraphBlock {
  type: "paragraph";
  text: LocalizedText;
}

export interface ResearchOsBulletsBlock {
  type: "bullets";
  items: LocalizedText[];
}

export interface ResearchOsCalloutBlock {
  type: "callout";
  tone: "accent" | "warning" | "neutral";
  label: LocalizedText;
  text: LocalizedText;
}

export interface ResearchOsClaimBlock {
  type: "claim";
  claimId: string;
}

export interface ResearchOsComparisonRow {
  label: LocalizedText;
  values: LocalizedText[];
}

export interface ResearchOsComparisonBlock {
  type: "comparison";
  columns: LocalizedText[];
  rows: ResearchOsComparisonRow[];
}

export interface ResearchOsDiagramNode {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
}

export interface ResearchOsDiagramEdge {
  from: string;
  to: string;
}

export interface ResearchOsDiagramBlock {
  type: "diagram";
  title: LocalizedText;
  nodes: ResearchOsDiagramNode[];
  edges: ResearchOsDiagramEdge[];
}

/**
 * A controlled block used by the Research OS articles to render the shared
 * reading inventory.  Keeping this as a block (rather than embedding HTML in
 * the content source) means the inventory can be rendered in compact form on
 * the hub and in full form on the Foundations article.
 */
export interface ResearchOsReadingGuideBlock {
  type: "reading-guide";
  mode: "full" | "compact";
}

export type ResearchOsBlock =
  | ResearchOsParagraphBlock
  | ResearchOsBulletsBlock
  | ResearchOsCalloutBlock
  | ResearchOsClaimBlock
  | ResearchOsComparisonBlock
  | ResearchOsDiagramBlock
  | ResearchOsReadingGuideBlock;

export interface ResearchOsSection {
  id: string;
  heading: LocalizedText;
  blocks: ResearchOsBlock[];
  referenceIds: string[];
}

export interface ResearchOsClaim {
  id: string;
  statement: LocalizedText;
  taskDefinition: LocalizedText;
  sampleSizeDenominator: LocalizedText;
  evaluator: LocalizedText;
  comparisonBasis: LocalizedText;
  claimAuthority: ClaimAuthority;
  referenceIds: string[];
}

export interface ResearchOsCaseStudy {
  id: string;
  title: LocalizedText;
  scope: LocalizedText;
  boundary: LocalizedText;
  referenceIds: string[];
}

export interface ResearchOsReference {
  id: string;
  title: string;
  url: string;
  kind: ResearchOsReferenceKind;
  authority: ResearchOsAuthority;
}

export type ResearchOsReadingTrack = "direct" | "foundations" | "systems" | "evaluation" | "lab";
export type ResearchOsPublicationStatus = "Peer-reviewed" | "Preprint" | "SSRN";

export interface ResearchOsReadingEntry {
  id: string;
  articleSlug: ResearchOsSlug;
  referenceId: string;
  companionReferenceIds: string[];
  track: ResearchOsReadingTrack;
  priority: number;
  releaseDate: string;
  paperVersion: string;
  paperVersionDate: string;
  publicationStatus: ResearchOsPublicationStatus;
  evidenceMaturity: EvidenceMaturity;
  whyRead: LocalizedText;
  evidenceBoundary: LocalizedText;
  /**
   * Reserved for a future reading card that contains a quantitative claim.
   * If present, every id must resolve to a complete article claim; otherwise
   * numeric statements in the card are rejected by the validator.
   */
  claimIds?: string[];
  supersedes: string | null;
  correctionOf: string | null;
}

export interface ResearchOsReadingGroup {
  id: ResearchOsReadingTrack;
  title: LocalizedText;
  summary: LocalizedText;
  entryIds: string[];
}

export interface ResearchOsReadingList {
  revision: string;
  lastReviewed: string;
  sourceCutoff: string;
  framing: LocalizedText;
  groups: ResearchOsReadingGroup[];
  recommendedPath: string[];
  entries: ResearchOsReadingEntry[];
}

export interface ResearchOsArticle {
  slug: ResearchOsSlug;
  revision: string;
  lastReviewed: string;
  sourceCutoff: string;
  title: LocalizedText;
  dek: LocalizedText;
  audience: LocalizedText;
  sections: ResearchOsSection[];
  claims: ResearchOsClaim[];
  caseStudies: ResearchOsCaseStudy[];
  references: ResearchOsReference[];
  relatedRoutes: string[];
}

export interface ResearchOsSource {
  schemaVersion: string;
  articles: ResearchOsArticle[];
  readingList: ResearchOsReadingList;
}

const slugs = new Set<ResearchOsSlug>(["foundations", "evaluation", "practice"]);
const blockTypes = new Set(["paragraph", "bullets", "callout", "claim", "comparison", "diagram", "reading-guide"]);
const authorities = new Set<ResearchOsAuthority>(["Primary", "Official"]);
const kinds = new Set<ResearchOsReferenceKind>(["Paper", "Repository", "Project", "Docs"]);
const claimAuthorities = new Set<ClaimAuthority>(["Author-reported", "Independently Validated"]);
const evidenceMaturities = new Set<EvidenceMaturity>(["A", "B", "C", "D"]);
const readingTracks = new Set<ResearchOsReadingTrack>(["direct", "foundations", "systems", "evaluation", "lab"]);
const publicationStatuses = new Set<ResearchOsPublicationStatus>(["Peer-reviewed", "Preprint", "SSRN"]);
const tones = new Set(["accent", "warning", "neutral"]);
const readingGuideModes = new Set(["full", "compact"]);
const recommendedReadingPath = ["roadmap-survey", "kamios", "xscientist", "autoresearch-eval", "robin"] as const;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

// Reading cards intentionally carry qualitative orientation only.  A numeric
// result belongs in an article claim, where denominator/evaluator/comparison
// metadata can travel with it.  This conservative detector catches the common
// forms without attempting to parse prose semantics.
const quantitativeTokenPattern = /(?:\b\d+(?:[.,]\d+)?\b|\b(?:percent|percentage|accuracy|f1|rmse|mae|pass\s*rate|sample\s*size|denominator|n\s*=)\b|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:task|tasks|paper|papers|model|models|domain|domains|trajectory|trajectories|experiment|experiments|assay|assays|review|reviews|stage|stages|entry|entries|step|steps|candidate|candidates|configuration|configurations|worker|workers|hour|hours|day|days)\b)/i;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[research-os] ${message}`);
}

function record(value: unknown, label: string): Record<string, unknown> {
  invariant(typeof value === "object" && value !== null && !Array.isArray(value), `${label} must be an object`);
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): asserts value is string {
  invariant(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string`);
}

function localized(value: unknown, label: string): asserts value is LocalizedText {
  const item = record(value, label);
  text(item.en, `${label}.en`);
  text(item.zh, `${label}.zh`);
}

function stringList(value: unknown, label: string, allowEmpty = true): asserts value is string[] {
  invariant(Array.isArray(value), `${label} must be an array`);
  invariant(allowEmpty || value.length > 0, `${label} must not be empty`);
  const ids = new Set<string>();
  value.forEach((item, index) => {
    text(item, `${label}[${index}]`);
    invariant(!ids.has(item), `${label} contains duplicate value ${item}`);
    ids.add(item);
  });
}

function date(value: unknown, label: string): asserts value is string {
  text(value, label);
  const parsed = Date.parse(`${value}T00:00:00Z`);
  invariant(isoDatePattern.test(value) && !Number.isNaN(parsed), `${label} must be YYYY-MM-DD`);
  invariant(new Date(parsed).toISOString().slice(0, 10) === value, `${label} is not a valid calendar date`);
}

function validateBlock(value: unknown, label: string, claimIds: Set<string>): void {
  const block = record(value, label);
  text(block.type, `${label}.type`);
  invariant(blockTypes.has(block.type), `${label}.type is not controlled`);
  switch (block.type) {
    case "paragraph":
      localized(block.text, `${label}.text`);
      break;
    case "bullets":
      invariant(Array.isArray(block.items) && block.items.length > 0, `${label}.items must not be empty`);
      block.items.forEach((item, index) => localized(item, `${label}.items[${index}]`));
      break;
    case "callout":
      invariant(tones.has(block.tone as string), `${label}.tone is invalid`);
      localized(block.label, `${label}.label`);
      localized(block.text, `${label}.text`);
      break;
    case "claim":
      text(block.claimId, `${label}.claimId`);
      invariant(claimIds.has(block.claimId), `${label}.claimId references an unknown claim`);
      break;
    case "comparison": {
      invariant(Array.isArray(block.columns) && block.columns.length >= 2, `${label}.columns must contain at least two columns`);
      const columns = block.columns as unknown[];
      columns.forEach((item, index) => localized(item, `${label}.columns[${index}]`));
      invariant(Array.isArray(block.rows) && block.rows.length > 0, `${label}.rows must not be empty`);
      const rows = block.rows as unknown[];
      rows.forEach((rowValue, rowIndex) => {
        const row = record(rowValue, `${label}.rows[${rowIndex}]`);
        localized(row.label, `${label}.rows[${rowIndex}].label`);
        const values = row.values as unknown;
        invariant(
          Array.isArray(values) && (values.length === columns.length - 1 || values.length === columns.length),
          `${label}.rows[${rowIndex}].values must match columns`,
        );
        (values as unknown[]).forEach((item, valueIndex) => localized(item, `${label}.rows[${rowIndex}].values[${valueIndex}]`));
      });
      break;
    }
    case "diagram": {
      localized(block.title, `${label}.title`);
      invariant(Array.isArray(block.nodes) && block.nodes.length > 0, `${label}.nodes must not be empty`);
      const nodeIds = new Set<string>();
      block.nodes.forEach((nodeValue, nodeIndex) => {
        const node = record(nodeValue, `${label}.nodes[${nodeIndex}]`);
        text(node.id, `${label}.nodes[${nodeIndex}].id`);
        invariant(!nodeIds.has(node.id), `${label}.nodes contains duplicate id ${node.id}`);
        nodeIds.add(node.id);
        localized(node.label, `${label}.nodes[${nodeIndex}].label`);
        localized(node.description, `${label}.nodes[${nodeIndex}].description`);
      });
      invariant(Array.isArray(block.edges), `${label}.edges must be an array`);
      block.edges.forEach((edgeValue, edgeIndex) => {
        const edge = record(edgeValue, `${label}.edges[${edgeIndex}]`);
        text(edge.from, `${label}.edges[${edgeIndex}].from`);
        text(edge.to, `${label}.edges[${edgeIndex}].to`);
        invariant(nodeIds.has(edge.from) && nodeIds.has(edge.to), `${label}.edges[${edgeIndex}] references an unknown node`);
      });
      break;
    }
    case "reading-guide":
      text(block.mode, `${label}.mode`);
      invariant(readingGuideModes.has(block.mode as string), `${label}.mode is invalid`);
      break;
    default:
      throw new Error(`[research-os] ${label}.type is not handled`);
  }
}

function quantitativeText(value: LocalizedText): boolean {
  return quantitativeTokenPattern.test(`${value.en} ${value.zh}`);
}

function hasReplicationCaveat(value: LocalizedText): boolean {
  const english = value.en.toLowerCase();
  const chinese = value.zh.toLowerCase();
  const englishPhrase = english.includes("independent replication");
  const chinesePhrase = chinese.includes("independent replication") || chinese.includes("独立复现");
  const englishNegation = /(?:does not|doesn't|not automatically|not equal|not established|not imply|cannot be inferred|not evidence of|not proof of|doesn't establish|not\s+(?:an?\s+)?independent replication)/i.test(english);
  const chineseNegation = /(?:不能|不等于|不自动|未建立|不意味着|不表示|不代表|不是|并非|不等同|不能证明)/i.test(chinese);
  return englishPhrase && englishNegation && chinesePhrase && chineseNegation;
}

function validateReadingList(
  value: unknown,
  articles: Map<ResearchOsSlug, Record<string, unknown>>,
  label = "readingList",
): asserts value is ResearchOsReadingList {
  const list = record(value, label);
  text(list.revision, `${label}.revision`);
  date(list.lastReviewed, `${label}.lastReviewed`);
  date(list.sourceCutoff, `${label}.sourceCutoff`);
  const sourceCutoff = list.sourceCutoff as string;
  const lastReviewed = list.lastReviewed as string;
  invariant(lastReviewed <= sourceCutoff, `${label}.lastReviewed must not be after sourceCutoff`);
  localized(list.framing, `${label}.framing`);

  // This is a guardrail against a common evidence mistake: a reading card
  // should not turn publication status into a claim of replication.
  const framing = list.framing as LocalizedText;
  invariant(hasReplicationCaveat(framing), `${label}.framing must state that peer review does not imply Independent Replication`);
  invariant(!quantitativeText(framing), `${label}.framing contains an unbound quantitative claim`);

  invariant(Array.isArray(list.entries) && list.entries.length > 0, `${label}.entries must not be empty`);
  const entries = list.entries as unknown[];
  const entryIds = new Set<string>();
  const priorities = new Set<number>();
  const urlVersionPairs = new Set<string>();
  const entryById = new Map<string, Record<string, unknown>>();

  entries.forEach((entryValue, entryIndex) => {
    const entryLabel = `${label}.entries[${entryIndex}]`;
    const entry = record(entryValue, entryLabel);
    text(entry.id, `${entryLabel}.id`);
    invariant(!entryIds.has(entry.id), `${label}.entries contains duplicate id ${entry.id}`);
    entryIds.add(entry.id);
    entryById.set(entry.id, entry);

    text(entry.articleSlug, `${entryLabel}.articleSlug`);
    invariant(articles.has(entry.articleSlug as ResearchOsSlug), `${entryLabel}.articleSlug references an unknown article`);
    const article = articles.get(entry.articleSlug as ResearchOsSlug) as Record<string, unknown>;
    const references = article.references as unknown[];
    const referenceById = new Map<string, Record<string, unknown>>();
    references.forEach((referenceValue) => {
      const reference = referenceValue as Record<string, unknown>;
      referenceById.set(reference.id as string, reference);
    });

    text(entry.referenceId, `${entryLabel}.referenceId`);
    const primary = referenceById.get(entry.referenceId as string);
    invariant(primary, `${entryLabel}.referenceId references an unknown source`);
    invariant(primary.kind === "Paper" && primary.authority === "Primary", `${entryLabel}.referenceId must point to a Primary Paper reference`);

    stringList(entry.companionReferenceIds, `${entryLabel}.companionReferenceIds`);
    (entry.companionReferenceIds as string[]).forEach((referenceId) => {
      const companion = referenceById.get(referenceId);
      invariant(companion, `${entryLabel}.companionReferenceIds references an unknown source ${referenceId}`);
      invariant(companion.kind !== "Paper" && companion.authority === "Official", `${entryLabel}.companionReferenceIds must point to Official non-paper references`);
    });

    text(entry.track, `${entryLabel}.track`);
    invariant(readingTracks.has(entry.track as ResearchOsReadingTrack), `${entryLabel}.track is invalid`);
    invariant(typeof entry.priority === "number" && Number.isInteger(entry.priority) && entry.priority > 0, `${entryLabel}.priority must be a positive integer`);
    invariant(!priorities.has(entry.priority), `${label}.entries contains duplicate priority ${entry.priority}`);
    priorities.add(entry.priority);

    date(entry.releaseDate, `${entryLabel}.releaseDate`);
    text(entry.paperVersion, `${entryLabel}.paperVersion`);
    date(entry.paperVersionDate, `${entryLabel}.paperVersionDate`);
    invariant(entry.releaseDate <= entry.paperVersionDate, `${entryLabel}.releaseDate must not be after paperVersionDate`);
    invariant(entry.releaseDate <= sourceCutoff, `${entryLabel}.releaseDate is after sourceCutoff`);
    invariant(entry.paperVersionDate <= sourceCutoff, `${entryLabel}.paperVersionDate is after sourceCutoff`);
    const pair = `${primary.url as string}\u0000${entry.paperVersion as string}`;
    invariant(!urlVersionPairs.has(pair), `${label}.entries contains duplicate Paper URL + paperVersion`);
    urlVersionPairs.add(pair);

    invariant(publicationStatuses.has(entry.publicationStatus as ResearchOsPublicationStatus), `${entryLabel}.publicationStatus is invalid`);
    invariant(evidenceMaturities.has(entry.evidenceMaturity as EvidenceMaturity), `${entryLabel}.evidenceMaturity is invalid`);
    localized(entry.whyRead, `${entryLabel}.whyRead`);
    localized(entry.evidenceBoundary, `${entryLabel}.evidenceBoundary`);

    if (entry.claimIds !== undefined) {
      stringList(entry.claimIds, `${entryLabel}.claimIds`);
      const claims = (article.claims as unknown[]) || [];
      const claimIds = new Set(claims.map((claim) => (claim as Record<string, unknown>).id as string));
      (entry.claimIds as string[]).forEach((claimId) => invariant(claimIds.has(claimId), `${entryLabel}.claimIds references an unknown article claim ${claimId}`));
    }
    const hasBoundClaims = Array.isArray(entry.claimIds) && (entry.claimIds as unknown[]).length > 0;
    if (!hasBoundClaims) {
      invariant(!quantitativeText(entry.whyRead as LocalizedText), `${entryLabel}.whyRead contains an unbound quantitative claim`);
      invariant(!quantitativeText(entry.evidenceBoundary as LocalizedText), `${entryLabel}.evidenceBoundary contains an unbound quantitative claim`);
    }

    for (const relation of ["supersedes", "correctionOf"] as const) {
      const target = entry[relation];
      invariant(target === null || typeof target === "string", `${entryLabel}.${relation} must be a string or null`);
      if (target !== null) {
        text(target, `${entryLabel}.${relation}`);
        // Resolve after the first pass so forward references can be diagnosed
        // consistently.  The target must be an older entry by date or order.
      }
    }
    invariant(
      !(typeof entry.supersedes === "string" && typeof entry.correctionOf === "string"),
      `${entryLabel} cannot set both supersedes and correctionOf`,
    );
  });

  const expectedPriorities = Array.from({ length: entries.length }, (_, index) => index + 1);
  invariant(expectedPriorities.every((priority) => priorities.has(priority)), `${label}.entries priorities must be continuous from 1 to ${entries.length}`);

  entries.forEach((entryValue, entryIndex) => {
    const entry = entryValue as Record<string, unknown>;
    const entryLabel = `${label}.entries[${entryIndex}]`;
    for (const relation of ["supersedes", "correctionOf"] as const) {
      const target = entry[relation] as string | null;
      if (target === null) continue;
      invariant(entryById.has(target), `${entryLabel}.${relation} references an unknown entry ${target}`);
      invariant(target !== entry.id, `${entryLabel}.${relation} cannot reference itself`);
      const targetEntry = entryById.get(target) as Record<string, unknown>;
      const targetDate = targetEntry.paperVersionDate as string;
      const currentDate = entry.paperVersionDate as string;
      const olderByDate = targetDate < currentDate;
      const sameDateEarlierInInventory = targetDate === currentDate && (targetEntry.priority as number) < (entry.priority as number);
      invariant(olderByDate || sameDateEarlierInInventory, `${entryLabel}.${relation} must point to an earlier entry`);
    }
  });

  invariant(Array.isArray(list.groups) && list.groups.length === readingTracks.size, `${label}.groups must contain exactly ${readingTracks.size} groups`);
  const groupIds = new Set<ResearchOsReadingTrack>();
  const groupedEntryIds = new Set<string>();
  (list.groups as unknown[]).forEach((groupValue, groupIndex) => {
    const groupLabel = `${label}.groups[${groupIndex}]`;
    const group = record(groupValue, groupLabel);
    text(group.id, `${groupLabel}.id`);
    invariant(readingTracks.has(group.id as ResearchOsReadingTrack), `${groupLabel}.id is invalid`);
    invariant(!groupIds.has(group.id as ResearchOsReadingTrack), `${label}.groups contains duplicate id ${group.id}`);
    groupIds.add(group.id as ResearchOsReadingTrack);
    localized(group.title, `${groupLabel}.title`);
    localized(group.summary, `${groupLabel}.summary`);
    invariant(!quantitativeText(group.summary as LocalizedText), `${groupLabel}.summary contains an unbound quantitative claim`);
    stringList(group.entryIds, `${groupLabel}.entryIds`, false);
    (group.entryIds as string[]).forEach((entryId) => {
      invariant(entryIds.has(entryId), `${groupLabel}.entryIds references an unknown entry ${entryId}`);
      invariant(!groupedEntryIds.has(entryId), `${label}.groups assign entry ${entryId} more than once`);
      const entry = entryById.get(entryId) as Record<string, unknown>;
      invariant(entry.track === group.id, `${groupLabel}.entryIds entry ${entryId} has a mismatched track`);
      groupedEntryIds.add(entryId);
    });
  });
  invariant(groupIds.size === readingTracks.size, `${label}.groups must include every controlled track`);
  invariant(groupedEntryIds.size === entryIds.size, `${label}.groups must cover every reading entry exactly once`);

  invariant(Array.isArray(list.recommendedPath) && list.recommendedPath.length === 5, `${label}.recommendedPath must contain exactly five entries`);
  const pathIds = new Set<string>();
  (list.recommendedPath as unknown[]).forEach((entryId, index) => {
    text(entryId, `${label}.recommendedPath[${index}]`);
    invariant(entryIds.has(entryId), `${label}.recommendedPath references an unknown entry ${entryId}`);
    invariant(!pathIds.has(entryId), `${label}.recommendedPath contains duplicate entry ${entryId}`);
    pathIds.add(entryId);
  });
  invariant(
    (list.recommendedPath as string[]).every((entryId, index) => entryId === recommendedReadingPath[index]),
    `${label}.recommendedPath must use the fixed order: ${recommendedReadingPath.join(" -> ")}`,
  );
}

export function validateResearchOs(value: unknown): asserts value is ResearchOsSource {
  const source = record(value, "source");
  text(source.schemaVersion, "source.schemaVersion");
  invariant(Array.isArray(source.articles) && source.articles.length === 3, "source.articles must contain exactly three articles");
  const articleSlugs = new Set<string>();
  const articleRecords = new Map<ResearchOsSlug, Record<string, unknown>>();

  source.articles.forEach((articleValue, articleIndex) => {
    const label = `articles[${articleIndex}]`;
    const article = record(articleValue, label);
    text(article.slug, `${label}.slug`);
    invariant(slugs.has(article.slug as ResearchOsSlug), `${label}.slug is invalid`);
    invariant(!articleSlugs.has(article.slug), `duplicate article slug ${article.slug}`);
    articleSlugs.add(article.slug);
    articleRecords.set(article.slug as ResearchOsSlug, article);
    text(article.revision, `${label}.revision`);
    date(article.lastReviewed, `${label}.lastReviewed`);
    date(article.sourceCutoff, `${label}.sourceCutoff`);
    localized(article.title, `${label}.title`);
    localized(article.dek, `${label}.dek`);
    localized(article.audience, `${label}.audience`);
    invariant(Array.isArray(article.claims), `${label}.claims must be an array`);
    const claimIds = new Set<string>();
    article.claims.forEach((claimValue, claimIndex) => {
      const claim = record(claimValue, `${label}.claims[${claimIndex}]`);
      text(claim.id, `${label}.claims[${claimIndex}].id`);
      invariant(!claimIds.has(claim.id), `${label}.claims contains duplicate id ${claim.id}`);
      claimIds.add(claim.id);
      for (const field of ["statement", "taskDefinition", "sampleSizeDenominator", "evaluator", "comparisonBasis"]) {
        localized(claim[field], `${label}.claims[${claimIndex}].${field}`);
      }
      invariant(claimAuthorities.has(claim.claimAuthority as ClaimAuthority), `${label}.claims[${claimIndex}].claimAuthority is invalid`);
      stringList(claim.referenceIds, `${label}.claims[${claimIndex}].referenceIds`, false);
    });

    invariant(Array.isArray(article.references) && article.references.length > 0, `${label}.references must not be empty`);
    const referenceIds = new Set<string>();
    article.references.forEach((referenceValue, referenceIndex) => {
      const reference = record(referenceValue, `${label}.references[${referenceIndex}]`);
      text(reference.id, `${label}.references[${referenceIndex}].id`);
      invariant(!referenceIds.has(reference.id), `${label}.references contains duplicate id ${reference.id}`);
      referenceIds.add(reference.id);
      text(reference.title, `${label}.references[${referenceIndex}].title`);
      text(reference.url, `${label}.references[${referenceIndex}].url`);
      invariant(reference.url.startsWith("https://"), `${label}.references[${referenceIndex}].url must use HTTPS`);
      try { new URL(reference.url); } catch { invariant(false, `${label}.references[${referenceIndex}].url is invalid`); }
      invariant(kinds.has(reference.kind as ResearchOsReferenceKind), `${label}.references[${referenceIndex}].kind is invalid`);
      invariant(authorities.has(reference.authority as ResearchOsAuthority), `${label}.references[${referenceIndex}].authority is invalid`);
      if (reference.kind === "Paper") invariant(reference.authority === "Primary", `${label}.references[${referenceIndex}] paper must be Primary`);
      if (reference.kind !== "Paper") invariant(reference.authority === "Official", `${label}.references[${referenceIndex}] non-paper source must be Official`);
    });

    invariant(Array.isArray(article.sections) && article.sections.length > 0, `${label}.sections must not be empty`);
    const sectionIds = new Set<string>();
    article.sections.forEach((sectionValue, sectionIndex) => {
      const section = record(sectionValue, `${label}.sections[${sectionIndex}]`);
      text(section.id, `${label}.sections[${sectionIndex}].id`);
      invariant(!sectionIds.has(section.id), `${label}.sections contains duplicate id ${section.id}`);
      sectionIds.add(section.id);
      localized(section.heading, `${label}.sections[${sectionIndex}].heading`);
      stringList(section.referenceIds, `${label}.sections[${sectionIndex}].referenceIds`);
      section.referenceIds.forEach((id) => invariant(referenceIds.has(id), `${label}.sections[${sectionIndex}] references unknown source ${id}`));
      invariant(Array.isArray(section.blocks) && section.blocks.length > 0, `${label}.sections[${sectionIndex}].blocks must not be empty`);
      section.blocks.forEach((block, blockIndex) => validateBlock(block, `${label}.sections[${sectionIndex}].blocks[${blockIndex}]`, claimIds));
    });

    article.claims.forEach((claimValue, claimIndex) => {
      const claim = record(claimValue, `${label}.claims[${claimIndex}]`);
      (claim.referenceIds as string[]).forEach((id) => invariant(referenceIds.has(id), `${label}.claims[${claimIndex}] references unknown source ${id}`));
    });

    invariant(Array.isArray(article.caseStudies), `${label}.caseStudies must be an array`);
    const caseIds = new Set<string>();
    article.caseStudies.forEach((caseValue, caseIndex) => {
      const item = record(caseValue, `${label}.caseStudies[${caseIndex}]`);
      text(item.id, `${label}.caseStudies[${caseIndex}].id`);
      invariant(!caseIds.has(item.id), `${label}.caseStudies contains duplicate id ${item.id}`);
      caseIds.add(item.id);
      localized(item.title, `${label}.caseStudies[${caseIndex}].title`);
      localized(item.scope, `${label}.caseStudies[${caseIndex}].scope`);
      localized(item.boundary, `${label}.caseStudies[${caseIndex}].boundary`);
      stringList(item.referenceIds, `${label}.caseStudies[${caseIndex}].referenceIds`);
      item.referenceIds.forEach((id) => invariant(referenceIds.has(id), `${label}.caseStudies[${caseIndex}] references unknown source ${id}`));
    });

    stringList(article.relatedRoutes, `${label}.relatedRoutes`, false);
    article.relatedRoutes.forEach((route) => invariant(route.startsWith("/"), `${label}.relatedRoutes must contain internal routes`));
  });

  invariant(articleSlugs.size === slugs.size, "all three Research OS slugs are required");
  validateReadingList(source.readingList, articleRecords);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach((child) => deepFreeze(child));
  }
  return value;
}

validateResearchOs(rawSource);
export const researchOsSource = deepFreeze(rawSource as ResearchOsSource);
export const researchOsArticles = researchOsSource.articles;
export const researchOsReadingList = researchOsSource.readingList;

export function getResearchOsArticle(slug: string): ResearchOsArticle | undefined {
  return researchOsArticles.find((article) => article.slug === slug);
}

export function getResearchOsReadingEntry(id: string): ResearchOsReadingEntry | undefined {
  return researchOsReadingList.entries.find((entry) => entry.id === id);
}

export function getResearchOsReadingReference(entry: ResearchOsReadingEntry): ResearchOsReference | undefined {
  return getResearchOsArticle(entry.articleSlug)?.references.find((reference) => reference.id === entry.referenceId);
}
