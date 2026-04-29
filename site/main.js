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
  { type: "prompt", command: "npm run bench:public" },
  { type: "muted", text: "> node scripts/benchmark-public-repos.mjs" },
  { type: "info", text: "cloning sindresorhus/type-fest@v5.6.0" },
  { type: "ok", text: "verified commit a5491644b32160f804dd10d0b44dad461037f4c1" },
  { type: "muted", text: "installing dependencies and TypeScript preview packages" },
  { type: "section", text: "benchmark target: sindresorhus/type-fest" },
  { type: "cmd", text: "node --max-old-space-size=6144 .../tsc6 -p tsconfig.json --noEmit" },
  { type: "ok", text: "TypeScript 6 passed in 62039ms" },
  { type: "cmd", text: "node .../@typescript/native-preview/bin/tsgo.js -p tsconfig.json --noEmit" },
  { type: "ok", text: "TypeScript 7 preview passed in 40537ms" },
  { type: "metric", text: "observed delta: ~1.56x faster" },
  { type: "info", text: "cloning gvergnaud/ts-pattern@v5.9.0" },
  { type: "ok", text: "TypeScript 6 passed in 1669ms" },
  { type: "ok", text: "TypeScript 7 preview passed in 652ms" },
  { type: "metric", text: "observed delta: ~2.56x faster" },
  { type: "info", text: "cloning supermacro/neverthrow@v8.2.0" },
  { type: "warn", text: "TypeScript 6: moduleResolution=node10 and baseUrl are deprecated" },
  { type: "fail", text: "TypeScript 7: moduleResolution=node10 and baseUrl have been removed" },
  { type: "ok", text: "wrote benchmark-public-repos.json" },
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
    terminalOutput.textContent += `${plainTerminalLine(line)}\n`;
    return;
  }

  if (line.type === "prompt") {
    terminal.writeln(
      "\x1b[48;5;31m\x1b[38;5;15m juanchi \x1b[0m" +
        "\x1b[48;5;237m\x1b[38;5;15m \ue0b1 typescript7-demo \x1b[0m" +
        "\x1b[48;5;64m\x1b[38;5;15m \ue0a0 main \x1b[0m " +
        `\x1b[1;37m${line.command}\x1b[0m`,
    );
    return;
  }

  const color = {
    muted: "\x1b[90m",
    info: "\x1b[36m",
    ok: "\x1b[32m",
    section: "\x1b[1;35m",
    cmd: "\x1b[37m",
    metric: "\x1b[1;33m",
    warn: "\x1b[33m",
    fail: "\x1b[31m",
  }[line.type] ?? "\x1b[37m";

  const prefix = {
    info: "",
    ok: "✓",
    section: "◆",
    metric: "↳",
    warn: "⚠",
    fail: "✗",
  }[line.type] ?? " ";

  terminal.writeln(`${color}${prefix} ${line.text}\x1b[0m`);
}

function plainTerminalLine(line) {
  if (line.type === "prompt") {
    return `juanchi typescript7-demo main > ${line.command}`;
  }

  return line.text;
}

replayButton?.addEventListener("click", replayTerminal);
replayTerminal();
