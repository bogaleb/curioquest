import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";

const executablePath = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome"].find(existsSync);
const browser = await chromium.launch({ executablePath, headless: true });
const base = process.env.CURIO_TEST_URL || "http://localhost:5173";
const errors = [];
mkdirSync("outputs", { recursive: true });
try {
  for (const width of [1440, 820, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/kid-preview?screen=world`, { waitUntil: "networkidle" });
    await page.locator(".atlas-card").first().waitFor();
    assert.equal(await page.locator(".atlas-card").count(), 11);
    await page.screenshot({ path: `outputs/world-guide-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Make", exact: true }).click();
    assert.equal(await page.locator(".atlas-card").count(), 2);
    await page.getByRole("button", { name: "All places", exact: true }).click();
    for (let i = 0; i < 11; i++) {
      await page.locator(".atlas-card").nth(i).click();
      await page.locator(".atlas-detail").waitFor();
      assert.equal(await page.locator(".atlas-steps li").count(), 3);
      assert.ok(await page.locator(".atlas-detail .primary").isEnabled());
      await page.getByRole("button", { name: "All places", exact: true }).click();
    }
    await page.getByRole("button", { name: "Creature Grove Grove", exact: true }).click();
    await page.getByRole("button", { name: "A feather", exact: true }).click();
    assert.match(await page.locator(".grove-feedback").innerText(), /try again/);
    assert.ok(await page.getByRole("button", { name: "Keep this discovery" }).isDisabled());
    for (const [creature, answer] of [["Snail", "Its shell"], ["Butterfly", "Its wings"], ["Bird", "Feathers"]]) {
      await page.getByRole("button", { name: creature, exact: true }).click();
      await page.getByRole("button", { name: answer, exact: true }).click();
      await page.getByRole("button", { name: "Keep this discovery" }).click();
      assert.ok(await page.getByRole("button", { name: "Added to field notes" }).isDisabled());
    }
    assert.match(await page.locator(".grove-notebook").innerText(), /3 little discoveries/);
    await page.screenshot({ path: `outputs/creature-grove-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "My Treehouse Room", exact: true }).click();
    await page.locator(".kid-room-bag-items button").first().click();
    assert.ok(await page.locator(".spot-desk .kid-room-place").isEnabled());
    await page.locator(".spot-desk .kid-room-place").click();
    assert.equal(await page.locator(".spot-desk .kid-room-place").getAttribute("data-filled"), "true");
    await page.getByRole("button", { name: "Cancel selection", exact: true }).click();
    assert.ok(await page.locator(".spot-desk .kid-room-place").isDisabled());
    await page.locator(".spot-desk .kid-room-return").click();
    assert.equal(await page.locator(".spot-desk .kid-room-place").getAttribute("data-filled"), null);
    await page.screenshot({ path: `outputs/treehouse-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Creature Grove Grove", exact: true }).click();
    assert.match(await page.locator(".grove-notebook").innerText(), /3 little discoveries/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `Horizontal overflow at ${width}px`);
    const animation = await page.locator(".grove-animal").evaluate((node) => getComputedStyle(node).animationName);
    assert.equal(animation, "none", "Reduced motion must disable creature animation");
    await context.close();
    console.log(`PASS ${width}px: 11 previews, filters, answers, notes, placement, reduced motion, no overflow`);
  }
  assert.deepEqual(errors, [], "Browser runtime errors");
} finally {
  await browser.close();
}
