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
  "PS C:\\Users\\jstor\\develop\\typescript7-demo> $env:RUNS=1; $env:WARMUPS=0; npm run bench:public",
  "",
  "> typescript7-demo@1.0.0 bench:public",
  "> node scripts/benchmark-public-repos.mjs",
  "",
  "→ cloning sindresorhus/type-fest@v5.6.0",
  "✓ verified sindresorhus/type-fest commit a5491644b32160f804dd10d0b44dad461037f4c1",
  "→ installing sindresorhus/type-fest dependencies",
  "→ installing TypeScript 6 and TypeScript 7 preview",
  "→ warming sindresorhus/type-fest: TypeScript 6",
  "→ measuring sindresorhus/type-fest: TypeScript 6",
  "→ warming sindresorhus/type-fest: TypeScript 7 native preview",
  "→ measuring sindresorhus/type-fest: TypeScript 7 native preview",
  "→ cloning gvergnaud/ts-pattern@v5.9.0",
  "✓ verified gvergnaud/ts-pattern commit 0e15315eafbbb813a91bad34496418846981c1b1",
  "→ installing gvergnaud/ts-pattern dependencies",
  "→ installing TypeScript 6 and TypeScript 7 preview",
  "→ measuring gvergnaud/ts-pattern: TypeScript 6",
  "→ measuring gvergnaud/ts-pattern: TypeScript 7 native preview",
  "→ cloning supermacro/neverthrow@v8.2.0",
  "✓ verified supermacro/neverthrow commit 1d4cc19ed2e6ba882e296385fe0175d642ec8c5d",
  "→ installing supermacro/neverthrow dependencies",
  "→ installing TypeScript 6 and TypeScript 7 preview",
  "Benchmark settings: 1 measured runs, 0 warmup run(s), speedup based on median.",
  "┌─────────┬──────────────────────────┬─────────────┬─────────────┬──────────┬──────────┬───────┐",
  "│ (index) │ repo                     │ ts6MedianMs │ ts7MedianMs │ ts6MinMs │ ts7MinMs │ delta │",
  "├─────────┼──────────────────────────┼─────────────┼─────────────┼──────────┼──────────┼───────┤",
  "│ 0       │ 'sindresorhus/type-fest' │ 73994       │ 45461       │ 73994    │ 45461    │ 1.63  │",
  "│ 1       │ 'gvergnaud/ts-pattern'   │ 2474        │ 685         │ 2474     │ 685      │ 3.61  │",
  "└─────────┴──────────────────────────┴─────────────┴─────────────┴──────────┴──────────┴───────┘",
  "migration signal: supermacro/neverthrow failed on deprecated/removed compiler options",
  "Wrote benchmark-public-repos.json",
  "",
  "TS5107: moduleResolution=node10 is deprecated in TypeScript 6",
  "TS5108: moduleResolution=node10 has been removed in TypeScript 7",
  "TS5101/TS5102: baseUrl migration required",
];

let replayTimer;
let terminal;

function replayTerminal() {
  if (!terminalOutput) {
    return;
  }

  window.clearInterval(replayTimer);
  ensureTerminal();

  if (terminal) {
    terminal.reset();
  } else {
    terminalOutput.textContent = "";
  }

  let lineIndex = 0;
  writeTerminalLine(terminalLines[lineIndex]);
  lineIndex += 1;

  replayTimer = window.setInterval(() => {
    writeTerminalLine(terminalLines[lineIndex]);
    lineIndex += 1;

    if (lineIndex >= terminalLines.length) {
      window.clearInterval(replayTimer);
    }
  }, 170);
}

function ensureTerminal() {
  if (terminal || !window.Terminal || !terminalOutput) {
    return;
  }

  terminal = new window.Terminal({
    cols: 96,
    rows: 22,
    cursorBlink: true,
    fontFamily: '"Cascadia Code", "JetBrains Mono", Consolas, monospace',
    fontSize: window.matchMedia("(max-width: 820px)").matches ? 10 : 13,
    lineHeight: 1.18,
    theme: {
      background: "#050505",
      foreground: "#f7f7f7",
      cursor: "#7ee787",
      black: "#050505",
      red: "#ff5f57",
      green: "#7ee787",
      yellow: "#f7cc4b",
      blue: "#61afef",
      magenta: "#c678dd",
      cyan: "#56b6c2",
      white: "#f7f7f7",
      brightBlack: "#6b7280",
      brightRed: "#ff6b6b",
      brightGreen: "#9be9a8",
      brightYellow: "#ffd866",
      brightBlue: "#79c0ff",
      brightMagenta: "#d2a8ff",
      brightCyan: "#8be9fd",
      brightWhite: "#ffffff",
    },
  });
  terminal.open(terminalOutput);
}

function writeTerminalLine(line) {
  if (!terminal) {
    terminalOutput.textContent += `${line}\n`;
    return;
  }

  terminal.writeln(`${terminalColor(line)}${line}\x1b[0m`);
}

function terminalColor(line) {
  if (line.startsWith(" juanchi")) {
    return "\x1b[1;37m";
  }

  if (line.startsWith("PS ")) {
    return "\x1b[1;37m";
  }

  if (line.startsWith("") || line.startsWith("→")) {
    return "\x1b[36m";
  }

  if (line.startsWith("✓")) {
    return "\x1b[32m";
  }

  if (line.startsWith("◆")) {
    return "\x1b[1;35m";
  }

  if (line.startsWith("↳")) {
    return "\x1b[1;33m";
  }

  if (line.startsWith("⚠")) {
    return "\x1b[33m";
  }

  if (line.startsWith("✗")) {
    return "\x1b[31m";
  }

  if (line.startsWith("TS510")) {
    return "\x1b[33m";
  }

  if (line.includes("vulnerabilities")) {
    return "\x1b[33m";
  }

  if (line.includes("found 0 vulnerabilities") || line.startsWith("Wrote ")) {
    return "\x1b[32m";
  }

  return "\x1b[90m";
}

replayButton?.addEventListener("click", replayTerminal);
replayTerminal();
