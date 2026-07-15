import { test, expect } from "@playwright/test";

/**
 * Risk (test-plan.md): incomplete story incorrectly appears ready / missing fields not shown.
 * Browser fit: UI must surface readiness missing list after create + open editor.
 * Boundaries: real auth (storageState), real API/DB.
 */
test.describe("readiness incomplete UI", () => {
  test("new draft shows readiness missing items in the editor", async ({ page }) => {
    const title = `E2E-readiness-${Date.now()}`;

    await page.goto("/app");
    await expect(page.getByRole("heading", { name: /cybersecurity backlog/i })).toBeVisible();

    // Create a minimal draft (no planning fields)
    await page.getByLabel(/new backlog story/i).fill(title);
    await page.getByRole("button", { name: /create draft/i }).click();

    // Editor opens on create
    await expect(page.getByRole("dialog", { name: /backlog story details/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /refine before jira/i })).toBeVisible();

    // Incomplete story must not claim Ready for Jira in the readiness panel
    const readiness = page.getByRole("heading", { name: /readiness check/i }).locator("..");
    await expect(readiness.getByText(/complete these before transfer/i)).toBeVisible();
    await expect(readiness.getByText(/^goal$/i)).toBeVisible();
    await expect(readiness.getByText(/definition of done/i).first()).toBeVisible();
    await expect(readiness.getByText(/ready for jira/i)).toHaveCount(0);

    // Cleanup: archive if possible
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /archive/i }).click();
  });
});
