# SecureSprint Test Plan

## Scope

This plan covers the business rule that decides whether a backlog story is ready for transfer to the team's day-to-day work-management system.

## Risk addressed

**Risk:** an incomplete Cybersecurity backlog item is incorrectly presented as ready. A specialist could then begin work without a clear goal, scope, implementation steps, or Definition of Done — the problem SecureSprint is intended to prevent.

## System under test

`src/lib/readiness.ts` contains a pure readiness evaluator. It accepts the story's planning fields and returns a deterministic ready/not-ready result with each missing condition.

## Required conditions

The story is ready only when it has all of the following:

1. Goal
2. Recipient or area
3. Scope description
4. At least one implementation step
5. Free-text Definition of Done
6. At least one Definition of Done checklist item

## Automated coverage

The unit suite must verify:

- a complete story is ready;
- each individual required field produces its corresponding missing condition;
- whitespace-only text is treated as missing;
- an empty implementation-step list and empty DoD checklist are treated as missing.

## Command

Run `npm test` before submitting or exporting a release candidate.

## Manual complement

When the story detail UI exists, create an incomplete story and confirm that its visible readiness result lists exactly the same missing conditions as the evaluator.

## Planned extension (post-badge)

When S-06 / S-07 land, add manual checks:

1. `GET` readiness (or story payload with readiness) over the HTTP API matches the UI for the same story.
2. With `/app` open, create or patch a story via authenticated API/curl and confirm the board updates without a full page reload.
3. With the channel disconnected, a manual refresh still shows consistent backlog data.

## Browser E2E (Playwright)

Command: `npm run test:e2e` (requires demo credentials in `DEMO_EMAIL` / `DEMO_PASSWORD`).

| Spec | Risk |
| --- | --- |
| `tests/e2e/readiness-incomplete-ui.spec.ts` | Incomplete story shown as ready / missing fields hidden in UI |
| `tests/e2e/live-board-remote-update.spec.ts` | Remote API create not visible on open board without reload (S-07) |
| `tests/e2e/seed.spec.ts` | Auth session restore to workspace (exemplar) |
