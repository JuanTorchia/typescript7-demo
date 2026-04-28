import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const runs = Number.parseInt(process.env.RUNS ?? "3", 10);
const workspace = resolve(".tmp/public-repos");
const repoDirectory = join(workspace, "type-fest");
const expectedCommit = "a5491644b32160f804dd10d0b44dad461037f4c1";

function exec(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    cwd: options.cwd,
    env: {
      ...process.env,
      CI: "1",
    },
  });
}

function execNpm(args, options = {}) {
  if (process.env.npm_execpath) {
    exec(process.execPath, [process.env.npm_execpath, ...args], options);
    return;
  }

  exec(process.platform === "win32" ? "npm.cmd" : "npm", args, options);
}

function safeRemove(path) {
  const resolvedPath = resolve(path);
  const resolvedWorkspace = resolve(workspace);

  if (!resolvedPath.startsWith(resolvedWorkspace)) {
    throw new Error(`Refusing to remove path outside benchmark workspace: ${resolvedPath}`);
  }

  rmSync(resolvedPath, { recursive: true, force: true });
}

function prepareTypeFest() {
  mkdirSync(workspace, { recursive: true });
  safeRemove(repoDirectory);

  exec("git", [
    "clone",
    "--depth",
    "1",
    "--branch",
    "v5.6.0",
    "https://github.com/sindresorhus/type-fest.git",
    repoDirectory,
  ], { stdio: "inherit" });

  const commit = exec("git", ["rev-parse", "HEAD"], { cwd: repoDirectory }).trim();

  if (commit !== expectedCommit) {
    throw new Error(`Unexpected Type-Fest commit: ${commit}`);
  }

  execNpm(["install", "--ignore-scripts"], { cwd: repoDirectory, stdio: "inherit" });
  execNpm([
    "install",
    "--ignore-scripts",
    "--no-save",
    "@typescript/typescript6@6.0.0",
    "@typescript/native-preview@beta",
  ], { cwd: repoDirectory, stdio: "inherit" });

  return commit;
}

function time(label, command, args) {
  const samples = [];

  for (let index = 0; index < runs; index += 1) {
    const start = performance.now();
    exec(command, args, { cwd: repoDirectory });
    samples.push(Math.round(performance.now() - start));
  }

  const averageMs = Math.round(samples.reduce((sum, item) => sum + item, 0) / samples.length);

  return {
    label,
    command: [command, ...args].join(" "),
    runs,
    samplesMs: samples,
    averageMs,
  };
}

const commit = prepareTypeFest();
const results = {
  generatedAt: new Date().toISOString(),
  benchmark: {
    repo: "sindresorhus/type-fest",
    url: "https://github.com/sindresorhus/type-fest",
    ref: "v5.6.0",
    commit,
    note: "TypeScript 7 is a preview. Treat these as CI measurements, not final compiler guarantees.",
  },
  results: [
    time("Type-Fest repository: TypeScript 6", "node", [
      "--max-old-space-size=6144",
      "node_modules/@typescript/typescript6/bin/tsc6",
      "-p",
      "tsconfig.json",
      "--noEmit",
    ]),
    time("Type-Fest repository: TypeScript 7 native preview", "node", [
      "node_modules/@typescript/native-preview/bin/tsgo.js",
      "-p",
      "tsconfig.json",
      "--noEmit",
    ]),
  ],
};

writeFileSync("benchmark-public-repos.json", `${JSON.stringify(results, null, 2)}\n`);
console.table(results.results);
console.log("Wrote benchmark-public-repos.json");
