/**
 * One-shot badge evidence screenshots (not part of CI suite).
 * BADGE_OUT=... DEMO_EMAIL=... DEMO_PASSWORD=... node tests/e2e/capture-badge-screenshots.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4321";
const out = process.env.BADGE_OUT || path.join(process.cwd(), "tmp", "badge-screenshots");
const email = process.env.DEMO_EMAIL || process.env.E2E_EMAIL;
const password = process.env.DEMO_PASSWORD || process.env.E2E_PASSWORD;

fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

/**
 * Forms on this app are React islands. A `fill` that lands before hydration is
 * accepted by the DOM but dropped from React state, so the form submits empty.
 * Re-fill until the controlled value sticks.
 */
async function fillHydrated(locator, value) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await locator.fill(value);
    await page.waitForTimeout(250);
    if ((await locator.inputValue()) === value) {
      return;
    }
  }
  throw new Error(`field never held its value after hydration retries: ${value}`);
}

await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
await page.screenshot({ path: path.join(out, "00-landing.png"), fullPage: true });

await page.goto(`${base}/auth/signin`, { waitUntil: "domcontentloaded" });
await page.screenshot({ path: path.join(out, "01-signin.png"), fullPage: true });

if (!email || !password) {
  console.error(JSON.stringify({ ok: false, reason: "missing credentials" }));
  await browser.close();
  process.exit(2);
}

await fillHydrated(page.getByLabel("Email"), email);
await fillHydrated(page.getByLabel("Password", { exact: true }), password);

await page.getByRole("button", { name: /sign in/i }).click();
try {
  await page.waitForURL(/\/app/, { timeout: 25_000 });
} catch {
  const shown = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim().slice(0, 200);
  throw new Error(`sign-in did not reach /app (still ${page.url()}). Page text: ${shown}`);
}
await page.getByRole("heading", { name: /cybersecurity backlog/i }).waitFor({ timeout: 15_000 });
// The board fetches stories and team members on mount; settling here means the
// island has hydrated and its controlled inputs will accept a fill.
await page.waitForLoadState("networkidle");

// (a) post-login board
await page.screenshot({ path: path.join(out, "02-post-login-board.png"), fullPage: true });

// (b) story form — create draft and wait for dialog
const title = `Badge-shot-${Date.now()}`;
await fillHydrated(page.getByLabel(/new backlog story/i), title);
const createWait = page.waitForResponse(
  (r) => r.url().includes("/api/stories") && r.request().method() === "POST",
  { timeout: 15_000 },
);
await page.getByRole("button", { name: /create draft/i }).click();
const createRes = await createWait;
if (!createRes.ok()) {
  throw new Error(`create failed: ${createRes.status()}`);
}

const dialog = page.locator('[role="dialog"][aria-label="Backlog story details"]');
await dialog.waitFor({ state: "visible", timeout: 15_000 });
await page.screenshot({ path: path.join(out, "03-story-form-refinement.png"), fullPage: true });

// close editor
await page.locator('[aria-label="Close editor"]').click();
await dialog.waitFor({ state: "hidden", timeout: 10_000 });

// (c) board with data — ensure our card is visible
await page.getByRole("button", { name: new RegExp(title) }).waitFor({ state: "visible", timeout: 10_000 });
await page.screenshot({ path: path.join(out, "04-board-data-display.png"), fullPage: true });

console.log(
  JSON.stringify({
    ok: true,
    files: fs.readdirSync(out).filter((f) => f.endsWith(".png")),
  }),
);
await browser.close();
