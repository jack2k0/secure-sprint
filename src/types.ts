import type { ReadinessField } from "@/lib/readiness";

export const BOARD_POSITIONS = ["draft", "refining", "ready"] as const;

export type BoardPosition = (typeof BOARD_POSITIONS)[number];

export interface DefinitionOfDoneItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  displayName: string;
}

export interface BacklogStory {
  id: string;
  title: string;
  goal: string | null;
  recipientOrArea: string | null;
  description: string | null;
  implementationSteps: string[];
  definitionOfDone: string | null;
  definitionOfDoneChecklist: DefinitionOfDoneItem[];
  assignedTo: string | null;
  boardPosition: BoardPosition;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface StoryReadinessResult {
  isReady: boolean;
  missingFields: ReadinessField[];
}
