---
change_id: live-board-auto-refresh
title: Live board auto-refresh for remote story changes
status: implemented
created: 2026-07-15
updated: 2026-07-15
archived_at: null
---

## Notes

Roadmap S-07 / PRD FR-013, US-02.

Open `/app` board merges remote creates, updates, and archives without full page reload. Prefer Supabase Realtime when available; poll `GET /api/stories` as reliable fallback. Protect dirty story editor from silent overwrite. Core CRUD must work without the live channel.
