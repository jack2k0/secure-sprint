import { describe, expect, it } from "vitest";

import { readinessForStory } from "./readiness";
import { SEED_COMPLETE_STORIES, seedStoryTitles } from "./seed-stories";

describe("SEED_COMPLETE_STORIES", () => {
  it("contains exactly ten stories", () => {
    expect(SEED_COMPLETE_STORIES).toHaveLength(10);
  });

  it("has pairwise unique titles", () => {
    const titles = seedStoryTitles();
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("has distinct goals and recipient areas (not clones)", () => {
    const goals = SEED_COMPLETE_STORIES.map((s) => s.goal);
    const areas = SEED_COMPLETE_STORIES.map((s) => s.recipientOrArea);
    expect(new Set(goals).size).toBe(10);
    expect(new Set(areas).size).toBe(10);
  });

  it.each(SEED_COMPLETE_STORIES.map((story, index) => [index + 1, story.title, story] as const))(
    "story %i (%s) is ready under readinessForStory",
    (_n, _title, story) => {
      const readiness = readinessForStory(story);
      expect(readiness).toEqual({ isReady: true, missingFields: [] });
      expect(story.implementationSteps.length).toBeGreaterThan(0);
      expect(story.definitionOfDoneChecklist.length).toBeGreaterThan(0);
      expect(story.boardPosition).toBe("ready");
    },
  );
});
