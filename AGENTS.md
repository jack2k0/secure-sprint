# Repository Guidelines

SecureSprint is an Astro 6 server-rendered web app with React islands, TypeScript, Tailwind, Supabase authentication, and a Cloudflare deployment target. Treat @context/foundation/prd.md as the product contract and @context/foundation/tech-stack.md as the stack decision; do not expand scope beyond them.

## Critical rules

- Preserve `context/`: it records approved requirements, stack choices, plans, and verification evidence. Do not rewrite its artifacts while implementing a feature.
- Protect every application route that exposes backlog data through the existing middleware pattern in @src/middleware.ts. Keep data access scoped to the authenticated user or approved shared workspace.
- Put new database changes in `supabase/migrations/` using `YYYYMMDDHHmmss_short_description.sql`; enable RLS and add granular policies for every new table.
- Do not add direct Jira, Jira MCP, Rovo, Claude, or other LLM integrations to the MVP. CSV export is the approved boundary.
- Address the direct Astro, Supabase, and Wrangler audit findings recorded in @context/changes/bootstrap-verification/verification.md before exposing the app publicly.

## Layout and implementation

- Use `src/pages/` for routes and API endpoints, `src/layouts/` for page shells, `src/components/` for UI, and `src/lib/` for Supabase access and business logic. Keep shared entity and DTO types in `src/types.ts`.
- Prefer `.astro` components for static server-rendered UI. Use React only for interactive controls such as drag-and-drop, forms, and checklist state.
- Use the `@/*` alias for `src/` imports. Compose Tailwind classes with `cn()` from @src/lib/utils.ts; do not concatenate conditional class strings manually.
- API route handlers export uppercase HTTP methods and validate external input with Zod. Never add Next.js directives to React files.

## Commands and quality gate

- `npm run dev` starts local development; `npm run build` is the production build check; `npm run lint` runs strict ESLint; `npm run format` applies Prettier.
- Run `npm run lint` and `npm run build` after each implementation slice. Husky and lint-staged format staged TypeScript, Astro, JSON, CSS, and Markdown files.
- No application test runner exists yet. Add the planned unit and end-to-end test tooling before claiming test coverage; keep tests next to their unit or in the configured end-to-end directory.

For detailed framework conventions, authentication flow, environment variables, and Cloudflare behavior, read @CLAUDE.md before modifying those areas.
