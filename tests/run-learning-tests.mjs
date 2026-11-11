#!/usr/bin/env node
/** Offline learning regressions. No dotenv, Node type-strip flags, or live credentials. */
import { build } from "esbuild";
import ts from "typescript";
import { readFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tests = [
  ["learning-integrity", "moodle-learning-integrity.test.mjs"],
  ["moodle-driver-snapshot", "moodle-driver-snapshot.test.mjs"],
  ["moodle-load-recovery", "moodle-load-recovery.test.mjs"],
  ["learning-routes", "learning-routes.test.mjs"],
  ["portal-read", "portal-read.test.mjs"],
];
const requested = process.argv.slice(2);
const selected = requested.length
  ? tests.filter(([name, file]) => requested.some((value) => value === name || value === file || value === `tests/unit/${file}`))
  : tests;
if (requested.some((value) => !tests.some(([name, file]) => value === name || value === file || value === `tests/unit/${file}`))) {
  console.error(`Unknown learning test. Choose: ${tests.map(([name]) => name).join(", ")}`);
  process.exitCode = 1;
} else {
  // Keep output beneath the root node_modules so external Next/esbuild packages
  // resolve normally. A system /tmp directory would break Node package lookup.
  const cache = resolve(root, "node_modules/.cache/bd-learning-tests");
  await mkdir(cache, { recursive: true });
  const output = await mkdtemp(resolve(cache, "run-"));
  let failures = 0;
  try {
    for (const [name, file] of selected) {
      console.log(`\n[learning-tests] ${name}`);
      try {
        const entry = resolve(root, "tests/unit", file);
        const source = await readFile(entry, "utf8");
        // CJS cannot contain top-level await. Preserve static imports at module
        // scope and put test statements (including dynamic Moodle imports) in
        // an async function. Dynamic imports still evaluate AFTER fixture setup.
        const parsed = ts.createSourceFile(entry, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
        const imports = [];
        const statements = [];
        for (const statement of parsed.statements) {
          (ts.isImportDeclaration(statement) ? imports : statements).push(statement.getFullText(parsed));
        }
        const contents = `${imports.join("\n")}\n(async () => {\n${statements.join("\n")}\n})().catch((error) => { console.error(error); process.exitCode = 1; });\n`;
        const outfile = resolve(output, `${name}.cjs`);
        await build({
          stdin: { contents, resolveDir: dirname(entry), sourcefile: entry, loader: "js" },
          outfile,
          absWorkingDir: root,
          tsconfig: resolve(root, "tsconfig.json"),
          bundle: true,
          platform: "node",
          target: "node18",
          format: "cjs",
          packages: "external",
          sourcemap: "inline",
          logLevel: "silent",
        });
        // Explicit allowlist: do not inherit NODE_OPTIONS, NODE_PATH, dotenv
        // preload hooks, Supabase keys, Moodle tokens, or any other credentials.
        const env = {
          PATH: process.env.PATH ?? "/usr/bin:/bin",
          NODE_ENV: "test",
          TZ: "UTC",
          BD_LEARNING_REPO_ROOT: root,
          MOODLE_URL: "https://moodle.example.test",
          MOODLE_TOKEN: "test-only-placeholder",
          MOODLE_DRIVER_PROGRAMME_COURSE_ID: "101",
          MOODLE_ECO_DRIVER_COURSE_ID: "102",
          MOODLE_AUTOLOGIN_SECRET: "",
          BUNNY_CDN_HOSTNAME: "video.example.test",
        };
        const result = spawnSync(process.execPath, [outfile], {
          cwd: root,
          env,
          stdio: "inherit",
          timeout: 120000,
        });
        if (result.error || result.signal || result.status !== 0) {
          failures++;
          console.error(`[learning-tests] FAILED ${name}${result.error ? `: ${result.error.message}` : result.signal ? `: ${result.signal}` : ""}`);
        } else {
          console.log(`[learning-tests] PASS ${name}`);
        }
      } catch (error) {
        failures++;
        console.error(`[learning-tests] FAILED ${name}: ${error.message}`);
      }
    }
  } finally {
    await rm(output, { recursive: true, force: true });
  }
  console.log(`\n[learning-tests] ${selected.length - failures}/${selected.length} suites passed.`);
  if (failures) process.exitCode = 1;
}
