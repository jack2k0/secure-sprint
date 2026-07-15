<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: SecureSprint MVP

- **Plan**: `context/foundation/prd.md` + `context/foundation/roadmap.md`
- **Scope**: Full MVP and 10xBuilder submission readiness
- **Date**: 2026-07-15
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 1 warning, 2 observations, 4 fixed

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

## Verified evidence

- FR-001–FR-010 are implemented: demo authentication, story CRUD, soft archive, detailed refinement, Definition of Done, deterministic readiness, drag-and-drop board, and CSV export.
- Authentication and ownership boundaries are implemented with protected routes, protected story APIs, `created_by`, Supabase RLS, and a shared authenticated workspace.
- Remote Supabase integration was verified using both demo accounts, including create, update, readiness enforcement, archive, and cross-account visibility.
- `npm test` passed 10/10 tests, `npm run lint` passed, and `npm run build` passed on 2026-07-15.
- GitHub Actions completed successfully for commit `da0449e`; the workflow currently verifies lint and build.
- `npm audit --package-lock-only` reported 0 critical, 0 high, 0 moderate, and 3 low findings.
- The submission PDF marks public deployment as optional, but requires screenshots of the authenticated app, two main features, and passing tests.

## Findings

### F1 — Implementation-step input can lose focus after every character

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/components/BacklogWorkspace.tsx:246`
- **Detail**: The React key contains the current step text (`${index}-${step}`). Each edit changes the key, so React remounts the row and can drop keyboard focus. This affects the core refinement flow.
- **Fix**: Give every implementation step a stable identity, or use a stable index key for this fixed local list, then verify typing and removal in the latest Chrome.
  - Strength: Removes a concrete blocker from the primary user flow.
  - Tradeoff: A stable ID is more robust but requires a small data-shape change; an index is narrower but less safe for reordering.
  - Confidence: HIGH — the key changes on every controlled-input update.
  - Blind spot: The controlled browser connection failed before a visual reproduction could be recorded.
- **Decision**: FIXED — the key is now the stable list index; `npm test`, lint, and build pass.

### F2 — GitHub Actions does not run the test suite

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `.github/workflows/ci.yml:18`
- **Detail**: The successful CI run executes install, Astro sync, lint, and build, but not `npm test`. Tests pass locally, so the public CI link alone is not evidence of passing course tests.
- **Fix**: Add `npm test` to the CI workflow before lint/build.
- **Decision**: FIXED — GitHub Actions now runs `npm test` before lint and build.

### F3 — Required submission screenshots are missing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `README.md:67`
- **Detail**: The repository contains no submission screenshots. The course form requires an authenticated/home view, two main-feature screenshots, and a screenshot of passing tests. A separate Chrome smoke-test record is also absent. Public deployment is optional and therefore is not a certification blocker.
- **Fix**: After F1 and F2, capture the board after login, refinement/readiness, Ready-for-Jira/CSV, and a passing test run in the latest Chrome.
- **Decision**: FIXED — formula-like cells are prefixed before CSV quoting and covered by a regression test.

### F4 — Exported CSV does not neutralize spreadsheet formulas

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/lib/csv.ts:3`
- **Detail**: Quoting and embedded quotes are handled, but values beginning with `=`, `+`, `-`, or `@` can be interpreted as formulas when a reviewer opens the export in a spreadsheet. Story text is user-controlled.
- **Fix**: Prefix formula-like cells with an apostrophe before CSV quoting and add regression cases to `src/lib/csv.test.ts`.
  - Strength: Removes the spreadsheet-injection class at the export boundary.
  - Tradeoff: The visible apostrophe may require confirmation against the eventual Jira import mapping.
  - Confidence: HIGH — the current helper only escapes double quotes.
  - Blind spot: The exact target Jira CSV importer behavior has not been tested.
- **Decision**: FIXED via Fix B — the export button now opens a preview modal before download.

### F5 — CSV preview promised by the roadmap is not implemented

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `context/foundation/roadmap.md:131`, `src/components/BacklogWorkspace.tsx:475`
- **Detail**: The roadmap says users can preview exportable data; the current action downloads the CSV immediately. FR-010 only requires an export, so this does not violate the course minimum.
- **Fix A ⭐ Recommended**: Amend the roadmap/PRD wording to match direct CSV download for the MVP.
  - Strength: Preserves the intentionally small scope and documents actual behavior.
  - Tradeoff: Removes a convenience the user previously requested.
  - Confidence: HIGH — direct download already satisfies the technical certification requirement.
  - Blind spot: A reviewer may prefer visible export evidence in the UI.
- **Fix B**: Add a lightweight preview modal before download.
  - Strength: Matches the roadmap and makes a stronger screenshot.
  - Tradeoff: Adds UI and testing work that is not required for certification.
  - Confidence: HIGH — the CSV data is already generated client-side.
  - Blind spot: Modal accessibility would also need verification.
- **Decision**: PENDING

### F6 — Planning status no longer reflects the implementation

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `context/foundation/roadmap.md:3`, `context/changes/secure-starter-dependencies/change.md:4`
- **Detail**: The roadmap remains `draft` with every slice marked `proposed`, while the dependency change remains `implementing` and its manual Chrome check is unchecked. This stale documentation is the source of the apparent implementation blockage; it is not a runtime blocker.
- **Fix**: Reconcile roadmap/change statuses and attach the final Chrome evidence after the remaining review findings are handled.
- **Decision**: PENDING

### F7 — Assigned-to-me identification is only partial

- **Severity**: 👁️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/components/BacklogWorkspace.tsx:60`
- **Detail**: An assignee can be selected in the detail editor, but the board card does not show an assignee and there is no Assigned to me filter. This is a partial implementation of the PRD wording, but is outside the published 10xBuilder minimum.
- **Fix**: Show the assignee name on each card; defer filtering unless it is useful for the demo.
- **Decision**: PENDING
