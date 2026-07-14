import { z } from "zod";

export const boardPositionSchema = z.enum(["draft", "refining", "ready"]);

const nullableText = z.string().trim().max(10_000).nullable().optional();

const checklistItemSchema = z.object({
  id: z.uuid(),
  label: z.string().trim().min(1).max(500),
  completed: z.boolean(),
});

export const createStorySchema = z.object({
  title: z.string().trim().min(1).max(180).default("Untitled backlog item"),
});

export const updateStorySchema = z
  .object({
    title: z.string().trim().min(1).max(180).optional(),
    goal: nullableText,
    recipientOrArea: nullableText,
    description: nullableText,
    implementationSteps: z.array(z.string().trim().min(1).max(2_000)).max(50).optional(),
    definitionOfDone: nullableText,
    definitionOfDoneChecklist: z.array(checklistItemSchema).max(50).optional(),
    assignedTo: z.uuid().nullable().optional(),
    boardPosition: boardPositionSchema.optional(),
    sortOrder: z.number().min(0).optional(),
  })
  .strict();

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;

export function toDatabaseUpdate(input: UpdateStoryInput) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.goal !== undefined ? { goal: input.goal ?? null } : {}),
    ...(input.recipientOrArea !== undefined ? { recipient_or_area: input.recipientOrArea ?? null } : {}),
    ...(input.description !== undefined ? { description: input.description ?? null } : {}),
    ...(input.implementationSteps !== undefined ? { implementation_steps: input.implementationSteps } : {}),
    ...(input.definitionOfDone !== undefined ? { definition_of_done: input.definitionOfDone ?? null } : {}),
    ...(input.definitionOfDoneChecklist !== undefined
      ? { definition_of_done_checklist: input.definitionOfDoneChecklist }
      : {}),
    ...(input.assignedTo !== undefined ? { assigned_to: input.assignedTo } : {}),
    ...(input.boardPosition !== undefined ? { board_position: input.boardPosition } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  };
}
