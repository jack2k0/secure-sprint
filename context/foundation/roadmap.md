---
project: SecureSprint
status: draft
created: 2026-07-14
updated: 2026-07-15
source_prd: context/foundation/prd.md
---

## Vision recap

SecureSprint turns a Cybersecurity manager's high-level backlog idea into a story a specialist can execute without waiting for clarification. A small, authenticated team refines a shared story, sees exactly what is missing for transfer, moves it across a board, and exports it as CSV for later import into its work-management system.

The **Modules 1–3 / 10xBuilder badge baseline** is a planning workspace with CRUD, deterministic readiness, board movement, CSV export, auth, and tests — without requiring an in-app LLM.

The **post-badge extension** makes the same backlog editable by IDE agents (Claude Code, Codex, Grok, and similar) through the HTTP API, with the open dashboard refreshing when an agent or another client changes data.

## North star

**S-03 — Story refinement and readiness.** A logged-in team member can complete the planning information and Definition of Done for a draft story, then receives either an explicit missing-information list or a ready-for-transfer result.

This is the product's core promise (PRD: Success Criteria, US-01, FR-007–FR-008, Business Logic). CRUD, the board, and export make the promise useful in a real planning session.

**Post-badge north star:** **S-07 — Live board refresh.** While the board is open, changes made through the authenticated story API (including by an IDE agent) appear without a full page reload (PRD: US-02, FR-013).

## 10xBuilder (Modules 1–3) vs extension

| Track | Scope | PRD | Status in product |
| --- | --- | --- | --- |
| **10xBuilder badge baseline** | Auth, CRUD, readiness rule, board, CSV, unit tests, agent onboarding docs for the app | FR-001–FR-010, US-01 | Implemented in code; submission still needs screenshots per Baserow form |
| **Post-badge / agent collaboration** | Documented machine API for agents, readiness endpoint, live UI refresh | FR-011–FR-014, US-02 | Done (S-06 + S-07) |

Course minimum for the badge (from 10xDevs M3): CRUD for the main resource + one business-logic function + at least one automated test suite. Live agent API and realtime are **not** badge blockers; they are deliberate product next steps.

## At a glance

| Order | ID | Deliverable | Covers | Depends on | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | F-01 | Secure starter dependencies | NFR / delivery safety | — | done |
| 2 | F-02 | Test plan and test runner | course test evidence | F-01 | done |
| 3 | S-01 | Gated demo workspace | FR-001, Access Control | F-01 | done |
| 4 | S-02 | Backlog story CRUD | FR-002–FR-006 | S-01 | done |
| 5 | S-03 | Story refinement and readiness | FR-007–FR-008, US-01 | S-02, F-02 | done |
| 6 | S-04 | Drag-and-drop backlog board | FR-009 | S-02, F-02 | done |
| 7 | S-05 | CSV backlog export | FR-010 | S-03, F-02 | done |
| 8 | S-06 | Agent-facing story API | FR-011, FR-012, FR-014, US-02 | S-02, S-03 | done |
| 9 | S-07 | Live board auto-refresh | FR-013, US-02 | S-04, S-06 | done |

## Streams

### Stream A — Product flow (badge baseline)

S-01 → S-02 → S-03 → S-04/S-05. Delivered planning workspace for human users in the browser.

### Stream B — Quality foundation (badge baseline)

F-01 → F-02. Dependency hygiene and readiness unit tests required for certification evidence.

### Stream C — Agent collaboration (post-badge)

S-06 → S-07. External authenticated clients edit the backlog through the app API; open dashboards stay in sync.

```
IDE agent / curl / CLI
        │
        ▼
  HTTP story API (S-06)  ──►  Postgres + RLS
        │                         │
        │                         ▼ push / realtime
        │                    open /app board (S-07)
        ▼
  readiness JSON (same rule as UI)
```

## Baseline

| Layer | State | Evidence | Roadmap consequence |
| --- | --- | --- | --- |
| Frontend | present, complete for MVP | Board, editor, CSV, auth pages | S-07 adds subscription or poll merge in `BacklogWorkspace` |
| Backend/API | present for UI; agent docs incomplete | `/api/stories`, `/api/stories/[id]`, team-members | S-06 hardens contract, readiness endpoint, agent docs |
| Data | present | Migration + RLS for stories and team members | Enable Realtime publication for `backlog_stories` if using Supabase Realtime |
| Auth | present | Email/password demo accounts; protected `/app` | S-06 documents how agents obtain a session for API calls |
| Deployment/CI | partial | Lint + build CI; deploy optional for badge | Keep optional; agent path must work on local `npm run dev` first |
| Observability | minimal | Platform logs | Log API errors; no dedicated agent audit trail in this extension |

## Foundations

### F-01 — Secure starter dependencies

- **Outcome:** The starter has an explicit, verified dependency-security baseline before feature work.
- **Change ID:** `secure-starter-dependencies`
- **PRD refs:** Non-Functional Requirements; timeline budget
- **Unlocks:** F-02, S-01–S-05
- **Status:** done

### F-02 — Test plan and test runner

- **Outcome:** A concise test plan and automated suite verify the readiness rule.
- **Change ID:** `test-plan-and-runner`
- **PRD refs:** US-01; Business Logic; 10xBuilder test requirement
- **Unlocks:** S-03–S-05 certification evidence
- **Status:** done

## Slices

### S-01 — Gated demo workspace

- **Outcome:** Demo sign-in; only authenticated users access backlog routes; sign-out works.
- **Change ID:** `gated-demo-workspace`
- **PRD refs:** FR-001; Access Control
- **Status:** done

### S-02 — Backlog story CRUD

- **Outcome:** Create draft, list, detail, edit, archive with persistence and RLS.
- **Change ID:** `backlog-story-crud`
- **PRD refs:** FR-002–FR-006; Access Control
- **Status:** done

### S-03 — Story refinement and readiness

- **Outcome:** Fixed planning fields, DoD + checklist, deterministic missing list or ready status.
- **Change ID:** `story-refinement-readiness`
- **PRD refs:** US-01; FR-007, FR-008; Business Logic
- **Status:** done

### S-04 — Drag-and-drop backlog board

- **Outcome:** Drag cards between draft / refining / ready; position persists.
- **Change ID:** `drag-backlog-board`
- **PRD refs:** FR-009
- **Status:** done

### S-05 — CSV backlog export

- **Outcome:** Download (and preview) active stories as CSV for later Jira mapping.
- **Change ID:** `csv-backlog-export`
- **PRD refs:** FR-010
- **Status:** done

### S-06 — Agent-facing story API

- **Outcome:** IDE agents and other non-browser clients can create, list, update, and archive backlog stories through documented authenticated JSON endpoints, and can fetch a machine-readable readiness assessment that uses the same rule as the UI.
- **Change ID:** `agent-facing-story-api`
- **PRD refs:** FR-011, FR-012, FR-014; US-02; Access Control; Non-Goals (no service-role default path)
- **Prerequisites:** S-02, S-03
- **Parallel with:** badge submission polish (screenshots, deploy)
- **Blockers:** Document a safe local auth path for agents (demo session cookie or short-lived script) without committing secrets.
- **Unknowns:** Cookie session vs explicit token for agents; resolve in plan with the simplest path that works with existing Supabase SSR auth.
- **Risk:** Agents bypass Zod/readiness if allowed to write only via service role; keep the app API as the default write path.
- **Implementation notes:**
  - Stabilize `/api/stories` and `/api/stories/[id]` request/response DTOs (stable field names, error shape).
  - Add `GET /api/stories/[id]/readiness` (or embed readiness on GET) returning `{ isReady, missingFields }` from `assessStoryReadiness`.
  - Document curl examples and an agent playbook in `README.md` and/or `AGENTS.md` (how to sign in, list, patch, check readiness).
  - Optional thin CLI is nice-to-have; **API is the requirement**.
- **Acceptance evidence:**
  - curl (or agent) creates a story and patches refinement fields while a user is signed in as a demo account.
  - Readiness JSON matches UI for the same payload.
  - Docs land in the repo so Claude Code / Codex / Grok can follow them without reading source.
- **Status:** done
- **Delivered (2026-07-15):** `GET /api/stories/[id]/readiness`, readiness embedded on list/get/create/update responses via `readinessForStory` → `assessStoryReadiness`; agent playbook in `README.md` + `AGENTS.md`; contract tests in `src/lib/readiness-api-contract.test.ts`.

### S-07 — Live board auto-refresh

- **Outcome:** An open `/app` board merges remote creates, updates, and archives (including those performed by an agent via the API) without a full page reload, while protecting in-progress local editor input from silent overwrite.
- **Change ID:** `live-board-auto-refresh`
- **PRD refs:** FR-013; US-02; Non-Functional Requirements (degrade to manual refresh)
- **Prerequisites:** S-04, S-06
- **Parallel with:** none required
- **Blockers:** Confirm Realtime is enabled for `public.backlog_stories` (migration or dashboard) if using Supabase Realtime.
- **Unknowns:** Supabase Realtime on Cloudflare Workers browser client vs short polling; prefer Realtime, keep polling fallback.
- **Risk:** Overwriting a human mid-edit when an agent patches the same story; show a stale/conflict banner or only auto-merge the board list, not dirty form fields.
- **Implementation notes:**
  - Preferred: browser Supabase client subscribes to `postgres_changes` on `backlog_stories` (filtered to active workspace rows) and remaps via existing `mapStory` / list fetch.
  - Fallback: poll `GET /api/stories` every N seconds while the board is focused.
  - On remote change: update board cards; if the open editor’s story changed and the form is dirty, prompt to reload instead of clobbering.
  - Core CRUD must still work if the channel is disconnected (manual refresh / next navigation).
- **Acceptance evidence:**
  - Two views: browser board open + agent/curl PATCH → card title/position updates without F5.
  - Agent creates a story → new card appears on the board.
  - Agent archives a story → card disappears from the active board.
  - Disconnect or disabled Realtime → manual refresh still correct.
- **Status:** done
- **Delivered (2026-07-15):** Poll `GET /api/stories` every 4s while tab visible; optional Supabase Realtime refetch; pure `board-sync` merge + dirty-editor banner; migration enables `backlog_stories` realtime publication.

## Backlog handoff

**Badge baseline (S-01–S-05 + F-01–F-02) is implemented.** Remaining badge work is submission evidence (screenshots, optional deploy), not new product slices.

**S-06 and S-07 are done.** Optional next: in-app AI review (parked) or deploy polish.

Suggested order:

1. ~~Freeze API contract + readiness endpoint + agent docs (S-06).~~
2. Prove agent/curl edit against local `npm run dev` with demo credentials (manual).
3. ~~Add live refresh on the board (S-07).~~
4. Demo: board open in Chrome + agent updates story → UI updates (manual).

Suggested acceptance evidence for the **badge** submission (unchanged):

- Screenshot: post-login board.
- Screenshot: main feature #1 (story form / refinement).
- Screenshot: main feature #2 (board or data display).
- Screenshot: passing `npm test`.
- Public repo with setup instructions.

Suggested acceptance evidence for the **agent extension**:

- Documented API calls for create/update/readiness.
- Recording or two-pane demo: API change → live board update.

## Open roadmap questions

1. Agent auth mechanism for local demos (session cookie script vs personal access pattern).
2. Realtime publication setup in hosted Supabase projects used for demos.
3. Whether a minimal CLI ships with S-06 or docs + curl only.

## Parked

- In-app LLM that suggests soft gaps or rewrites story text (separate from agent-via-API).
- Direct Jira, Rovo, or vendor MCP product integration (generic HTTP API + optional project MCP wrapper later).
- Multi-tenant API keys, OAuth device flow for machines.
- Multiple workspaces, roles, invitations, admin, change history.
- Self-service account registration, password reset, email verification.
- Browser support beyond the latest Google Chrome.
- Automatic three-way merge of concurrent human and agent form edits.

## Done

- Product shaping and MVP scope captured in `context/foundation/shape-notes.md`.
- PRD completed and extended in `context/foundation/prd.md` (v2: FR-011–FR-014, US-02).
- Astro/Supabase/Cloudflare starter selected and bootstrapped.
- Build verification completed; dependency audit recorded in `context/changes/bootstrap-verification/verification.md`.
- Agent onboarding guidance for the codebase created in `AGENTS.md`.
- Badge baseline slices S-01–S-05 and foundations F-01–F-02 implemented in application code.
- Post-badge slices S-06 (agent API) and S-07 (live refresh) added to this roadmap.
