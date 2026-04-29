import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const tsconfigFiles = findTsconfigFiles(root);
const findings = [];

for (const file of tsconfigFiles) {
  const config = readJson(file);
  const compilerOptions = config.compilerOptions ?? {};
  const rel = normalize(relative(root, file));

  addFinding({
    condition: compilerOptions.moduleResolution === "node10",
    file: rel,
    severity: "error",
    code: "moduleResolution-node10",
    finding: "moduleResolution=node10 is removed in TypeScript 7.",
    action: "Move to node16, nodenext, or bundler, then verify package exports/imports behavior.",
  });

  addFinding({
    condition: Object.hasOwn(compilerOptions, "baseUrl"),
    file: rel,
    severity: "error",
    code: "baseUrl",
    finding: "baseUrl is removed in TypeScript 7 preview builds.",
    action: "Prefer explicit paths mappings or package-manager/workspace resolution instead of implicit baseUrl lookup.",
  });

  addFinding({
    condition: compilerOptions.moduleResolution === "classic",
    file: rel,
    severity: "error",
    code: "moduleResolution-classic",
    finding: "classic module resolution is incompatible with modern TypeScript migration paths.",
    action: "Move to node16, nodenext, or bundler depending on runtime and bundler behavior.",
  });

  addFinding({
    condition: compilerOptions.module === "commonjs" && compilerOptions.moduleResolution === "NodeNext",
    file: rel,
    severity: "warn",
    code: "mixed-module-mode",
    finding: "CommonJS module output with NodeNext resolution is a configuration smell during migration.",
    action: "Confirm whether the project is runtime CommonJS, Node ESM, or bundler-first and align module/moduleResolution.",
  });

  addFinding({
    condition: compilerOptions.skipLibCheck === true,
    file: rel,
    severity: "info",
    code: "skipLibCheck",
    finding: "skipLibCheck may hide dependency declaration issues during compiler migrations.",
    action: "Keep it if CI requires speed, but run at least one scheduled migration check without it.",
  });

  addFinding({
    condition: compilerOptions.declaration === true && compilerOptions.isolatedDeclarations !== true,
    file: rel,
    severity: "info",
    code: "isolatedDeclarations-readiness",
    finding: "Declarations are emitted, but isolatedDeclarations is not enabled.",
    action: "Run an isolatedDeclarations branch check to find exported APIs that need explicit annotations.",
  });

  if (Array.isArray(config.references) && config.references.length > 0) {
    addFinding({
      condition: true,
      file: rel,
      severity: "info",
      code: "project-references",
      finding: `Project references detected (${config.references.length}).`,
      action: "Benchmark tsgo -b with --builders tuned to available CI cores and memory.",
    });
  }
}

const summary = {
  error: findings.filter((finding) => finding.severity === "error").length,
  warn: findings.filter((finding) => finding.severity === "warn").length,
  info: findings.filter((finding) => finding.severity === "info").length,
};

const report = {
  generatedAt: new Date().toISOString(),
  root: normalize(root),
  scannedFiles: tsconfigFiles.map((file) => normalize(relative(root, file))),
  summary,
  findings,
};

writeFileSync("migration-findings.json", `${JSON.stringify(report, null, 2)}\n`);
console.table(findings.map(({ severity, file, code, finding }) => ({ severity, file, code, finding })));
console.log(`Scanned ${tsconfigFiles.length} tsconfig file(s). Errors: ${summary.error}, warnings: ${summary.warn}, info: ${summary.info}.`);
console.log("Wrote migration-findings.json");

function addFinding({ condition, ...finding }) {
  if (condition) {
    findings.push(finding);
  }
}

function findTsconfigFiles(directory) {
  const ignored = new Set([".git", "node_modules", ".tmp", "dist", "coverage"]);
  const results = [];

  for (const entry of readdirSync(directory)) {
    if (ignored.has(entry)) {
      continue;
    }

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      results.push(...findTsconfigFiles(path));
      continue;
    }

    if (/^tsconfig(?:\..+)?\.json$/.test(entry)) {
      results.push(path);
    }
  }

  return results.sort();
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Could not parse ${path}: ${error.message}`);
  }
}

function normalize(path) {
  return path.replaceAll("\\\\", "/");
}
