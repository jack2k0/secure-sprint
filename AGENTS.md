# Repository Guidelines

SecureSprint is an Astro 6 server-rendered web app with React islands, TypeScript, Tailwind, Supabase authentication, and a Cloudflare deployment target. Treat @context/foundation/prd.md as the product contract and @context/foundation/tech-stack.md as the stack decision; do not expand scope beyond them.

## Critical rules

- Preserve `context/`: it records approved requirements, stack choices, plans, and verification evidence. Do not rewrite its artifacts while implementing a feature.
- Protect every application route that exposes backlog data through the existing middleware pattern in @src/middleware.ts. Keep data access scoped to the authenticated user or approved shared workspace.
- Put new database changes in `supabase/migrations/` using `YYYYMMDDHHmmss_short_description.sql`; enable RLS and add granular policies for every new table.
- Do not add direct Jira, Jira MCP, Rovo, Claude, or other LLM integrations to the MVP. CSV export is the approved boundary.
  The single approved exception is the post-MVP AI story review (`src/lib/ai/story-review.ts`, `POST /api/stories/:id/ai-review`),
  which only adds **soft** suggestions. Hard readiness stays deterministic in `assessStoryReadiness`, and the endpoint degrades to a
  hard-only review when `XAI_API_KEY` is absent. Do not extend it to decide readiness, move cards, or write story fields.
- Address the direct Astro, Supabase, and Wrangler audit findings recorded in @context/changes/bootstrap-verification/verification.md before exposing the app publicly.

## Layout and implementation

- Use `src/pages/` for routes and API endpoints, `src/layouts/` for page shells, `src/components/` for UI, and `src/lib/` for Supabase access and business logic. Keep shared entity and DTO types in `src/types.ts`.
- Prefer `.astro` components for static server-rendered UI. Use React only for interactive controls such as drag-and-drop, forms, and checklist state.
- Use the `@/*` alias for `src/` imports. Compose Tailwind classes with `cn()` from @src/lib/utils.ts; do not concatenate conditional class strings manually.
- API route handlers export uppercase HTTP methods and validate external input with Zod. Never add Next.js directives to React files.

## Commands and quality gate

- `npm run dev` starts local development; `npm run build` is the production build check; `npm run lint` runs strict ESLint; `npm run format` applies Prettier; `npm test` runs Vitest unit tests.
- Run `npm run lint`, `npm test`, and `npm run build` after each implementation slice. Husky and lint-staged format staged TypeScript, Astro, JSON, CSS, and Markdown files.
- Unit tests live next to modules (e.g. `src/lib/readiness.test.ts`). Keep readiness logic pure in `src/lib/readiness.ts`.
- Browser E2E: Playwright under `tests/e2e/` (`npm run test:e2e`). Prefer `getByRole`, no `waitForTimeout`, auth via `playwright/.auth/` from `auth.setup.ts`. Rules: `tests/e2e/e2e-quality-rules.md`.

## Agent-facing backlog API

When an IDE agent (or curl) should edit SecureSprint backlog data:

1. Prefer the authenticated app HTTP API documented in @README.md (section **Agent API playbook**).
2. Obtain a demo user session via `POST /api/auth/signin` (form body) and reuse response cookies.
3. Endpoints: `GET/POST /api/stories`, `GET/PATCH/DELETE /api/stories/:id`, `GET /api/stories/:id/readiness`.
4. Readiness JSON is always `{ isReady, missingFields }` from `readinessForStory` → `assessStoryReadiness`. Incomplete stories cannot remain on board position `ready`.
5. Do **not** use the Supabase service-role key as the default write path; it bypasses Zod validation and app readiness enforcement.

For detailed framework conventions, authentication flow, environment variables, and Cloudflare behavior, read @CLAUDE.md before modifying those areas.

<!-- BEGIN @przeprogramowani/10x-cli -->

---
name: 10xDevs AI Toolkit - Module 3, Lesson 4 (E2E Tests)
description: End-to-end testing with AI tools
license: CC BY-NC-ND 4.0
metadata:
  tags: AI, E2E, testing, Playwright
  version: 1.0.0
  module: 3
  lesson: 4
---

## 10xDevs AI Toolkit - Moduł 3, Lekcja 4 (Testy E2E)

**Do testów E2E użyj umiejętności `/10x-e2e`.** Jest to jedyne źródło prawdy
dla przepływu pracy — ryzyko → test początkowy + reguły → generowanie → przegląd pod kątem pięciu
antywzorców → ponowne zapytanie → weryfikacja. `references/` tej umiejętności
zawierają pełne reguły, antywzorce, wzorzec początkowy i szablon promptu.

Kilka twardych reguł, które obowiązują jeszcze przed wywołaniem umiejętności:

- **Lokatory:** Najpierw `getByRole` / `getByLabel` / `getByText`; `getByTestId`
  tylko wtedy, gdy atrybuty dostępności są niejednoznaczne. Nigdy selektory CSS, XPath
  ani struktura DOM.
- **Nigdy `page.waitForTimeout()`.** Czekaj na stan: `toBeVisible()`,
  `waitForURL()`, `waitForResponse()`.
- **Niezależność testów + czyszczenie.** Każdy test działa samodzielnie — własna konfiguracja,
  akcja, asercja i czyszczenie; unikalne identyfikatory (sufiks znacznika czasu), aby równoległe uruchomienia
  i ponowne uruchomienia nie kolidowały.

Dwie granice, które należy rozróżnić:

- **DOM (migawka) jest domyślny.** Wizja (`--caps=vision`) jest uzupełnieniem dla
  ryzyk wizualnych (układ, z-index, animacja); dla regresji pikseli preferuj
  narzędzia deterministyczne (`toMatchSnapshot`, Argos, Lost Pixel). Wybór/koszt modelu VLM
  to temat debugowania (Lekcja 5), a nie testowania.
- **Healer pomaga w selektorach, szkodzi w logice.** Zmieniony selektor → healer
  odnajduje go ponownie (trasa przez przegląd PR). Zmienione zachowanie biznesowe → healer
  maskuje błąd; ten przypadek nieudanego testu do naprawy to Lekcja 5.

<!-- END @przeprogramowani/10x-cli -->
