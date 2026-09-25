import { chromium } from "playwright-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { loadTs } from "../tests/load-typescript.mjs";

const port = process.env.DISCOVERY_TEST_PORT ?? "5173";
const base = `http://localhost:${port}`;
const { discoveryLessons } = loadTs("lib/discover/content");
const { tierForBand } = loadTs("lib/science/tier");
const executablePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome"].find(existsSync);
const browser = await chromium.launch({ executablePath, headless: true });
const out = "outputs/discovery-verification";
mkdirSync(out, { recursive: true });
const errors = [];
const results = [];
try {
  for (const [band, width, height] of [["prek", 1440, 1000], ["kindergarten", 820, 1180], ["grade2", 390, 844], ["early-preschool", 390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("net::ERR_FAILED")) errors.push(message.text()); });
    await page.goto(`${base}/kid-preview?screen=home&band=${band}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /Small wonders/ }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `home overflow ${band}`);
    await page.screenshot({ path: `${out}/home-${width}-${band}.png`, fullPage: true });
    await page.getByRole("button", { name: "Show library", exact: true }).click();
    await page.getByRole("heading", { name: "Follow your curiosity." }).waitFor();
    await page.screenshot({ path: `${out}/library-${width}-${band}.png`, fullPage: true });
    assert.equal(await page.locator(".discovery-card").count(), 12);
    await page.getByRole("button", { name: "Numbers & shapes", exact: true }).click();
    assert.equal(await page.locator(".discovery-card").count(), 2);
    await page.getByRole("searchbox").fill("not-a-discovery");
    await page.getByRole("heading", { name: "No discoveries found yet." }).waitFor();
    await page.getByRole("button", { name: "Show everything", exact: true }).click();
    for (const lesson of discoveryLessons) {
      const task = lesson.versions[tierForBand(band)].task;
      await page.locator(".discovery-card").filter({ has: page.getByRole("heading", { name: lesson.title, exact: true }) }).click();
      if (lesson.id === "picnic-count") {
        for (let i = 1; i <= 3; i++) await page.getByRole("button", { name: `Count object ${i}`, exact: true }).click();
        await page.getByText("Three altogether. Spread them out: still three!", { exact: true }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Count object 1", exact: true }).isDisabled(), true);
        await page.getByRole("button", { name: "Spread them out", exact: true }).click();
        assert.equal(await page.locator(".discovery-counting-model [aria-pressed=true]").count(), 3);
      }
      if (lesson.id === "shadow-play") {
        await page.getByRole("button", { name: "Move toward the torch", exact: true }).click();
        await page.getByText("Closer to the torch: a larger shadow on the same wall.", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Try clear glass", exact: true }).click();
        await page.getByRole("img", { name: /Most light passes through/ }).waitFor();
      }
      if (lesson.id === "seed-secret") {
        await page.getByRole("button", { name: "Later", exact: true }).click();
        await page.getByRole("button", { name: "Later", exact: true }).click();
        assert.equal(await page.getByRole("button", { name: "Later", exact: true }).isDisabled(), true);
        await page.getByRole("img", { name: "A young plant with leaves", exact: true }).waitFor();
      }
      if (lesson.id === "little-map") {
        await page.getByRole("button", { name: "Library", exact: true }).click();
        await page.getByText("The library is east of the park. To return to the park, go west.", { exact: true }).waitFor();
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${lesson.id} model overflow ${band}`);
      if (lesson.id === "shadow-play" && band === "grade2") await page.screenshot({ path: `${out}/shadow-model-phone.png`, fullPage: true });
      await page.getByRole("button", { name: "Let me try", exact: true }).click();
      if (task.kind === "build") {
        await page.getByRole("button", { name: "Check my thinking", exact: true }).click();
        await page.getByText("Keep exploring.", { exact: true }).waitFor();
        for (let i = 0; i < task.answer[0]; i++) await page.getByRole("button", { name: "Add one counter", exact: true }).click();
      } else for (const index of task.answer) await page.locator(".discovery-options").getByRole("button", { name: task.choices[index], exact: true }).click();
      if (lesson.id === "picnic-count") {
        await page.getByRole("button", { name: "Pause preview", exact: true }).click();
        assert.equal(await page.getByRole("button", { name: "Check my thinking", exact: true }).isDisabled(), true);
        assert.equal(await page.getByRole("button", { name: "Add one counter", exact: true }).isDisabled(), true);
        await page.getByRole("button", { name: "Resume preview", exact: true }).click();
        await page.screenshot({ path: `${out}/activity-${width}-${band}.png`, fullPage: true });
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${lesson.id} overflow ${band}`);
      await page.getByRole("button", { name: "Check my thinking", exact: true }).click();
      await page.getByText("You worked it out.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Take it with me", exact: true }).click();
      await page.getByRole("heading", { name: "An idea to take with you." }).waitFor();
      await page.getByRole("button", { name: "Back to discoveries", exact: true }).click();
      await page.waitForFunction(() => document.activeElement?.classList.contains("discovery-card"));
    }
    assert.equal(await page.locator(".discovery-passport strong").innerText(), "12");
    results.push({ band, viewport: `${width}x${height}`, completed: 12, overflow: false, keyboardFocusRestored: true });
    await context.close();
  }
  // A network failure must preserve both the construction and the attempt ID.
  const page = await browser.newPage();
  await page.goto(`${base}/kid-preview?screen=discover&band=prek`, { waitUntil: "networkidle" });
  await page.locator(".discovery-card").filter({ hasText: "Pack a picnic" }).click();
  await page.getByRole("button", { name: "Let me try", exact: true }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Add one counter", exact: true }).click();
  const attempts = [];
  await page.route("**/api/discover-preview", async (route) => {
    attempts.push(route.request().postDataJSON().attempt);
    if (attempts.length === 1) await route.abort(); else await route.continue();
  });
  await page.getByRole("button", { name: "Check my thinking", exact: true }).click();
  await page.getByRole("button", { name: "Try saving again", exact: true }).click();
  await page.getByText("You worked it out.", { exact: true }).waitFor();
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0], attempts[1]);
  assert.equal(await page.locator("output").innerText(), "3");
  const unauthorized = await page.request.get(`${base}/api/discover?profile=unknown`);
  assert.equal(unauthorized.status(), 401);
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/results.json`, JSON.stringify({ results, errors, retryPreservesAttempt: true, unauthenticatedBlocked: true, scope: "Real browser to development preview API; production route tested with isolated repository mocks, not a live family database." }, null, 2));
  console.log("PASS: 48 lesson flows; desktop/tablet/phone; filters, empty state, pause, retry, focus restoration, and auth boundary.");
} finally { await browser.close(); }
