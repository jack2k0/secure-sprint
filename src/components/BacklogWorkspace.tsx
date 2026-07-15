/* eslint-disable @typescript-eslint/no-confusing-void-expression */

import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Archive, Download, GripVertical, Plus, Save, Sparkles, X } from "lucide-react";
import type { SoftGap, StoryAiReviewResult } from "@/lib/ai/story-review";
import { isStoryEditorDirty, resolveLiveBoardUpdate, type StoryEditorSnapshot } from "@/lib/board-sync";
import { assessStoryReadiness } from "@/lib/readiness";
import { backlogToCsv } from "@/lib/csv";
import {
  BOARD_POSITIONS,
  type BacklogStory,
  type BoardPosition,
  type DefinitionOfDoneItem,
  type TeamMember,
} from "@/types";

const LIVE_POLL_MS = 4000;

const POSITION_LABEL: Record<BoardPosition, string> = {
  draft: "Draft",
  refining: "Refining",
  ready: "Ready for Jira",
};

const MISSING_FIELD_LABEL = {
  goal: "goal",
  recipientOrArea: "recipient or area",
  description: "scope description",
  implementationSteps: "implementation steps",
  definitionOfDone: "Definition of Done",
  definitionOfDoneChecklist: "a Definition of Done checklist item",
} as const;

interface WorkspaceResponse {
  stories: BacklogStory[];
}

interface MembersResponse {
  members: TeamMember[];
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(input, {
    headers,
    ...init,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Unable to complete this action.");
  }
  return (await response.json()) as T;
}

function checklistLabels(items: DefinitionOfDoneItem[]) {
  return items.map((item) => item.label);
}

function newChecklistItem(): DefinitionOfDoneItem {
  return { id: crypto.randomUUID(), label: "", completed: false };
}

function StoryCard({
  story,
  assigneeName,
  onOpen,
}: {
  story: BacklogStory;
  assigneeName: string | null;
  onOpen: (story: BacklogStory) => void;
}) {
  const readiness = assessStoryReadiness({
    goal: story.goal,
    recipientOrArea: story.recipientOrArea,
    description: story.description,
    implementationSteps: story.implementationSteps,
    definitionOfDone: story.definitionOfDone,
    definitionOfDoneChecklist: checklistLabels(story.definitionOfDoneChecklist),
  });

  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", story.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => {
        onOpen(story);
      }}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-cyan-400 hover:shadow"
    >
      <span className="mb-2 flex items-start gap-2 text-sm font-semibold text-slate-900">
        <GripVertical className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
        {story.title}
      </span>
      <span className={readiness.isReady ? "text-xs font-medium text-emerald-700" : "text-xs text-amber-700"}>
        {readiness.isReady ? "Ready for Jira" : `${readiness.missingFields.length} items to refine`}
      </span>
      {assigneeName ? <span className="mt-1 block text-xs text-slate-500">Assigned to {assigneeName}</span> : null}
    </button>
  );
}

function StoryEditor({
  story,
  members,
  remoteStale,
  remoteArchived,
  onEditorStateChange,
  onReloadFromRemote,
  onSaved,
  onArchived,
  onClose,
}: {
  story: BacklogStory;
  members: TeamMember[];
  remoteStale: boolean;
  remoteArchived: boolean;
  onEditorStateChange: (state: { dirty: boolean; draft: StoryEditorSnapshot | null }) => void;
  onReloadFromRemote: (remote: BacklogStory) => void;
  onSaved: (story: BacklogStory) => void;
  onArchived: (id: string) => void;
  onClose: () => void;
}) {
  const [baseline, setBaseline] = useState(story);
  const [draft, setDraft] = useState(story);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [aiReview, setAiReview] = useState<StoryAiReviewResult | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const readiness = assessStoryReadiness({
    goal: draft.goal,
    recipientOrArea: draft.recipientOrArea,
    description: draft.description,
    implementationSteps: draft.implementationSteps,
    definitionOfDone: draft.definitionOfDone,
    definitionOfDoneChecklist: checklistLabels(draft.definitionOfDoneChecklist),
  });

  useEffect(() => {
    const dirty = isStoryEditorDirty(baseline, draft);
    onEditorStateChange({ dirty, draft: dirty ? draft : null });
  }, [baseline, draft, onEditorStateChange]);

  function applyRemoteStory(next: BacklogStory) {
    setBaseline(next);
    setDraft(next);
    onEditorStateChange({ dirty: false, draft: null });
    onReloadFromRemote(next);
  }

  const remoteForReload = remoteStale ? story : null;

  function updateText(field: "title" | "goal" | "recipientOrArea" | "description" | "definitionOfDone", value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title: draft.title,
        goal: draft.goal,
        recipientOrArea: draft.recipientOrArea,
        description: draft.description,
        implementationSteps: draft.implementationSteps.filter((item) => item.trim()),
        definitionOfDone: draft.definitionOfDone,
        definitionOfDoneChecklist: draft.definitionOfDoneChecklist.filter((item) => item.label.trim()),
        assignedTo: draft.assignedTo,
        boardPosition: readiness.isReady ? draft.boardPosition : draft.boardPosition,
      };
      const response = await requestJson<{ story: BacklogStory }>(`/api/stories/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onSaved(response.story);
      setBaseline(response.story);
      setDraft(response.story);
      onEditorStateChange({ dirty: false, draft: null });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the story.");
    } finally {
      setIsSaving(false);
    }
  }

  async function requestAiReview() {
    setIsReviewing(true);
    setAiNotice(null);
    try {
      // Persist latest draft without closing the editor so the server reviews saved content.
      if (isStoryEditorDirty(baseline, draft)) {
        const payload = {
          title: draft.title,
          goal: draft.goal,
          recipientOrArea: draft.recipientOrArea,
          description: draft.description,
          implementationSteps: draft.implementationSteps.filter((item) => item.trim()),
          definitionOfDone: draft.definitionOfDone,
          definitionOfDoneChecklist: draft.definitionOfDoneChecklist.filter((item) => item.label.trim()),
          assignedTo: draft.assignedTo,
          boardPosition: draft.boardPosition,
        };
        const saved = await requestJson<{ story: BacklogStory }>(`/api/stories/${draft.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setBaseline(saved.story);
        setDraft(saved.story);
        onEditorStateChange({ dirty: false, draft: null });
        onSaved(saved.story);
      }
      const response = await requestJson<{
        review: StoryAiReviewResult;
        available: boolean;
        error?: string;
      }>(`/api/stories/${draft.id}/ai-review`, { method: "POST", body: "{}" });
      setAiReview(response.review);
      if (!response.available) {
        setAiNotice(response.error ?? "AI review unavailable; hard readiness only.");
      }
    } catch (cause) {
      setAiNotice(cause instanceof Error ? cause.message : "Unable to run AI review.");
    } finally {
      setIsReviewing(false);
    }
  }

  function applySuggestedText(gap: SoftGap) {
    if (!gap.suggestedText) return;
    if (gap.field === "goal") updateText("goal", gap.suggestedText);
    else if (gap.field === "recipientOrArea") updateText("recipientOrArea", gap.suggestedText);
    else if (gap.field === "description") updateText("description", gap.suggestedText);
    else if (gap.field === "definitionOfDone") updateText("definitionOfDone", gap.suggestedText);
    else if (gap.field === "title") updateText("title", gap.suggestedText);
  }

  async function archive() {
    if (!window.confirm("Archive this backlog story? It will disappear from the active board.")) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/stories/${draft.id}`, {
        method: "DELETE",
        headers: { Origin: window.location.origin },
      });
      if (!response.ok) throw new Error("Unable to archive the story.");
      onArchived(draft.id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to archive the story.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Backlog story details"
    >
      <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-medium text-cyan-700">Backlog story</p>
            <h2 className="text-lg font-bold text-slate-950">Refine before Jira</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close editor"
          >
            <X className="size-5" />
          </button>
        </div>

        {remoteArchived ? (
          <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-medium">This story was archived elsewhere.</p>
            <button type="button" onClick={onClose} className="mt-2 text-sm font-semibold text-cyan-800 underline">
              Close editor
            </button>
          </div>
        ) : null}

        {remoteStale && !remoteArchived && remoteForReload ? (
          <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-medium">This story was updated elsewhere. Your unsaved edits were kept.</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => applyRemoteStory(remoteForReload)}
                className="rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-800"
              >
                Reload remote version
              </button>
              <span className="self-center text-xs text-amber-900">or keep editing and save carefully</span>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <label className="block text-sm font-medium text-slate-800">
              Summary
              <input
                value={draft.title}
                onChange={(event) => updateText("title", event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Goal — what outcome do we need?
              <textarea
                value={draft.goal ?? ""}
                onChange={(event) => updateText("goal", event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Recipient or security area
              <input
                value={draft.recipientOrArea ?? ""}
                onChange={(event) => updateText("recipientOrArea", event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Description / scope
              <textarea
                value={draft.description ?? ""}
                onChange={(event) => updateText("description", event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Assignee
              <select
                value={draft.assignedTo ?? ""}
                onChange={(event) => setDraft((current) => ({ ...current, assignedTo: event.target.value || null }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">Implementation steps</legend>
              <div className="space-y-2">
                {draft.implementationSteps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={step}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          implementationSteps: current.implementationSteps.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Describe a concrete engineering step"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          implementationSteps: current.implementationSteps.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                      className="rounded px-2 text-slate-500 hover:bg-slate-100"
                      aria-label="Remove implementation step"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({ ...current, implementationSteps: [...current.implementationSteps, ""] }))
                  }
                  className="text-sm font-medium text-cyan-700 hover:underline"
                >
                  + Add implementation step
                </button>
              </div>
            </fieldset>

            <label className="block text-sm font-medium text-slate-800">
              Definition of Done
              <textarea
                value={draft.definitionOfDone ?? ""}
                onChange={(event) => updateText("definitionOfDone", event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="How will an engineer and manager know this is complete?"
              />
            </label>
            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">Definition of Done checklist</legend>
              <div className="space-y-2">
                {draft.definitionOfDoneChecklist.map((item, index) => (
                  <div key={item.id} className="flex gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          definitionOfDoneChecklist: current.definitionOfDoneChecklist.map((currentItem, itemIndex) =>
                            itemIndex === index ? { ...currentItem, completed: event.target.checked } : currentItem,
                          ),
                        }))
                      }
                    />
                    <input
                      value={item.label}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          definitionOfDoneChecklist: current.definitionOfDoneChecklist.map((currentItem, itemIndex) =>
                            itemIndex === index ? { ...currentItem, label: event.target.value } : currentItem,
                          ),
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Evidence or acceptance criterion"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          definitionOfDoneChecklist: current.definitionOfDoneChecklist.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                      className="rounded px-2 text-slate-500 hover:bg-slate-100"
                      aria-label="Remove Definition of Done item"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      definitionOfDoneChecklist: [...current.definitionOfDoneChecklist, newChecklistItem()],
                    }))
                  }
                  className="text-sm font-medium text-cyan-700 hover:underline"
                >
                  + Add DoD item
                </button>
              </div>
            </fieldset>
          </div>

          <aside className="h-fit space-y-4 rounded-xl bg-slate-50 p-4">
            <div>
              <h3 className="font-semibold text-slate-900">Readiness check</h3>
              {readiness.isReady ? (
                <p className="mt-2 text-sm font-medium text-emerald-700">Ready for Jira</p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-600">Complete these before transfer:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                    {readiness.missingFields.map((field) => (
                      <li key={field}>{MISSING_FIELD_LABEL[field]}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-900">AI quality review</h3>
              <p className="mt-1 text-xs text-slate-500">Optional. Hard readiness stays deterministic.</p>
              <button
                type="button"
                onClick={() => {
                  void requestAiReview();
                }}
                disabled={isReviewing || isSaving}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60"
              >
                <Sparkles className="size-4 text-cyan-700" />
                {isReviewing ? "Reviewing…" : "Suggest gaps with AI"}
              </button>
              {aiNotice ? <p className="mt-2 text-xs text-amber-800">{aiNotice}</p> : null}
              {aiReview ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-slate-700">{aiReview.summary}</p>
                  <ul className="space-y-2">
                    {aiReview.softGaps.map((gap) => (
                      <li
                        key={`${gap.field}-${gap.message}`}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700"
                      >
                        <p className="font-semibold text-slate-900">
                          {gap.severity}: {gap.field}
                        </p>
                        <p className="mt-1">{gap.message}</p>
                        {gap.suggestedText ? (
                          <button
                            type="button"
                            onClick={() => {
                              applySuggestedText(gap);
                            }}
                            className="mt-2 font-semibold text-cyan-700 hover:underline"
                          >
                            Apply suggested text
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
        {error ? <p className="mx-6 mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={archive}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Archive className="size-4" />
            Archive
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isSaving || !draft.title.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
          >
            <Save className="size-4" />
            {isSaving ? "Saving…" : "Save story"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface WorkspaceProps {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export default function BacklogWorkspace({ supabaseUrl = "", supabaseAnonKey = "" }: WorkspaceProps) {
  const [stories, setStories] = useState<BacklogStory[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedStory, setSelectedStory] = useState<BacklogStory | null>(null);
  /** Latest remote copy of the open story (for reload while dirty). */
  const [remoteSelected, setRemoteSelected] = useState<BacklogStory | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [staleSelected, setStaleSelected] = useState(false);
  const [selectedArchivedRemote, setSelectedArchivedRemote] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [liveHint, setLiveHint] = useState<string | null>(null);
  const storiesRef = useRef(stories);
  const selectedIdRef = useRef<string | null>(null);
  const editorDirtyRef = useRef(false);
  const dirtyEditorDraftRef = useRef<StoryEditorSnapshot | null>(null);
  const syncInFlight = useRef(false);

  storiesRef.current = stories;
  selectedIdRef.current = selectedStory?.id ?? null;
  editorDirtyRef.current = editorDirty;

  const handleEditorStateChange = useCallback((state: { dirty: boolean; draft: StoryEditorSnapshot | null }) => {
    setEditorDirty(state.dirty);
    editorDirtyRef.current = state.dirty;
    dirtyEditorDraftRef.current = state.draft;
  }, []);

  const applyRemoteStories = useCallback((remoteStories: BacklogStory[]) => {
    const result = resolveLiveBoardUpdate({
      localStories: storiesRef.current,
      remoteStories,
      selectedId: selectedIdRef.current,
      dirtyEditorDraft: dirtyEditorDraftRef.current,
    });
    setStories(result.stories);

    if (result.selectedArchived) {
      setSelectedArchivedRemote(true);
      setStaleSelected(false);
      setRemoteSelected(null);
      return;
    }

    setSelectedArchivedRemote(false);

    if (!result.selectedId || !result.selectedRemote) {
      setStaleSelected(false);
      setRemoteSelected(null);
      return;
    }

    setRemoteSelected(result.selectedRemote);
    setStaleSelected(result.staleSelected);

    if (!editorDirtyRef.current) {
      setSelectedStory(result.selectedRemote);
    }
  }, []);

  const refreshStoriesFromApi = useCallback(async () => {
    if (syncInFlight.current) return;
    syncInFlight.current = true;
    try {
      const storyResponse = await requestJson<WorkspaceResponse>("/api/stories");
      applyRemoteStories(storyResponse.stories);
      setLiveHint(null);
    } catch {
      // Live sync is best-effort; CRUD still works offline-from-channel.
      setLiveHint("Live board sync paused — save and refresh still work.");
    } finally {
      syncInFlight.current = false;
    }
  }, [applyRemoteStories]);

  useEffect(() => {
    Promise.all([requestJson<WorkspaceResponse>("/api/stories"), requestJson<MembersResponse>("/api/team-members")])
      .then(([storyResponse, memberResponse]) => {
        setStories(storyResponse.stories);
        setMembers(memberResponse.members);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load the workspace."))
      .finally(() => setLoading(false));
  }, []);

  // Poll while the tab is visible — primary live path (works with session cookies).
  useEffect(() => {
    if (loading) return;

    const tick = () => {
      if (document.visibilityState === "visible") {
        void refreshStoriesFromApi();
      }
    };

    const id = window.setInterval(tick, LIVE_POLL_MS);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [loading, refreshStoriesFromApi]);

  // Optional Supabase Realtime: faster signal to refetch the same authenticated list.
  useEffect(() => {
    if (loading || !supabaseUrl || !supabaseAnonKey) return;

    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    const channel = client
      .channel("backlog-stories-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "backlog_stories" }, () => {
        void refreshStoriesFromApi();
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [loading, supabaseUrl, supabaseAnonKey, refreshStoriesFromApi]);

  const storiesByPosition = useMemo(
    () =>
      Object.fromEntries(
        BOARD_POSITIONS.map((position) => [position, stories.filter((story) => story.boardPosition === position)]),
      ) as Record<BoardPosition, BacklogStory[]>,
    [stories],
  );
  const csvPreview = useMemo(() => backlogToCsv(stories, members), [stories, members]);

  async function createStory(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setError(null);
    try {
      const response = await requestJson<{ story: BacklogStory }>("/api/stories", {
        method: "POST",
        body: JSON.stringify({ title: newTitle }),
      });
      setStories((current) => [response.story, ...current]);
      setNewTitle("");
      openStory(response.story);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create the story.");
    }
  }

  async function moveStory(id: string, boardPosition: BoardPosition) {
    const previous = stories.find((story) => story.id === id);
    if (!previous || previous.boardPosition === boardPosition) return;
    const readiness = assessStoryReadiness({
      goal: previous.goal,
      recipientOrArea: previous.recipientOrArea,
      description: previous.description,
      implementationSteps: previous.implementationSteps,
      definitionOfDone: previous.definitionOfDone,
      definitionOfDoneChecklist: checklistLabels(previous.definitionOfDoneChecklist),
    });
    if (boardPosition === "ready" && !readiness.isReady) {
      setError("Complete the readiness check before moving a story to Ready for Jira.");
      return;
    }
    setStories((current) => current.map((story) => (story.id === id ? { ...story, boardPosition } : story)));
    try {
      const response = await requestJson<{ story: BacklogStory }>(`/api/stories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ boardPosition }),
      });
      setStories((current) => current.map((story) => (story.id === id ? response.story : story)));
    } catch (cause) {
      setStories((current) => current.map((story) => (story.id === id ? previous : story)));
      setError(cause instanceof Error ? cause.message : "Unable to move the story.");
    }
  }

  function openStory(story: BacklogStory) {
    setSelectedStory(story);
    setRemoteSelected(story);
    setEditorDirty(false);
    dirtyEditorDraftRef.current = null;
    setStaleSelected(false);
    setSelectedArchivedRemote(false);
  }

  function downloadCsv() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvPreview], { type: "text/csv;charset=utf-8" }));
    link.download = "securesprint-backlog.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-cyan-700">SecureSprint</p>
            <h1 className="text-xl font-bold">Cybersecurity backlog refinement</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportPreviewOpen(true)}
              disabled={stories.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="size-4" />
              Export CSV
            </button>
            <form method="POST" action="/api/auth/signout">
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <form
          onSubmit={createStory}
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
        >
          <label className="sr-only" htmlFor="new-story-title">
            New backlog story
          </label>
          <input
            id="new-story-title"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Capture a high-level Cybersecurity task…"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-800"
          >
            <Plus className="size-4" />
            Create draft
          </button>
        </form>
        {error ? (
          <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}
        {liveHint ? (
          <p className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{liveHint}</p>
        ) : null}
        {loading ? (
          <p className="text-sm text-slate-600">Loading backlog…</p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {BOARD_POSITIONS.map((position) => (
              <section
                key={position}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void moveStory(event.dataTransfer.getData("text/plain"), position);
                }}
                className="min-h-96 rounded-2xl bg-slate-200/70 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">{POSITION_LABEL[position]}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                    {storiesByPosition[position].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {storiesByPosition[position].map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      assigneeName={
                        story.assignedTo
                          ? (members.find((member) => member.id === story.assignedTo)?.displayName ?? null)
                          : null
                      }
                      onOpen={openStory}
                    />
                  ))}
                  {storiesByPosition[position].length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                      Drag a card here
                    </p>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      {selectedStory ? (
        <StoryEditor
          key={selectedStory.id}
          story={editorDirty || staleSelected ? selectedStory : (remoteSelected ?? selectedStory)}
          members={members}
          remoteStale={staleSelected}
          remoteArchived={selectedArchivedRemote}
          onEditorStateChange={handleEditorStateChange}
          onReloadFromRemote={(remote) => {
            setSelectedStory(remote);
            setRemoteSelected(remote);
            setStaleSelected(false);
            setEditorDirty(false);
            dirtyEditorDraftRef.current = null;
            setStories((current) => current.map((item) => (item.id === remote.id ? remote : item)));
          }}
          onSaved={(story) => {
            setStories((current) => current.map((item) => (item.id === story.id ? story : item)));
            setSelectedStory(story);
            setRemoteSelected(story);
            setStaleSelected(false);
          }}
          onArchived={(id) => {
            setStories((current) => current.filter((story) => story.id !== id));
            setSelectedStory(null);
            setRemoteSelected(null);
            setStaleSelected(false);
            setSelectedArchivedRemote(false);
          }}
          onClose={() => {
            setSelectedStory(null);
            setRemoteSelected(null);
            setEditorDirty(false);
            dirtyEditorDraftRef.current = null;
            setStaleSelected(false);
            setSelectedArchivedRemote(false);
          }}
        />
      ) : null}
      {isExportPreviewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-preview-title"
        >
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-sm font-medium text-cyan-700">Jira handoff</p>
                <h2 id="csv-preview-title" className="text-lg font-bold text-slate-950">
                  CSV export preview
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsExportPreviewOpen(false)}
                className="rounded p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close CSV preview"
              >
                <X className="size-5" />
              </button>
            </div>
            <pre className="max-h-96 overflow-auto bg-slate-950 p-5 text-xs leading-5 text-slate-100">{csvPreview}</pre>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsExportPreviewOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadCsv();
                  setIsExportPreviewOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                <Download className="size-4" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
