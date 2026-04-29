import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const runs = Number.parseInt(process.env.RUNS ?? "5", 10);
const warmups = Number.parseInt(process.env.WARMUPS ?? "1", 10);
const tsgo = "node_modules/@typescript/native-preview/bin/tsgo.js";

const variants = [
  {
    id: "default-check",
    label: "tsgo --noEmit",
    command: [process.execPath, tsgo, "--noEmit"],
    category: "local project",
  },
  {
    id: "checkers-1",
    label: "tsgo --noEmit --checkers 1",
    command: [process.execPath, tsgo, "--noEmit", "--checkers", "1"],
    category: "checker tuning",
  },
  {
    id: "checkers-4",
    label: "tsgo --noEmit --checkers 4",
    command: [process.execPath, tsgo, "--noEmit", "--checkers", "4"],
    category: "checker tuning",
  },
  {
    id: "single-threaded",
    label: "tsgo --noEmit --singleThreaded",
    command: [process.execPath, tsgo, "--noEmit", "--singleThreaded"],
    category: "debug baseline",
  },
  {
    id: "builders-4-dry",
    label: "tsgo -b tsconfig.json --builders 4 --dry",
    command: [process.execPath, tsgo, "-b", "tsconfig.json", "--builders", "4", "--dry"],
    category: "project builder tuning",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  note: "TypeScript 7 tuning flags are preview behavior. Compare relative behavior on the same machine, not across machines.",
  runs,
  warmups,
  variants: variants.map(measureVariant),
};

writeFileSync("benchmark-tuning.json", `${JSON.stringify(report, null, 2)}\n`);
console.table(report.variants.map((variant) => ({
  id: variant.id,
  category: variant.category,
  medianMs: variant.medianMs,
  minMs: variant.minMs,
  averageMs: variant.averageMs,
  status: variant.status,
})));
console.log("Wrote benchmark-tuning.json");

function measureVariant(variant) {
  console.log(`→ warming ${variant.label}`);
  for (let index = 0; index < warmups; index += 1) {
    runOrThrow(variant);
  }

  console.log(`→ measuring ${variant.label}`);
  const samples = [];
  for (let index = 0; index < runs; index += 1) {
    samples.push(runOrThrow(variant));
  }

  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b);

  return {
    id: variant.id,
    label: variant.label,
    category: variant.category,
    command: variant.command.join(" "),
    status: "passed",
    runs,
    warmups,
    averageMs: Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length),
    medianMs: median(durations),
    minMs: durations[0],
    samples,
  };
}

function runOrThrow(variant) {
  const start = performance.now();
  const timedCommand = process.platform !== "win32" && existsSync("/usr/bin/time")
    ? ["/usr/bin/time", "-v", ...variant.command]
    : variant.command;
  const result = spawnSync(timedCommand[0], timedCommand.slice(1), {
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
  });
  const durationMs = Math.round(performance.now() - start);

  if (result.status !== 0) {
    throw new Error(`${variant.label} failed:\n${result.stdout}\n${result.stderr}`);
  }

  return {
    status: result.status,
    durationMs,
    peakRssKb: parsePeakRss(result.stderr),
  };
}

function parsePeakRss(stderr) {
  const match = stderr.match(/Maximum resident set size \\(kbytes\\):\\s*(\\d+)/);
  return match ? Number(match[1]) : null;
}

function median(values) {
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 1
    ? values[middle]
    : Math.round((values[middle - 1] + values[middle]) / 2);
}
