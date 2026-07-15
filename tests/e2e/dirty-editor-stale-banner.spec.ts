import { test, expect } from "@playwright/test";

/**
 * Risk (S-07 / FR-013): unsaved editor draft silently replaced when remote updates the same story.
 * Assert: stale banner appears; draft keeps local edits; Reload applies remote snapshot.
 */
test.describe("dirty editor stale banner", () => {
  test("keeps local draft, shows banner, Reload applies remote title", async ({ page }) => {
    const title = `E2E-dirty-${Date.now()}`;
    const localTitle = `${title}-LOCAL-EDIT`;
    const remoteTitle = `${title}-REMOTE`;

    await page.goto("/app");
    await expect(page.getByRole("heading", { name: /cybersecurity backlog/i })).toBeVisible();

    await page.getByLabel(/new backlog story/i).fill(title);
    await page.getByRole("button", { name: /create draft/i }).click();
    const dialog = page.locator('[role="dialog"][aria-label="Backlog story details"]');
    await dialog.waitFor({ state: "visible" });

    const summary = dialog.getByLabel(/summary/i);
    await summary.fill(localTitle);

    const list = await page.request.get("/api/stories");
    const payload = (await list.json()) as { stories: { id: string; title: string }[] };
    const created = payload.stories.find((item) => item.title === title);
    if (!created) throw new Error("created story not found in list");
    const storyId = created.id;

    const patch = await page.request.patch(`/api/stories/${storyId}`, {
      data: {
        title: remoteTitle,
        description: "Remote description change",
      },
      headers: { Origin: new URL(page.url()).origin },
    });
    expect(patch.ok()).toBeTruthy();

    await expect(dialog.getByText(/updated elsewhere/i)).toBeVisible({ timeout: 15_000 });
    await expect(summary).toHaveValue(localTitle);

    // Reload must apply remote snapshot (not re-apply local baseline)
    await dialog.getByRole("button", { name: /reload remote version/i }).click();
    await expect(dialog.getByText(/updated elsewhere/i)).toHaveCount(0);
    await expect(summary).toHaveValue(remoteTitle);

    await page.request.delete(`/api/stories/${storyId}`, {
      headers: { Origin: new URL(page.url()).origin },
    });
  });
});
