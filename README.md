# TypeScript 7 PreviewBench

[![TypeScript 7 Fast Check](https://github.com/JuanTorchia/typescript7-demo/actions/workflows/typescript-7-open-source.yml/badge.svg)](https://github.com/JuanTorchia/typescript7-demo/actions/workflows/typescript-7-open-source.yml)
[![TypeScript 7 Full Benchmark](https://github.com/JuanTorchia/typescript7-demo/actions/workflows/typescript-7-full-benchmark.yml/badge.svg)](https://github.com/JuanTorchia/typescript7-demo/actions/workflows/typescript-7-full-benchmark.yml)

PreviewBench is a practical TypeScript 7 migration lab with commands that can be run locally or in GitHub Actions.

Important correction: the public TypeScript 7.0 beta is not installed as `typescript@beta`. Microsoft published it as `@typescript/native-preview@beta`, and the native compiler is executed with `tsgo`.

Official reference: <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/>

## Why TypeScript 7 Matters

TypeScript 7 is not a normal release. Microsoft moved the compiler to a native Go foundation, added parallel compiler work, and designed the beta to run side-by-side with TypeScript 6 during migration.

The parts worth testing early:

- Native compiler performance: Microsoft describes TypeScript 7 as often about `10x` faster than TypeScript 6.
- Parallel controls: `--checkers`, `--builders`, and `--singleThreaded` matter for large repos and CI sizing.
- Side-by-side validation: `tsgo` can be compared against `tsc6`.
- Editor direction: the same native foundation is expected to improve daily feedback loops, not only CI.
- Migration friction: deprecated TypeScript 6 flags become hard errors in TypeScript 7.

## Why Use This?

Use this repo as an upgrade readiness check before TypeScript 7 becomes an upgrade deadline:

- Find deprecated or removed compiler options early.
- Compare TypeScript 6 and TypeScript 7 native preview on real public repositories.
- Generate a private-repo-safe GitHub Actions workflow.
- Customize that workflow for `npm`, `pnpm`, `yarn`, or `bun`.
- Use real commands such as `npm run typecheck`, `tsc -b`, `turbo typecheck`, `vue-tsc`, or `next build`.
- Review concrete migration findings such as `moduleResolution=node10`, `baseUrl`, and `isolatedDeclarations`.
- Scan your own `tsconfig*.json` files before running expensive benchmarks.
- Compare TypeScript 7 preview tuning flags such as `--checkers`, `--builders`, and `--singleThreaded`.
- Generate a Markdown report that can be pasted into issues, RFCs, or upgrade notes.
- Track preview behavior over time while TypeScript 7 is still beta.
- Build evidence for whether faster type-checking matters in your codebase.

## What This Proves

- `typescript@6` provides the real JavaScript compiler, and `@typescript/typescript6` exposes the side-by-side `tsc6` binary.
- `tsgo` runs the TypeScript 7.0 native preview through `@typescript/native-preview`.
- The same local TypeScript project type-checks with both compilers.
- `isolatedDeclarations` catches public exports that need explicit annotations.
- An open-source type-heavy fixture based on `type-fest@5.6.0` type-checks with both compilers.
- A public-repository benchmark clones `sindresorhus/type-fest@v5.6.0`, `gvergnaud/ts-pattern@v5.9.0`, `ts-essentials/ts-essentials@v9.4.2`, `supermacro/neverthrow@v8.2.0`, and `millsp/ts-toolbelt@v9.5.1`, verifies expected commits, and compares both compilers against real repos or migration checks.
- A controlled synthetic benchmark generates inspectable stress corpora for template-literal types, many modules, and project references.
- A TypeScript 7 tuning benchmark compares preview flags on the same local project.
- A migration scanner reports local `tsconfig*.json` findings before teams spend time interpreting benchmark results.
- A site data exporter renders committed JSON results into the static web page.
- The benchmark script compares `tsc6 --noEmit` and `tsgo --noEmit` on both the local project and the Type-Fest fixture.
- The static site explains the safer model for private repositories: run the check in the user's own GitHub Actions environment.

## Why These Public Repos?

The repo includes [type-fest](https://github.com/sindresorhus/type-fest) as a pinned dev dependency and compiles `oss/type-fest-usage.ts` against it.

The public benchmark also clones pinned external repositories. That gives the demo more credibility than only using hand-written toy examples:

- Type-Fest is a known open-source package.
- It uses complex conditional, mapped, recursive, and template-literal types.
- ts-pattern adds exhaustive pattern matching and deep inference.
- ts-essentials adds another utility-type package with a production tsconfig.
- neverthrow and ts-toolbelt provide real migration signals from older config choices.
- Versions and commits are pinned, so results are reproducible.

## Install

```bash
npm install
```

## Static Site

The landing page lives in `site/` and can be hosted as static files.

```bash
npm run site:serve
```

The page is intentionally explicit about the beta status of TypeScript 7 and the private-repo security model:

- Open-source benchmarks can run in this repository's GitHub Actions workflow.
- Private repositories should run in the user's GitHub Actions environment.
- The generated workflow requires only `contents: read`.
- This project does not need to clone or execute private code on its own servers.

## Full Verification

```bash
npm run verify
```

This runs:

```bash
npm run typecheck:ts6
npm run typecheck:ts7
npm run typecheck:isolated
npm run typecheck:oss:ts6
npm run typecheck:oss:ts7
npm test
```

## Open-Source Fixture

```bash
npm run typecheck:oss:ts6
npm run typecheck:oss:ts7
```

The fixture lives in `oss/type-fest-usage.ts` and imports real types from `type-fest@5.6.0`.

## Local Benchmark

```bash
npm run bench
```

The result is written to `benchmark-results.json`.

By default, the script runs 5 samples per compiler. To increase the number of samples:

```bash
RUNS=10 npm run bench
```

On PowerShell:

```powershell
$env:RUNS=10; npm run bench
```

Benchmark results depend heavily on machine, OS, package manager cache, project size, and cold versus warm runs. Treat them as local measurements, not universal claims.

## Methodology

Read [docs/benchmark-methodology.md](docs/benchmark-methodology.md) before quoting numbers.

Short version:

- Compare results from the same machine and same run.
- Prefer medians over averages when multiple samples exist.
- Public repositories are pinned and verified by commit.
- Synthetic inputs are generated locally and can be inspected under `.tmp/synthetic-corpus`.
- TypeScript 7 is a preview, so results are migration signal rather than final compiler behavior.
- Weekly benchmark artifacts are useful for trend tracking while the preview changes.

## Migration Scanner

```bash
npm run scan:migration
```

This scans local `tsconfig*.json` files and writes `migration-findings.json`.

It currently checks for:

- removed or risky module resolution modes
- `baseUrl`
- `skipLibCheck`
- declaration emit without `isolatedDeclarations`
- project references that should be tested with builder tuning

## TypeScript 7 Tuning Matrix

```bash
npm run bench:tuning
```

This compares preview flags on the local project:

- `tsgo --noEmit`
- `tsgo --noEmit --checkers 1`
- `tsgo --noEmit --checkers 4`
- `tsgo --noEmit --singleThreaded`
- `tsgo -b tsconfig.json --builders 4 --dry`

On Linux runners, this script also records peak RSS with `/usr/bin/time -v`. On Windows, peak RSS is reported as unavailable instead of mixing incompatible measurement methods.

## Public Repository Benchmark

```bash
npm run bench:public
```

This clones real public repositories, checks their resolved commits, installs dependencies, and writes `benchmark-public-repos.json`.

Current matrix:

- `sindresorhus/type-fest@v5.6.0`: heavy type-level programming.
- `gvergnaud/ts-pattern@v5.9.0`: exhaustive pattern matching and deep inference.
- `ts-essentials/ts-essentials@v9.4.2`: utility type library production config.
- `supermacro/neverthrow@v8.2.0`: migration compatibility signal for deprecated or removed compiler options.
- `millsp/ts-toolbelt@v9.5.1`: legacy utility-type migration signal for removed compiler options.

It is intentionally separate from `npm run verify` because it performs network IO and takes longer than the local fixture checks.

A local smoke run on Windows with Node 24, `RUNS=1`, and `WARMUPS=0` measured:

- `sindresorhus/type-fest`: TypeScript 6 `125026ms`, TypeScript 7 native preview `76685ms`, roughly `1.63x` faster.
- `gvergnaud/ts-pattern`: TypeScript 6 `5294ms`, TypeScript 7 native preview `2795ms`, roughly `1.89x` faster.
- `ts-essentials/ts-essentials`: TypeScript 6 `1369ms`, TypeScript 7 native preview `1164ms`, roughly `1.18x` faster.
- `supermacro/neverthrow`: migration signal. TypeScript 6 reports deprecated options; TypeScript 7 reports those options as removed.
- `millsp/ts-toolbelt`: migration signal. TypeScript 6 reports deprecated options; TypeScript 7 reports removed options.

The matrix now includes additional public projects. Rerun `npm run bench:public` for current numbers because the project list and preview compiler version can change.

Treat those as sample numbers only. The GitHub Actions artifact is the reproducible benchmark output for the published repo.

## Controlled Synthetic Benchmark

```bash
npm run bench:synthetic
```

This generates TypeScript projects under `.tmp/synthetic-corpus` and writes `benchmark-synthetic.json`.

Current generated cases:

- `template-literal-stress`: template-literal routes, mapped types, and thousands of concrete route checks.
- `many-modules`: thousands of small TypeScript modules with a long import graph.
- `project-references`: a generated multi-package project-reference build graph.

A local smoke run on Windows with Node 24, `RUNS=1`, and `WARMUPS=0` measured:

- `template-literal-stress`: TypeScript 6 `44009ms`, TypeScript 7 native preview `17097ms`, roughly `2.57x` faster.
- `many-modules`: TypeScript 6 `3468ms`, TypeScript 7 native preview `858ms`, roughly `4.04x` faster.
- `project-references`: TypeScript 6 `1487ms`, TypeScript 7 native preview `622ms`, roughly `2.39x` faster.

These are not public ecosystem proof. They are controlled stress inputs that make the benchmark easier to inspect and repeat.

## GitHub Actions

This repo includes two workflows:

- `.github/workflows/typescript-7-open-source.yml`: fast push/PR verification.
- `.github/workflows/typescript-7-full-benchmark.yml`: manual and weekly full benchmark.

The fast workflow runs local project checks, the Type-Fest fixture, the migration scanner, and a local benchmark.

The full workflow runs:

- local benchmark
- TypeScript 7 tuning matrix
- controlled synthetic benchmark
- public repository benchmark
- migration scanner
- Markdown report generator
- static site data exporter

The full workflow uploads raw JSON plus `benchmark-report.md` as artifacts.

The full workflow is also scheduled weekly. It does not commit back to the repository; publish a new static history snapshot manually when you want the site to show a new run.

## Markdown Report

```bash
npm run bench:full
npm run report
```

The report generator writes `benchmark-report.md` from the JSON outputs.

## Static Site Data

```bash
npm run site:data
```

This writes `site/data/latest-results.json`, which the static site reads to render the latest committed result tables.

To append the current site data to the published history:

```bash
npm run history:update
```

## Relevant Files

- `src/helpers/paginated.ts`: generic helper with explicit exported types.
- `src/helpers/events.ts`: discriminated-union narrowing.
- `src/helpers/object-keys.ts`: stricter `Object.keys` typing that TypeScript 7 catches.
- `src/integration/anthropic-like.ts`: realistic async result union.
- `oss/type-fest-usage.ts`: open-source type-heavy fixture using Type-Fest.
- `scripts/generate-synthetic-corpus.mjs`: generated benchmark corpus for controlled stress tests.
- `scripts/benchmark-synthetic.mjs`: TypeScript 6 versus TypeScript 7 benchmark runner for the generated corpus.
- `scripts/benchmark-tuning.mjs`: TypeScript 7 preview tuning matrix.
- `scripts/scan-migration.mjs`: local `tsconfig*.json` migration scanner.
- `scripts/generate-report.mjs`: Markdown report generator.
- `scripts/write-site-data.mjs`: static site data snapshot generator.
- `docs/benchmark-methodology.md`: benchmark methodology and caveats.
- `fixtures/isolated-declarations/bad-export.ts`: intentionally failing fixture for `isolatedDeclarations`.
- `test/tooling.test.mjs`: Node test suite that validates the real toolchain.

## Manual Commands

```bash
npx tsc6 --version
npx tsgo --version
npx tsc6 --noEmit
npx tsgo --noEmit
npx tsgo -p fixtures/isolated-declarations/tsconfig.json --noEmit
```

## Blog Post Patch

If you link this repo from the article, update the installation block:

```diff
- npm install typescript@beta --save-dev
- npx tsc --version
+ npm install -D @typescript/native-preview@beta
+ npx tsgo --version
```

Also avoid claiming that every new error comes from TypeScript 7 unless the repo has a fixture that reproduces it. This repository separates what is proven from what is narrative context.
