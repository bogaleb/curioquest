/**
 * Screenshots the child component layer at the device classes it makes promises about.
 *
 * Unlike `ui-shots.mjs` this needs no session, no Supabase and no child data: `/kid-preview`
 * is a development-only route that renders the primitives on their own. It captures each
 * viewport twice — once normally, once with `prefers-reduced-motion: reduce` — because the
 * reduced-motion path is part of the accessibility floor rather than a degraded fallback,
 * and it fails if the page logs an error or if any control is smaller than the band's floor.
 *
 *   pnpm dev --port 5199
 *   node scripts/shot-kid-layer.mjs --port 5199 --band prek
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};

const PORT = arg("port", "5199");
const BAND = arg("band", "prek");
const WORLD = arg("world", "grove");
const OUT = arg("out", "outputs");
const URL = `http://localhost:${PORT}/kid-preview?band=${BAND}&world=${WORLD}`;

/** The four viewports the blueprint's definition of done names, plus iPad mini. */
const VIEWPORTS = [
  { name: "ipad-landscape", width: 1180, height: 820 },
  { name: "ipad-portrait", width: 820, height: 1180 },
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

/** C6: 64px for bands 4–5, 56px for 6–7. The preview must never paint one smaller. */
const TOUCH_FLOOR = ["grade2", "grade3"].includes(BAND) ? 56 : 64;

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((path) => existsSync(path));
if (!CHROME) throw new Error("No installed Chrome or Edge found.");

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const failures = [];

for (const viewport of VIEWPORTS) {
  for (const motion of ["no-preference", "reduce"]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: motion === "reduce" ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => failures.push(`${viewport.name}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(`${viewport.name}: ${message.text()}`);
    });

    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".kid-scene");

    // Touch targets, measured on the painted page rather than asserted in a stylesheet.
    const small = await page.$$eval(
      ".kid-button, .kid-slot, .kid-bubble-replay, .kid-card[data-pressable]",
      (nodes, floor) =>
        nodes
          .map((node) => ({ box: node.getBoundingClientRect(), label: node.textContent?.trim().slice(0, 20) }))
          .filter(({ box }) => box.height + 0.5 < floor || box.width + 0.5 < floor)
          .map(({ box, label }) => `${label || "(no text)"} ${Math.round(box.width)}x${Math.round(box.height)}`),
      TOUCH_FLOOR,
    );
    for (const target of small) {
      failures.push(`${viewport.name} [${motion}]: touch target below ${TOUCH_FLOOR}px — ${target}`);
    }

    const suffix = motion === "reduce" ? "-reduced-motion" : "";
    const path = `${OUT}/kid-layer-${BAND}-${viewport.name}${suffix}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`captured ${path}`);
    await context.close();
  }
}

await browser.close();

if (failures.length) {
  console.log("\nPROBLEMS:");
  for (const failure of [...new Set(failures)]) console.log(" -", failure);
  process.exitCode = 1;
} else {
  console.log(`\nNo console errors; every touch target is at least ${TOUCH_FLOOR}px.`);
}
