import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateResearchOs as validateStandalone } from "../scripts/validate-research-os.mjs";
import ts from "typescript";

const source = JSON.parse(readFileSync(new URL("../content/research-os.json", import.meta.url), "utf8"));

function loadBuildTimeValidator() {
  const compiledModule = { exports: {} };
  const output = ts.transpileModule(readFileSync(new URL("../content/research-os.ts", import.meta.url), "utf8"), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier === "./research-os.json") return JSON.parse(readFileSync(new URL("../content/research-os.json", import.meta.url), "utf8"));
    if (specifier === "./field-updates") return { ClaimAuthority: undefined };
    throw new Error(`Unexpected test-time import: ${specifier}`);
  };
  new Function("require", "module", "exports", output)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports.validateResearchOs;
}

const validators = [["standalone", validateStandalone], ["build-time", loadBuildTimeValidator()]];

test("accepts the three bilingual Research OS articles", () => {
  for (const [, validate] of validators) assert.doesNotThrow(() => validate(structuredClone(source)));
  assert.equal(source.readingList.entries.length, 21);
  assert.equal(source.readingList.groups.length, 5);
  assert.equal(source.readingList.recommendedPath.length, 5);
});

test("rejects a missing bilingual field", () => {
  const broken = structuredClone(source);
  delete broken.articles[0].title.zh;
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /bilingual|title\.zh/, label);
});

test("rejects an unbound claim reference", () => {
  const broken = structuredClone(source);
  const claimBlock = broken.articles.flatMap((article) => article.sections.flatMap((section) => section.blocks)).find((block) => block.type === "claim");
  assert.ok(claimBlock, "fixture should contain a claim block");
  claimBlock.claimId = "missing-claim";
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /claim(?:Id)? .*unknown|unknown claim/, label);
});

test("rejects a missing reading list", () => {
  const broken = structuredClone(source);
  delete broken.readingList;
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /readingList.*object|readingList/, label);
});

test("requires the Evidence A replication caveat in both locales", () => {
  const brokenEnglish = structuredClone(source);
  brokenEnglish.readingList.framing.en = "Peer-reviewed status is useful.";
  const brokenChinese = structuredClone(source);
  brokenChinese.readingList.framing.zh = "这是一个精选阅读清单。";
  for (const [label, validate] of validators) {
    assert.throws(() => validate(brokenEnglish), /framing.*Independent Replication/, label);
    assert.throws(() => validate(brokenChinese), /framing.*Independent Replication/, label);
  }
});

test("rejects an invalid reading-guide mode", () => {
  const broken = structuredClone(source);
  const guide = broken.articles[0].sections.flatMap((section) => section.blocks).find((block) => block.type === "reading-guide");
  assert.ok(guide, "fixture should contain a reading-guide block");
  guide.mode = "sideways";
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /mode is invalid/, label);
});

test("rejects a reading entry without Chinese rationale", () => {
  const broken = structuredClone(source);
  delete broken.readingList.entries[0].whyRead.zh;
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /whyRead\.zh|bilingual/, label);
});

test("rejects unknown references and duplicate entry ids", () => {
  const unknownReference = structuredClone(source);
  unknownReference.readingList.entries[0].referenceId = "not-a-reference";
  const duplicateId = structuredClone(source);
  duplicateId.readingList.entries[1].id = duplicateId.readingList.entries[0].id;
  for (const [label, validate] of validators) {
    assert.throws(() => validate(unknownReference), /referenceId.*unknown/, label);
    assert.throws(() => validate(duplicateId), /duplicate id/, label);
  }
});

test("rejects invalid publication and evidence labels", () => {
  const badPublication = structuredClone(source);
  badPublication.readingList.entries[0].publicationStatus = "Draft";
  const badEvidence = structuredClone(source);
  badEvidence.readingList.entries[0].evidenceMaturity = "E";
  for (const [label, validate] of validators) {
    assert.throws(() => validate(badPublication), /publicationStatus is invalid/, label);
    assert.throws(() => validate(badEvidence), /evidenceMaturity is invalid/, label);
  }
});

test("rejects non-HTTPS references and unknown path entries", () => {
  const badUrl = structuredClone(source);
  badUrl.articles[0].references[0].url = "http://example.com/paper";
  const badPath = structuredClone(source);
  badPath.readingList.recommendedPath[0] = "missing-entry";
  for (const [label, validate] of validators) {
    assert.throws(() => validate(badUrl), /url must use HTTPS/, label);
    assert.throws(() => validate(badPath), /recommendedPath.*unknown/, label);
  }
});

test("rejects a companion reference that is not an Official artifact", () => {
  const broken = structuredClone(source);
  const entry = broken.readingList.entries.find((candidate) => candidate.companionReferenceIds.length > 0);
  assert.ok(entry, "fixture should contain a companion reference");
  entry.companionReferenceIds = ["xscientist"];
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /companionReferenceIds.*Official/, label);
});

test("rejects a duplicate Paper URL and paper version", () => {
  const broken = structuredClone(source);
  broken.readingList.entries[1].referenceId = broken.readingList.entries[0].referenceId;
  broken.readingList.entries[1].articleSlug = broken.readingList.entries[0].articleSlug;
  broken.readingList.entries[1].paperVersion = broken.readingList.entries[0].paperVersion;
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /duplicate Paper URL.*paperVersion/, label);
});

test("rejects a group assignment whose track disagrees with the group", () => {
  const broken = structuredClone(source);
  const directEntryId = broken.readingList.groups[0].entryIds[0];
  const directEntry = broken.readingList.entries.find((entry) => entry.id === directEntryId);
  directEntry.track = "systems";
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /mismatched track/, label);
});

test("rejects duplicate group assignment and malformed recommended path", () => {
  const duplicateGroup = structuredClone(source);
  duplicateGroup.readingList.groups[1].entryIds.push(duplicateGroup.readingList.groups[0].entryIds[0]);
  const badPath = structuredClone(source);
  badPath.readingList.recommendedPath[1] = badPath.readingList.recommendedPath[0];
  const wrongOrderPath = structuredClone(source);
  [wrongOrderPath.readingList.recommendedPath[1], wrongOrderPath.readingList.recommendedPath[2]] = [wrongOrderPath.readingList.recommendedPath[2], wrongOrderPath.readingList.recommendedPath[1]];
  for (const [label, validate] of validators) {
    assert.throws(() => validate(duplicateGroup), /more than once|cover every/, label);
    assert.throws(() => validate(badPath), /recommendedPath.*duplicate/, label);
    assert.throws(() => validate(wrongOrderPath), /recommendedPath.*fixed order/, label);
  }
});

test("rejects dates after source cutoff and unbound quantitative narrative", () => {
  const badDate = structuredClone(source);
  badDate.readingList.entries[0].paperVersionDate = "2099-01-01";
  const badNarrative = structuredClone(source);
  badNarrative.readingList.entries[0].whyRead.en = "Reports 5 tasks without a bound claim.";
  const badSpelledNarrative = structuredClone(source);
  badSpelledNarrative.readingList.entries[0].evidenceBoundary.en = "Covers five experiments without a bound claim.";
  for (const [label, validate] of validators) {
    assert.throws(() => validate(badDate), /paperVersionDate.*sourceCutoff/, label);
    assert.throws(() => validate(badNarrative), /unbound quantitative/, label);
    assert.throws(() => validate(badSpelledNarrative), /unbound quantitative/, label);
  }
});

test("rejects an impossible calendar date", () => {
  const broken = structuredClone(source);
  broken.readingList.entries[0].releaseDate = "2026-02-30";
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /calendar date|YYYY-MM-DD/, label);
});

test("rejects a broken supersedes relation", () => {
  const broken = structuredClone(source);
  broken.readingList.entries[0].supersedes = "missing-entry";
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /supersedes.*unknown/, label);
});

test("rejects mutually exclusive correction relations", () => {
  const broken = structuredClone(source);
  broken.readingList.entries[1].supersedes = broken.readingList.entries[0].id;
  broken.readingList.entries[1].correctionOf = broken.readingList.entries[0].id;
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /both supersedes and correctionOf/, label);
});
