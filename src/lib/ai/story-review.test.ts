import { describe, expect, it } from "vitest";

import { mergeStoryAiReview } from "./story-review";
import type { BacklogStory } from "@/types";

const complete: Pick<
  BacklogStory,
  "goal" | "recipientOrArea" | "description" | "implementationSteps" | "definitionOfDone" | "definitionOfDoneChecklist"
> = {
  goal: "Protect remote access",
  recipientOrArea: "Network",
  description: "Scope text",
  implementationSteps: ["Step one"],
  definitionOfDone: "Done when MFA is on",
  definitionOfDoneChecklist: [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", label: "Evidence", completed: false }],
};

describe("mergeStoryAiReview", () => {
  it("uses hard-only path when model payload is null", () => {
    const result = mergeStoryAiReview(complete, null);
    expect(result.source).toBe("hard-only");
    expect(result.hardGaps.isReady).toBe(true);
    expect(result.softGaps).toEqual([]);
  });

  it("merges parsed soft gaps without changing hard readiness", () => {
    const result = mergeStoryAiReview(complete, {
      summary: "Tighten the DoD.",
      softGaps: [
        {
          field: "definitionOfDone",
          severity: "warning",
          message: "DoD is not measurable.",
          suggestedText: "Every VPN user has MFA or an exception ticket.",
        },
      ],
    });
    expect(result.source).toBe("ai");
    expect(result.hardGaps.isReady).toBe(true);
    expect(result.softGaps).toHaveLength(1);
    expect(result.softGaps[0]?.field).toBe("definitionOfDone");
  });

  it("falls back to hard-only when model JSON is invalid", () => {
    const result = mergeStoryAiReview({ ...complete, goal: null }, { not: "valid" });
    expect(result.source).toBe("hard-only");
    expect(result.hardGaps.isReady).toBe(false);
    expect(result.hardGaps.missingFields).toContain("goal");
  });
});
