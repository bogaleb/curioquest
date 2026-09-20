/** Captures one route at one viewport. For quick visual checks during development. */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = `http://localhost:${arg("port", "5174")}`;
const OUT = arg("out", "ui-shots");
const VIEW = arg("view", "");
const W = Number(arg("w", "1440")), H = Number(arg("h", "900"));
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome"].find(existsSync);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const api = (p, d) => page.request.post(`${BASE}${p}`, { data: d, headers: { Origin: BASE } });
await page.goto(`${BASE}/auth/sign-in`, { waitUntil: "domcontentloaded" });
await api("/auth/session", { action: "sign-in", email: "curioquest-ui-check@example.com", password: "ui-verification-passphrase-2026" });
let g = await api("/api/parent", { action: "setup", pin: "246810" });
if (!g.ok()) await api("/api/parent", { action: "unlock", pin: "246810" });
const state = await (await page.request.get(`${BASE}/api/quest`)).json();
if (!state.profiles?.length) await api("/api/quest", { action: "create-profile", name: "Robin", band: "prek", grade: "prek", avatar: "fox", interests: ["space"], dailyGoal: 10 });
await page.goto(`${BASE}/${VIEW ? `?view=${VIEW}` : ""}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await page.screenshot({ path: `${OUT}/${VIEW || "home"}.png`, fullPage: process.argv.includes("--full") });
await browser.close();
console.log(`saved ${OUT}/${VIEW || "home"}.png`);
if (errors.length) { console.log("ERRORS:"); for (const e of [...new Set(errors)]) console.log(" -", e); }
