/**
 * Screenshots the Wonder Lab at the device classes it makes promises about.
 *
 * Same arrangement as `shot-kid-layer.mjs`, and for the same reason: `/kid-preview` needs
 * no session, no Supabase and no child data, so the lab can be looked at without a signed-in
 * family. What it adds is coverage of the three screens a child actually moves through —
 * the shelves, one shelf, and a station — plus a sweep that renders *every* station, because
 * the faults this package found were all things only a rendered page shows: art that names
 * a condition rather than the thing that moves, an object at `width: 100%` inside a flex row
 * pushing the controls off the screen, a part of a diagram painted underneath another.
 *
 * It fails on a console error, on a touch target below the band's floor, and on any station
 * that overflows horizontally — a child surface that scrolls sideways has lost a control.
 *
 *   pnpm dev --port 5199
 *   node scripts/shot-wonder-lab.mjs --port 5199 --band prek
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};

const PORT = arg("port", "5199");
const BAND = arg("band", "prek");
const OUT = arg("out", "outputs");
const URL = `http://localhost:${PORT}/kid-preview?screen=lab&band=${BAND}`;

/** The four viewports the blueprint's definition of done names. iPad landscape is first (D8). */
const VIEWPORTS = [
  { name: "ipad-landscape", width: 1180, height: 820 },
  { name: "ipad-portrait", width: 820, height: 1180 },
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

/** C6: 64px for bands 4–5, 56px for 6–7. The lab must never paint one smaller. */
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

/** Drive one of the preview's `<select>`s the way a person would. */
const pick = (page, index, value) =>
  page.evaluate(
    ([at, want]) => {
      const select = document.querySelectorAll("select")[at];
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
      setter.call(select, want);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    },
    [index, value],
  );

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
    await page.waitForSelector(".lab-room");

    // Every station, rendered. Cheap, and it is the check that catches an object with no
    // drawing or an engine that throws on one particular activity shape.
    const stations = await page.$$eval("select:nth-of-type(1) option", () => {
      const select = document.querySelectorAll("select")[1];
      return [...select.options].map((option) => option.value);
    });
    for (const station of stations) {
      await pick(page, 1, station);
      await page.waitForTimeout(60);
      const trouble = await page.evaluate(() => ({
        engine: document.querySelector(".lab-engine")?.dataset.engine ?? null,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }));
      if (!trouble.engine) failures.push(`${viewport.name}: ${station} rendered no engine`);
      if (trouble.overflow) failures.push(`${viewport.name}: ${station} scrolls sideways`);
    }

    // Touch targets, measured on the painted page rather than asserted in a stylesheet.
    const small = await page.$$eval(
      ".lab-shelf, .lab-station, .lab-bin, .lab-stage, .lab-variable, .lab-clue, .lab-hotspot, .lab-room .kid-button",
      (nodes, floor) =>
        nodes
          .map((node) => ({ box: node.getBoundingClientRect(), label: node.textContent?.trim().slice(0, 24) }))
          .filter(({ box }) => box.height + 0.5 < floor || box.width + 0.5 < floor)
          .map(({ box, label }) => `${label || "(no text)"} ${Math.round(box.width)}x${Math.round(box.height)}`),
      TOUCH_FLOOR,
    );
    for (const target of small) {
      failures.push(`${viewport.name} [${motion}]: touch target below ${TOUCH_FLOOR}px — ${target}`);
    }

    const suffix = motion === "reduce" ? "-reduced-motion" : "";
    for (const [screen, station] of [
      ["shelves", "floating.first-look"],
      ["shelf", "habitats.sort"],
      ["station", "floating.first-look"],
    ]) {
      await pick(page, 1, station);
      await pick(page, 2, screen);
      await page.waitForTimeout(120);
      const path = `${OUT}/wonder-lab-${screen}-${BAND}-${viewport.name}${suffix}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`captured ${path}`);
    }

    await context.close();
  }
}

await browser.close();

if (failures.length) {
  console.log("\nPROBLEMS:");
  for (const failure of [...new Set(failures)]) console.log(" -", failure);
  process.exitCode = 1;
} else {
  console.log(`\nNo console errors, nothing scrolls sideways, every target is at least ${TOUCH_FLOOR}px.`);
}
