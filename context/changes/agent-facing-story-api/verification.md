---
verified_at: 2026-07-15
scope: agent-facing-story-api
---

## Result

S-06 delivered: machine-readable readiness on the story HTTP API, agent documentation, and automated contract tests.

| Check | Result |
| --- | --- |
| `npm test` | 18/18 passed |
| `npm run lint` | exit 0 (pre-existing astro-eslint-parser projectService warnings only) |
| `GET /api/stories/[id]/readiness` | present; uses `readinessForStory` → `assessStoryReadiness` |
| Readiness on GET/PATCH/POST story | `{ story, readiness }` |
| List endpoint | `stories` + `readinessById` |
| Ready-position enforcement on PATCH | retained (demotes incomplete to `refining`) |
| Docs | README Agent API playbook + AGENTS.md agent section |
| Full HTTP smoke with demo credentials | not run in this environment (no assumed running server/demo password) |

## Endpoints

- `GET /api/stories` — list + `readinessById`
- `POST /api/stories` — create + readiness
- `GET /api/stories/:id` — story + readiness
- `PATCH /api/stories/:id` — update + readiness; incomplete cannot stay `ready`
- `DELETE /api/stories/:id` — soft archive
- `GET /api/stories/:id/readiness` — `{ storyId, readiness: { isReady, missingFields } }`
