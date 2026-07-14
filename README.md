# SecureSprint

SecureSprint is a small planning workspace for a Cybersecurity Scrum team. It turns a high-level task into an actionable backlog story with scope, implementation steps, a Definition of Done, a readiness check, board movement, and CSV export for later Jira import.

## 10xBuilder requirements covered

- CRUD: create, view, edit, and archive backlog stories.
- Business logic: a story is Jira-ready only when it has a goal, recipient/area, description, implementation steps, DoD, and at least one DoD checklist item.
- Tests: automated unit tests cover the readiness-rule risk in [`context/foundation/test-plan.md`](context/foundation/test-plan.md).
- Authentication: email/password demo accounts protect the workspace; stories are linked to their creator and kept in an authenticated shared workspace.

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
npm run lint
npm run build
```

The test plan is at [`context/foundation/test-plan.md`](context/foundation/test-plan.md). Current automated suite covers the readiness evaluator and CSV escaping.

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

The GitHub Actions workflow verifies a clean install, Astro sync, lint, and build on pushes and pull requests to `master`.
