/**
 * Run every migration against a throwaway Postgres, then execute every routine they define.
 *
 * Why this exists: `create function` proves almost nothing for plpgsql. The SQL inside a
 * function body is parsed when the body first *runs*, not when it is created — so a
 * migration can apply cleanly and still fail the first time a child opens the app. Three
 * real faults in WP-06 (`rows` and `row` used as column aliases, both Postgres keywords,
 * and a `days` variable shadowing `make_interval`'s parameter) were invisible to reading
 * and invisible to `create function`. Only execution found them.
 *
 * The container is disposable and nothing here touches Supabase or any local database.
 *
 *   node scripts/verify-migrations.mjs            # apply, exercise, tear down
 *   node scripts/verify-migrations.mjs --keep     # leave the container up to poke at
 *
 * Requires Docker. Skips with a clear message (and exit 0) when Docker is unavailable, so
 * it can sit in a pipeline that does not always have a daemon.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const CONTAINER = "cq-verify-migrations";
const IMAGE = "postgres:17-alpine";
const DB = "curioquest";
const KEEP = process.argv.includes("--keep");

function docker(args, options = {}) {
  return execFileSync("docker", args, { encoding: "utf8", stdio: "pipe", ...options });
}

/**
 * Run a file, returning stdout *and* stderr together.
 *
 * Both halves matter and neither is optional. `raise notice` — which is how the exercise
 * file reports that a refusal behaved correctly, and how it would report a BUG — goes to
 * stderr, and so does every `psql:... ERROR:`. Reading only stdout would produce a check
 * that passes while the thing it is checking is broken, which is worse than no check.
 */
function psql(file, { tolerant = false } = {}) {
  docker(["cp", join(root, file), `${CONTAINER}:/tmp/run.sql`]);
  const flags = tolerant ? [] : ["-v", "ON_ERROR_STOP=1"];
  const args = ["exec", CONTAINER, "psql", "-U", "postgres", "-d", DB, ...flags, "-f", "/tmp/run.sql"];
  if (!tolerant) return docker(args);
  // Tolerant runs must not throw on a deliberate refusal, but their stderr is the part
  // worth reading, so both streams are merged inside the container.
  return docker(["exec", CONTAINER, "sh", "-c",
    `psql -U postgres -d ${DB} -f /tmp/run.sql 2>&1`]);
}

function cleanup() {
  if (KEEP) {
    console.log(`\nContainer ${CONTAINER} left running on port 55433 (--keep).`);
    return;
  }
  try { docker(["rm", "-f", CONTAINER]); } catch { /* already gone */ }
}

try {
  docker(["info", "--format", "{{.ServerVersion}}"]);
} catch {
  console.log("Docker is not available — skipping migration verification.");
  process.exit(0);
}

let failed = false;
try {
  try { docker(["rm", "-f", CONTAINER]); } catch { /* not running */ }
  console.log(`Starting ${IMAGE}…`);
  docker(["run", "-d", "--name", CONTAINER, "-e", "POSTGRES_PASSWORD=verify",
    "-e", `POSTGRES_DB=${DB}`, "-p", "55433:5432", IMAGE]);

  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { docker(["exec", CONTAINER, "pg_isready", "-U", "postgres"]); ready = true; break; }
    catch { execFileSync("docker", ["exec", CONTAINER, "sleep", "1"], { stdio: "ignore" }); }
  }
  if (!ready) throw new Error("Postgres did not become ready.");

  console.log("Installing the Supabase-shaped shim…");
  psql("supabase/verify/00-supabase-shim.sql");

  const migrations = readdirSync(join(root, "supabase/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  console.log(`\nApplying ${migrations.length} migrations:`);
  for (const name of migrations) {
    try {
      psql(`supabase/migrations/${name}`);
      console.log(`  ok    ${name}`);
    } catch (error) {
      console.log(`  FAIL  ${name}`);
      console.log(String(error.stderr || error.message).split("\n").slice(0, 12).map((line) => `        ${line}`).join("\n"));
      failed = true;
      break;
    }
  }

  if (!failed) {
    console.log("\nSeeding a family and its evidence…");
    psql("supabase/verify/01-seed.sql");

    console.log("\nExercising every routine branch:");
    // Tolerant: the file deliberately triggers refusals and catches them, and psql's
    // ON_ERROR_STOP would treat a caught exception's NOTICE as fatal in some versions.
    const output = psql("supabase/verify/02-exercise.sql", { tolerant: true });
    console.log(output.split("\n").map((line) => `  ${line}`).join("\n"));

    // The exercise file prints BUG on any branch that behaved wrongly, and psql prints
    // ERROR on anything that failed to parse or run at all.
    const bugs = output.split("\n").filter((line) => /\bBUG\b/.test(line));
    const errors = output.split("\n").filter((line) => /^psql:.*ERROR:/.test(line));
    if (bugs.length || errors.length) {
      console.log(`\n${bugs.length} behaviour bug(s), ${errors.length} SQL error(s).`);
      failed = true;
    }
  }
} catch (error) {
  console.error(String(error.stderr || error.message));
  failed = true;
} finally {
  cleanup();
}

console.log(failed ? "\nMigration verification FAILED." : "\nEvery migration applies and every routine branch runs.");
process.exitCode = failed ? 1 : 0;
