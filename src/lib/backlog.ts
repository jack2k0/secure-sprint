import type { BacklogStory, BoardPosition, DefinitionOfDoneItem, TeamMember } from "@/types";

interface DatabaseStory {
  id: string;
  title: string;
  goal: string | null;
  recipient_or_area: string | null;
  description: string | null;
  implementation_steps: unknown;
  definition_of_done: string | null;
  definition_of_done_checklist: unknown;
  assigned_to: string | null;
  board_position: BoardPosition;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

function asTextList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asChecklist(value: unknown): DefinitionOfDoneItem[] {
  if (!Array.isArray(value)) return [];

  const items: unknown[] = value;
  return items.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.label !== "string" ||
      typeof candidate.completed !== "boolean"
    ) {
      return [];
    }
    return [{ id: candidate.id, label: candidate.label, completed: candidate.completed }];
  });
}

export function mapStory(row: unknown): BacklogStory {
  const databaseRow = row as DatabaseStory;
  return {
    id: databaseRow.id,
    title: databaseRow.title,
    goal: databaseRow.goal,
    recipientOrArea: databaseRow.recipient_or_area,
    description: databaseRow.description,
    implementationSteps: asTextList(databaseRow.implementation_steps),
    definitionOfDone: databaseRow.definition_of_done,
    definitionOfDoneChecklist: asChecklist(databaseRow.definition_of_done_checklist),
    assignedTo: databaseRow.assigned_to,
    boardPosition: databaseRow.board_position,
    sortOrder: databaseRow.sort_order,
    createdBy: databaseRow.created_by,
    createdAt: databaseRow.created_at,
    updatedAt: databaseRow.updated_at,
    archivedAt: databaseRow.archived_at,
  };
}

export function mapTeamMember(row: { id: string; display_name: string }): TeamMember {
  return { id: row.id, displayName: row.display_name };
}
