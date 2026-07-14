# Secure Starter Dependencies — Plan Brief

> Full plan: `context/changes/secure-starter-dependencies/plan.md`

## What & Why

Before building SecureSprint features, we will resolve the starter's known direct dependency vulnerabilities using compatible, non-forced npm updates. This gives the course project a safer, reproducible baseline and avoids building the MVP on a known high-severity Astro issue.

## Starting Point

The Astro/Supabase/Cloudflare starter builds and lints, but its recorded audit has one direct high finding and two direct moderate findings. CI already provides the desired verification path: clean install, Astro sync, lint, and production build on Node 22.

## Desired End State

The package manifest and lockfile resolve compatible versions with no direct Astro, Supabase CLI, Wrangler, or Vite audit finding where a fix is available. The same Cloudflare SSR app builds successfully afterward, and concise evidence records the final audit and commands.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Upgrade strategy | Standard non-forced npm remediation | It preserves compatibility boundaries and avoids surprise major migrations. | Plan |
| Scope | Package metadata, lockfile, and verification evidence only | Product features and data changes would obscure the security change. | Roadmap |
| Verification | CI-equivalent install, sync, lint, build, plus Chrome smoke test | This exercises the Astro/Cloudflare boundary that upgrades could affect. | Research |
| Residual risk | Document rather than force an incompatible fix | The deadline does not justify breaking SSR or deployment configuration. | Plan |

## Scope

**In scope:**

- Audit evidence and non-forced remediation review.
- Compatible `package.json` and `package-lock.json` updates.
- Reproducible install, Astro, lint, build, audit, and smoke-test evidence.

**Out of scope:**

- SecureSprint features, database schema, test runner, deployments, and Git setup.
- Forced/major package upgrades and manual transitive-package edits.

## Architecture / Approach

Inspect the standard npm remediation proposal first, apply only its compatible result, then run the project's existing verification pipeline. The original bootstrap audit remains untouched as a baseline; a new verification file captures the post-update state.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Evidence-led upgrade set | Reviewed, non-forced upgrade proposal | A fix may require a breaking version. |
| 2. Compatible updates | Updated manifest and deterministic lockfile | Unintended dependency-graph changes. |
| 3. Starter verification | CI-equivalent proof and Chrome smoke test | Astro/Wrangler update could affect SSR. |

**Prerequisites:** Node 22, npm registry access, and Supabase build variables available locally.
**Estimated effort:** One focused implementation session plus a short manual smoke test.

## Open Risks & Assumptions

- A compatible update is assumed to exist for the current direct findings; if not, this change records the limitation and opens a separate compatibility plan.
- The build must be run with Supabase environment variables, as CI does.
- This change does not make the project ready for certification by itself; F-02 supplies the required test evidence.

## Success Criteria (Summary)

- No unreviewed forced or major dependency update is applied.
- The final audit has no unresolved direct findings without documented justification.
- Clean install, Astro sync, lint, production build, and Chrome smoke test succeed.
