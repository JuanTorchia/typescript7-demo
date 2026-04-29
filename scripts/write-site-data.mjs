import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const inputs = [
  ["local", "benchmark-results.json"],
  ["synthetic", "benchmark-synthetic.json"],
  ["publicRepos", "benchmark-public-repos.json"],
  ["tuning", "benchmark-tuning.json"],
  ["migration", "migration-findings.json"],
];

const data = {
  generatedAt: new Date().toISOString(),
  source: "Repository benchmark and migration JSON files created from npm script outputs.",
};

for (const [key, file] of inputs) {
  data[key] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

mkdirSync(join("site", "data"), { recursive: true });
writeFileSync(join("site", "data", "latest-results.json"), `${JSON.stringify(data, null, 2)}\n`);
console.log("Wrote site/data/latest-results.json");
