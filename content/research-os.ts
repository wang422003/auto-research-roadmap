import rawSource from "./research-os.json";
import type { ClaimAuthority, LocalizedText } from "./field-updates";

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

export type ResearchOsBlock =
  | ResearchOsParagraphBlock
  | ResearchOsBulletsBlock
  | ResearchOsCalloutBlock
  | ResearchOsClaimBlock
  | ResearchOsComparisonBlock
  | ResearchOsDiagramBlock;

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
}

const slugs = new Set<ResearchOsSlug>(["foundations", "evaluation", "practice"]);
const blockTypes = new Set(["paragraph", "bullets", "callout", "claim", "comparison", "diagram"]);
const authorities = new Set<ResearchOsAuthority>(["Primary", "Official"]);
const kinds = new Set<ResearchOsReferenceKind>(["Paper", "Repository", "Project", "Docs"]);
const claimAuthorities = new Set<ClaimAuthority>(["Author-reported", "Independently Validated"]);
const tones = new Set(["accent", "warning", "neutral"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

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
  invariant(isoDatePattern.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), `${label} must be YYYY-MM-DD`);
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
    default:
      throw new Error(`[research-os] ${label}.type is not handled`);
  }
}

export function validateResearchOs(value: unknown): asserts value is ResearchOsSource {
  const source = record(value, "source");
  text(source.schemaVersion, "source.schemaVersion");
  invariant(Array.isArray(source.articles) && source.articles.length === 3, "source.articles must contain exactly three articles");
  const articleSlugs = new Set<string>();

  source.articles.forEach((articleValue, articleIndex) => {
    const label = `articles[${articleIndex}]`;
    const article = record(articleValue, label);
    text(article.slug, `${label}.slug`);
    invariant(slugs.has(article.slug as ResearchOsSlug), `${label}.slug is invalid`);
    invariant(!articleSlugs.has(article.slug), `duplicate article slug ${article.slug}`);
    articleSlugs.add(article.slug);
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

export function getResearchOsArticle(slug: string): ResearchOsArticle | undefined {
  return researchOsArticles.find((article) => article.slug === slug);
}
