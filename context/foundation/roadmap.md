---
project: SecureSprint
status: draft
created: 2026-07-14
source_prd: context/foundation/prd.md
---

## Vision recap

SecureSprint turns a Cybersecurity manager's high-level backlog idea into a story a specialist can execute without waiting for clarification. A small, authenticated team refines a shared story, sees exactly what is missing for transfer, moves it across a board, and exports it as CSV for later import into its work-management system.

The MVP is deliberately a planning workspace, not a replacement for Jira or an AI integration. Its most important outcome is a fast, reliable refinement-to-ready flow before day-to-day work begins.

## North star

**S-03 — Story refinement and readiness.** A logged-in team member can complete the planning information and Definition of Done for a draft story, then receives either an explicit missing-information list or a ready-for-transfer result.

This is the product's core promise (PRD: Success Criteria, US-01, FR-007–FR-008, Business Logic). CRUD, the board, and export make the promise useful in a real planning session.

## At a glance

| Order | ID | Deliverable | Covers | Depends on | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | F-01 | Secure starter dependencies | NFR / delivery safety | — | proposed |
| 2 | F-02 | Test plan and test runner | course test evidence | F-01 | proposed |
| 3 | S-01 | Gated demo workspace | FR-001, Access Control | F-01 | proposed |
| 4 | S-02 | Backlog story CRUD | FR-002–FR-006 | S-01 | proposed |
| 5 | S-03 | Story refinement and readiness | FR-007–FR-008, US-01 | S-02, F-02 | proposed |
| 6 | S-04 | Drag-and-drop backlog board | FR-009 | S-02, F-02 | proposed |
| 7 | S-05 | CSV backlog export | FR-010 | S-03, F-02 | proposed |

## Streams

### Stream A — Product flow

S-01 → S-02 → S-03 → S-04/S-05. This stream creates the visible planning workspace in the order a team uses it.

### Stream B — Quality foundation

F-01 → F-02. This stream makes the codebase safe to extend and supplies the test evidence required for certification. F-02 must be complete before logic-dependent slices are considered done.

## Baseline

| Layer | State | Evidence | Roadmap consequence |
| --- | --- | --- | --- |
| Frontend | present, incomplete | Astro/React starter with landing, auth forms, placeholder dashboard | Build product UI in the starter; no new frontend foundation needed. |
| Backend/API | present, incomplete | Auth endpoints exist; no story/domain API | Add story operations as part of CRUD slice. |
| Data | absent | Supabase config exists, but no migrations, tables, or RLS policies | Establish schema and access rules within S-02. |
| Auth | present, incomplete | Email/password signin/signup and middleware protect only `/dashboard` | Adapt it to protected SecureSprint routes and seeded/demo credentials in S-01. |
| Deployment/CI | present, incomplete | Cloudflare adapter and build/lint CI exist; Worker still uses starter name and CI has no deploy | Keep deployment wiring in scope for release readiness, after product slices. |
| Observability | present, incomplete | Cloudflare observability enabled; no app-level error reporting | Use user-facing error states and platform logs; no separate MVP foundation. |

## Foundations

### F-01 — Secure starter dependencies

- **Outcome:** The starter has an explicit, verified dependency-security baseline before feature work. Resolve or consciously document the current `npm audit` findings, especially the direct Astro and Supabase dependency findings, then retain a reproducible build/lint/audit check.
- **Change ID:** `secure-starter-dependencies`
- **PRD refs:** Non-Functional Requirements; timeline budget
- **Unlocks:** F-02, S-01, S-02, S-03, S-04, S-05
- **Prerequisites:** none
- **Parallel with:** none
- **Blockers:** none
- **Unknowns:** Whether compatible non-breaking upgrades clear all audit findings.
- **Risk:** Dependency upgrades may require small Astro/Supabase configuration changes; verify build and login flow after each update.
- **Status:** proposed

### F-02 — Test plan and test runner

- **Outcome:** A concise `test-plan` identifies the risk that an incomplete story is incorrectly marked ready, and an automated test suite verifies the readiness rule. The project has one documented command that runs it.
- **Change ID:** `test-plan-and-runner`
- **PRD refs:** US-01; Business Logic; 10xBuilder test requirement
- **Unlocks:** S-03, S-04, S-05 and final certification evidence
- **Prerequisites:** F-01
- **Parallel with:** S-01 and S-02 after F-01
- **Blockers:** none
- **Unknowns:** Choose the smallest test runner that fits the Astro/TypeScript starter without adding browser-test complexity.
- **Risk:** Tests could couple to UI implementation; keep the readiness rule in a pure domain module.
- **Status:** proposed

## Slices

### S-01 — Gated demo workspace

- **Outcome:** A visitor can sign in with a prepared demo account and only authenticated users can access SecureSprint's backlog routes. The app consistently shows the shared workspace identity and supports sign-out.
- **Change ID:** `gated-demo-workspace`
- **PRD refs:** FR-001; Access Control; Non-Goals (no registration, verification, or recovery)
- **Prerequisites:** F-01
- **Parallel with:** F-02
- **Blockers:** Demo account credentials/configuration must be safely documented for reviewers without committing secrets.
- **Unknowns:** Exact number and names of demo accounts.
- **Risk:** The starter signup path could accidentally expose out-of-scope self-registration; remove or hide it from the MVP flow.
- **Status:** proposed

### S-02 — Backlog story CRUD

- **Outcome:** An authenticated user can create a minimal draft, see all active stories in the shared workspace, open a detailed Jira-like view, edit title/description/assignee/steps, and archive a story so it disappears from the active backlog. Persistence and access control are enforced in the data layer.
- **Change ID:** `backlog-story-crud`
- **PRD refs:** FR-002, FR-003, FR-004, FR-005, FR-006; Access Control
- **Prerequisites:** S-01
- **Parallel with:** F-02
- **Blockers:** none
- **Unknowns:** Minimal set of board positions and specialist demo records; choose stable defaults during implementation planning.
- **Risk:** Mixing archive, edit, board position, and readiness state in UI-only state would violate persistence and user-linked-resource requirements; put the schema/RLS contract first.
- **Status:** proposed

### S-03 — Story refinement and readiness

- **Outcome:** On a story detail page, a user answers the fixed planning questions, records free-text DoD and at least one DoD checklist item, then sees a deterministic result: a precise missing-fields list or ready-for-transfer status.
- **Change ID:** `story-refinement-readiness`
- **PRD refs:** US-01; FR-007, FR-008; Business Logic; Success Criteria
- **Prerequisites:** S-02, F-02
- **Parallel with:** none
- **Blockers:** none
- **Unknowns:** Exact wording/order of refinement prompts; default them to goal, recipient/area, scope, and implementation steps unless user changes them. The rule itself is fixed by the PRD.
- **Risk:** A vague readiness definition would undermine certification; use a pure, directly tested rule and show each missing condition to the user.
- **Status:** proposed

### S-04 — Drag-and-drop backlog board

- **Outcome:** An authenticated user can view active stories as cards and drag a card between the selected backlog positions. The new position persists after refresh and remains consistent with the detail view.
- **Change ID:** `drag-backlog-board`
- **PRD refs:** FR-009; Success Criteria
- **Prerequisites:** S-02, F-02
- **Parallel with:** S-03
- **Blockers:** none
- **Unknowns:** Number and labels of initial positions; choose a small planning-oriented set during implementation planning.
- **Risk:** Drag-and-drop adds interaction complexity; use a maintained, accessible library or a minimal native interaction only if it covers the Chrome-only need cleanly.
- **Status:** proposed

### S-05 — CSV backlog export

- **Outcome:** An authenticated user can preview exportable backlog content and download active stories as a CSV with title, description, steps, DoD, readiness, assignee, and board position fields suitable for later import mapping.
- **Change ID:** `csv-backlog-export`
- **PRD refs:** FR-010; Non-Functional Requirements; Non-Goals (CSV only)
- **Prerequisites:** S-03, F-02
- **Parallel with:** S-04
- **Blockers:** none
- **Unknowns:** Exact target-system import mapping; publish clear generic headers and make the mapping configurable later rather than building a direct integration.
- **Risk:** Multiline descriptions and DoD can produce invalid CSV if escaping is hand-written; test generated rows and use a reliable serializer.
- **Status:** proposed

## Backlog handoff

The next implementation change is **F-01 `secure-starter-dependencies`**, because dependency risk is already known and it unlocks all product work. Once complete, run **F-02** and **S-01** in parallel; then execute S-02, followed by the north-star S-03. S-04 and S-05 can proceed in parallel after their prerequisites.

Suggested acceptance evidence for the final course submission:

- A screenshot of the authenticated board and a story detail page showing its readiness result.
- A screenshot showing a card in two different board positions or the drag action outcome.
- A screenshot/recording of CSV preview or download result.
- The committed test plan and passing test command for the incomplete-story readiness risk.
- A public/reviewer-accessible repository with setup instructions and demo credentials supplied securely.

## Open roadmap questions

1. Confirm demo-account approach: seed data, Supabase dashboard setup, or reviewer-created accounts. This does not block the roadmap; it affects S-01's implementation detail.
2. Confirm the final wording/order for refinement questions before S-03. Default wording is recorded in S-03.
3. Confirm CSV headers against the eventual import configuration before S-05. Generic headers are sufficient for the MVP.
4. Confirm whether to deploy before the course review. The PRD requires a Chrome-usable app but not deployment; a hosted demo is strong submission evidence.

## Parked

- Claude Code / LLM-assisted backlog analysis.
- Direct Jira, MCP, or Rovo integration.
- Multiple workspaces, roles, invitations, admin, change history.
- Self-service account registration, password reset, email verification.
- Browser support beyond the latest Google Chrome.

## Done

- Product shaping and MVP scope captured in `context/foundation/shape-notes.md`.
- PRD completed in `context/foundation/prd.md`.
- Astro/Supabase/Cloudflare starter selected and bootstrapped.
- Build verification completed; dependency audit recorded in `context/changes/bootstrap-verification/verification.md`.
- Agent onboarding guidance created in `AGENTS.md`.
