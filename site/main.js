for (const button of document.querySelectorAll("[data-copy-target]")) {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copyTarget);

    if (!target) {
      return;
    }

    await navigator.clipboard.writeText(target.textContent.trim());
    const previous = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1400);
  });
}

const workflowCode = document.getElementById("workflow-code");
const packageManager = document.getElementById("package-manager");
const typecheckPreset = document.getElementById("typecheck-preset");
const customTypecheck = document.getElementById("custom-typecheck");
const tsgoCommand = document.getElementById("tsgo-command");
const nodeVersion = document.getElementById("node-version");

const packageManagerConfig = {
  npm: {
    setup: `      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: NODE_VERSION
          cache: npm`,
    install: "npm ci",
    installPreview: "npm install --no-save @typescript/native-preview@beta",
  },
  pnpm: {
    setup: `      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: NODE_VERSION
          cache: pnpm`,
    install: "pnpm install --frozen-lockfile",
    installPreview: "pnpm add -D @typescript/native-preview@beta",
  },
  yarn: {
    setup: `      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: NODE_VERSION
          cache: yarn`,
    install: "yarn install --immutable",
    installPreview: "yarn add -D @typescript/native-preview@beta",
  },
  bun: {
    setup: `      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: NODE_VERSION`,
    install: "bun install --frozen-lockfile",
    installPreview: "bun add -d @typescript/native-preview@beta",
  },
};

function selectedTypecheckCommand() {
  if (typecheckPreset?.value === "custom") {
    return customTypecheck?.value.trim() || "npm run typecheck";
  }

  return typecheckPreset?.value || "npm run typecheck";
}

function updateWorkflow() {
  if (!workflowCode || !packageManager || !tsgoCommand || !nodeVersion) {
    return;
  }

  const manager = packageManager.value;
  const config = packageManagerConfig[manager] ?? packageManagerConfig.npm;
  const setup = config.setup.replaceAll("NODE_VERSION", nodeVersion.value.trim() || "24");
  const currentCommand = selectedTypecheckCommand();

  workflowCode.textContent = `name: TypeScript 7 Preview Check

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

${setup}

      - name: Install dependencies
        run: ${config.install}

      - name: Install TypeScript 7 native preview
        run: ${config.installPreview}

      - name: Current project check
        run: ${currentCommand}

      - name: TypeScript 7 native preview version
        run: npx tsgo --version

      - name: TypeScript 7 native preview check
        run: ${tsgoCommand.value}

      - name: Write summary
        if: always()
        run: |
          {
            echo "## TypeScript 7 Preview Check"
            echo ""
            echo "- Current command: ${currentCommand}"
            echo "- Preview command: ${tsgoCommand.value}"
            echo "- Package manager: ${manager}"
          } >> "$GITHUB_STEP_SUMMARY"`;
}

for (const control of [packageManager, typecheckPreset, customTypecheck, tsgoCommand, nodeVersion]) {
  control?.addEventListener("input", updateWorkflow);
  control?.addEventListener("change", updateWorkflow);
}

updateWorkflow();

const terminalOutput = document.getElementById("terminal-output");
const replayButton = document.querySelector("[data-terminal-replay]");
const terminalLines = [
  "$ npm run bench:public",
  "",
  "> node scripts/benchmark-public-repos.mjs",
  "Cloning sindresorhus/type-fest@v5.6.0...",
  "Verified commit a5491644b32160f804dd10d0b44dad461037f4c1",
  "Installing repository dependencies...",
  "Installing @typescript/typescript6@6.0.0 and @typescript/native-preview@beta...",
  "",
  "Benchmark target: sindresorhus/type-fest",
  "TypeScript 6 command:",
  "node --max-old-space-size=6144 node_modules/@typescript/typescript6/bin/tsc6 -p tsconfig.json --noEmit",
  "Result: passed in 62039ms",
  "",
  "TypeScript 7 native preview command:",
  "node node_modules/@typescript/native-preview/bin/tsgo.js -p tsconfig.json --noEmit",
  "Result: passed in 40537ms",
  "",
  "Observed delta: ~1.56x faster in this sample run",
  "",
  "Cloning gvergnaud/ts-pattern@v5.9.0...",
  "Result: TypeScript 6 passed in 1669ms",
  "Result: TypeScript 7 native preview passed in 652ms",
  "Observed delta: ~2.56x faster in this sample run",
  "",
  "Cloning supermacro/neverthrow@v8.2.0...",
  "TypeScript 6 migration signal: moduleResolution=node10 and baseUrl are deprecated",
  "TypeScript 7 migration signal: moduleResolution=node10 and baseUrl have been removed",
  "Wrote benchmark-public-repos.json",
];

let replayTimer;

function replayTerminal() {
  if (!terminalOutput) {
    return;
  }

  window.clearInterval(replayTimer);
  terminalOutput.textContent = "";

  let lineIndex = 0;
  replayTimer = window.setInterval(() => {
    terminalOutput.textContent += `${terminalLines[lineIndex]}\n`;
    lineIndex += 1;

    if (lineIndex >= terminalLines.length) {
      window.clearInterval(replayTimer);
    }
  }, 170);
}

replayButton?.addEventListener("click", replayTerminal);
replayTerminal();
