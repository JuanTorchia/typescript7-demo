import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const runs = Number.parseInt(process.env.RUNS ?? "5", 10);
const warmups = Number.parseInt(process.env.WARMUPS ?? "1", 10);
const root = resolve(".tmp/synthetic-corpus");
const tsc6 = resolve("node_modules/@typescript/typescript6/bin/tsc6");
const tsgo = resolve("node_modules/@typescript/native-preview/bin/tsgo.js");

execFileSync(process.execPath, ["scripts/generate-synthetic-corpus.mjs"], { stdio: "inherit" });

const projects = [
  {
    id: "template-literal-stress",
    category: "template literal and mapped types",
    ts6: [process.execPath, tsc6, "-p", "tsconfig.json", "--noEmit"],
    ts7: [process.execPath, tsgo, "-p", "tsconfig.json", "--noEmit"],
  },
  {
    id: "many-modules",
    category: "many small modules and import graph",
    ts6: [process.execPath, tsc6, "-p", "tsconfig.json", "--noEmit"],
    ts7: [process.execPath, tsgo, "-p", "tsconfig.json", "--noEmit"],
  },
  {
    id: "project-references",
    category: "project references build graph",
    beforeEach: () => cleanProjectReferencesOutput(join(root, "project-references")),
    ts6: [process.execPath, tsc6, "-b", "tsconfig.json", "--force"],
    ts7: [process.execPath, tsgo, "-b", "tsconfig.json", "--force"],
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  note: "Synthetic stress tests are generated in .tmp/synthetic-corpus and are intended to be inspectable, controlled benchmark inputs.",
  runs,
  warmups,
  benchmarks: projects.map(measureProject),
};

writeFileSync("benchmark-synthetic.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(`Synthetic benchmark settings: ${runs} measured runs, ${warmups} warmup run(s), speedup based on median.`);
console.table(report.benchmarks.map((project) => ({
  corpus: project.id,
  category: project.category,
  ts6MedianMs: project.ts6.medianMs,
  ts7MedianMs: project.ts7.medianMs,
  ts6MinMs: project.ts6.minMs,
  ts7MinMs: project.ts7.minMs,
  delta: project.observedDelta,
})));
console.log("Wrote benchmark-synthetic.json");

function measureProject(project) {
  const directory = join(root, project.id);
  const ts6 = measure(`${project.id}: TypeScript 6`, project.ts6, directory, project.beforeEach);
  const ts7 = measure(`${project.id}: TypeScript 7 native preview`, project.ts7, directory, project.beforeEach);

  return {
    id: project.id,
    category: project.category,
    ts6,
    ts7,
    observedDelta: ts6.medianMs && ts7.medianMs
      ? Number((ts6.medianMs / ts7.medianMs).toFixed(2))
      : null,
  };
}

function measure(label, argv, cwd, beforeEach) {
  console.log(`→ warming ${label}`);
  for (let index = 0; index < warmups; index += 1) {
    beforeEach?.();
    runOrThrow(label, argv, cwd);
  }

  console.log(`→ measuring ${label}`);
  const samples = [];
  for (let index = 0; index < runs; index += 1) {
    beforeEach?.();
    samples.push(runOrThrow(label, argv, cwd));
  }

  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);

  return {
    label,
    command: argv.join(" "),
    runs,
    warmups,
    status: "passed",
    averageMs: Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length),
    medianMs: median(durations),
    minMs: durations[0],
    samples,
  };
}

function runOrThrow(label, argv, cwd) {
  const start = performance.now();
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
    },
  });
  const durationMs = Math.round(performance.now() - start);

  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${result.stdout}\n${result.stderr}`);
  }

  return { status: result.status, durationMs };
}

function cleanProjectReferencesOutput(directory) {
  const packages = join(directory, "packages");

  if (!existsSync(packages)) {
    throw new Error(`Synthetic project references corpus is missing: ${packages}`);
  }

  for (let index = 0; index < 48; index += 1) {
    rmSync(join(packages, `pkg-${index}`, "dist"), { recursive: true, force: true });
    rmSync(join(packages, `pkg-${index}`, "tsconfig.tsbuildinfo"), { force: true });
  }
}

function median(values) {
  const middle = Math.floor(values.length / 2);

  if (values.length % 2 === 1) {
    return values[middle];
  }

  return Math.round((values[middle - 1] + values[middle]) / 2);
}
