/**
 * Visits every explorer route in a real browser and reports what broke.
 *
 * Route splitting moves code between bundles, and a screen that fails to hydrate
 * still returns HTTP 200 — so this asserts on rendered content and console errors,
 * not on status codes.
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = `http://localhost:${arg("port", "5174")}`;
const OUT = arg("out", "ui-shots/routes");
const ROUTES = ["/", "/read", "/play", "/create", "/world", "/today", "/science",
  "/stories", "/theater", "/worlds", "/build", "/team", "/rewards", "/parent"];
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome"].find(existsSync);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const api = (p, d) => page.request.post(`${BASE}${p}`, { data: d, headers: { Origin: BASE } });

await page.goto(`${BASE}/auth/sign-in`, { waitUntil: "domcontentloaded" });
await api("/auth/session", { action: "sign-in", email: "curioquest-ui-check@example.com", password: "ui-verification-passphrase-2026" });
if (!(await api("/api/parent", { action: "setup", pin: "246810" })).ok())
  await api("/api/parent", { action: "unlock", pin: "246810" });
const state = await (await page.request.get(`${BASE}/api/quest`)).json();
if (!state.profiles?.length)
  await api("/api/quest", { action: "create-profile", name: "Robin", band: "prek", grade: "prek", avatar: "fox", interests: ["space"], dailyGoal: 10 });

let failures = 0;
for (const route of ROUTES) {
  const errors = [];
  const onError = (e) => errors.push(typeof e === "string" ? e : e.message);
  page.on("pageerror", onError);
  const onConsole = (m) => { if (m.type() === "error") errors.push(m.text()); };
  page.on("console", onConsole);

  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2600);

  // The shell must be present and the main region must have real content.
  const shell = await page.locator(".cq-shell").count();
  const text = (await page.locator("#cq-main").innerText().catch(() => "")).trim();
  const ok = shell === 1 && text.length > 20 && !errors.length;
  if (!ok) { failures += 1; await page.screenshot({ path: `${OUT}/FAIL${route.replace(/\//g, "_")}.png` }); }
  console.log(`${ok ? "ok  " : "FAIL"} ${route.padEnd(10)} shell=${shell} chars=${text.length}${errors.length ? ` errors=${errors.length}` : ""}`);
  for (const e of [...new Set(errors)].slice(0, 2)) console.log(`       - ${e.slice(0, 140)}`);

  page.off("pageerror", onError);
  page.off("console", onConsole);
}
await browser.close();
console.log(failures ? `\n${failures} route(s) failed.` : "\nAll routes render.");
process.exitCode = failures ? 1 : 0;
