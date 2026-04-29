import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(".tmp/synthetic-corpus");

safeRemove(root);
mkdirSync(root, { recursive: true });

generateTemplateLiteralStress();
generateManyModulesStress();
generateProjectReferencesStress();

console.log(`Generated synthetic corpus at ${root}`);

function generateTemplateLiteralStress() {
  const directory = join(root, "template-literal-stress");
  mkdirSync(join(directory, "src"), { recursive: true });
  writeJson(join(directory, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2024",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["src/**/*.ts"],
  });

  const entityCount = 360;
  const fields = ["id", "slug", "title", "body", "createdAt", "updatedAt", "status", "ownerId"];
  const entities = Array.from({ length: entityCount }, (_, index) => `Entity${index}`);

  const lines = [
    `type Entity = ${entities.map((entity) => `"${entity}"`).join(" | ")};`,
    `type Field = ${fields.map((field) => `"${field}"`).join(" | ")};`,
    'type Operation = "get" | "set" | "list" | "delete" | "publish" | "archive";',
    "type Route = `/${Lowercase<Entity>}/${Operation}/${Field}`;",
    "type EventName = `${Entity}.${Operation}.${Field}`;",
    "type Payload<T extends Entity, F extends Field> = { entity: T; field: F; value: `${T}:${F}:${number}` };",
    "type ApiMap = { [T in Entity as Lowercase<T>]: { [F in Field]: Payload<T, F> } };",
    "type RouteHandlers = { [R in Route]: (input: { route: R; event: EventName }) => Promise<ApiMap[keyof ApiMap]> };",
    "declare const handlers: RouteHandlers;",
  ];

  for (let index = 0; index < 3200; index += 1) {
    const entity = entities[index % entities.length].toLowerCase();
    const field = fields[index % fields.length];
    lines.push(`export const route_${index}: Route = "/${entity}/get/${field}";`);
    lines.push(`export const handler_${index} = handlers[route_${index}];`);
  }

  writeFileSync(join(directory, "src/index.ts"), `${lines.join("\n")}\n`);
}

function generateManyModulesStress() {
  const directory = join(root, "many-modules");
  const src = join(directory, "src");
  mkdirSync(src, { recursive: true });
  writeJson(join(directory, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2024",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    include: ["src/**/*.ts"],
  });

  const fileCount = 2600;

  for (let index = 0; index < fileCount; index += 1) {
    const previousImport = index === 0 ? "" : `import type { Model${index - 1} } from "./module-${index - 1}.js";\n`;
    const previousField = index === 0 ? "seed: string;" : `previous: Model${index - 1};`;
    writeFileSync(
      join(src, `module-${index}.ts`),
      `${previousImport}export type Model${index}<T extends string = "m${index}"> = {
  id: T;
  index: ${index};
  ${previousField}
  tags: readonly [T, Uppercase<T>, Lowercase<T>];
};

export function make${index}<T extends string>(id: T, previous: ${index === 0 ? "string" : `Model${index - 1}`}): Model${index}<T> {
  return {
    id,
    index: ${index},
    ${index === 0 ? "seed: previous" : "previous"},
    tags: [id, id.toUpperCase() as Uppercase<T>, id.toLowerCase() as Lowercase<T>],
  };
}
`,
    );
  }

  writeFileSync(
    join(src, "index.ts"),
    Array.from({ length: fileCount }, (_, index) => `export type { Model${index} } from "./module-${index}.js";`).join("\n") + "\n",
  );
}

function generateProjectReferencesStress() {
  const directory = join(root, "project-references");
  const packageCount = 48;
  mkdirSync(directory, { recursive: true });
  writeJson(join(directory, "tsconfig.json"), {
    files: [],
    references: Array.from({ length: packageCount }, (_, index) => ({ path: `./packages/pkg-${index}` })),
  });

  for (let index = 0; index < packageCount; index += 1) {
    const pkg = join(directory, "packages", `pkg-${index}`);
    mkdirSync(join(pkg, "src"), { recursive: true });
    writeJson(join(pkg, "tsconfig.json"), {
      compilerOptions: {
        composite: true,
        declaration: true,
        declarationMap: false,
        target: "ES2024",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        skipLibCheck: true,
        rootDir: "src",
        outDir: "dist",
      },
      include: ["src/**/*.ts"],
      references: index === 0 ? [] : [{ path: `../pkg-${index - 1}` }],
    });

    const imports = index === 0 ? "" : `import type { Package${index - 1}Model } from "../../pkg-${index - 1}/src/index.js";\n`;
    const previous = index === 0 ? "seed: string;" : `previous: Package${index - 1}Model;`;
    writeFileSync(
      join(pkg, "src/index.ts"),
      `${imports}export type Package${index}Model = {
  packageName: "pkg-${index}";
  ${previous}
  routes: {
${Array.from({ length: 128 }, (_, route) => `    "route-${route}": "/pkg-${index}/route-${route}";`).join("\n")}
  };
};

export const packageName = "pkg-${index}" as const;
`,
    );
  }
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function safeRemove(path) {
  const resolved = resolve(path);
  const allowed = resolve(".tmp");

  if (!resolved.startsWith(allowed)) {
    throw new Error(`Refusing to remove path outside .tmp: ${resolved}`);
  }

  rmSync(resolved, { recursive: true, force: true });
}
