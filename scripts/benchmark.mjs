import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const runs = Number.parseInt(process.env.RUNS ?? "5", 10);

function time(label, command) {
  const samples = [];

  for (let index = 0; index < runs; index += 1) {
    const start = performance.now();
    execSync(command, { stdio: "pipe" });
    samples.push(Math.round(performance.now() - start));
  }

  const averageMs = Math.round(samples.reduce((sum, item) => sum + item, 0) / samples.length);

  return { label, runs, samplesMs: samples, averageMs };
}

const results = [
  time("Local project: TypeScript 6 tsc6 --noEmit", "npm run -s typecheck:ts6"),
  time("Local project: TypeScript 7 tsgo --noEmit", "npm run -s typecheck:ts7"),
  time("Type-Fest fixture: TypeScript 6 tsc6 --noEmit", "npm run -s typecheck:oss:ts6"),
  time("Type-Fest fixture: TypeScript 7 tsgo --noEmit", "npm run -s typecheck:oss:ts7"),
];

writeFileSync("benchmark-results.json", `${JSON.stringify(results, null, 2)}\n`);
console.table(results);
console.log("Wrote benchmark-results.json");
