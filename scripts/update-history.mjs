import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const latestPath = join("site", "data", "latest-results.json");
const historyPath = join("site", "data", "history.json");

if (!existsSync(latestPath)) {
  throw new Error("Missing site/data/latest-results.json. Run npm run site:data first.");
}

const latest = JSON.parse(readFileSync(latestPath, "utf8"));
const history = existsSync(historyPath)
  ? JSON.parse(readFileSync(historyPath, "utf8"))
  : { updatedAt: null, runs: [] };

const snapshot = {
  capturedAt: new Date().toISOString(),
  sourceGeneratedAt: latest.generatedAt,
  typescript7Version: latest.local?.find?.((item) => item.label?.includes("TypeScript 7"))?.label ?? "TypeScript 7 native preview",
  synthetic: latest.synthetic?.benchmarks?.map((item) => ({
    id: item.id,
    delta: item.observedDelta,
    ts6MedianMs: item.ts6.medianMs,
    ts7MedianMs: item.ts7.medianMs,
  })) ?? [],
  publicRepos: latest.publicRepos?.benchmarks?.map((item) => ({
    repo: item.repo,
    ref: item.ref,
    delta: item.observedDelta,
    ts6MedianMs: item.ts6.medianMs,
    ts7MedianMs: item.ts7.medianMs,
  })) ?? [],
};

history.updatedAt = snapshot.capturedAt;
history.runs = [
  snapshot,
  ...history.runs.filter((run) => run.sourceGeneratedAt !== snapshot.sourceGeneratedAt),
].slice(0, 20);

mkdirSync(join("site", "data"), { recursive: true });
writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
console.log("Wrote site/data/history.json");
