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
