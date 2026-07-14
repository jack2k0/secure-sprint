import { describe, expect, it } from "vitest";

import { assessStoryReadiness, type StoryReadinessInput } from "./readiness";

const readyStory: StoryReadinessInput = {
  goal: "Protect privileged accounts from unnecessary access.",
  recipientOrArea: "Identity and access management",
  description: "Review and remove stale privileged group memberships.",
  implementationSteps: ["Export current privileged memberships.", "Remove stale access."],
  definitionOfDone: "Stale access is removed and the review evidence is attached.",
  definitionOfDoneChecklist: ["Evidence attached"],
};

describe("assessStoryReadiness", () => {
  it("marks a story with every required planning condition as ready", () => {
    expect(assessStoryReadiness(readyStory)).toEqual({ isReady: true, missingFields: [] });
  });

  it.each([
    ["goal", "goal"],
    ["recipientOrArea", "recipientOrArea"],
    ["description", "description"],
    ["definitionOfDone", "definitionOfDone"],
  ] as const)("reports a missing %s", (field, expectedMissingField) => {
    const result = assessStoryReadiness({ ...readyStory, [field]: "   " });

    expect(result).toEqual({ isReady: false, missingFields: [expectedMissingField] });
  });

  it("reports an empty implementation step list", () => {
    expect(assessStoryReadiness({ ...readyStory, implementationSteps: [] })).toEqual({
      isReady: false,
      missingFields: ["implementationSteps"],
    });
  });

  it("reports an implementation step list containing only whitespace", () => {
    expect(assessStoryReadiness({ ...readyStory, implementationSteps: [" "] })).toEqual({
      isReady: false,
      missingFields: ["implementationSteps"],
    });
  });

  it("reports an empty Definition of Done checklist", () => {
    expect(assessStoryReadiness({ ...readyStory, definitionOfDoneChecklist: [] })).toEqual({
      isReady: false,
      missingFields: ["definitionOfDoneChecklist"],
    });
  });

  it("reports a Definition of Done checklist containing only whitespace", () => {
    expect(assessStoryReadiness({ ...readyStory, definitionOfDoneChecklist: ["\n"] })).toEqual({
      isReady: false,
      missingFields: ["definitionOfDoneChecklist"],
    });
  });
});
