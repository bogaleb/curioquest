/**
 * Rebuild the mastery cache from the event stream (blueprint §WP-06.1).
 *
 * The blob on `private.explorer_state` used to be the only record of what a child had
 * learned: a running total mutated in place, impossible to recompute and impossible to
 * correct. WP-01 made it reproducible; this script is the command that proves it. It
 * folds `learning_events` through the same projection the application reads, compares
 * the result to the cache, and — unless asked only to report — writes it back.
 *
 * That comparison is the acceptance criterion. If a rebuild reproduces the cache, the
 * blob really is derived data and can be thrown away. Where it does not, the difference
 * is printed rather than silently overwritten, because a projection that disagrees with
 * six months of a child's history is a claim that needs a person to look at it.
 *
 *   node scripts/rebuild-mastery.mjs --report        # compare only, change nothing
 *   node scripts/rebuild-mastery.mjs                 # compare, then write
 *   node scripts/rebuild-mastery.mjs --parent <uuid> # one family
 */
import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";
import { loadTs } from "../tests/load-typescript.mjs";

const { masteryFromEvents, eventFromRow } = loadTs("lib/mastery-projection");

try { loadEnvFile(".env.local"); } catch (error) { if (error.code !== "ENOENT") throw error; }

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
};
const REPORT_ONLY = process.argv.includes("--report");
const ONE_PARENT = arg("parent");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

/**
 * Compare two mastery maps the way a reader would.
 *
 * Only the fields the evidence rule and the recommender actually consult. `sessionIds`
 * and `questionIds` are recency windows the blob trimmed at a different point in its
 * life, and treating a trimmed list as a disagreement would report every child as
 * broken while nothing is wrong.
 */
const COMPARED = [
  "score", "confidence", "attemptCount", "correctCount", "independentCorrect",
  "consecutiveIndependent", "retainedReviews",
];

function differences(cached, rebuilt) {
  const out = [];
  for (const skillId of new Set([...Object.keys(cached ?? {}), ...Object.keys(rebuilt)])) {
    const before = cached?.[skillId];
    const after = rebuilt[skillId];
    if (!after) { out.push({ skillId, note: "in the cache, but no events explain it" }); continue; }
    if (!before) { out.push({ skillId, note: "projected from events, absent from the cache" }); continue; }
    for (const field of COMPARED) {
      const a = Number(before[field] ?? 0);
      const b = Number(after[field] ?? 0);
      // A tenth of a point is rounding, not disagreement: the score is stored rounded.
      if (Math.abs(a - b) > 0.1) out.push({ skillId, note: `${field}: cache ${a}, events ${b}` });
    }
  }
  return out;
}

const { data: children, error: childError } = await db
  .from("child_profiles")
  .select("id, parent_id, name")
  .order("created_at");
if (childError) { console.error(childError.message); process.exit(1); }

const wanted = ONE_PARENT ? children.filter((child) => child.parent_id === ONE_PARENT) : children;
if (!wanted.length) { console.log("No children to rebuild."); process.exit(0); }

let matched = 0;
let rewritten = 0;
let unexplained = 0;

for (const child of wanted) {
  const { data: state } = await db.schema("private").from("explorer_state")
    .select("data").eq("child_id", child.id).maybeSingle();
  const { data: rows, error: eventError } = await db.rpc("cq_events", {
    p_parent: child.parent_id, p_child: child.id, p_since: null, p_limit: 20000,
  });
  if (eventError) { console.error(`${child.name}: ${eventError.message}`); process.exitCode = 1; continue; }

  const rebuilt = masteryFromEvents((rows ?? []).map(eventFromRow));
  const cached = state?.data?.skillMastery ?? {};
  const diff = differences(cached, rebuilt);
  const orphans = diff.filter((entry) => entry.note.startsWith("in the cache"));
  unexplained += orphans.length;

  const label = `${child.name} (${child.id.slice(0, 8)})`;
  if (!diff.length) {
    matched += 1;
    console.log(`  ok    ${label}: ${Object.keys(rebuilt).length} skills, cache reproduces exactly`);
  } else {
    console.log(`  diff  ${label}: ${Object.keys(rebuilt).length} skills projected, ${diff.length} difference(s)`);
    for (const entry of diff.slice(0, 8)) console.log(`          ${entry.skillId} — ${entry.note}`);
    if (diff.length > 8) console.log(`          …and ${diff.length - 8} more`);
  }

  if (!REPORT_ONLY && Object.keys(rebuilt).length) {
    // Merged, not replaced, for the same reason `withProjectedMastery` merges: skills
    // the blob holds from before the event stream existed are history, and a rebuild
    // command that deleted them would be a data loss dressed as a repair.
    const merged = { ...cached, ...rebuilt };
    const { error } = await db.rpc("cq_mastery_cache", {
      p_parent: child.parent_id, p_child: child.id, p_mastery: merged,
    });
    if (error) { console.error(`${label}: ${error.message}`); process.exitCode = 1; }
    else rewritten += 1;
  }
}

console.log(
  `\n${wanted.length} child(ren): ${matched} reproduced the cache exactly, ` +
  `${wanted.length - matched} differed, ${unexplained} skill(s) in a cache that no event explains.`,
);
if (REPORT_ONLY) console.log("Report only — nothing was written.");
else console.log(`${rewritten} cache(s) refreshed from the projection.`);
if (unexplained) {
  console.log(
    "\nThe unexplained skills predate the event stream (WP-01). They are kept, not deleted.\n" +
    "When this number reaches zero the merge in `withProjectedMastery` can go, and the\n" +
    "blob can be dropped outright.",
  );
}
