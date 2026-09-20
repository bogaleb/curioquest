/**
 * Visual verification harness.
 *
 * Drives a real Chrome through sign-in, parent-gate setup, and profile creation, then
 * captures the child-facing app at the device classes the shell claims to support.
 * Reuses the Chrome already installed on the machine, so no browser download.
 *
 *   node scripts/ui-shots.mjs [--port 5174] [--out <dir>] [--band prek] [--view adventure]
 */
import { chromium } from "playwright-core";
import { mkdirSync, existsSync } from "node:fs";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};

const PORT = arg("port", "5174");
const BASE = `http://localhost:${PORT}`;
const OUT = arg("out", "ui-shots");
const BAND = arg("band", "prek");
const EMAIL = "curioquest-ui-check@example.com";
const PASSWORD = "ui-verification-passphrase-2026";
const PIN = "246810";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
const executablePath = CHROME_PATHS.find((path) => existsSync(path));
if (!executablePath) throw new Error("No installed Chrome or Edge found.");

/** The device classes the shell makes promises about. */
const VIEWPORTS = [
  { name: "phone-portrait", width: 390, height: 844, isMobile: true },
  { name: "phone-landscape", width: 844, height: 390, isMobile: true },
  { name: "ipad-mini-portrait", width: 768, height: 1024, isMobile: true },
  { name: "ipad-pro-portrait", width: 1024, height: 1366, isMobile: true },
  { name: "ipad-landscape", width: 1180, height: 820, isMobile: true },
  { name: "laptop", width: 1440, height: 900, isMobile: false },
  { name: "desktop-wide", width: 1920, height: 1080, isMobile: false },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(`PAGE ERROR: ${error.message}`));

const api = (path, data) =>
  page.request.post(`${BASE}${path}`, { data, headers: { Origin: BASE } });

// --- sign in -------------------------------------------------------------
await page.goto(`${BASE}/auth/sign-in`, { waitUntil: "domcontentloaded" });
const signIn = await api("/auth/session", { action: "sign-in", email: EMAIL, password: PASSWORD });
if (!signIn.ok()) throw new Error(`sign-in failed: ${signIn.status()} ${await signIn.text()}`);

// --- unlock the parent gate (setup first run, unlock afterwards) ----------
let gate = await api("/api/parent", { action: "setup", pin: PIN });
if (!gate.ok()) gate = await api("/api/parent", { action: "unlock", pin: PIN });
if (!gate.ok()) throw new Error(`parent gate failed: ${gate.status()} ${await gate.text()}`);

// --- ensure one explorer exists ------------------------------------------
const existing = await (await page.request.get(`${BASE}/api/quest`)).json();
if (!existing.profiles?.length) {
  const created = await api("/api/quest", {
    action: "create-profile",
    name: "Robin",
    band: BAND,
    grade: BAND === "grade1" || BAND === "grade2" || BAND === "grade3" ? "grade1" : "prek",
    avatar: "fox",
    interests: ["animals", "space"],
    dailyGoal: 10,
  });
  if (!created.ok()) throw new Error(`profile create failed: ${created.status()} ${await created.text()}`);
}

// --- capture --------------------------------------------------------------
const view = arg("view", "");
for (const viewport of VIEWPORTS) {
  const shot = await context.newPage();
  await shot.setViewportSize({ width: viewport.width, height: viewport.height });
  await shot.goto(`${BASE}/${view ? `?view=${view}` : ""}`, { waitUntil: "networkidle" });
  // Let entrance animations settle so screenshots are not caught mid-transition.
  await shot.waitForTimeout(1200);
  await shot.screenshot({ path: `${OUT}/${viewport.name}.png`, fullPage: false });
  await shot.close();
  console.log(`captured ${viewport.name} (${viewport.width}x${viewport.height})`);
}

await browser.close();

if (consoleErrors.length) {
  console.log("\nCONSOLE ERRORS:");
  for (const error of [...new Set(consoleErrors)]) console.log(" -", error);
  process.exitCode = 1;
} else {
  console.log("\nNo console errors.");
}
