# Live board auto-refresh — Plan Brief

> Full plan: `context/changes/live-board-auto-refresh/plan.md`

## What & Why

When an IDE agent or another teammate changes backlog stories through the HTTP API, the open SecureSprint board should update without F5 so collaboration and demos feel live (FR-013 / US-02).

## Starting Point

`BacklogWorkspace` loads stories once on mount. S-06 already exposes authenticated list/get/create/update/archive APIs with readiness.

## Desired End State

- Board list merges remote create/update/archive without reload.
- Dirty open editor is not silently overwritten; user sees a reload signal.
- CRUD and export still work if live sync is disconnected.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Sync transport | Poll `GET /api/stories` always; optional Realtime trigger to refetch | Cookie session works for poll; Realtime may need publication + browser client |
| Merge logic | Pure helper + unit tests | Testable without browser |
| Dirty editor | Keep local draft; banner + explicit reload | Avoid data loss |
| Source of truth for rows | API list payload (not raw SQL client write) | Same Zod/map path as UI |

## Scope

**In:** board list live merge, dirty-editor guard, poll + optional realtime, tests, migration for realtime publication  
**Out:** CRDT merge, LLM, Playwright requirement, agent API rework

## Phases at a Glance

| Phase | Delivers | Risk |
| --- | --- | --- |
| 1 | Pure merge + dirty policy + tests | None if pure |
| 2 | Wire poll (+ optional Realtime) into `BacklogWorkspace` | Env/publication |
| 3 | Close-out / roadmap / evidence | Manual smoke |

**Estimated effort:** one focused implementation session
