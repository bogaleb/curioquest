/**
 * Answer-key leak check.
 *
 * `lib/curriculum.ts` holds every question together with its answer. A single value
 * import of that module from a client component bundles all of it into the browser,
 * where the answers are readable in the developer tools. That is not a hypothetical:
 * it shipped, because one client page imported `activityCount` to print a sentence.
 *
 * Run this against a production build. It looks for curriculum text in the client
 * chunks. Server chunks are not examined — answers belong there.
 *
 *   node scripts/check-bundle.mjs
 *
 * Exit code 1 means answer-key material is reachable from a browser. The usual cause
 * is a new `@/lib/curriculum` import in a "use client" file; take the value from
 * `@/lib/curriculum-facts` or compute it on the server instead.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const CLIENT_DIR = path.join(process.cwd(), ".next", "static", "chunks");

/**
 * Strings that only exist inside the curriculum module. Each is an explanation or a
 * prompt template that no chrome, component, or copy deck has any reason to contain,
 * so a match means the question bank itself was bundled.
 */
const MARKERS = [
  "A letter can have an uppercase and a lowercase shape.",
  "Rhyming words have the same ending sound.",
  "arcade-prek-robot-0",
];

if (!existsSync(CLIENT_DIR)) {
  console.error(`No client chunks at ${CLIENT_DIR}. Run \`pnpm build\` first.`);
  process.exit(2);
}

const files = readdirSync(CLIENT_DIR, { recursive: true })
  .map((name) => path.join(CLIENT_DIR, String(name)))
  .filter((file) => file.endsWith(".js"));

const hits = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const marker of MARKERS) {
    if (source.includes(marker)) hits.push({ file: path.relative(process.cwd(), file), marker });
  }
}

if (hits.length) {
  console.error("FAIL: curriculum answer keys are in the client bundle.\n");
  for (const hit of hits) console.error(`  ${hit.file}\n    contains: ${JSON.stringify(hit.marker)}`);
  console.error(
    "\nA client component is importing @/lib/curriculum. Use @/lib/curriculum-facts,\n" +
      "or move the work to a server component or route handler.",
  );
  process.exit(1);
}

console.log(`OK - ${files.length} client chunks checked, no curriculum answer keys found.`);
