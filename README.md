# SecureSprint

SecureSprint is a small planning workspace for a Cybersecurity Scrum team. It turns a high-level task into an actionable backlog story with scope, implementation steps, a Definition of Done, a readiness check, board movement, and CSV export for later Jira import.

## 10xBuilder requirements covered

**Modules 1–3 badge baseline** (course minimum: CRUD + business logic + tests; plus this product’s auth and export):

- CRUD: create, view, edit, and archive backlog stories.
- Business logic: a story is Jira-ready only when it has a goal, recipient/area, description, implementation steps, DoD, and at least one DoD checklist item.
- Tests: automated unit tests cover the readiness-rule risk in [`context/foundation/test-plan.md`](context/foundation/test-plan.md).
- Authentication: email/password demo accounts protect the workspace; stories are linked to their creator and kept in an authenticated shared workspace.
- Board + CSV: drag between draft / refining / ready; export for later Jira import.

**Post-badge extension** (planned in [`context/foundation/roadmap.md`](context/foundation/roadmap.md) as S-06 / S-07; PRD FR-011–FR-014, US-02):

- Agent-facing HTTP API: IDE agents (Claude Code, Codex, Grok, etc.) edit the backlog through the same authenticated JSON story endpoints as the UI — not by raw service-role SQL as the default path.
- Machine-readable readiness: agents can fetch the same deterministic ready / missing-fields result as the UI.
- Live board refresh: an open dashboard merges remote creates, updates, and archives without a full page reload when an agent or another client changes data.
- Agent docs: repository instructions for how to authenticate and call the API during local development.

These extension items are **not** required to submit the Modules 1–3 Baserow form; they are the next product stream after the badge baseline.

## Stack

Astro 6, React 19, TypeScript, Tailwind CSS, Supabase Auth/Postgres, and Cloudflare Workers.

## Run locally

Prerequisites: Node 22, npm, Docker, and the Supabase CLI.

```bash
npm ci
npx supabase start
```

Copy the Supabase URL and anon key printed by the CLI into both `.env` and `.dev.vars`:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<anon-key-from-supabase-start>
```

Apply the local migration and start the app:

```bash
npx supabase db reset
npm run dev
```

Create at least two test users in Supabase Studio (`http://127.0.0.1:54323`, Authentication → Users). The migration creates a `team_members` record automatically for each new user. Use those accounts to sign in at `/auth/signin`.

## Use a hosted Supabase project

1. Create a Supabase project and configure its Authentication URL settings for your local and deployed app URLs.
2. Link and push the tracked migration:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

3. In Authentication → Users, create the demo accounts for the manager and specialist. Do not commit their passwords.
4. Add the project URL and anon key to `.env` and `.dev.vars` locally. Add the same values as `SUPABASE_URL` and `SUPABASE_KEY` secrets in Cloudflare and GitHub Actions.

Self-service signup is deliberately disabled in the UI. Demo accounts are the MVP authentication path.

## Verification

```bash
npm test
npm run test:e2e   # Playwright; needs DEMO_EMAIL / DEMO_PASSWORD (or E2E_*)
npm run lint
npm run build
```

The test plan is at [`context/foundation/test-plan.md`](context/foundation/test-plan.md). Unit suite: readiness, board-sync, seed payloads, CSV. E2E suite (`tests/e2e/`): auth setup + seed + readiness incomplete UI + live board remote update.

## Agent API playbook (IDE agents / curl)

IDE agents (Claude Code, Codex, Grok, etc.) should edit the shared backlog through the **app HTTP API**, not with a Supabase service-role SQL write as the default path. Auth is the same demo email/password session the browser uses (Supabase SSR cookies).

### Prerequisites

1. Local app running (`npm run dev`, default `http://localhost:4321`).
2. Supabase configured (local or hosted) with at least one demo user.
3. Do **not** commit demo passwords; use env vars in your shell only.

```bash
export BASE_URL=http://localhost:4321
export DEMO_EMAIL='manager@example.com'   # your demo account
export DEMO_PASSWORD='...'                # never commit
COOKIE_JAR="$(mktemp)"
```

### 1. Sign in (session cookie)

`POST /api/auth/signin` expects form fields and sets Supabase auth cookies on the response.

Astro blocks cross-site form mutations (`403 Cross-site POST/DELETE form submissions are forbidden`) unless the request looks same-origin. For curl/agents, send matching `Origin` and `Referer` on **POST / sign-in, POST create, PATCH, DELETE**:

```bash
export ORIGIN_HEADERS=(
  -H "Origin: $BASE_URL"
  -H "Referer: $BASE_URL/auth/signin"
)

curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/signin" \
  "${ORIGIN_HEADERS[@]}" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "email=$DEMO_EMAIL" \
  --data-urlencode "password=$DEMO_PASSWORD" \
  -o /dev/null -w '%{http_code}\n'
```

A successful sign-in redirects to `/app` (HTTP 302). Reuse `-c`/`-b` `$COOKIE_JAR` on every later call.

### 2. List active stories

```bash
curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/stories" | jq .
# { "stories": [ ... ], "readinessById": { "<id>": { "isReady": false, "missingFields": [...] } } }
```

### 3. Create a draft

```bash
curl -sS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/stories" \
  -H "Origin: $BASE_URL" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Audit MFA for VPN"}' | jq .
# { "story": { ... }, "readiness": { "isReady": false, "missingFields": [...] } }
```

### 4. Update refinement fields

```bash
STORY_ID='<uuid-from-create>'

curl -sS -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/stories/$STORY_ID" \
  -H "Origin: $BASE_URL" \
  -H 'Content-Type: application/json' \
  -d '{
    "goal": "Protect remote access accounts",
    "recipientOrArea": "Network security",
    "description": "Review MFA enrollment for VPN users",
    "implementationSteps": ["Export VPN users", "Check MFA enrollment"],
    "definitionOfDone": "Every active VPN account has MFA or an exception ticket",
    "definitionOfDoneChecklist": [
      {"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","label":"Evidence attached","completed":false}
    ],
    "boardPosition": "refining"
  }' | jq .
```

Incomplete stories cannot stay on `boardPosition: "ready"` — the API demotes them to `refining`.

### 5. Readiness check (machine-readable)

Same deterministic rule as the UI (`assessStoryReadiness`):

```bash
# Dedicated endpoint
curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/stories/$STORY_ID/readiness" | jq .
# { "storyId": "...", "readiness": { "isReady": true|false, "missingFields": [...] } }

# Also embedded on GET / PATCH
curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/stories/$STORY_ID" | jq '.readiness'
```

### 6. Archive (soft delete)

```bash
curl -sS -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/stories/$STORY_ID" \
  -H "Origin: $BASE_URL" \
  -w '%{http_code}\n'
# 204 No Content
```

### Agent rules of thumb

| Do | Don't |
|----|--------|
| Use `/api/stories` with the demo session cookie | Write rows with the Supabase service role as the default path |
| Send `Origin: $BASE_URL` on POST/PATCH/DELETE (and sign-in) | Call mutating endpoints without Origin (Astro returns 403) |
| Check `/readiness` before marking `ready` | Invent a second readiness rule in the agent prompt |
| Send checklist items as `{ id, label, completed }` with UUID `id` | Commit credentials or cookie jars |

Live board auto-refresh (S-07): the open `/app` board polls `GET /api/stories` every few seconds (and optionally listens to Supabase Realtime) so agent/API changes appear without F5. Dirty story editors show a reload banner instead of silent overwrite.

## Submission checklist

After Supabase is configured, capture these in the latest Chrome:

1. The board with a logged-in user and a draft story.
2. The story detail page showing the readiness check and missing requirements.
3. A completed story in **Ready for Jira** and the CSV export action.
4. Passing `npm test`, `npm run lint`, and `npm run build` in the public repository.

## Deployment

Set `SUPABASE_URL` and `SUPABASE_KEY` as Cloudflare Worker secrets, then deploy:

```bash
npm run build
npx wrangler deploy
```

The GitHub Actions workflow verifies a clean install, Astro sync, lint, and build on pushes and pull requests to `main`.
