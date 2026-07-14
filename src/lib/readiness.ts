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
