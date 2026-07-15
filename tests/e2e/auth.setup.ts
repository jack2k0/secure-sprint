import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const authFile = path.join("playwright", ".auth", "user.json");

/**
 * One-time sign-in → storageState for remaining E2E specs.
 * Credentials: E2E_EMAIL / E2E_PASSWORD (or DEMO_EMAIL / DEMO_PASSWORD).
 * Never commit secrets.
 */
setup("authenticate demo user", async ({ page }) => {
  const email = process.env.E2E_EMAIL ?? process.env.DEMO_EMAIL ?? "specialist@securesprint.demo";
  const password = process.env.E2E_PASSWORD ?? process.env.DEMO_PASSWORD ?? "SecureSprint!2026";

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /cybersecurity backlog/i })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
