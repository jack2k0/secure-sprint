import type { BacklogStory } from "@/types";

/** Fields the story editor can change (used for dirty detection). */
export type StoryEditorSnapshot = Pick<
  BacklogStory,
  | "title"
  | "goal"
  | "recipientOrArea"
  | "description"
  | "implementationSteps"
  | "definitionOfDone"
  | "definitionOfDoneChecklist"
  | "assignedTo"
  | "boardPosition"
>;

function snapshotKey(story: StoryEditorSnapshot): string {
  return JSON.stringify({
    title: story.title,
    goal: story.goal ?? null,
    recipientOrArea: story.recipientOrArea ?? null,
    description: story.description ?? null,
    implementationSteps: story.implementationSteps,
    definitionOfDone: story.definitionOfDone ?? null,
    definitionOfDoneChecklist: story.definitionOfDoneChecklist,
    assignedTo: story.assignedTo ?? null,
    boardPosition: story.boardPosition,
  });
}

/** True when the editor draft differs from the baseline opened for that story. */
export function isStoryEditorDirty(baseline: StoryEditorSnapshot, draft: StoryEditorSnapshot): boolean {
  return snapshotKey(baseline) !== snapshotKey(draft);
}

/**
 * Replace local board state with the remote active-story list.
 * Archives disappear because they are absent from the remote active list.
 * Order follows the remote payload (API sort).
 */
export function mergeStoriesFromRemote(
  _localStories: readonly BacklogStory[],
  remoteStories: readonly BacklogStory[],
): BacklogStory[] {
  return remoteStories.map((story) => ({ ...story }));
}

export interface LiveBoardUpdateInput {
  localStories: readonly BacklogStory[];
  remoteStories: readonly BacklogStory[];
  selectedId: string | null;
  /**
   * Snapshot of the open editor draft when it has unsaved edits.
   * Compared to remote for stale detection — NOT the board list row (board already
   * absorbs remote on the first poll, so list comparison would clear the banner).
   * Null when the editor is clean or closed.
   */
  dirtyEditorDraft: StoryEditorSnapshot | null;
}

export interface LiveBoardUpdateResult {
  stories: BacklogStory[];
  selectedId: string | null;
  /** Remote copy of the selected story when still active; null if archived or none selected. */
  selectedRemote: BacklogStory | null;
  /**
   * True when a dirty editor draft differs from the remote story.
   * Stays true across later polls until the draft matches remote or is reloaded/saved.
   */
  staleSelected: boolean;
  /** True when the selected story was archived remotely. */
  selectedArchived: boolean;
}

/**
 * Apply a full remote active-story snapshot to board state and selected-editor policy.
 */
export function resolveLiveBoardUpdate(input: LiveBoardUpdateInput): LiveBoardUpdateResult {
  const stories = mergeStoriesFromRemote(input.localStories, input.remoteStories);
  const selectedId = input.selectedId;

  if (!selectedId) {
    return {
      stories,
      selectedId: null,
      selectedRemote: null,
      staleSelected: false,
      selectedArchived: false,
    };
  }

  const selectedRemote = stories.find((story) => story.id === selectedId) ?? null;

  if (!selectedRemote) {
    return {
      stories,
      selectedId: null,
      selectedRemote: null,
      staleSelected: false,
      selectedArchived: true,
    };
  }

  const draft = input.dirtyEditorDraft;
  const staleSelected = draft !== null && snapshotKey(draft) !== snapshotKey(selectedRemote);

  return {
    stories,
    selectedId,
    selectedRemote,
    staleSelected,
    selectedArchived: false,
  };
}
