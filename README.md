# TypeScript 7.0 Beta: Reproducible Repo

This repository backs a blog post about the TypeScript 7.0 beta with commands that can be run locally.

Important correction: the public TypeScript 7.0 beta is not installed as `typescript@beta`. Microsoft published it as `@typescript/native-preview@beta`, and the native compiler is executed with `tsgo`.

Official reference: <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/>

## What This Proves

- `tsc6` runs TypeScript 6 through `typescript: npm:@typescript/typescript6`.
- `tsgo` runs the TypeScript 7.0 native preview through `@typescript/native-preview`.
- The same local TypeScript project type-checks with both compilers.
- `isolatedDeclarations` catches public exports that need explicit annotations.
- An open-source type-heavy fixture based on `type-fest@5.6.0` type-checks with both compilers.
- A public-repository benchmark clones `sindresorhus/type-fest@v5.6.0`, verifies the expected commit, and compares both compilers against the real repo.
- The benchmark script compares `tsc6 --noEmit` and `tsgo --noEmit` on both the local project and the Type-Fest fixture.
- The static site explains the safer model for private repositories: run the check in the user's own GitHub Actions environment.

## Why Type-Fest?

The repo includes [type-fest](https://github.com/sindresorhus/type-fest) as a pinned dev dependency and compiles `oss/type-fest-usage.ts` against it.

That gives the demo more credibility than only using hand-written toy examples:

- Type-Fest is a known open-source package.
- It uses complex conditional, mapped, recursive, and template-literal types.
- The version is pinned in `package-lock.json`, so results are reproducible.

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

## Public Repository Benchmark

```bash
npm run bench:public
```

This clones the real public repository `sindresorhus/type-fest` at tag `v5.6.0`, checks that the resolved commit is `a5491644b32160f804dd10d0b44dad461037f4c1`, installs dependencies, and writes `benchmark-public-repos.json`.

It is intentionally separate from `npm run verify` because it performs network IO and takes longer than the local fixture checks.

A local smoke run on Windows with Node 24 and `RUNS=1` measured:

- TypeScript 6: `62039ms`
- TypeScript 7 native preview: `27241ms`
- Observed delta: roughly `2.3x` faster

Treat those as sample numbers only. The GitHub Actions artifact is the reproducible benchmark output for the published repo.

## GitHub Actions

This repo includes `.github/workflows/typescript-7-open-source.yml`.

It runs the local project and the Type-Fest fixture against:

- TypeScript 6 through `tsc6`
- TypeScript 7 native preview through `tsgo`

It also uploads `benchmark-results.json` as a workflow artifact.

The workflow also runs the public repository benchmark and uploads `benchmark-public-repos.json`.

## Relevant Files

- `src/helpers/paginated.ts`: generic helper with explicit exported types.
- `src/helpers/events.ts`: discriminated-union narrowing.
- `src/helpers/object-keys.ts`: stricter `Object.keys` typing that TypeScript 7 catches.
- `src/integration/anthropic-like.ts`: realistic async result union.
- `oss/type-fest-usage.ts`: open-source type-heavy fixture using Type-Fest.
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
