import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { loadTs } from "./load-typescript.mjs";

const { questions } = loadTs("lib/curriculum");
const facts = loadTs("lib/curriculum-facts");

/**
 * `lib/curriculum-facts.ts` restates numbers that user interface code needs, so that no
 * client component has to import the curriculum — which would bundle every answer into
 * the browser. Restating them only works if they stay true, which is what this checks.
 */
test("the restated activity count still matches the real curriculum", () => {
  assert.equal(
    facts.activityCount,
    questions.length,
    "lib/curriculum-facts.ts is stale. Update activityCount to the new total.",
  );
});

/**
 * The leak this guards against was introduced by an ordinary-looking one-line import.
 * Catching it at the source is cheaper than catching it in a built bundle, so this
 * fails before anyone has to run a build.
 */
test("no client component imports the curriculum module", () => {
  const offenders = [];
  for (const dir of ["components", "app", "hooks"]) {
    for (const name of readdirSync(dir, { recursive: true })) {
      const file = `${dir}/${String(name).replaceAll("\\", "/")}`;
      if (!/\.(tsx|ts)$/.test(file)) continue;
      // Route handlers and server components run on the server, where the answer key
      // belongs. Only files that declare themselves client-side are a problem.
      const source = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/m.test(source)) continue;
      // A type-only import is erased at compile time and never reaches the bundle.
      if (/import\s+(?!type\b)[^;]*from\s+["']@\/lib\/curriculum["']/.test(source)) {
        offenders.push(file);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "These client files import @/lib/curriculum, which ships every answer to the browser. " +
      "Use @/lib/curriculum-facts, or move the work to the server.",
  );
});
