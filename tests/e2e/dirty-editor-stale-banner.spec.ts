import { test, expect } from "@playwright/test";

/**
 * Risk (S-07 / FR-013): unsaved editor draft silently replaced when remote updates the same story.
 * Assert: stale banner appears; draft title field keeps local edits.
 */
test.describe("dirty editor stale banner", () => {
  test("keeps local draft and shows reload banner after remote PATCH", async ({ page }) => {
    const title = `E2E-dirty-${Date.now()}`;
    const localTitle = `${title}-LOCAL-EDIT`;

    await page.goto("/app");
    await expect(page.getByRole("heading", { name: /cybersecurity backlog/i })).toBeVisible();

    await page.getByLabel(/new backlog story/i).fill(title);
    await page.getByRole("button", { name: /create draft/i }).click();
    const dialog = page.locator('[role="dialog"][aria-label="Backlog story details"]');
    await dialog.waitFor({ state: "visible" });

    // Dirty the open editor
    const summary = dialog.getByLabel(/summary/i);
    await summary.fill(localTitle);

    // Remote update same story via authenticated API
    const list = await page.request.get("/api/stories");
    const payload = (await list.json()) as { stories: { id: string; title: string }[] };
    // Story still has original title on server until save
    const created = payload.stories.find((item) => item.title === title);
    if (!created) throw new Error("created story not found in list");
    const storyId = created.id;

    const patch = await page.request.patch(`/api/stories/${storyId}`, {
      data: {
        title: `${title}-REMOTE`,
        description: "Remote description change",
      },
      headers: { Origin: new URL(page.url()).origin },
    });
    expect(patch.ok()).toBeTruthy();

    // Poll should surface banner without clobbering local draft
    await expect(dialog.getByText(/updated elsewhere/i)).toBeVisible({ timeout: 15_000 });
    await expect(summary).toHaveValue(localTitle);

    // Cleanup
    await page.request.delete(`/api/stories/${storyId}`, {
      headers: { Origin: new URL(page.url()).origin },
    });
  });
});
