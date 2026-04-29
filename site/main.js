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

loadLatestResults();

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
  "→ cloning ts-essentials/ts-essentials@v9.4.2",
  "✓ verified ts-essentials/ts-essentials commit 8e625d9f554fe2607e5cf53706bdf23301643247",
  "→ installing ts-essentials/ts-essentials dependencies",
  "→ installing TypeScript 6 and TypeScript 7 preview",
  "→ measuring ts-essentials/ts-essentials: TypeScript 6",
  "→ measuring ts-essentials/ts-essentials: TypeScript 7 native preview",
  "→ cloning supermacro/neverthrow@v8.2.0",
  "✓ verified supermacro/neverthrow commit 1d4cc19ed2e6ba882e296385fe0175d642ec8c5d",
  "→ skipping supermacro/neverthrow dependencies; this is a config-only migration check",
  "→ installing TypeScript 6 and TypeScript 7 preview",
  "→ cloning millsp/ts-toolbelt@v9.5.1",
  "✓ verified millsp/ts-toolbelt commit 359e223c1a4a38345c989e3abe72257d41bda989",
  "→ skipping millsp/ts-toolbelt dependencies; this is a config-only migration check",
  "→ installing TypeScript 6 and TypeScript 7 preview",
  "Benchmark settings: 1 measured runs, 0 warmup run(s), speedup based on median.",
  "repo                            ts6MedianMs  ts7MedianMs  delta",
  "sindresorhus/type-fest          125026       76685        1.63",
  "gvergnaud/ts-pattern            5294         2795         1.89",
  "ts-essentials/ts-essentials     1369         1164         1.18",
  "migration signal: neverthrow and ts-toolbelt failed on deprecated/removed compiler options",
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

async function loadLatestResults() {
  const latestTable = document.getElementById("latest-results-table");
  const tuningTable = document.getElementById("tuning-results-table");
  const historyTable = document.getElementById("history-results-table");

  if (!latestTable && !tuningTable && !historyTable) {
    return;
  }

  try {
    const response = await fetch("./data/latest-results.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load latest-results.json: ${response.status}`);
    }

    const data = await response.json();
    renderLatestResults(latestTable, data);
    renderTuningResults(tuningTable, data);
    await renderHistoryResults(historyTable);
  } catch (error) {
    const message = `<span class="muted">${escapeHtml(error.message)}</span>`;

    if (latestTable) {
      latestTable.innerHTML = message;
    }

    if (tuningTable) {
      tuningTable.innerHTML = message;
    }

    if (historyTable) {
      historyTable.innerHTML = message;
    }
  }
}

function renderLatestResults(container, data) {
  if (!container) {
    return;
  }

  const syntheticRows = data.synthetic?.benchmarks?.map((item) => [
    item.id,
    item.category,
    `${item.ts6.medianMs}ms`,
    `${item.ts7.medianMs}ms`,
    `${item.observedDelta}x`,
  ]) ?? [];

  const publicRows = data.publicRepos?.benchmarks?.map((item) => [
    item.repo,
    item.category,
    `${item.ts6.medianMs}ms`,
    `${item.ts7.medianMs}ms`,
    `${item.observedDelta}x`,
  ]) ?? [];

  container.innerHTML = tableHtml(
    ["Target", "Category", "TS6", "TS7 preview", "Delta"],
    [...syntheticRows, ...publicRows].slice(0, 8),
  );
}

function renderTuningResults(container, data) {
  if (!container) {
    return;
  }

  const rows = data.tuning?.variants?.map((item) => [
    item.label,
    item.category,
    `${item.medianMs}ms`,
    `${item.minMs}ms`,
    `${item.averageMs}ms`,
    formatPeakRss(item.samples),
  ]) ?? [];

  container.innerHTML = tableHtml(["Variant", "Category", "Median", "Min", "Average", "Peak RSS"], rows);
}

async function renderHistoryResults(container) {
  if (!container) {
    return;
  }

  const response = await fetch("./data/history.json", { cache: "no-store" });

  if (!response.ok) {
    container.innerHTML = '<span class="muted">No published history yet.</span>';
    return;
  }

  const history = await response.json();
  const rows = history.runs?.slice(0, 6).map((run) => {
    const bestPublic = [...(run.publicRepos ?? [])].sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))[0];
    const bestSynthetic = [...(run.synthetic ?? [])].sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))[0];

    return [
      new Date(run.capturedAt).toLocaleDateString("en-US"),
      bestPublic ? `${bestPublic.repo}: ${bestPublic.delta}x` : "n/a",
      bestSynthetic ? `${bestSynthetic.id}: ${bestSynthetic.delta}x` : "n/a",
    ];
  }) ?? [];

  container.innerHTML = tableHtml(["Date", "Best public signal", "Best synthetic signal"], rows);
}

function tableHtml(headers, rows) {
  if (rows.length === 0) {
    return '<span class="muted">No benchmark data available yet.</span>';
  }

  return `<table>
    <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatPeakRss(samples) {
  const values = samples?.map((sample) => sample.peakRssKb).filter((value) => typeof value === "number") ?? [];
  return values.length > 0 ? `${Math.max(...values)} KB` : "not captured";
}
