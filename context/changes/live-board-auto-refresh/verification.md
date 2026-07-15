---
verified_at: 2026-07-15
scope: live-board-auto-refresh
---

## Result

S-07 delivered: open board merges remote story changes without full page reload; dirty editor protected.

| Check | Result |
| --- | --- |
| `npm test` | 41/41 passed (includes `board-sync.test.ts`) |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 |
| Pure merge/dirty helpers | `src/lib/board-sync.ts` + unit tests |
| Live transport | Poll 4s + optional Realtime `postgres_changes` → refetch list |
| Dirty editor | Stale banner; no silent field clobber |
| Migration | `20260715233000_enable_backlog_stories_realtime.sql` |
| API smoke | create/update/archive visible on subsequent list fetch (poll source of truth) |

## Notes

- Dual-browser visual proof not required in harness; board uses the same authenticated list the poll hits.
- Core CRUD does not depend on Realtime/poll success.

## Follow-up fix (stale banner)

- `staleSelected` now compares **dirty editor draft** to remote, not the board list row.
- Multi-poll regression covered in `board-sync.test.ts`.
- `BacklogWorkspace` passes `dirtyEditorDraft` via `dirtyEditorDraftRef` from `onEditorStateChange`.
