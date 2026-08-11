import rawSource from "./field-updates.json";

export type Locale = "en" | "zh";
export type LocalizedText = Record<Locale, string>;
export type EvidenceMaturity = "A" | "B" | "C" | "D";
export type DeltaStatus = "New" | "Context" | "Date Clarification";
export type ClaimAuthority = "Author-reported" | "Independently Validated";

export interface QuantitativeClaim {
  statement: LocalizedText;
  taskDefinition: LocalizedText;
  sampleSizeDenominator: LocalizedText;
  evaluator: LocalizedText;
  comparisonBasis: LocalizedText;
  claimAuthority: ClaimAuthority;
}

export interface FieldUpdateWork {
  id: string;
  canonicalWorkId: string;
  title: LocalizedText;
  releaseDate: string;
  originalReleaseDate: string;
  paperVersionDate: string;
  paperVersion: string;
  domain: LocalizedText;
  researchLifecycleCoverage: LocalizedText;
  autonomyLevel: LocalizedText;
  runHorizon: LocalizedText;
  agentTopology: LocalizedText;
  memoryStateMechanism: LocalizedText;
  evaluationProtocol: LocalizedText;
  codeDataTrajectoryAvailability: LocalizedText;
  externalValidation: LocalizedText;
  limitation: LocalizedText;
  evidenceMaturity: EvidenceMaturity;
  deltaStatus: DeltaStatus;
  supersedes: string | null;
  correctionOf: string | null;
  claims: QuantitativeClaim[];
  referenceIds: string[];
}

export interface ProgressTheme {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  workIds: string[];
}

export interface CapabilityAssessment {
  capability: LocalizedText;
  assessment: LocalizedText;
  workIds: string[];
}

export interface CapabilityLadderStage {
  stage: LocalizedText;
  status: LocalizedText;
  description: LocalizedText;
}

export interface FieldUpdateReference {
  id: string;
  workId: string;
  kind: "Paper" | "Repository" | "Project";
  authority: "Primary" | "Official";
  title: string;
  url: string;
}

export interface FieldUpdate {
  id: string;
  anchor: string;
  publishedAt: string;
  evidenceCutoff: string;
  previousCutoff: string;
  supersedes: string | null;
  correctionOf: string | null;
  title: LocalizedText;
  summary: LocalizedText;
  takeaways: LocalizedText[];
  newSincePreviousCutoff: string[];
  contextEntries: string[];
  dateCorrections: string[];
  themes: ProgressTheme[];
  evidenceMaturityDistribution: Record<EvidenceMaturity, number>;
  capabilityAssessment: CapabilityAssessment[];
  capabilityLadder: CapabilityLadderStage[];
  openGaps: LocalizedText[];
  works: FieldUpdateWork[];
  references: FieldUpdateReference[];
}

export interface FieldUpdatesSource {
  schemaVersion: string;
  cadence: LocalizedText;
  evidenceMaturityDefinitions: Record<EvidenceMaturity, LocalizedText>;
  updates: FieldUpdate[];
}

interface ArchivedWork {
  id: string;
  canonicalWorkId: string;
  evidenceMaturity: EvidenceMaturity;
  publishedAt: string;
  supersedes: string | null;
  correctionOf: string | null;
  label: string;
}

const maturityGrades = new Set<EvidenceMaturity>(["A", "B", "C", "D"]);
const deltaStatuses = new Set<DeltaStatus>(["New", "Context", "Date Clarification"]);
const claimAuthorities = new Set<ClaimAuthority>(["Author-reported", "Independently Validated"]);
const referenceKinds = new Set(["Paper", "Repository", "Project"]);
const referenceAuthorities = new Set(["Primary", "Official"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[field-updates] ${message}`);
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  invariant(typeof value === "object" && value !== null && !Array.isArray(value), `${label} must be an object`);
  return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, label: string): asserts value is string {
  invariant(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string`);
}

function nullableId(value: unknown, label: string): void {
  invariant(value === null || (typeof value === "string" && value.trim().length > 0), `${label} must be null or a non-empty id`);
}

function localized(value: unknown, label: string): asserts value is LocalizedText {
  const record = asRecord(value, label);
  nonEmptyString(record.en, `${label}.en`);
  nonEmptyString(record.zh, `${label}.zh`);
}

function localizedList(value: unknown, label: string, allowEmpty = false): void {
  invariant(Array.isArray(value), `${label} must be an array`);
  invariant(allowEmpty || value.length > 0, `${label} must not be empty`);
  value.forEach((item, index) => localized(item, `${label}[${index}]`));
}

function stringList(value: unknown, label: string): asserts value is string[] {
  invariant(Array.isArray(value), `${label} must be an array`);
  value.forEach((item, index) => nonEmptyString(item, `${label}[${index}]`));
  invariant(new Set(value).size === value.length, `${label} contains duplicate ids`);
}

function isoDate(value: unknown, label: string): asserts value is string {
  nonEmptyString(value, label);
  invariant(isoDatePattern.test(value), `${label} must use YYYY-MM-DD`);
  invariant(!Number.isNaN(Date.parse(`${value}T00:00:00Z`)), `${label} is not a valid date`);
}

function validateClaim(value: unknown, label: string): void {
  const claim = asRecord(value, label);
  localized(claim.statement, `${label}.statement`);
  localized(claim.taskDefinition, `${label}.taskDefinition`);
  localized(claim.sampleSizeDenominator, `${label}.sampleSizeDenominator`);
  localized(claim.evaluator, `${label}.evaluator`);
  localized(claim.comparisonBasis, `${label}.comparisonBasis`);
  invariant(claimAuthorities.has(claim.claimAuthority as ClaimAuthority), `${label}.claimAuthority is invalid`);
}

function hasNumericSignal(value: unknown): boolean {
  if (typeof value === "string") return /(?:\d|%|[$<>≤≥])/.test(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.values(value as Record<string, unknown>).some(hasNumericSignal);
  }
  return false;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach((child) => deepFreeze(child));
  }
  return value;
}

/**
 * Validates the append-only source at import/build time. The standalone Node
 * validator mirrors these invariants for CI before Next.js starts compiling.
 */
export function validateFieldUpdates(value: unknown): asserts value is FieldUpdatesSource {
  const source = asRecord(value, "source");
  nonEmptyString(source.schemaVersion, "source.schemaVersion");
  localized(source.cadence, "source.cadence");

  const definitions = asRecord(source.evidenceMaturityDefinitions, "source.evidenceMaturityDefinitions");
  for (const grade of maturityGrades) localized(definitions[grade], `source.evidenceMaturityDefinitions.${grade}`);
  invariant(
    String((definitions.A as LocalizedText).en).toLowerCase().includes("does not by itself imply independent replication"),
    "Evidence A definition must state that Grade A does not imply independent replication",
  );

  invariant(Array.isArray(source.updates) && source.updates.length > 0, "source.updates must be a non-empty array");
  const updateIds = new Set<string>();
  const anchors = new Set<string>();
  const workIds = new Set<string>();
  const referenceIds = new Set<string>();
  const paperUrls = new Set<string>();
  const versionedEntries = new Set<string>();
  const archivedWorks = new Map<string, ArchivedWork>();
  const allUpdates = source.updates.map((item, index) => asRecord(item, `updates[${index}]`));
  const allUpdateIds = new Set(allUpdates.map((update, index) => {
    nonEmptyString(update.id, `updates[${index}].id`);
    return update.id;
  }));
  const updatesById = new Map(allUpdates.map((update) => [update.id as string, update]));

  let previousPublishedAt: string | null = null;
  allUpdates.forEach((update, updateIndex) => {
    const updateLabel = `updates[${updateIndex}]`;
    nonEmptyString(update.id, `${updateLabel}.id`);
    invariant(!updateIds.has(update.id), `duplicate update id: ${update.id}`);
    updateIds.add(update.id);
    nonEmptyString(update.anchor, `${updateLabel}.anchor`);
    invariant(!anchors.has(update.anchor), `duplicate update anchor: ${update.anchor}`);
    anchors.add(update.anchor);
    isoDate(update.anchor, `${updateLabel}.anchor`);
    isoDate(update.publishedAt, `${updateLabel}.publishedAt`);
    isoDate(update.evidenceCutoff, `${updateLabel}.evidenceCutoff`);
    isoDate(update.previousCutoff, `${updateLabel}.previousCutoff`);
    invariant(update.previousCutoff < update.evidenceCutoff, `${updateLabel}.previousCutoff must precede evidenceCutoff`);
    invariant(update.evidenceCutoff <= update.publishedAt, `${updateLabel}.evidenceCutoff cannot exceed publishedAt`);
    invariant(update.anchor === update.publishedAt, `${updateLabel}.anchor must equal publishedAt`);
    invariant(previousPublishedAt === null || update.publishedAt < previousPublishedAt, "updates must be reverse chronological");
    previousPublishedAt = update.publishedAt;
    nullableId(update.supersedes, `${updateLabel}.supersedes`);
    nullableId(update.correctionOf, `${updateLabel}.correctionOf`);
    for (const relation of [update.supersedes, update.correctionOf]) {
      if (typeof relation === "string") {
        invariant(relation !== update.id && allUpdateIds.has(relation), `${updateLabel} references an unknown or self update relation: ${relation}`);
        const target = updatesById.get(relation);
        invariant(
          typeof target?.publishedAt === "string" && target.publishedAt < update.publishedAt,
          `${updateLabel} update relation must reference an older published update`,
        );
      }
    }
    localized(update.title, `${updateLabel}.title`);
    localized(update.summary, `${updateLabel}.summary`);
    localizedList(update.takeaways, `${updateLabel}.takeaways`);
    localizedList(update.openGaps, `${updateLabel}.openGaps`);
    stringList(update.newSincePreviousCutoff, `${updateLabel}.newSincePreviousCutoff`);
    stringList(update.contextEntries, `${updateLabel}.contextEntries`);
    stringList(update.dateCorrections, `${updateLabel}.dateCorrections`);

    invariant(Array.isArray(update.themes) && update.themes.length === 6, `${updateLabel}.themes must contain the six fixed progress themes`);
    update.themes.forEach((themeValue, themeIndex) => {
      const theme = asRecord(themeValue, `${updateLabel}.themes[${themeIndex}]`);
      nonEmptyString(theme.id, `${updateLabel}.themes[${themeIndex}].id`);
      localized(theme.title, `${updateLabel}.themes[${themeIndex}].title`);
      localized(theme.summary, `${updateLabel}.themes[${themeIndex}].summary`);
      stringList(theme.workIds, `${updateLabel}.themes[${themeIndex}].workIds`);
    });

    invariant(Array.isArray(update.capabilityAssessment) && update.capabilityAssessment.length > 0, `${updateLabel}.capabilityAssessment must not be empty`);
    update.capabilityAssessment.forEach((assessmentValue, assessmentIndex) => {
      const assessment = asRecord(assessmentValue, `${updateLabel}.capabilityAssessment[${assessmentIndex}]`);
      localized(assessment.capability, `${updateLabel}.capabilityAssessment[${assessmentIndex}].capability`);
      localized(assessment.assessment, `${updateLabel}.capabilityAssessment[${assessmentIndex}].assessment`);
      stringList(assessment.workIds, `${updateLabel}.capabilityAssessment[${assessmentIndex}].workIds`);
    });

    invariant(Array.isArray(update.capabilityLadder) && update.capabilityLadder.length === 5, `${updateLabel}.capabilityLadder must contain five stages`);
    update.capabilityLadder.forEach((stageValue, stageIndex) => {
      const stage = asRecord(stageValue, `${updateLabel}.capabilityLadder[${stageIndex}]`);
      localized(stage.stage, `${updateLabel}.capabilityLadder[${stageIndex}].stage`);
      localized(stage.status, `${updateLabel}.capabilityLadder[${stageIndex}].status`);
      localized(stage.description, `${updateLabel}.capabilityLadder[${stageIndex}].description`);
    });

    invariant(Array.isArray(update.works) && update.works.length > 0, `${updateLabel}.works must be a non-empty array`);
    const localWorkIds = new Set<string>();
    const calculatedCounts: Record<EvidenceMaturity, number> = { A: 0, B: 0, C: 0, D: 0 };
    update.works.forEach((workValue, workIndex) => {
      const work = asRecord(workValue, `${updateLabel}.works[${workIndex}]`);
      const workLabel = `${updateLabel}.works[${workIndex}]`;
      nonEmptyString(work.id, `${workLabel}.id`);
      nonEmptyString(work.canonicalWorkId, `${workLabel}.canonicalWorkId`);
      invariant(!workIds.has(work.id), `duplicate work id across archive: ${work.id}`);
      workIds.add(work.id);
      localWorkIds.add(work.id);
      localized(work.title, `${workLabel}.title`);
      isoDate(work.releaseDate, `${workLabel}.releaseDate`);
      isoDate(work.originalReleaseDate, `${workLabel}.originalReleaseDate`);
      isoDate(work.paperVersionDate, `${workLabel}.paperVersionDate`);
      invariant((work.releaseDate as string) <= (update.evidenceCutoff as string), `${workLabel}.releaseDate exceeds evidence cutoff`);
      invariant((work.paperVersionDate as string) <= (update.evidenceCutoff as string), `${workLabel}.paperVersionDate exceeds evidence cutoff`);
      invariant(work.originalReleaseDate <= work.paperVersionDate, `${workLabel}.originalReleaseDate exceeds version date`);
      nonEmptyString(work.paperVersion, `${workLabel}.paperVersion`);
      const versionKey = `${work.canonicalWorkId}::${work.paperVersion}::${work.paperVersionDate}`;
      invariant(!versionedEntries.has(versionKey), `duplicate versioned entry: ${versionKey}`);
      versionedEntries.add(versionKey);
      [
        "domain",
        "researchLifecycleCoverage",
        "autonomyLevel",
        "runHorizon",
        "agentTopology",
        "memoryStateMechanism",
        "evaluationProtocol",
        "codeDataTrajectoryAvailability",
        "externalValidation",
        "limitation",
      ].forEach((field) => localized(work[field], `${workLabel}.${field}`));
      invariant(maturityGrades.has(work.evidenceMaturity as EvidenceMaturity), `${workLabel}.evidenceMaturity is invalid`);
      invariant(deltaStatuses.has(work.deltaStatus as DeltaStatus), `${workLabel}.deltaStatus is invalid`);
      nullableId(work.supersedes, `${workLabel}.supersedes`);
      nullableId(work.correctionOf, `${workLabel}.correctionOf`);
      invariant(
        !(typeof work.supersedes === "string" && typeof work.correctionOf === "string"),
        `${workLabel} cannot set both supersedes and correctionOf`,
      );
      invariant(Array.isArray(work.claims), `${workLabel}.claims must be an array`);
      work.claims.forEach((claim, claimIndex) => validateClaim(claim, `${workLabel}.claims[${claimIndex}]`));
      const narrativeFields = [
        "researchLifecycleCoverage",
        "autonomyLevel",
        "runHorizon",
        "agentTopology",
        "memoryStateMechanism",
        "evaluationProtocol",
        "codeDataTrajectoryAvailability",
        "externalValidation",
        "limitation",
      ];
      invariant(
        !narrativeFields.some((field) => hasNumericSignal(work[field])) || work.claims.length > 0,
        `${workLabel} contains a numeric result without a bound QuantitativeClaim`,
      );
      stringList(work.referenceIds, `${workLabel}.referenceIds`);
      invariant(work.referenceIds.length > 0, `${workLabel}.referenceIds must include a primary paper`);

      const grade = work.evidenceMaturity as EvidenceMaturity;
      calculatedCounts[grade] += 1;
      archivedWorks.set(work.id, {
        id: work.id,
        canonicalWorkId: work.canonicalWorkId,
        evidenceMaturity: grade,
        publishedAt: update.publishedAt as string,
        supersedes: work.supersedes as string | null,
        correctionOf: work.correctionOf as string | null,
        label: workLabel,
      });

      if (work.deltaStatus === "New") {
        invariant((work.releaseDate as string) > (update.previousCutoff as string), `${workLabel} is marked New but does not postdate previousCutoff`);
        invariant((update.newSincePreviousCutoff as string[]).includes(work.id), `${workLabel} is New but missing from newSincePreviousCutoff`);
      } else if (work.deltaStatus === "Context") {
        invariant((work.releaseDate as string) <= (update.previousCutoff as string), `${workLabel} Context entry must not postdate previousCutoff`);
        invariant((update.contextEntries as string[]).includes(work.id), `${workLabel} is Context but missing from contextEntries`);
      } else {
        invariant((update.dateCorrections as string[]).includes(work.id), `${workLabel} is a Date Clarification but missing from dateCorrections`);
      }
    });

    const expectedBuckets: Array<[string, DeltaStatus]> = [
      ["newSincePreviousCutoff", "New"],
      ["contextEntries", "Context"],
      ["dateCorrections", "Date Clarification"],
    ];
    expectedBuckets.forEach(([field, expectedStatus]) => {
      (update[field] as string[]).forEach((id) => {
        invariant(localWorkIds.has(id), `${updateLabel}.${field} references unknown work ${id}`);
        const work = (update.works as unknown[]).map((item) => asRecord(item, "work")).find((item) => item.id === id);
        invariant(work?.deltaStatus === expectedStatus, `${updateLabel}.${field} contains ${id} with the wrong deltaStatus`);
      });
    });

    const distribution = asRecord(update.evidenceMaturityDistribution, `${updateLabel}.evidenceMaturityDistribution`);
    for (const grade of maturityGrades) {
      invariant(Number.isInteger(distribution[grade]) && distribution[grade] === calculatedCounts[grade], `${updateLabel}.evidenceMaturityDistribution.${grade} does not match works`);
    }

    invariant(Array.isArray(update.references) && update.references.length > 0, `${updateLabel}.references must not be empty`);
    const localReferences = new Map<string, Record<string, unknown>>();
    update.references.forEach((referenceValue, referenceIndex) => {
      const reference = asRecord(referenceValue, `${updateLabel}.references[${referenceIndex}]`);
      const referenceLabel = `${updateLabel}.references[${referenceIndex}]`;
      nonEmptyString(reference.id, `${referenceLabel}.id`);
      invariant(!referenceIds.has(reference.id), `duplicate reference id: ${reference.id}`);
      referenceIds.add(reference.id);
      localReferences.set(reference.id, reference);
      nonEmptyString(reference.workId, `${referenceLabel}.workId`);
      invariant(localWorkIds.has(reference.workId), `${referenceLabel}.workId does not match an update work`);
      invariant(referenceKinds.has(String(reference.kind)), `${referenceLabel}.kind is invalid`);
      invariant(referenceAuthorities.has(String(reference.authority)), `${referenceLabel}.authority must be Primary or Official`);
      nonEmptyString(reference.title, `${referenceLabel}.title`);
      nonEmptyString(reference.url, `${referenceLabel}.url`);
      invariant(reference.url.startsWith("https://"), `${referenceLabel}.url must use HTTPS`);
      try {
        new URL(reference.url);
      } catch {
        invariant(false, `${referenceLabel}.url is invalid`);
      }
      if (reference.kind === "Paper") {
        invariant(reference.authority === "Primary", `${referenceLabel} paper must be a Primary source`);
        invariant(!paperUrls.has(reference.url), `duplicate paper URL: ${reference.url}`);
        paperUrls.add(reference.url);
      } else {
        invariant(reference.authority === "Official", `${referenceLabel} project/repository must be Official`);
      }
    });

    (update.works as unknown[]).forEach((workValue, workIndex) => {
      const work = asRecord(workValue, `${updateLabel}.works[${workIndex}]`);
      const linkedReferences = (work.referenceIds as string[]).map((id) => {
        const reference = localReferences.get(id);
        invariant(reference, `${updateLabel} work ${work.id} references unknown source ${id}`);
        invariant(reference.workId === work.id, `${updateLabel} work ${work.id} references source ${id} owned by ${String(reference.workId)}`);
        return reference;
      });
      invariant(
        linkedReferences.some((reference) => reference.kind === "Paper" && reference.authority === "Primary"),
        `${updateLabel} work ${work.id}.referenceIds must include its own Primary paper reference`,
      );
    });

    const linkedWorkIdLists = [
      ...(update.themes as Array<Record<string, unknown>>).map((theme) => theme.workIds as string[]),
      ...(update.capabilityAssessment as Array<Record<string, unknown>>).map((assessment) => assessment.workIds as string[]),
    ];
    linkedWorkIdLists.flat().forEach((id) => invariant(localWorkIds.has(id), `${updateLabel} thematic/capability link references unknown work ${id}`));
  });

  for (const work of archivedWorks.values()) {
    for (const [relationName, targetId] of [
      ["supersedes", work.supersedes],
      ["correctionOf", work.correctionOf],
    ] as const) {
      if (targetId === null) continue;
      const target = archivedWorks.get(targetId);
      invariant(target, `${work.label}.${relationName} references unknown work ${targetId}`);
      invariant(target.id !== work.id, `${work.label}.${relationName} cannot reference itself`);
      invariant(
        target.canonicalWorkId === work.canonicalWorkId,
        `${work.label}.${relationName} must reference the same canonicalWorkId`,
      );
      invariant(
        target.publishedAt < work.publishedAt,
        `${work.label}.${relationName} must reference an older published work`,
      );
    }
  }

  const worksByCanonicalId = new Map<string, ArchivedWork[]>();
  for (const work of archivedWorks.values()) {
    const entries = worksByCanonicalId.get(work.canonicalWorkId) ?? [];
    entries.push(work);
    worksByCanonicalId.set(work.canonicalWorkId, entries);
  }
  for (const [canonicalWorkId, entries] of worksByCanonicalId) {
    entries.sort((left, right) => left.publishedAt.localeCompare(right.publishedAt));
    for (let index = 1; index < entries.length; index += 1) {
      const previous = entries[index - 1];
      const current = entries[index];
      invariant(
        previous.publishedAt < current.publishedAt,
        `${current.label} duplicates canonicalWorkId ${canonicalWorkId} within one update`,
      );
      if (previous.evidenceMaturity !== current.evidenceMaturity) {
        invariant(
          current.supersedes === previous.id || current.correctionOf === previous.id,
          `${current.label} changes Evidence Grade for ${canonicalWorkId} from ${previous.evidenceMaturity} to ${current.evidenceMaturity} without linking the immediately previous work ${previous.id}`,
        );
      }
    }
  }
}

const parsedSource: unknown = rawSource;
validateFieldUpdates(parsedSource);

export const fieldUpdatesSource = deepFreeze(parsedSource);
export const fieldUpdates = fieldUpdatesSource.updates;
export const latestFieldUpdate = fieldUpdates[0];
export const evidenceMaturityDefinitions = fieldUpdatesSource.evidenceMaturityDefinitions;
export const updateCadence = fieldUpdatesSource.cadence;

export function getLocalized(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

export function getEvidenceCounts(update: FieldUpdate): Record<EvidenceMaturity, number> {
  return update.works.reduce<Record<EvidenceMaturity, number>>(
    (counts, work) => ({ ...counts, [work.evidenceMaturity]: counts[work.evidenceMaturity] + 1 }),
    { A: 0, B: 0, C: 0, D: 0 },
  );
}
