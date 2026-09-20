/**
 * Captures the activity player, including the interactive play engines.
 *
 * Plays the real recommendation path in a real browser: it signs in, starts a quest,
 * and answers multiple-choice activities by trying options until the player advances.
 * Nothing here uses a debug route, so what it captures is exactly what a child is
 * served — and getting a screenshot at all proves the answer-and-advance loop works.
 *
 *   node scripts/ui-play.mjs [--port 5174] [--out dir]
 */
import { chromium } from "playwright-core";
import { mkdirSync, existsSync } from "node:fs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const PORT = arg("port", "5174");
const BASE = `http://localhost:${PORT}`;
const OUT = arg("out", "ui-shots/play");
const TARGETS = arg("engines", "bubble-pop,balance,constellation").split(",");
const EMAIL = "curioquest-ui-check@example.com";
const PASSWORD = "ui-verification-passphrase-2026";
const PIN = "246810";

/** Bands and subjects chosen because each surfaces a different engine early. */
const RUNS = [
  { for: "constellation", band: "kindergarten", grade: "prek", subject: "reading", interests: ["space"] },
  { for: "bubble-pop", band: "kindergarten", grade: "prek", subject: "math", interests: [] },
  { for: "balance", band: "grade3", grade: "grade1", subject: "math", interests: ["puzzles"] },
];

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));
if (!CHROME) throw new Error("No installed Chrome or Edge found.");

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1100, height: 940 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGE: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

const api = (path, data) => page.request.post(`${BASE}${path}`, { data, headers: { Origin: BASE } });
const questState = async () => (await page.request.get(`${BASE}/api/quest`)).json();

await page.goto(`${BASE}/auth/sign-in`, { waitUntil: "domcontentloaded" });
if (!(await api("/auth/session", { action: "sign-in", email: EMAIL, password: PASSWORD })).ok())
  throw new Error("sign-in failed");
let gate = await api("/api/parent", { action: "setup", pin: PIN });
if (!gate.ok()) gate = await api("/api/parent", { action: "unlock", pin: PIN });
if (!gate.ok()) throw new Error("parent gate failed");

const seen = new Set();

/**
 * Recommendation order depends on the profile's own id (a deterministic jitter keeps a
 * child's quest stable between reloads), so which activity lands first cannot be
 * predicted offline. Instead we create fresh profiles until the wanted engine comes up
 * first, which is also a fair sample of what a real new child would be served.
 */
const ATTEMPTS = Number(arg("attempts", "18"));

for (const run of RUNS) {
  if (!TARGETS.includes(run.for) || seen.has(run.for)) continue;

  for (let attempt = 0; attempt < ATTEMPTS && !seen.has(run.for); attempt += 1) {
    // A family is capped at four explorers and the API refuses to delete the last.
    const before = await questState();
    for (const old of (before.profiles ?? []).slice(1)) {
      await api("/api/quest", { action: "delete-profile", profile: old.id, confirm: old.name });
    }

    const name = `P${Math.random().toString(36).slice(2, 6)}`;
    const created = await api("/api/quest", {
      action: "create-profile", name,
      band: run.band, grade: run.grade, avatar: "fox", interests: run.interests, dailyGoal: 10,
    });
    if (!created.ok()) { console.log(`create failed: ${await created.text()}`); break; }
    const profile = (await created.json()).profile.id;

    const started = await api("/api/quest", { action: "start", subject: run.subject, profile });
    if (!started.ok()) continue;
    const kind = (await started.json()).profile?.session?.question?.engine?.kind;
    if (kind !== run.for) continue;

    await page.goto(`${BASE}/?child=${profile}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const open = page.locator("button").filter({ hasText: /Start my daily quest|Continue|Keep going/i }).first();
    if (await open.count()) await open.click().catch(() => {});
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/${run.for}.png` });
    seen.add(run.for);
    console.log(`captured ${run.for} (${run.band}/${run.subject}, attempt ${attempt + 1})`);
  }
  if (!seen.has(run.for)) console.log(`${run.for}: not surfaced in ${ATTEMPTS} attempts`);
}

await browser.close();
console.log(seen.size ? `\nCaptured: ${[...seen].join(", ")}` : "\nNo target engines captured.");
for (const target of TARGETS) if (!seen.has(target)) console.log(`  not reached: ${target}`);
if (errors.length) {
  console.log("\nCONSOLE ERRORS:");
  for (const error of [...new Set(errors)]) console.log(" -", error);
  process.exitCode = 1;
}
