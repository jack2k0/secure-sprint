import { describe, expect, it } from "vitest";

import { isStoryEditorDirty, mergeStoriesFromRemote, resolveLiveBoardUpdate } from "./board-sync";
import type { BacklogStory } from "@/types";

function story(partial: Partial<BacklogStory> & Pick<BacklogStory, "id" | "title">): BacklogStory {
  return {
    goal: null,
    recipientOrArea: null,
    description: null,
    implementationSteps: [],
    definitionOfDone: null,
    definitionOfDoneChecklist: [],
    assignedTo: null,
    boardPosition: "draft",
    sortOrder: 0,
    createdBy: "user-1",
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z",
    archivedAt: null,
    ...partial,
  };
}

describe("mergeStoriesFromRemote", () => {
  it("adds stories present only on remote", () => {
    const local = [story({ id: "a", title: "A" })];
    const remote = [story({ id: "a", title: "A" }), story({ id: "b", title: "B" })];
    expect(mergeStoriesFromRemote(local, remote).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("updates fields from remote", () => {
    const local = [story({ id: "a", title: "Old", boardPosition: "draft" })];
    const remote = [story({ id: "a", title: "New", boardPosition: "ready" })];
    expect(mergeStoriesFromRemote(local, remote)[0]).toMatchObject({
      title: "New",
      boardPosition: "ready",
    });
  });

  it("removes stories missing from remote (archived)", () => {
    const local = [story({ id: "a", title: "A" }), story({ id: "b", title: "B" })];
    const remote = [story({ id: "b", title: "B" })];
    expect(mergeStoriesFromRemote(local, remote).map((s) => s.id)).toEqual(["b"]);
  });

  it("follows remote order", () => {
    const local = [story({ id: "a", title: "A" }), story({ id: "b", title: "B" })];
    const remote = [story({ id: "b", title: "B" }), story({ id: "a", title: "A" })];
    expect(mergeStoriesFromRemote(local, remote).map((s) => s.id)).toEqual(["b", "a"]);
  });
});

describe("isStoryEditorDirty", () => {
  it("is false when snapshots match", () => {
    const base = story({ id: "a", title: "Same", goal: "G" });
    expect(isStoryEditorDirty(base, { ...base })).toBe(false);
  });

  it("is true when a planning field changes", () => {
    const base = story({ id: "a", title: "Same", goal: "G" });
    expect(isStoryEditorDirty(base, { ...base, goal: "Other" })).toBe(true);
  });
});

describe("resolveLiveBoardUpdate", () => {
  it("merges list when nothing is selected", () => {
    const result = resolveLiveBoardUpdate({
      localStories: [story({ id: "a", title: "A" })],
      remoteStories: [story({ id: "a", title: "A2" }), story({ id: "b", title: "B" })],
      selectedId: null,
      dirtyEditorDraft: null,
    });
    expect(result.stories).toHaveLength(2);
    expect(result.selectedId).toBeNull();
    expect(result.staleSelected).toBe(false);
  });

  it("clears selection when remote archived the open story", () => {
    const result = resolveLiveBoardUpdate({
      localStories: [story({ id: "a", title: "A" })],
      remoteStories: [],
      selectedId: "a",
      dirtyEditorDraft: story({ id: "a", title: "A", goal: "edited" }),
    });
    expect(result.selectedId).toBeNull();
    expect(result.selectedArchived).toBe(true);
    expect(result.stories).toEqual([]);
  });

  it("flags stale when dirty editor draft differs from remote", () => {
    const local = story({ id: "a", title: "Local", goal: "G1" });
    const remote = story({ id: "a", title: "Remote", goal: "G2" });
    const draft = { ...local, goal: "My unsaved edit" };
    const result = resolveLiveBoardUpdate({
      localStories: [local],
      remoteStories: [remote],
      selectedId: "a",
      dirtyEditorDraft: draft,
    });
    expect(result.staleSelected).toBe(true);
    expect(result.selectedId).toBe("a");
    expect(result.selectedRemote?.title).toBe("Remote");
    expect(result.stories[0].title).toBe("Remote");
  });

  it("does not flag stale when editor is clean even if remote differs", () => {
    const local = story({ id: "a", title: "Local" });
    const remote = story({ id: "a", title: "Remote" });
    const result = resolveLiveBoardUpdate({
      localStories: [local],
      remoteStories: [remote],
      selectedId: "a",
      dirtyEditorDraft: null,
    });
    expect(result.staleSelected).toBe(false);
    expect(result.selectedRemote?.title).toBe("Remote");
  });

  it("keeps staleSelected true on a second poll after board already absorbed remote", () => {
    const opened = story({ id: "a", title: "Opened", goal: "G1", updatedAt: "t1" });
    const remote = story({ id: "a", title: "Remote agent edit", goal: "G2", updatedAt: "t2" });
    const dirtyDraft = { ...opened, description: "typing locally" };

    const first = resolveLiveBoardUpdate({
      localStories: [opened],
      remoteStories: [remote],
      selectedId: "a",
      dirtyEditorDraft: dirtyDraft,
    });
    expect(first.staleSelected).toBe(true);
    expect(first.stories[0].title).toBe("Remote agent edit");

    // Second poll: local board is already the remote merge from poll 1.
    const second = resolveLiveBoardUpdate({
      localStories: first.stories,
      remoteStories: [remote],
      selectedId: "a",
      dirtyEditorDraft: dirtyDraft,
    });
    expect(second.staleSelected).toBe(true);
    expect(second.selectedRemote?.title).toBe("Remote agent edit");
  });

  it("clears stale when dirty draft is reloaded to match remote", () => {
    const remote = story({ id: "a", title: "Remote", goal: "G2" });
    const result = resolveLiveBoardUpdate({
      localStories: [remote],
      remoteStories: [remote],
      selectedId: "a",
      dirtyEditorDraft: null,
    });
    expect(result.staleSelected).toBe(false);
  });
});
