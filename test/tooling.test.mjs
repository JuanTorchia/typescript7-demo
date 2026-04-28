import { execSync } from "node:child_process";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function run(command) {
  return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

describe("TypeScript 7 native preview", () => {
  it("uses tsgo from @typescript/native-preview", () => {
    const version = run("node node_modules/@typescript/native-preview/bin/tsgo.js --version").trim();

    assert.match(version, /^Version 7\.0\.0/);
  });

  it("keeps the same project compiling with TypeScript 6 and TypeScript 7", () => {
    assert.doesNotThrow(() => run("npm run -s typecheck:ts6"));
    assert.doesNotThrow(() => run("npm run -s typecheck:ts7"));
  });

  it("type-checks an open-source Type-Fest fixture with both compilers", () => {
    assert.doesNotThrow(() => run("npm run -s typecheck:oss:ts6"));
    assert.doesNotThrow(() => run("npm run -s typecheck:oss:ts7"));
  });

  it("enforces isolatedDeclarations on exported functions", () => {
    let output = "";
    let status = 0;

    try {
      run(
        "node node_modules/@typescript/native-preview/bin/tsgo.js -p fixtures/isolated-declarations/tsconfig.json --noEmit",
      );
    } catch (error) {
      status = error.status ?? 1;
      output = `${error.stdout ?? ""}\n${error.stderr ?? ""}`;
    }

    assert.notEqual(status, 0);
    assert.match(output, /isolatedDeclarations|explicit/i);
  });
});
