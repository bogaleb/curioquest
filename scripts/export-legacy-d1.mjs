/**
 * One-shot rescue of the local Cloudflare D1 state before WP-00 deletes the
 * Cloudflare half of the stack.
 *
 * `.wrangler/state` is gitignored, so the only copy of any family progress that was
 * created against the D1 build lives on this machine. This writes it out in the
 * legacy v4 export shape that `scripts/import-legacy.mjs` already knows how to
 * replay into Supabase, so deleting Wrangler is reversible rather than terminal.
 *
 *   node scripts/export-legacy-d1.mjs [--out work/d1-export.json]
 *
 * The output contains child learning records. It is written under `work/`, which is
 * gitignored, and must never be committed.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const flag = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : fallback;
};
const out = resolve(root, flag("--out", join("work", "d1-export.json")));

const stateDir = join(root, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
let files = [];
try {
  files = readdirSync(stateDir).filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite");
} catch {
  console.log("No local D1 state found. Nothing to export.");
  process.exit(0);
}
if (!files.length) {
  console.log("No local D1 database found. Nothing to export.");
  process.exit(0);
}

const db = new DatabaseSync(join(stateDir, files[0]), { readOnly: true });
const tables = new Set(
  db.prepare("select name from sqlite_master where type='table'").all().map((row) => row.name),
);
const all = (table, order) =>
  tables.has(table) ? db.prepare(`select * from "${table}"${order ? ` order by ${order}` : ""}`).all() : [];
const parse = (value) => {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};

const bundle = {
  schemaVersion: 4,
  exportedAt: new Date().toISOString(),
  source: "cloudflare-d1-local",
  profiles: all("explorers").map((row) => parse(row.data)),
  collections: all("workspace_items", "updated_at desc").map((row) => ({
    id: row.id,
    profile_id: row.profile_id,
    kind: row.kind,
    data: parse(row.data),
    revision: row.revision,
    updated_at: row.updated_at,
  })),
  reading: {
    profiles: all("reading_profiles").map((row) => ({
      child_id: row.child_id,
      data: parse(row.data),
      revision: row.revision,
    })),
    attempts: all("reading_attempts", "created_at").map((row) => parse(row.data)),
  },
  experience: {
    profiles: all("experience_profiles").map((row) => ({
      child_id: row.child_id,
      data: parse(row.data),
      revision: row.revision,
    })),
    responses: all("interactive_media_responses", "created_at").map((row) => parse(row.data)),
    inventory: all("child_world_items").map((row) => ({
      child_id: row.child_id,
      item_id: row.item_id,
      earned_at: row.earned_at,
    })),
    placements: all("world_item_placements").map((row) => ({
      child_id: row.child_id,
      slot: row.slot,
      item_id: row.item_id,
    })),
  },
  attempts: [],
  rewardEvents: [],
};
db.close();

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(bundle, null, 2)}\n`);
console.log(
  `Exported ${bundle.profiles.length} explorer(s), ${bundle.collections.length} saved item(s), ` +
    `${bundle.reading.attempts.length} reading attempt(s) to ${out}`,
);
console.log("Replay into Supabase with: pnpm supabase:import -- --parent-id <uuid> --file " + out);
