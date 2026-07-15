export type ReadinessField =
  | "goal"
  | "recipientOrArea"
  | "description"
  | "implementationSteps"
  | "definitionOfDone"
  | "definitionOfDoneChecklist";

export interface StoryReadinessInput {
  goal: string | null | undefined;
  recipientOrArea: string | null | undefined;
  description: string | null | undefined;
  implementationSteps: readonly string[] | null | undefined;
  definitionOfDone: string | null | undefined;
  definitionOfDoneChecklist: readonly string[] | null | undefined;
}

export interface StoryReadiness {
  isReady: boolean;
  missingFields: ReadinessField[];
}

/** Machine-readable HTTP contract for agents and the UI. */
export interface StoryReadinessPayload {
  isReady: boolean;
  missingFields: ReadinessField[];
}

/** Minimal story shape for HTTP/UI mapping — avoids importing @/types (circular). */
export interface StoryReadinessSource {
  goal: string | null | undefined;
  recipientOrArea: string | null | undefined;
  description: string | null | undefined;
  implementationSteps: readonly string[] | null | undefined;
  definitionOfDone: string | null | undefined;
  definitionOfDoneChecklist: readonly { label: string }[] | readonly string[] | null | undefined;
}

const hasText = (value: string | null | undefined) => Boolean(value?.trim());

const hasItem = (values: readonly string[] | null | undefined) =>
  Boolean(values?.some((value) => value.trim().length > 0));

export function assessStoryReadiness(input: StoryReadinessInput): StoryReadiness {
  const missingFields: ReadinessField[] = [];

  if (!hasText(input.goal)) missingFields.push("goal");
  if (!hasText(input.recipientOrArea)) missingFields.push("recipientOrArea");
  if (!hasText(input.description)) missingFields.push("description");
  if (!hasItem(input.implementationSteps)) missingFields.push("implementationSteps");
  if (!hasText(input.definitionOfDone)) missingFields.push("definitionOfDone");
  if (!hasItem(input.definitionOfDoneChecklist)) missingFields.push("definitionOfDoneChecklist");

  return { isReady: missingFields.length === 0, missingFields };
}

export function checklistLabelsForReadiness(items: StoryReadinessSource["definitionOfDoneChecklist"]): string[] {
  if (!items) return [];
  return items.map((item) => (typeof item === "string" ? item : item.label));
}

/** Map a persisted/API story into the pure readiness evaluator input. */
export function toReadinessInput(story: StoryReadinessSource): StoryReadinessInput {
  return {
    goal: story.goal,
    recipientOrArea: story.recipientOrArea,
    description: story.description,
    implementationSteps: story.implementationSteps,
    definitionOfDone: story.definitionOfDone,
    definitionOfDoneChecklist: checklistLabelsForReadiness(story.definitionOfDoneChecklist),
  };
}

/** Single entry point for HTTP readiness responses — always uses assessStoryReadiness. */
export function readinessForStory(story: StoryReadinessSource): StoryReadinessPayload {
  return assessStoryReadiness(toReadinessInput(story));
}
