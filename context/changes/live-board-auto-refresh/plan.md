# Live board auto-refresh Implementation Plan

## Overview

Make the open `/app` board reflect remote story creates, updates, and archives without a full page reload, while protecting an in-progress dirty editor from silent overwrite (roadmap S-07, FR-013).

## Current State Analysis

- `BacklogWorkspace` loads `/api/stories` once in `useEffect` and never re-syncs.
- Story CRUD already persists via authenticated API (S-06).
- No browser Supabase client; server uses `astro:env/server` secrets.
- `mapStory` is pure and reusable for any DB-shaped row.

## Desired End State

1. Board cards appear/update/disappear when remote clients change active stories.
2. Dirty editor shows a stale banner instead of clobbering fields.
3. Without live channel, manual navigation/refresh and local CRUD still work.
4. Unit tests cover merge and dirty-guard using shipped pure functions.

## What We're NOT Doing

- Three-way CRDT field merge
- In-app LLM
- Playwright E2E as a hard gate
- Service-role writes as the sync path
- Exposing a Supabase **service-role** key to the browser island (Realtime props may use the **anon** key only; RLS remains the access control; authenticated `GET /api/stories` remains the row shape source of truth)

## Implementation Approach

Extract pure board-sync helpers. Poll authenticated `GET /api/stories` while the tab is visible (reliable with session cookies). Optionally subscribe to Supabase Realtime `postgres_changes` on `backlog_stories` when URL+anon key are passed from the server, and treat events as a signal to refetch the list. Never make live sync required for CRUD.

## Phase 1: Pure merge and dirty-editor policy

### Overview

Ship testable sync functions in `src/lib/board-sync.ts`.

### Changes Required

#### 1. Board sync module

**File**: `src/lib/board-sync.ts`

**Intent**: Merge remote active-story snapshots into local board state; detect dirty drafts; decide selected-story updates and stale flags.

**Contract**:
- `mergeStoriesFromRemote(local, remote): BacklogStory[]` — remote is the full active list; result is remote order; archives disappear because they are absent from remote.
- `isStoryEditorDirty(baseline, draft): boolean` — compare planning fields that the editor edits.
- `resolveLiveBoardUpdate({ localStories, remoteStories, selectedId, dirtyEditorDraft })` → `{ stories, selectedId, selectedRemote, staleSelected, selectedArchived }`.
- **Stale rule:** `staleSelected` is true when `dirtyEditorDraft` is non-null and differs from the remote selected story. Do **not** compare remote only to the board list — after the first merge the list already equals remote, which would clear the banner while the draft is still dirty. Pass the open editor’s dirty draft snapshot (or null when clean).

#### 2. Unit tests

**File**: `src/lib/board-sync.test.ts`

**Intent**: Drive insert, update, archive-remove, dirty-guard, non-dirty selected refresh, and **multi-poll sticky stale** (second resolve with `localStories = first.stories` and the same dirty draft must keep `staleSelected: true`) through the shipped helpers.

### Success Criteria

#### Automated Verification

- Unit tests pass for merge insert/update/archive and dirty guard: `npm test -- src/lib/board-sync.test.ts`
- Multi-poll regression: dirty draft + remote change remains `staleSelected` after a second resolve on already-merged local stories
- Full suite still green: `npm test`

#### Manual Verification

- None (pure logic)

## Phase 2: Wire live sync into BacklogWorkspace

### Overview

Poll (and optionally Realtime-refetch) while the board is open; apply pure resolve helper.

### Changes Required

#### 1. Workspace live loop

**File**: `src/components/BacklogWorkspace.tsx`

**Intent**: After initial load, periodically refetch `/api/stories` when `document.visibilityState === "visible"`; on each payload call `resolveLiveBoardUpdate`; track editor dirty via callback from `StoryEditor`; show stale banner with reload action.

**Contract**:
- Poll interval ~4s (or similar); pause when tab hidden.
- `StoryEditor` reports editor state to parent: `{ dirty, draft }` where `draft` is the dirty snapshot or null when clean; parent feeds `dirtyEditorDraft` into `resolveLiveBoardUpdate`.
- Stale banner: "This story was updated elsewhere" + Reload (reset draft from remote board copy) / Keep editing. Banner must stay until reload/save/close while draft still differs from remote across later polls.
- Optional: accept `supabaseUrl`/`supabaseAnonKey` props (**anon key only**, never service role; RLS remains the access control). If present, create browser client and on `postgres_changes` for `backlog_stories` trigger an immediate refetch (still merge via API list).

#### 2. Page props for optional Realtime

**File**: `src/pages/app.astro`

**Intent**: Pass server Supabase URL+anon key into the island when configured so Realtime can connect without new public env names.

#### 3. Realtime publication migration

**File**: `supabase/migrations/YYYYMMDDHHMMSS_enable_backlog_stories_realtime.sql`

**Intent**: Add `backlog_stories` to `supabase_realtime` publication when missing.

### Success Criteria

#### Automated Verification

- `npm test`
- `npm run lint`
- `npm run build` (if secrets present)

#### Manual Verification

- With `/app` open, curl create/patch/archive → board updates without F5 (poll ≤ interval).
- Dirty editor for a story patched remotely → banner, fields not clobbered.

## Phase 3: Close-out

### Overview

Verification artifact, roadmap S-07 → done, change status implemented.

### Success Criteria

#### Automated Verification

- Logs under implementer scratch: npm-test, npm-lint
- Structural: board-sync + poll/realtime wiring present

#### Manual Verification

- Smoke log if server available

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands.

### Phase 1: Pure merge and dirty-editor policy

#### Automated

- [x] 1.1 Unit tests pass for merge insert/update/archive and dirty guard
- [x] 1.2 Multi-poll regression: dirty draft stays stale after second resolve on merged local stories
- [x] 1.3 Full `npm test` still green

#### Manual

### Phase 2: Wire live sync into BacklogWorkspace

#### Automated

- [x] 2.1 `npm test` after wiring
- [x] 2.2 `npm run lint` passes
- [x] 2.3 `npm run build` passes when secrets available

#### Manual

- [x] 2.4 With `/app` open, curl create/patch/archive → board updates without F5 (poll ≤ interval)
- [x] 2.5 Dirty editor for a story patched remotely → banner, fields not clobbered (sticky across later polls)

### Phase 3: Close-out

#### Automated

- [x] 3.1 Logs under implementer scratch: npm-test, npm-lint
- [x] 3.2 Structural: board-sync + poll/realtime wiring present; roadmap S-07 + verification written

#### Manual

- [x] 3.3 Smoke log if server available
