/**
 * Measures the child's map in a real browser, and photographs it.
 *
 * The map is the one screen where layout *is* the feature: a landmark that lands on top of
 * another one, or a target a four-year-old's finger cannot hit, is a broken map however well
 * the data reads. Those two things cannot be checked from a stylesheet, so they are checked
 * here, against the painted page, at every viewport and every band.
 *
 * It uses `/kid-preview?screen=map`, which is development-only and needs no family, no
 * session and no Supabase — so running it never touches anyone's data.
 *
 *   pnpm dev --port 5199
 *   node scripts/shot-child-map.mjs --port 5199
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};

const PORT = arg("port", "5199");
const OUT = arg("out", "outputs");

const VIEWPORTS = [
  { name: "ipad-landscape", width: 1180, height: 820 },
  { name: "ipad-portrait", width: 820, height: 1180 },
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

/** The extremes of the band range: the largest type and targets, and the smallest. */
const BANDS = ["early-preschool", "prek", "grade2"];
const floorFor = (band) => (["grade2", "grade3"].includes(band) ? 56 : 64);

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
  for (const band of BANDS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => failures.push(`${viewport.name}/${band}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(`${viewport.name}/${band}: ${message.text()}`);
    });

    await page.goto(`http://localhost:${PORT}/kid-preview?screen=map&band=${band}`, {
      waitUntil: "networkidle",
    });
    await page.waitForSelector(".kid-map");

    const targets = await page.$$eval(
      ".kid-place, .kid-trailhead, .kid-who, .kid-bubble-replay, .kid-bubble",
      (nodes) =>
        nodes.map((node) => ({
          label: (node.textContent || "").trim().slice(0, 16) || node.className,
          touchable: !node.classList.contains("kid-bubble"),
          box: (({ x, y, width, height }) => ({ x, y, width, height }))(node.getBoundingClientRect()),
        })),
    );

    // Nothing a child can touch may sit on top of anything else they can touch, and the
    // speech bubble may not cover a landmark either.
    for (let i = 0; i < targets.length; i += 1) {
      for (let j = i + 1; j < targets.length; j += 1) {
        const a = targets[i].box;
        const b = targets[j].box;
        const overlaps =
          a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        if (overlaps) {
          failures.push(
            `${viewport.name}/${band}: "${targets[i].label}" overlaps "${targets[j].label}"`,
          );
        }
      }
    }

    const floor = floorFor(band);
    for (const target of targets) {
      if (!target.touchable) continue;
      if (target.box.height + 0.5 < floor || target.box.width + 0.5 < floor) {
        failures.push(
          `${viewport.name}/${band}: "${target.label}" is ${Math.round(target.box.width)}x` +
            `${Math.round(target.box.height)}, under the ${floor}px floor`,
        );
      }
    }

    if (band === "prek") {
      const path = `${OUT}/child-map-${viewport.name}.png`;
      await page.screenshot({ path });
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
  console.log(`\n${VIEWPORTS.length} viewports x ${BANDS.length} bands: no overlaps, no small targets.`);
}
