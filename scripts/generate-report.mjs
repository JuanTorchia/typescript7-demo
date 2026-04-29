import { existsSync, readFileSync, writeFileSync } from "node:fs";

const now = new Date().toISOString();
const local = readJson("benchmark-results.json");
const synthetic = readJson("benchmark-synthetic.json");
const publicRepos = readJson("benchmark-public-repos.json");
const tuning = readJson("benchmark-tuning.json");
const migration = readJson("migration-findings.json");

const lines = [
  "# TypeScript 7 PreviewBench Report",
  "",
  `Generated at: ${now}`,
  "",
  "## Methodology",
  "",
  "- Results compare TypeScript 6 and the TypeScript 7 native preview on the same machine.",
  "- Speedups use median wall-clock time when the source report includes medians.",
  "- Public repositories are cloned at pinned refs and verified against expected commits.",
  "- Synthetic corpora are generated locally under `.tmp/synthetic-corpus` and can be inspected after running the benchmark.",
  "- TypeScript 7 is a preview. Treat results as migration signal, not a production guarantee.",
  "",
  "## Local Fixture Benchmark",
  "",
  table(["Target", "Runs", "Average ms", "Samples"], local?.map((item) => [item.label, item.runs, item.averageMs, item.samplesMs.join(", ")]) ?? []),
  "",
  "## Controlled Synthetic Benchmark",
  "",
  table(["Corpus", "Category", "TS6 median", "TS7 median", "Delta"], synthetic?.benchmarks?.map((item) => [item.id, item.category, item.ts6.medianMs, item.ts7.medianMs, `${item.observedDelta}x`]) ?? []),
  "",
  "## Public Repository Benchmark",
  "",
  table(["Repository", "Ref", "TS6 median", "TS7 median", "Delta", "Why"], publicRepos?.benchmarks?.map((item) => [item.repo, item.ref, item.ts6.medianMs, item.ts7.medianMs, `${item.observedDelta}x`, item.why]) ?? []),
  "",
  "## Migration Checks",
  "",
  table(["Repository", "Kind", "TS6", "TS7", "Why"], publicRepos?.migrationChecks?.map((item) => [item.repo, item.resultKind, item.ts6.status, item.ts7.status, item.why]) ?? []),
  "",
  "## TypeScript 7 Tuning Matrix",
  "",
  table(["Variant", "Category", "Median ms", "Min ms", "Average ms", "Peak RSS"], tuning?.variants?.map((item) => [
    item.label,
    item.category,
    item.medianMs,
    item.minMs,
    item.averageMs,
    formatPeakRss(item.samples),
  ]) ?? []),
  "",
  "## Local Migration Scanner",
  "",
  migration ? `Scanned ${migration.scannedFiles.length} tsconfig file(s). Errors: ${migration.summary.error}, warnings: ${migration.summary.warn}, info: ${migration.summary.info}.` : "No migration scanner output found.",
  "",
  table(["Severity", "File", "Code", "Finding", "Action"], migration?.findings?.map((item) => [item.severity, item.file, item.code, item.finding, item.action]) ?? []),
  "",
];

writeFileSync("benchmark-report.md", `${lines.join("\n")}\n`);
console.log("Wrote benchmark-report.md");

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function table(headers, rows) {
  const safeRows = rows.length > 0 ? rows : [[...headers.map(() => "")]];
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...safeRows.map((row) => `| ${row.map(formatCell).join(" | ")} |`),
  ].join("\n");
}

function formatCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function formatPeakRss(samples) {
  const values = samples?.map((sample) => sample.peakRssKb).filter((value) => typeof value === "number") ?? [];
  return values.length > 0 ? `${Math.max(...values)} KB` : "not captured on this OS";
}
