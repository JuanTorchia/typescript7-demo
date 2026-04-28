import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const runs = Number.parseInt(process.env.RUNS ?? "2", 10);
const workspace = resolve(".tmp/public-repos");

const projects = [
  {
    id: "type-fest",
    repo: "sindresorhus/type-fest",
    url: "https://github.com/sindresorhus/type-fest.git",
    ref: "v5.6.0",
    expectedCommit: "a5491644b32160f804dd10d0b44dad461037f4c1",
    category: "heavy type-level programming",
    why: "Conditional, mapped, recursive, and template-literal types.",
    ts6: ["node", "--max-old-space-size=6144", "node_modules/@typescript/typescript6/bin/tsc6", "-p", "tsconfig.json", "--noEmit"],
    ts7: ["node", "node_modules/@typescript/native-preview/bin/tsgo.js", "-p", "tsconfig.json", "--noEmit"],
  },
  {
    id: "ts-pattern",
    repo: "gvergnaud/ts-pattern",
    url: "https://github.com/gvergnaud/ts-pattern.git",
    ref: "v5.9.0",
    expectedCommit: "0e15315eafbbb813a91bad34496418846981c1b1",
    category: "exhaustive pattern matching",
    why: "Deep inference, union narrowing, and exhaustive match types.",
    ts6: ["node", "node_modules/@typescript/typescript6/bin/tsc6", "--strict", "--noEmit"],
    ts7: ["node", "node_modules/@typescript/native-preview/bin/tsgo.js", "--strict", "--noEmit"],
  },
  {
    id: "neverthrow",
    repo: "supermacro/neverthrow",
    url: "https://github.com/supermacro/neverthrow.git",
    ref: "v8.2.0",
    expectedCommit: "1d4cc19ed2e6ba882e296385fe0175d642ec8c5d",
    category: "migration compatibility signal",
    why: "Shows removed/deprecated compiler options that matter during a TypeScript 7 migration.",
    allowFailure: true,
    ts6: ["node", "node_modules/@typescript/typescript6/bin/tsc6", "--noEmit"],
    ts7: ["node", "node_modules/@typescript/native-preview/bin/tsgo.js", "--noEmit"],
  },
];

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

function run(command, args, cwd) {
  const start = performance.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
    },
  });

  return {
    command: [command, ...args].join(" "),
    status: result.status ?? 1,
    durationMs: Math.round(performance.now() - start),
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
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

function prepareProject(project) {
  const directory = join(workspace, project.id);
  mkdirSync(workspace, { recursive: true });
  safeRemove(directory);

  exec("git", ["clone", "--depth", "1", "--branch", project.ref, project.url, directory], {
    stdio: "inherit",
  });

  const commit = exec("git", ["rev-parse", "HEAD"], { cwd: directory }).trim();

  if (commit !== project.expectedCommit) {
    throw new Error(`Unexpected commit for ${project.repo}: ${commit}`);
  }

  execNpm(["install", "--ignore-scripts"], { cwd: directory, stdio: "inherit" });
  execNpm([
    "install",
    "--ignore-scripts",
    "--no-save",
    "@typescript/typescript6@6.0.0",
    "@typescript/native-preview@beta",
  ], { cwd: directory, stdio: "inherit" });

  return { directory, commit };
}

function measure(label, argv, directory, allowFailure) {
  const samples = [];

  for (let index = 0; index < runs; index += 1) {
    const sample = run(argv[0], argv.slice(1), directory);

    if (sample.status !== 0 && !allowFailure) {
      throw new Error(`${label} failed:\n${sample.stdout}\n${sample.stderr}`);
    }

    samples.push(sample);
  }

  const successfulSamples = samples.filter((sample) => sample.status === 0);
  const averageMs = successfulSamples.length > 0
    ? Math.round(successfulSamples.reduce((sum, sample) => sum + sample.durationMs, 0) / successfulSamples.length)
    : null;

  return {
    label,
    command: samples[0]?.command ?? argv.join(" "),
    runs,
    status: samples.every((sample) => sample.status === 0) ? "passed" : "failed",
    averageMs,
    samples: samples.map((sample) => ({
      status: sample.status,
      durationMs: sample.durationMs,
      diagnosticExcerpt: sample.status === 0
        ? ""
        : `${sample.stdout}\n${sample.stderr}`.trim().split("\n").slice(0, 8).join("\n"),
    })),
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  note: "TypeScript 7 is a preview. Treat these as CI measurements and migration signals, not final compiler guarantees.",
  runs,
  projects: [],
};

for (const project of projects) {
  const prepared = prepareProject(project);
  const ts6 = measure(`${project.repo}: TypeScript 6`, project.ts6, prepared.directory, project.allowFailure);
  const ts7 = measure(`${project.repo}: TypeScript 7 native preview`, project.ts7, prepared.directory, project.allowFailure);

  report.projects.push({
    repo: project.repo,
    ref: project.ref,
    commit: prepared.commit,
    category: project.category,
    why: project.why,
    resultKind: project.allowFailure ? "migration-signal" : "benchmark",
    ts6,
    ts7,
    observedDelta: ts6.averageMs && ts7.averageMs
      ? Number((ts6.averageMs / ts7.averageMs).toFixed(2))
      : null,
  });
}

writeFileSync("benchmark-public-repos.json", `${JSON.stringify(report, null, 2)}\n`);
console.table(report.projects.map((project) => ({
  repo: project.repo,
  kind: project.resultKind,
  ts6: project.ts6.averageMs ?? project.ts6.status,
  ts7: project.ts7.averageMs ?? project.ts7.status,
  delta: project.observedDelta,
})));
console.log("Wrote benchmark-public-repos.json");
