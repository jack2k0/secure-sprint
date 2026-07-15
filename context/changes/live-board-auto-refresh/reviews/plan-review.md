<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Live board auto-refresh

- **Plan**: `context/changes/live-board-auto-refresh/plan.md`
- **Mode**: Deep
- **Date**: 2026-07-15
- **Verdict**: SOUND (after triage)
- **Findings**: 0 critical, 3 warnings, 2 observations — all warnings fixed; observations fixed or closed

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | PASS (after F1/F4) |
| Plan Completeness | PASS (after F2/F3) |

## Grounding

Grounding: 5/5 paths ✓ (`board-sync.ts`, `BacklogWorkspace.tsx`, `app.astro`, migrations dir, package stack), 3/3 symbols ✓ (`resolveLiveBoardUpdate`, poll path, realtime migration), brief↔plan ✓

Note: change status is already `implemented`. This review asks whether the **written plan** is sound as a build guide (and as living docs). Code has already diverged on one critical policy detail (see F1).

## Findings

### F1 — Dirty/stale contract under-specified (boolean isEditorDirty)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; wrong compare target recreates multi-poll banner bug
- **Dimension**: Blind Spots
- **Location**: Phase 1 — Contract for `resolveLiveBoardUpdate`
- **Detail**: Plan contract uses `{ localStories, remoteStories, selectedId, isEditorDirty }` and implies stale = dirty ∧ remote differs from **board/local list**. After the first successful merge, `localStories` already equals remote, so a second poll with a still-dirty draft would clear the banner. Shipped code correctly uses `dirtyEditorDraft` compared to remote; the plan still documents the weaker API.
- **Fix A ⭐ Recommended**: Update the plan contract to `dirtyEditorDraft: StoryEditorSnapshot | null`, define stale as draft≠remote, and require a multi-poll unit test in Phase 1 success criteria.
  - Strength: Matches fixed shipped behavior; prevents reintroduction.
  - Tradeoff: Small plan edit only (code already fixed).
  - Confidence: HIGH — multi-poll failure mode was observed in review/verification.
  - Blind spot: None significant.
- **Fix B**: Document sticky stale flag (set on first diverge, clear only on reload/save) without passing draft.
  - Strength: Simpler input surface.
  - Tradeoff: Banner can linger after draft is edited to match remote.
  - Confidence: MED — works but weaker UX semantics.
  - Blind spot: Needs explicit clear events listed.
- **Decision**: FIXED via Fix A — plan contract now uses `dirtyEditorDraft`; multi-poll SC + Progress 1.2 added; Phase 2 wires draft snapshot.

### F2 — Phase 2 manual success criteria not fully mirrored in Progress

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Manual Verification vs `## Progress`
- **Detail**: Phase 2 lists two manual criteria (board updates without F5; dirty editor banner / no clobber). Progress only has `2.4` covering the curl/board path; the dirty-editor banner check is not a separate Progress row. `/10x-implement` tracking can mark the phase “done” without explicit dirty-editor evidence.
- **Fix**: Split Progress into `2.4` board poll/live evidence and `2.5` dirty-editor banner / no clobber (or fold both into 2.4 wording explicitly and keep one box).
- **Decision**: FIXED — Progress 2.4/2.5 split to match Phase 2 manual SC.

### F3 — Progress titles are paraphrases of Success Criteria

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 Progress vs Success Criteria
- **Detail**: Phase 3 automated SC (“Logs under implementer scratch…”, “Structural: board-sync + poll/realtime…”) map loosely to `3.1` / `3.2` with different titles. Mechanical Progress↔SC alignment is soft, not broken enough to fail implement parsing, but auditors must re-interpret.
- **Fix**: Rename Progress rows to match SC bullets 1:1 (or rewrite SC to match Progress).
- **Decision**: FIXED — Phase 3 Progress titles aligned to SC (3.1 logs, 3.2 structural, 3.3 smoke).

### F4 — Anon key to browser island not framed as security boundary

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architectural Fitness
- **Location**: Phase 2 — `app.astro` props
- **Detail**: Plan correctly passes server Supabase URL+key into the React island for Realtime. It does not spell out that this must remain the **anon** key (never service role) and that RLS still protects rows. Risk is low if env is already anon, high if someone later swaps in service role for “simplicity”.
- **Fix**: One Non-Goals / Contract sentence: only anon key; RLS is the access control; poll path remains authoritative for row shape.
- **Decision**: FIXED — Non-Goals + Phase 2 Contract state anon-only / no service role in browser.

### F5 — Brief Phase 3 label vs plan Phase 3 content

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: plan-brief.md Phases table
- **Detail**: Brief says Phase 3 is “UX banner + verification”; full plan Phase 3 is close-out/docs (banner is wired in Phase 2). Minor brief drift.
- **Fix**: Align brief Phase 3 label to “Close-out / roadmap / evidence”.
- **Decision**: FIXED — brief Phase 3 label aligned.
