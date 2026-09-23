/**
 * Screenshots the Making Place at the device classes it makes promises about.
 *
 * Same arrangement as `shot-wonder-lab.mjs`: `/kid-preview` needs no session, no Supabase
 * and no child data, so the studio can be looked at without a signed-in family. What it
 * adds is a sweep of every colouring page and every letter, because a shape grammar fails
 * in ways only a rendered page shows — a tail that fills into a wedge, a foot hidden behind
 * a body, a letter whose bowl crosses its stem.
 *
 * It fails on a console error, on a touch target below the band's floor, and on any room
 * that overflows horizontally — a child surface that scrolls sideways has lost a control.
 *
 *   pnpm dev --port 5199
 *   node scripts/shot-making-place.mjs --port 5199 --band prek
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
const URL = `http://localhost:${PORT}/kid-preview?screen=studio&band=${BAND}`;

/** The four viewports the blueprint's definition of done names. iPad landscape is first (D8). */
const VIEWPORTS = [
  { name: "ipad-landscape", width: 1180, height: 820 },
  { name: "ipad-portrait", width: 820, height: 1180 },
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

/** C6: 64px for bands 4–5, 56px for 6–7. The studio must never paint one smaller. */
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
    await page.waitForSelector(".studio-room");

    // Every colouring page, rendered. Cheap, and it is the check that catches a shape
    // that fills into a wedge or a part drawn underneath the body it belongs to.
    await pick(page, 1, "colour");
    const pageIds = await page.evaluate(() => [...document.querySelectorAll("select")[2].options].map((o) => o.value));
    for (const id of pageIds) {
      await pick(page, 2, id);
      await page.waitForTimeout(50);
      const trouble = await page.evaluate(() => ({
        regions: document.querySelectorAll(".studio-region").length,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }));
      if (trouble.regions < 5) failures.push(`${viewport.name}: page ${id} drew ${trouble.regions} regions`);
      if (trouble.overflow) failures.push(`${viewport.name}: page ${id} scrolls sideways`);
    }

    // Every letter, rendered, in every set.
    await pick(page, 1, "write");
    const sets = await page.evaluate(() => [...document.querySelectorAll("select")[2].options].map((o) => o.value));
    for (const setId of sets) {
      await pick(page, 2, setId);
      await page.waitForTimeout(40);
      const letters = await page.evaluate(() => [...document.querySelectorAll("select")[3].options].map((o) => o.value));
      for (const letter of letters) {
        await pick(page, 3, letter);
        await page.waitForTimeout(25);
        const trouble = await page.evaluate(() => ({
          trail: document.querySelector(".studio-trail")?.getAttribute("points")?.length ?? 0,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        }));
        if (trouble.trail < 10) failures.push(`${viewport.name}: ${setId}/${letter} drew no trail`);
        if (trouble.overflow) failures.push(`${viewport.name}: ${setId}/${letter} scrolls sideways`);
      }
    }

    // Touch targets, measured on the painted page rather than asserted in a stylesheet.
    const small = await page.$$eval(
      ".studio-door, .studio-page-card, .studio-set, .studio-letter, .studio-tool, .studio-size, .studio-stamp, .studio-swatch, .studio-room .kid-button",
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
    for (const [room, extra] of [["shelf", null], ["colour", "cat"], ["draw", null], ["write", "lowercase"]]) {
      await pick(page, 1, room);
      await page.waitForTimeout(80);
      if (extra) await pick(page, 2, extra);
      await page.waitForTimeout(120);
      const path = `${OUT}/making-place-${room}-${BAND}-${viewport.name}${suffix}.png`;
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
