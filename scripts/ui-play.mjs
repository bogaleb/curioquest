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
  { band: "kindergarten", grade: "prek", subject: "reading" },
  { band: "kindergarten", grade: "prek", subject: "math" },
  { band: "grade2", grade: "grade1", subject: "math" },
  { band: "prek", grade: "prek", subject: "math" },
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

for (const run of RUNS) {
  if (TARGETS.every((engine) => seen.has(engine))) break;

  // A fresh profile per run keeps each run's recommendation deterministic.
  const created = await api("/api/quest", {
    action: "create-profile", name: `P${Math.random().toString(36).slice(2, 6)}`,
    band: run.band, grade: run.grade, avatar: "fox", interests: ["space"], dailyGoal: 10,
  });
  if (!created.ok()) { console.log(`profile limit reached; stopping`); break; }
  const profile = (await created.json()).profile.id;

  await api("/api/quest", { action: "start", subject: run.subject, profile });
  await page.goto(`${BASE}/?child=${profile}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // Open the in-progress session.
  const open = page.locator("button").filter({ hasText: /Start my daily quest|Continue|Keep going/i }).first();
  if (await open.count()) await open.click().catch(() => {});
  await page.waitForTimeout(1200);

  for (let step = 0; step < 8; step += 1) {
    const state = await questState();
    const session = state.profiles?.find((p) => p.id === profile)?.session;
    const kind = session?.question?.engine?.kind;
    if (!session?.question) break;

    if (kind && TARGETS.includes(kind) && !seen.has(kind)) {
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/${kind}.png` });
      seen.add(kind);
      console.log(`captured ${kind} (${run.band}/${run.subject}, step ${step})`);
      break;
    }

    // Advance by answering. Only plain multiple choice is solvable this way; any
    // other engine ends this run and we move to the next band/subject combination.
    const options = page.locator(".answers button:not([disabled])");
    const count = await options.count();
    if (!count) break;
    let advanced = false;
    for (let choice = 0; choice < count; choice += 1) {
      const button = page.locator(".answers button:not([disabled])").nth(0);
      if (!(await button.count())) break;
      await button.click().catch(() => {});
      await page.waitForTimeout(700);
      const next = page.locator("button").filter({ hasText: /Next discovery|Finish my quest/i }).first();
      if (await next.count()) {
        await next.click().catch(() => {});
        await page.waitForTimeout(900);
        advanced = true;
        break;
      }
    }
    if (!advanced) break;
  }
}

await browser.close();
console.log(seen.size ? `\nCaptured: ${[...seen].join(", ")}` : "\nNo target engines captured.");
for (const target of TARGETS) if (!seen.has(target)) console.log(`  not reached: ${target}`);
if (errors.length) {
  console.log("\nCONSOLE ERRORS:");
  for (const error of [...new Set(errors)]) console.log(" -", error);
  process.exitCode = 1;
}
