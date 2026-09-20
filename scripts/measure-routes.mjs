/**
 * Measures the JavaScript a single route actually downloads.
 *
 * Total bundle size is the wrong metric after a route split — splitting adds chunks
 * and raises the total while lowering what any one page needs. This loads a route with
 * a cold cache and sums the transferred JS.
 */
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = `http://localhost:${arg("port", "5174")}`;
const ROUTES = (arg("routes", "/,/create,/play,/parent")).split(",");
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
for (const route of ROUTES) {
  // A fresh context per route means no warm cache carrying chunks between them.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const api = (p, d) => page.request.post(`${BASE}${p}`, { data: d, headers: { Origin: BASE } });
  await page.goto(`${BASE}/auth/sign-in`, { waitUntil: "domcontentloaded" });
  await api("/auth/session", { action: "sign-in", email: "curioquest-ui-check@example.com", password: "ui-verification-passphrase-2026" });

  let bytes = 0, files = 0;
  page.on("response", async (response) => {
    if (!/\.js(\?|$)/.test(response.url())) return;
    try { bytes += (await response.body()).length; files += 1; } catch { /* redirect or aborted */ }
  });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  console.log(`${route.padEnd(10)} ${(bytes / 1024).toFixed(0).padStart(6)} KB across ${files} files`);
  await context.close();
}
await browser.close();
