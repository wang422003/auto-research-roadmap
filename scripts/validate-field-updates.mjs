import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const grades = new Set(["A", "B", "C", "D"]);
const statuses = new Set(["New", "Context", "Date Clarification"]);

function check(condition, message) {
  if (!condition) throw new Error(`[field-updates] ${message}`);
}

function text(value, label) {
  check(typeof value === "string" && value.trim(), `${label} must be a non-empty string`);
}

function localized(value, label) {
  check(value && typeof value === "object" && !Array.isArray(value), `${label} must be bilingual`);
  text(value.en, `${label}.en`);
  text(value.zh, `${label}.zh`);
}

function date(value, label) {
  text(value, label);
  check(/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), `${label} must be a valid YYYY-MM-DD date`);
}

function uniqueId(id, label, ids) {
  text(id, label);
  check(!ids.has(id), `duplicate id: ${id}`);
  ids.add(id);
}

function hasNumericSignal(value) {
  if (typeof value === "string") return /(?:\d|%|[$<>≤≥])/.test(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.values(value).some(hasNumericSignal);
  }
  return false;
}

export function validateFieldUpdates(source) {
  const ids = new Set();
  const anchors = new Set();
  const paperUrls = new Set();
  const versionedEntries = new Set();
  const archivedWorks = new Map();

  check(source && typeof source === "object", "source must be an object");
  text(source.schemaVersion, "schemaVersion");
  localized(source.cadence, "cadence");
  for (const grade of grades) localized(source.evidenceMaturityDefinitions?.[grade], `evidenceMaturityDefinitions.${grade}`);
  check(
    source.evidenceMaturityDefinitions.A.en.toLowerCase().includes("does not by itself imply independent replication"),
    "Evidence A must explicitly state that peer review is not independent replication",
  );
  check(Array.isArray(source.updates) && source.updates.length, "updates must be non-empty");

  const updateIds = new Set(source.updates.map((update) => update.id));
  const updatesById = new Map(source.updates.map((update) => [update.id, update]));
  let lastPublishedAt = null;

  for (const [updateIndex, update] of source.updates.entries()) {
  const ul = `updates[${updateIndex}]`;
  uniqueId(update.id, `${ul}.id`, ids);
  text(update.anchor, `${ul}.anchor`);
  check(!anchors.has(update.anchor), `duplicate anchor: ${update.anchor}`);
  anchors.add(update.anchor);
  date(update.anchor, `${ul}.anchor`);
  date(update.publishedAt, `${ul}.publishedAt`);
  date(update.evidenceCutoff, `${ul}.evidenceCutoff`);
  date(update.previousCutoff, `${ul}.previousCutoff`);
  check(update.previousCutoff < update.evidenceCutoff, `${ul}: previousCutoff must precede evidenceCutoff`);
  check(update.evidenceCutoff <= update.publishedAt, `${ul}: evidenceCutoff exceeds publishedAt`);
  check(update.anchor === update.publishedAt, `${ul}: anchor must equal publishedAt`);
  check(lastPublishedAt === null || update.publishedAt < lastPublishedAt, "updates must be reverse chronological");
  lastPublishedAt = update.publishedAt;
  for (const relation of [update.supersedes, update.correctionOf]) {
    check(relation === null || (typeof relation === "string" && relation !== update.id && updateIds.has(relation)), `${ul}: invalid supersedes/correctionOf relation`);
    if (typeof relation === "string") {
      const target = updatesById.get(relation);
      check(target?.publishedAt < update.publishedAt, `${ul}: update relation must reference an older published update`);
    }
  }
  localized(update.title, `${ul}.title`);
  localized(update.summary, `${ul}.summary`);
  for (const [index, takeaway] of update.takeaways.entries()) localized(takeaway, `${ul}.takeaways[${index}]`);
  for (const [index, gap] of update.openGaps.entries()) localized(gap, `${ul}.openGaps[${index}]`);
  check(update.themes.length === 6, `${ul}: exactly six progress themes are required`);
  check(update.capabilityLadder.length === 5, `${ul}: exactly five capability-ladder stages are required`);

  const localWorkIds = new Set(update.works.map((work) => work.id));
  const expectedStatus = new Map([
    ...update.newSincePreviousCutoff.map((id) => [id, "New"]),
    ...update.contextEntries.map((id) => [id, "Context"]),
    ...update.dateCorrections.map((id) => [id, "Date Clarification"]),
  ]);
  check(expectedStatus.size === update.works.length, `${ul}: delta buckets must include every work exactly once`);
  const calculated = { A: 0, B: 0, C: 0, D: 0 };

  for (const [workIndex, work] of update.works.entries()) {
    const wl = `${ul}.works[${workIndex}]`;
    uniqueId(work.id, `${wl}.id`, ids);
    text(work.canonicalWorkId, `${wl}.canonicalWorkId`);
    localized(work.title, `${wl}.title`);
    date(work.releaseDate, `${wl}.releaseDate`);
    date(work.originalReleaseDate, `${wl}.originalReleaseDate`);
    date(work.paperVersionDate, `${wl}.paperVersionDate`);
    check(work.releaseDate <= update.evidenceCutoff, `${wl}: releaseDate exceeds evidenceCutoff`);
    check(work.paperVersionDate <= update.evidenceCutoff, `${wl}: paperVersionDate exceeds evidenceCutoff`);
    check(work.originalReleaseDate <= work.paperVersionDate, `${wl}: originalReleaseDate exceeds paperVersionDate`);
    text(work.paperVersion, `${wl}.paperVersion`);
    const versionKey = `${work.canonicalWorkId}::${work.paperVersion}::${work.paperVersionDate}`;
    check(!versionedEntries.has(versionKey), `duplicate versioned entry: ${versionKey}`);
    versionedEntries.add(versionKey);
    for (const field of [
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
    ]) localized(work[field], `${wl}.${field}`);
    check(grades.has(work.evidenceMaturity), `${wl}: invalid Evidence Maturity`);
    check(statuses.has(work.deltaStatus), `${wl}: invalid deltaStatus`);
    for (const [relationName, relation] of [["supersedes", work.supersedes], ["correctionOf", work.correctionOf]]) {
      check(relation === null || (typeof relation === "string" && relation.trim()), `${wl}.${relationName} must be null or a non-empty id`);
    }
    check(!(work.supersedes && work.correctionOf), `${wl}: cannot set both supersedes and correctionOf`);
    check(expectedStatus.get(work.id) === work.deltaStatus, `${wl}: deltaStatus does not match its update bucket`);
    if (work.deltaStatus === "New") check(work.releaseDate > update.previousCutoff, `${wl}: New entry predates or equals previousCutoff`);
    if (work.deltaStatus === "Context") check(work.releaseDate <= update.previousCutoff, `${wl}: Context entry postdates previousCutoff`);
    check(Array.isArray(work.claims), `${wl}.claims must be an array`);
    for (const [claimIndex, claim] of work.claims.entries()) {
      const cl = `${wl}.claims[${claimIndex}]`;
      localized(claim.statement, `${cl}.statement`);
      localized(claim.taskDefinition, `${cl}.taskDefinition`);
      localized(claim.sampleSizeDenominator, `${cl}.sampleSizeDenominator`);
      localized(claim.evaluator, `${cl}.evaluator`);
      localized(claim.comparisonBasis, `${cl}.comparisonBasis`);
      check(["Author-reported", "Independently Validated"].includes(claim.claimAuthority), `${cl}: invalid claimAuthority`);
    }
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
    check(
      !narrativeFields.some((field) => hasNumericSignal(work[field])) || work.claims.length > 0,
      `${wl}: numeric result is missing a bound QuantitativeClaim`,
    );
    check(Array.isArray(work.referenceIds) && work.referenceIds.length, `${wl}: a primary reference is required`);
    calculated[work.evidenceMaturity] += 1;
    archivedWorks.set(work.id, {
      id: work.id,
      canonicalWorkId: work.canonicalWorkId,
      evidenceMaturity: work.evidenceMaturity,
      publishedAt: update.publishedAt,
      supersedes: work.supersedes,
      correctionOf: work.correctionOf,
      label: wl,
    });
  }

  for (const grade of grades) {
    check(update.evidenceMaturityDistribution[grade] === calculated[grade], `${ul}: Evidence Maturity distribution mismatch for ${grade}`);
  }

  const localReferences = new Map();
  for (const [referenceIndex, reference] of update.references.entries()) {
    const rl = `${ul}.references[${referenceIndex}]`;
    uniqueId(reference.id, `${rl}.id`, ids);
    localReferences.set(reference.id, reference);
    check(localWorkIds.has(reference.workId), `${rl}: unknown workId`);
    check(["Paper", "Repository", "Project"].includes(reference.kind), `${rl}: invalid kind`);
    check(["Primary", "Official"].includes(reference.authority), `${rl}: source is not Primary/Official`);
    text(reference.title, `${rl}.title`);
    text(reference.url, `${rl}.url`);
    check(reference.url.startsWith("https://"), `${rl}: source URL must use HTTPS`);
    try {
      new URL(reference.url);
    } catch {
      check(false, `${rl}: invalid URL`);
    }
    if (reference.kind === "Paper") {
      check(reference.authority === "Primary", `${rl}: paper must be marked Primary`);
      check(!paperUrls.has(reference.url), `duplicate paper URL: ${reference.url}`);
      paperUrls.add(reference.url);
    } else {
      check(reference.authority === "Official", `${rl}: repository/project must be marked Official`);
    }
  }

  for (const work of update.works) {
    const linkedReferences = work.referenceIds.map((referenceId) => {
      const reference = localReferences.get(referenceId);
      check(reference, `${ul}: ${work.id} has unknown reference ${referenceId}`);
      check(reference.workId === work.id, `${ul}: ${work.id} references source ${referenceId} owned by ${reference.workId}`);
      return reference;
    });
    check(
      linkedReferences.some((reference) => reference.kind === "Paper" && reference.authority === "Primary"),
      `${ul}: ${work.id}.referenceIds must include its own Primary paper reference`,
    );
  }
  for (const theme of update.themes) {
    text(theme.id, `${ul}.theme.id`);
    localized(theme.title, `${ul}.theme.title`);
    localized(theme.summary, `${ul}.theme.summary`);
    for (const workId of theme.workIds) check(localWorkIds.has(workId), `${ul}: theme references unknown work ${workId}`);
  }
  for (const assessment of update.capabilityAssessment) {
    localized(assessment.capability, `${ul}.capabilityAssessment.capability`);
    localized(assessment.assessment, `${ul}.capabilityAssessment.assessment`);
    for (const workId of assessment.workIds) check(localWorkIds.has(workId), `${ul}: capability assessment references unknown work ${workId}`);
  }
  for (const stage of update.capabilityLadder) {
    localized(stage.stage, `${ul}.capabilityLadder.stage`);
    localized(stage.status, `${ul}.capabilityLadder.status`);
    localized(stage.description, `${ul}.capabilityLadder.description`);
  }
  }

  for (const work of archivedWorks.values()) {
    for (const [relationName, targetId] of [["supersedes", work.supersedes], ["correctionOf", work.correctionOf]]) {
      if (targetId === null) continue;
      const target = archivedWorks.get(targetId);
      check(target, `${work.label}.${relationName} references unknown work ${targetId}`);
      check(target.id !== work.id, `${work.label}.${relationName} cannot reference itself`);
      check(target.canonicalWorkId === work.canonicalWorkId, `${work.label}.${relationName} must reference the same canonicalWorkId`);
      check(target.publishedAt < work.publishedAt, `${work.label}.${relationName} must reference an older published work`);
    }
  }

  const worksByCanonicalId = new Map();
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
      check(previous.publishedAt < current.publishedAt, `${current.label} duplicates canonicalWorkId ${canonicalWorkId} within one update`);
      if (previous.evidenceMaturity !== current.evidenceMaturity) {
        check(
          current.supersedes === previous.id || current.correctionOf === previous.id,
          `${current.label} changes Evidence Grade for ${canonicalWorkId} from ${previous.evidenceMaturity} to ${current.evidenceMaturity} without linking the immediately previous work ${previous.id}`,
        );
      }
    }
  }

  return {
    updates: source.updates.length,
    works: source.updates.reduce((sum, update) => sum + update.works.length, 0),
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const sourceUrl = new URL("../content/field-updates.json", import.meta.url);
  const source = JSON.parse(await readFile(sourceUrl, "utf8"));
  const counts = validateFieldUpdates(source);
  console.log(`Validated ${counts.updates} field update(s), ${counts.works} versioned work entries.`);
}
