import { describe, expect, it } from "vitest";

import { assessStoryReadiness, readinessForStory, toReadinessInput, type StoryReadinessPayload } from "./readiness";
import type { BacklogStory } from "@/types";

function makeStory(overrides: Partial<BacklogStory> = {}): BacklogStory {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Audit MFA for VPN",
    goal: "Protect remote access accounts.",
    recipientOrArea: "Network security",
    description: "Review MFA enrollment for VPN users and close gaps.",
    implementationSteps: ["Export VPN users", "Check MFA enrollment"],
    definitionOfDone: "Every active VPN account has MFA or an exception ticket.",
    definitionOfDoneChecklist: [
      { id: "22222222-2222-4222-8222-222222222222", label: "Evidence attached", completed: false },
    ],
    assignedTo: null,
    boardPosition: "refining",
    sortOrder: 0,
    createdBy: "33333333-3333-4333-8333-333333333333",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
    archivedAt: null,
    ...overrides,
  };
}

/** Same shape agents receive on GET /api/stories/:id and GET /api/stories/:id/readiness. */
function agentReadinessEnvelope(story: BacklogStory): { readiness: StoryReadinessPayload } {
  return { readiness: readinessForStory(story) };
}

describe("agent readiness API contract", () => {
  it("exposes isReady and missingFields for a complete story", () => {
    const payload = agentReadinessEnvelope(makeStory());

    expect(payload).toEqual({
      readiness: { isReady: true, missingFields: [] },
    });
    expect(Object.keys(payload.readiness).sort()).toEqual(["isReady", "missingFields"]);
  });

  it("exposes expected missing fields for an incomplete draft", () => {
    const draft = makeStory({
      goal: null,
      recipientOrArea: null,
      description: null,
      implementationSteps: [],
      definitionOfDone: null,
      definitionOfDoneChecklist: [],
    });
    const payload = agentReadinessEnvelope(draft);

    expect(payload.readiness.isReady).toBe(false);
    expect(payload.readiness.missingFields).toEqual([
      "goal",
      "recipientOrArea",
      "description",
      "implementationSteps",
      "definitionOfDone",
      "definitionOfDoneChecklist",
    ]);
  });

  it("uses assessStoryReadiness — not a second rule — for story objects", () => {
    const story = makeStory({ goal: "  ", implementationSteps: [" "] });
    const fromHelper = readinessForStory(story);
    const fromPure = assessStoryReadiness(toReadinessInput(story));

    expect(fromHelper).toEqual(fromPure);
    expect(fromHelper).toEqual({
      isReady: false,
      missingFields: ["goal", "implementationSteps"],
    });
  });

  it("maps checklist item labels into the evaluator", () => {
    const story = makeStory({
      definitionOfDoneChecklist: [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", label: "  ", completed: false }],
    });

    expect(readinessForStory(story).missingFields).toContain("definitionOfDoneChecklist");
    expect(toReadinessInput(story).definitionOfDoneChecklist).toEqual(["  "]);
  });

  it("matches dedicated readiness route envelope fields", () => {
    const story = makeStory({ goal: null });
    const dedicated = {
      storyId: story.id,
      readiness: readinessForStory(story),
    };

    expect(dedicated.storyId).toBe(story.id);
    expect(dedicated.readiness.isReady).toBe(false);
    expect(dedicated.readiness.missingFields).toContain("goal");
  });
});
