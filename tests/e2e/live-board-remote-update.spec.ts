import { test, expect } from "@playwright/test";

/**
 * Risk (test-plan extension / S-07 FR-013): remote story changes not visible without full reload.
 * Browser fit: open board must merge authenticated list poll (≤ ~4–8s) after API create.
 * Boundaries: real auth, real API; second client = page.request with same storageState cookies.
 */
test.describe("live board remote update", () => {
  test("card appears after remote API create without page reload", async ({ page }) => {
    const title = `E2E-live-${Date.now()}`;

    await page.goto("/app");
    await expect(page.getByRole("heading", { name: /cybersecurity backlog/i })).toBeVisible();

    // Baseline: title not present
    await expect(page.getByRole("button", { name: new RegExp(title) })).toHaveCount(0);

    // Remote client creates story via the same session cookies (agent/API path)
    const create = await page.request.post("/api/stories", {
      data: { title },
      headers: { Origin: new URL(page.url()).origin },
    });
    expect(create.ok()).toBeTruthy();
    const body = (await create.json()) as { story: { id: string } };
    const storyId = body.story.id;

    // Board poll should surface the new card without F5
    await expect(page.getByRole("button", { name: new RegExp(title) })).toBeVisible({
      timeout: 12_000,
    });

    // Cleanup via API
    const del = await page.request.delete(`/api/stories/${storyId}`, {
      headers: { Origin: new URL(page.url()).origin },
    });
    expect(del.status()).toBe(204);

    await expect(page.getByRole("button", { name: new RegExp(title) })).toHaveCount(0, {
      timeout: 12_000,
    });
  });
});
