import { z } from "zod";
import { assessStoryReadiness, type StoryReadinessPayload } from "@/lib/readiness";
import type { BacklogStory } from "@/types";

export const softGapSchema = z.object({
  field: z.enum([
    "title",
    "goal",
    "recipientOrArea",
    "description",
    "implementationSteps",
    "definitionOfDone",
    "definitionOfDoneChecklist",
    "general",
  ]),
  severity: z.enum(["info", "warning"]),
  message: z.string().min(1).max(500),
  suggestedText: z.string().max(4000).optional(),
});

export const aiReviewResponseSchema = z.object({
  summary: z.string().min(1).max(1000),
  softGaps: z.array(softGapSchema).max(20),
});

export type SoftGap = z.infer<typeof softGapSchema>;
export type AiReviewModelPayload = z.infer<typeof aiReviewResponseSchema>;

export interface StoryAiReviewResult {
  hardGaps: StoryReadinessPayload;
  softGaps: SoftGap[];
  summary: string;
  source: "ai" | "hard-only";
}

/** Pure merge: hard readiness always from assessStoryReadiness; soft gaps from parsed model JSON. */
export function mergeStoryAiReview(
  story: Pick<
    BacklogStory,
    | "goal"
    | "recipientOrArea"
    | "description"
    | "implementationSteps"
    | "definitionOfDone"
    | "definitionOfDoneChecklist"
  >,
  modelPayload: unknown,
): StoryAiReviewResult {
  const hardGaps = assessStoryReadiness({
    goal: story.goal,
    recipientOrArea: story.recipientOrArea,
    description: story.description,
    implementationSteps: story.implementationSteps,
    definitionOfDone: story.definitionOfDone,
    definitionOfDoneChecklist: story.definitionOfDoneChecklist.map((item) => item.label),
  });

  if (modelPayload === null) {
    return {
      hardGaps,
      softGaps: [],
      summary: hardGaps.isReady
        ? "Hard readiness checks passed. AI suggestions unavailable."
        : "Hard readiness checks found missing planning fields. AI suggestions unavailable.",
      source: "hard-only",
    };
  }

  const parsed = aiReviewResponseSchema.safeParse(modelPayload);
  if (!parsed.success) {
    return {
      hardGaps,
      softGaps: [],
      summary: "AI returned an unusable response; only hard readiness checks are shown.",
      source: "hard-only",
    };
  }

  return {
    hardGaps,
    softGaps: parsed.data.softGaps,
    summary: parsed.data.summary,
    source: "ai",
  };
}

export function buildStoryReviewUserPrompt(story: BacklogStory): string {
  return JSON.stringify(
    {
      title: story.title,
      goal: story.goal,
      recipientOrArea: story.recipientOrArea,
      description: story.description,
      implementationSteps: story.implementationSteps,
      definitionOfDone: story.definitionOfDone,
      definitionOfDoneChecklist: story.definitionOfDoneChecklist.map((item) => item.label),
      boardPosition: story.boardPosition,
    },
    null,
    2,
  );
}

export const STORY_REVIEW_SYSTEM_PROMPT = `You are a Cybersecurity backlog planning coach for SecureSprint.
Hard readiness (empty fields) is computed by the application — do not invent a different ready rule.
Return ONLY valid JSON matching:
{"summary": string, "softGaps": [{"field": string, "severity": "info"|"warning", "message": string, "suggestedText"?: string}]}
Focus on quality: vague goals, non-verifiable DoD, missing steps, weak scope.
Keep messages concrete and short. No secrets or credentials in suggestions.`;
