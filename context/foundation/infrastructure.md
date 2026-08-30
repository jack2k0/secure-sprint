---
project: SecureSprint
decided_at: 2026-07-15
last_updated: 2026-08-30
status: deployed
public_url: https://secure-sprint.jack2k0.workers.dev
---

# Infrastructure

## Decision

| Concern             | Choice                                        |
| ------------------- | --------------------------------------------- |
| Application runtime | Cloudflare Workers, via `@astrojs/cloudflare` |
| Rendering           | Full SSR (`output: "server"`)                 |
| Database and auth   | Supabase (hosted Postgres + Auth)             |
| Session storage     | Cloudflare KV, `SESSION` binding              |
| CI                  | GitHub Actions                                |
| Deployment          | `npx wrangler deploy` from a verified `main`  |

## Why Workers rather than a container

The MVP is a small SSR app with cookie sessions and no long-running work. Everything it does fits a
request/response model, so paying for an always-on container buys nothing. Workers give a public URL
with no idle cost, a global edge by default, and a deploy that finishes in seconds — which matters
more than raw throughput for a project that will be looked at, not load-tested.

The cost is real and accepted: Workers are not Node. The runtime is `workerd`, so anything depending
on Node built-ins has to be checked rather than assumed, and `npm run dev` already runs under
`workerd` so that surprise lands locally instead of in production.

## Why Supabase rather than a Worker-native store

Auth is the reason. The app needs email/password sessions, per-user rows and row-level security, and
Supabase provides all three behind one client — `@supabase/ssr` handles the cookie plumbing that SSR
needs. Building that on D1 or KV would have meant writing an auth layer, which is not what this
project is for.

Postgres also lets the readiness rule stay in application code while the data keeps real
constraints. RLS is enabled on every table with granular per-operation, per-role policies.

## Environments

| Environment     | Runtime            | Secrets from       |
| --------------- | ------------------ | ------------------ |
| Local (Node)    | `astro dev`        | `.env`             |
| Local (Workers) | `wrangler dev`     | `.dev.vars`        |
| CI              | GitHub Actions     | repository secrets |
| Production      | Cloudflare Workers | `wrangler secret`  |

`SUPABASE_URL` and `SUPABASE_KEY` are declared in `astro.config.mjs` under `env.schema` as
server-only, so they cannot leak into a client bundle. Neither `.env` nor `.dev.vars` is tracked, and
neither has ever been committed.

## Deployment

```bash
npm run build
npx wrangler deploy
```

There is no automatic deploy on merge. It is a deliberate gap rather than an oversight: this is a
one-person project where a bad deploy has no rollback drill, and a manual step keeps the deployed
commit something a human chose. The verification log records the commit and the Cloudflare version
so parity is checkable rather than assumed.

Current: version `315aa155-c293-4912-846c-972a7fbf906f` from commit `7fe82ab`.

## What is not covered

- **No staging environment.** One production Worker. Changes are verified locally against hosted
  Supabase before deploying.
- **No automated rollback.** `wrangler rollback` exists and is the manual answer.
- **No custom domain.** The `workers.dev` subdomain is enough for an MVP that needs to be reachable,
  not branded.
- **No observability beyond Cloudflare's own dashboard.** No error tracking, no uptime monitor. For
  a project with no users this is a conscious omission, and the first thing to add if that changes.

## Risks

| Risk                                  | Standing                                                                                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency advisories                 | 12 high, all reachable only through the `astro` 6 → 7 and `@astrojs/cloudflare` 13 → 14 majors. `npm audit fix` does not reduce the count. Recorded as a dated exception in `AGENTS.md` |
| Supabase is a single point of failure | Accepted. Auth and data both live there; an outage takes the app down                                                                                                                   |
| Manual deploy can drift from `main`   | Mitigated by recording the commit-to-version mapping after each deploy                                                                                                                  |
