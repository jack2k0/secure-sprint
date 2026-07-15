import { test, expect } from "@playwright/test";

/**
 * Seed exemplar for SecureSprint E2E.
 * Provenance: 10x-e2e quality levers — getByRole, wait-for-state, auth via storageState.
 * Risk anchor: authenticated user can reach the backlog workspace after session restore.
 */
test.describe("seed — authenticated workspace entry", () => {
  test("restored session lands on backlog board without sign-in UI", async ({ page }) => {
    // Plan: open protected workspace with storageState cookies already applied
    await page.goto("/app");

    // Assert: board chrome is visible (not redirected to sign-in)
    await expect(page.getByRole("heading", { name: /cybersecurity backlog/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create draft/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Draft", exact: true })).toBeVisible();
  });
});
