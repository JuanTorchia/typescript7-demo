import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const runs = Number.parseInt(process.env.RUNS ?? "5", 10);
const warmups = Number.parseInt(process.env.WARMUPS ?? "1", 10);
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
    id: "ts-essentials",
    repo: "ts-essentials/ts-essentials",
    url: "https://github.com/ts-essentials/ts-essentials.git",
    ref: "v9.4.2",
    expectedCommit: "8e625d9f554fe2607e5cf53706bdf23301643247",
    category: "utility type library",
    why: "A focused utility-types package with production and test configurations.",
    ts6: ["node", "node_modules/@typescript/typescript6/bin/tsc6", "-p", "tsconfig.prod.json", "--noEmit"],
    ts7: ["node", "node_modules/@typescript/native-preview/bin/tsgo.js", "-p", "tsconfig.prod.json", "--noEmit"],
  },
  {
    id: "neverthrow",
    repo: "supermacro/neverthrow",
    url: "https://github.com/supermacro/neverthrow.git",
    ref: "v8.2.0",
    expectedCommit: "1d4cc19ed2e6ba882e296385fe0175d642ec8c5d",
    category: "migration compatibility signal",
    why: "Shows removed/deprecated compiler options that matter during a TypeScript 7 migration.",
    mode: "migration",
    skipProjectInstall: true,
    ts6: ["node", "node_modules/@typescript/typescript6/bin/tsc6", "--noEmit"],
    ts7: ["node", "node_modules/@typescript/native-preview/bin/tsgo.js", "--noEmit"],
  },
  {
    id: "ts-toolbelt",
    repo: "millsp/ts-toolbelt",
    url: "https://github.com/millsp/ts-toolbelt.git",
    ref: "v9.5.1",
    expectedCommit: "359e223c1a4a38345c989e3abe72257d41bda989",
    category: "legacy type-level migration signal",
    why: "Surfaces older tsconfig options that matter for utility-type libraries.",
    mode: "migration",
    skipProjectInstall: true,
    ts6: ["node", "node_modules/@typescript/typescript6/bin/tsc6", "-p", "tsconfig.json", "--noEmit"],
    ts7: ["node", "node_modules/@typescript/native-preview/bin/tsgo.js", "-p", "tsconfig.json", "--noEmit"],
  },
];

function exec(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: options.stdio ?? "pipe",
      cwd: options.cwd,
      env: {
        ...process.env,
        CI: "1",
        NO_COLOR: "1",
        FORCE_COLOR: "0",
      },
    });
  } catch (error) {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`.trim();
    throw new Error(output || error.message);
  }
}

function run(command, args, cwd) {
  const start = performance.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "1",
      NO_COLOR: "1",
      FORCE_COLOR: "0",
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

  console.log(`→ cloning ${project.repo}@${project.ref}`);
  exec("git", ["clone", "--depth", "1", "--branch", project.ref, project.url, directory], {
    stdio: "pipe",
  });

  const commit = exec("git", ["rev-parse", "HEAD"], { cwd: directory }).trim();

  if (commit !== project.expectedCommit) {
    throw new Error(`Unexpected commit for ${project.repo}: ${commit}`);
  }

  console.log(`✓ verified ${project.repo} commit ${commit}`);
  if (!project.skipProjectInstall) {
    console.log(`→ installing ${project.repo} dependencies`);
    execNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", "--loglevel", "error", "--legacy-peer-deps"], { cwd: directory });
  } else {
    console.log(`→ skipping ${project.repo} dependencies; this is a config-only migration check`);
  }

  console.log(`→ installing TypeScript 6 and TypeScript 7 preview`);
  execNpm([
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--loglevel",
    "error",
    "--legacy-peer-deps",
    "--no-save",
    "typescript@6.0.3",
    "@typescript/typescript6@6.0.1",
    "@typescript/native-preview@beta",
  ], { cwd: directory });

  return { directory, commit };
}

function measure(label, argv, directory, allowFailure) {
  const samples = [];

  console.log(`→ warming ${label}`);
  for (let index = 0; index < warmups; index += 1) {
    const warmup = run(argv[0], argv.slice(1), directory);

    if (warmup.status !== 0 && !allowFailure) {
      throw new Error(`${label} warmup failed:\n${warmup.stdout}\n${warmup.stderr}`);
    }
  }

  console.log(`→ measuring ${label}`);
  for (let index = 0; index < runs; index += 1) {
    const sample = run(argv[0], argv.slice(1), directory);

    if (sample.status !== 0 && !allowFailure) {
      throw new Error(`${label} failed:\n${sample.stdout}\n${sample.stderr}`);
    }

    samples.push(sample);
  }

  const successfulSamples = samples.filter((sample) => sample.status === 0);
  const durations = successfulSamples.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const averageMs = durations.length > 0
    ? Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length)
    : null;
  const medianMs = median(durations);
  const minMs = durations[0] ?? null;

  return {
    label,
    command: samples[0]?.command ?? argv.join(" "),
    runs,
    warmups,
    status: samples.every((sample) => sample.status === 0) ? "passed" : "failed",
    averageMs,
    medianMs,
    minMs,
    samples: samples.map((sample) => ({
      status: sample.status,
      durationMs: sample.durationMs,
      diagnosticExcerpt: sample.status === 0
        ? ""
        : stripAnsi(`${sample.stdout}\n${sample.stderr}`).trim().split("\n").slice(0, 8).join("\n"),
    })),
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  note: "TypeScript 7 is a preview. Treat these as CI measurements and migration signals, not final compiler guarantees.",
  runs,
  warmups,
  benchmarks: [],
  migrationChecks: [],
};

for (const project of projects) {
  const prepared = prepareProject(project);
  const allowFailure = project.mode === "migration";
  const ts6 = measure(`${project.repo}: TypeScript 6`, project.ts6, prepared.directory, allowFailure);
  const ts7 = measure(`${project.repo}: TypeScript 7 native preview`, project.ts7, prepared.directory, allowFailure);

  const result = {
    repo: project.repo,
    ref: project.ref,
    commit: prepared.commit,
    category: project.category,
    why: project.why,
    resultKind: project.mode === "migration" ? "migration-signal" : "benchmark",
    ts6,
    ts7,
    observedDelta: ts6.medianMs && ts7.medianMs
      ? Number((ts6.medianMs / ts7.medianMs).toFixed(2))
      : null,
  };

  if (project.mode === "migration") {
    report.migrationChecks.push(result);
  } else {
    report.benchmarks.push(result);
  }
}

writeFileSync("benchmark-public-repos.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(`Benchmark settings: ${runs} measured runs, ${warmups} warmup run(s), speedup based on median.`);
console.table(report.benchmarks.map((project) => ({
  repo: project.repo,
  ts6MedianMs: project.ts6.medianMs,
  ts7MedianMs: project.ts7.medianMs,
  ts6MinMs: project.ts6.minMs,
  ts7MinMs: project.ts7.minMs,
  delta: project.observedDelta,
})));
console.table(report.migrationChecks.map((project) => ({
  repo: project.repo,
  kind: project.resultKind,
  ts6: project.ts6.status,
  ts7: project.ts7.status,
  ts6Diagnostic: project.ts6.samples.find((sample) => sample.diagnosticExcerpt)?.diagnosticExcerpt.split("\n")[0] ?? "",
  ts7Diagnostic: project.ts7.samples.find((sample) => sample.diagnosticExcerpt)?.diagnosticExcerpt.split("\n")[0] ?? "",
})));
console.log("Wrote benchmark-public-repos.json");

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const middle = Math.floor(values.length / 2);

  if (values.length % 2 === 1) {
    return values[middle];
  }

  return Math.round((values[middle - 1] + values[middle]) / 2);
}

function stripAnsi(value) {
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}
