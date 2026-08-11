import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import ts from "typescript";

import { validateFieldUpdates as validateStandalone } from "../scripts/validate-field-updates.mjs";

function loadBuildTimeValidator() {
  const compiledModule = { exports: {} };
  const sourceUrl = new URL("../content/field-updates.ts", import.meta.url);
  const jsonUrl = new URL("../content/field-updates.json", import.meta.url);
  const output = ts.transpileModule(readFileSync(sourceUrl, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier === "./field-updates.json") {
      return JSON.parse(readFileSync(jsonUrl, "utf8"));
    }
    throw new Error(`Unexpected test-time import: ${specifier}`);
  };
  new Function("require", "module", "exports", output)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports.validateFieldUpdates;
}

const validators = [
  ["standalone", validateStandalone],
  ["build-time", loadBuildTimeValidator()],
];

function assertAccepted(source) {
  for (const [label, validate] of validators) {
    assert.doesNotThrow(() => validate(structuredClone(source)), label);
  }
}

function assertRejected(source, pattern) {
  for (const [label, validate] of validators) {
    assert.throws(() => validate(structuredClone(source)), pattern, label);
  }
}

const localized = (en) => ({ en, zh: `${en} 中文` });

function makeWork({
  id,
  canonicalWorkId,
  releaseDate,
  paperVersion,
  evidenceMaturity,
  supersedes = null,
  correctionOf = null,
  referenceIds = [`ref-${id}-paper`],
}) {
  return {
    id,
    canonicalWorkId,
    title: localized(`Title ${id}`),
    releaseDate,
    originalReleaseDate: releaseDate,
    paperVersionDate: releaseDate,
    paperVersion,
    domain: localized("Domain"),
    researchLifecycleCoverage: localized("Lifecycle coverage"),
    autonomyLevel: localized("Bounded autonomy"),
    runHorizon: localized("Short horizon"),
    agentTopology: localized("Single agent"),
    memoryStateMechanism: localized("Recorded state"),
    evaluationProtocol: localized("Held-out evaluation"),
    codeDataTrajectoryAvailability: localized("Open artifacts"),
    externalValidation: localized("Author evaluation"),
    limitation: localized("Limited scope"),
    evidenceMaturity,
    deltaStatus: "New",
    supersedes,
    correctionOf,
    claims: [],
    referenceIds,
  };
}

function makePaperReference(work) {
  return {
    id: `ref-${work.id}-paper`,
    workId: work.id,
    kind: "Paper",
    authority: "Primary",
    title: `Paper ${work.id}`,
    url: `https://example.com/papers/${work.id}`,
  };
}

function makeUpdate({ id, publishedAt, evidenceCutoff, previousCutoff, works, references }) {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  for (const work of works) counts[work.evidenceMaturity] += 1;
  const workIds = works.map((work) => work.id);

  return {
    id,
    anchor: publishedAt,
    publishedAt,
    evidenceCutoff,
    previousCutoff,
    supersedes: null,
    correctionOf: null,
    title: localized(`Update ${id}`),
    summary: localized("Summary"),
    takeaways: [localized("Takeaway")],
    newSincePreviousCutoff: workIds,
    contextEntries: [],
    dateCorrections: [],
    themes: Array.from({ length: 6 }, (_, index) => ({
      id: `theme-${id}-${index}`,
      title: localized(`Theme ${index}`),
      summary: localized("Theme summary"),
      workIds,
    })),
    evidenceMaturityDistribution: counts,
    capabilityAssessment: [{
      capability: localized("Capability"),
      assessment: localized("Assessment"),
      workIds,
    }],
    capabilityLadder: Array.from({ length: 5 }, (_, index) => ({
      stage: localized(`Stage ${index}`),
      status: localized("Current"),
      description: localized("Stage description"),
    })),
    openGaps: [localized("Open gap")],
    works,
    references,
  };
}

function makeSource(updates) {
  return {
    schemaVersion: "test-v1",
    cadence: localized("Monthly"),
    evidenceMaturityDefinitions: {
      A: localized("Grade A does not by itself imply independent replication"),
      B: localized("Grade B"),
      C: localized("Grade C"),
      D: localized("Grade D"),
    },
    updates,
  };
}

function makeVersionChainSource() {
  const older = makeWork({
    id: "alpha-v1",
    canonicalWorkId: "alpha",
    releaseDate: "2026-07-10",
    paperVersion: "v1",
    evidenceMaturity: "C",
  });
  const newer = makeWork({
    id: "alpha-v2",
    canonicalWorkId: "alpha",
    releaseDate: "2026-08-01",
    paperVersion: "v2",
    evidenceMaturity: "B",
    supersedes: older.id,
  });

  return makeSource([
    makeUpdate({
      id: "update-newer",
      publishedAt: "2026-08-11",
      evidenceCutoff: "2026-08-10",
      previousCutoff: "2026-07-27",
      works: [newer],
      references: [makePaperReference(newer)],
    }),
    makeUpdate({
      id: "update-older",
      publishedAt: "2026-07-28",
      evidenceCutoff: "2026-07-27",
      previousCutoff: "2026-06-30",
      works: [older],
      references: [makePaperReference(older)],
    }),
  ]);
}

function makeReferenceSource() {
  const alpha = makeWork({
    id: "alpha-v1",
    canonicalWorkId: "alpha",
    releaseDate: "2026-08-01",
    paperVersion: "v1",
    evidenceMaturity: "C",
    referenceIds: ["ref-alpha-v1-paper", "ref-alpha-v1-repo"],
  });
  const beta = makeWork({
    id: "beta-v1",
    canonicalWorkId: "beta",
    releaseDate: "2026-08-02",
    paperVersion: "v1",
    evidenceMaturity: "C",
  });
  const references = [
    makePaperReference(alpha),
    {
      id: "ref-alpha-v1-repo",
      workId: alpha.id,
      kind: "Repository",
      authority: "Official",
      title: "Alpha repository",
      url: "https://example.com/repositories/alpha",
    },
    makePaperReference(beta),
  ];

  return makeSource([
    makeUpdate({
      id: "update-references",
      publishedAt: "2026-08-11",
      evidenceCutoff: "2026-08-10",
      previousCutoff: "2026-07-28",
      works: [alpha, beta],
      references,
    }),
  ]);
}

test("rejects an evidence cutoff after publication", () => {
  const source = makeVersionChainSource();
  assertAccepted(source);

  source.updates[0].evidenceCutoff = "2026-08-12";
  assertRejected(source, /evidenceCutoff (?:cannot exceed|exceeds) publishedAt/);
});

test("rejects invalid work relation targets, direction, and grade chains", () => {
  const valid = makeVersionChainSource();
  assertAccepted(valid);

  const unknownTarget = structuredClone(valid);
  unknownTarget.updates[0].works[0].supersedes = "missing-work";
  assertRejected(unknownTarget, /references unknown work/);

  const wrongDirection = structuredClone(valid);
  wrongDirection.updates[1].works[0].supersedes = "alpha-v2";
  assertRejected(wrongDirection, /must reference an older published work/);

  const wrongUpdateDirection = structuredClone(valid);
  wrongUpdateDirection.updates[1].supersedes = "update-newer";
  assertRejected(wrongUpdateDirection, /update relation must reference an older published update/);

  const unchainedGradeChange = structuredClone(valid);
  unchainedGradeChange.updates[0].works[0].supersedes = null;
  assertRejected(unchainedGradeChange, /without linking the immediately previous work/);
});

test("rejects cross-work references and an unbound own Primary paper", () => {
  const valid = makeReferenceSource();
  assertAccepted(valid);

  const crossWorkReference = structuredClone(valid);
  crossWorkReference.updates[0].works[0].referenceIds = ["ref-beta-v1-paper"];
  assertRejected(crossWorkReference, /owned by beta-v1/);

  const unboundPrimary = structuredClone(valid);
  unboundPrimary.updates[0].works[0].referenceIds = ["ref-alpha-v1-repo"];
  assertRejected(unboundPrimary, /must include its own Primary paper reference/);
});
