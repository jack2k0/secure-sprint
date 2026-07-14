---
verified_at: 2026-07-15
scope: remote-supabase-integration
---

## Remote verification

The SecureSprint migration was applied to the configured Supabase project and confirmed by `supabase migration list`.

Two confirmed demo accounts were created through the Supabase Auth admin API:

- Security Manager
- Security Specialist

Credentials and secrets are intentionally not stored in this repository.

## End-to-end evidence

Using the local Cloudflare-compatible development server connected to the remote Supabase project, the following checks passed:

| Flow                           | Result                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| Manager email/password sign-in | Redirected to `/app`; authenticated API access granted.                                            |
| Story creation                 | A draft was created with `created_by` linked to the signed-in manager.                             |
| Story refinement               | Goal, recipient/area, description, implementation steps, DoD, and checklist were saved.            |
| Ready status                   | A complete story moved to `ready`.                                                                 |
| Readiness enforcement          | Removing the description while requesting `ready` automatically changed the story to `refining`.   |
| Archive                        | The verification story was soft-archived and disappeared from active backlog results.              |
| Shared workspace               | A specialist authenticated with a separate demo account could read a manager-created active story. |

All temporary verification stories were archived after the checks.

## Remaining external verification

Cloudflare deployment is not yet configured because the current environment is not logged in to Cloudflare. Run `npx wrangler login` before deploying and adding runtime secrets.
