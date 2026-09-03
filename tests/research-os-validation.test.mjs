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
});

test("rejects a missing bilingual field", () => {
  const broken = structuredClone(source);
  delete broken.articles[0].title.zh;
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /bilingual|title\.zh/, label);
});

test("rejects an unbound claim reference", () => {
  const broken = structuredClone(source);
  broken.articles[1].sections[4].blocks[1].claimId = "missing-claim";
  for (const [label, validate] of validators) assert.throws(() => validate(broken), /claim(?:Id)? .*unknown|unknown claim/, label);
});
