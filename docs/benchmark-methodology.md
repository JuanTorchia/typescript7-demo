# Benchmark Methodology

This repo is a TypeScript 7 preview lab. It is designed to produce useful migration and performance signals, not universal benchmark claims.

## What Is Measured

- Local fixture checks compare this repository with TypeScript 6 and the TypeScript 7 native preview.
- Public repository checks clone pinned open-source repos, verify commits, install dependencies, and run the same compiler command shape with both compilers.
- Synthetic checks generate inspectable TypeScript projects under `.tmp/synthetic-corpus` and benchmark them with both compilers.
- Tuning checks run TypeScript 7 preview with flags such as `--checkers`, `--singleThreaded`, and `--builders`.
- Migration checks scan `tsconfig*.json` files for settings that are likely to matter during a TypeScript 7 migration.

## How To Read Results

- Prefer medians when a report includes multiple samples.
- Treat single-run smoke results as sanity checks only.
- Compare results produced on the same machine and same run.
- Use raw JSON artifacts when quoting numbers.
- Treat TypeScript 7 preview behavior as unstable until the final compiler release.

## What Is Not Measured

- Editor latency is not measured directly.
- Runtime JavaScript performance is not measured.
- Bundler performance is only measured if a generated workflow is configured to run a bundler command such as `next build`.
- Private repositories are not cloned by this project. Private checks should run inside the user's own GitHub Actions environment.

## Reproducibility Controls

- Public repos use pinned refs and expected commit hashes.
- Install commands disable audit, funding output, and lifecycle scripts where practical.
- Benchmark outputs include command text, sample counts, warmup counts, statuses, and diagnostics excerpts.
- Generated outputs are written as JSON first, then optional Markdown/site summaries are derived from those JSON files.
