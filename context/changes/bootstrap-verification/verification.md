---
bootstrapped_at: 2026-07-14T22:26:46Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: secure-sprint
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: secure-sprint
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

SecureSprint is a small, three-week web MVP with user login, shared planning data, and no AI or real-time requirement. The curated Astro starter provides a TypeScript-first full-stack foundation with authentication, persistence, and a deployment path already aligned to a solo builder and a short timeline. Its conventions reduce the number of architectural decisions a lower-capability implementation model must make. Cloudflare Pages is the starter's default deployment target, while GitHub Actions with automatic deployment after merging keeps verification and release flow straightforward. The starter is registered as first-class rather than fully verified, so the bootstrap stage will confirm its generated project before implementation begins.

## Pre-scaffold verification

| Signal | Value | Severity | Notes |
| --- | --- | --- | --- |
| npm package | not run | n/a | The starter is cloned from a repository, so no create-package name applies. |
| GitHub repository | `przeprogramowani/10x-astro-starter` last pushed 2026-05-17T10:33:39Z | fresh | Public repository checked before cloning. |

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`

**Strategy**: git-clone

**Exit code**: 0

**Files moved**: starter source and configuration files plus 32,524 installed dependency files

**Conflicts (.scaffold siblings)**: none

**.gitignore handling**: moved silently

**.bootstrap-scaffold cleanup**: deleted

**Build verification**: `npm run build` passed after scaffold; Astro produced `dist/` successfully.

## Post-scaffold audit

**Tool**: `npm audit --json`

**Summary**: 0 CRITICAL, 6 HIGH, 9 MODERATE, 2 LOW

**Direct vs transitive**: 0/1/2/0 direct of total 0/6/9/2 (CRITICAL/HIGH/MODERATE/LOW; direct vulnerable packages are Astro, Supabase, and Wrangler)

#### CRITICAL findings

None.

#### HIGH findings

- `astro` (direct) — reflected XSS, XSS through unescaped spread attribute names, and host-header SSRF advisories; a fix is available.
- `devalue` (transitive) — denial of service through sparse-array deserialization; a fix is available.
- `miniflare` (transitive) — affected through `undici` and `ws`; a fix is available.
- `undici` (transitive) — multiple transport and resource-exhaustion advisories; a fix is available.
- `vite` (transitive) — filesystem disclosure advisory on Windows paths; a fix is available.
- `ws` (transitive) — memory-exhaustion advisory; a fix is available.

#### MODERATE findings

- `@astrojs/language-server`, `@cloudflare/vite-plugin`, `js-yaml`, `supabase` (direct), `tar`, `volar-service-yaml`, `wrangler` (direct), `yaml`, and `yaml-language-server` each have a fix available.

#### LOW / INFO findings

- `@babel/core` and `esbuild` have low-severity advisories with fixes available.

## Hints recorded but not acted on

| Hint | Value |
| --- | --- |
| bootstrapper_confidence | first-class |
| quality_override | false |
| path_taken | standard |
| self_check_answers | null |
| team_size | solo |
| deployment_target | cloudflare-pages |
| ci_provider | github-actions |
| ci_default_flow | auto-deploy-on-merge |
| has_auth | true |
| has_payments | false |
| has_realtime | false |
| has_ai | false |
| has_background_jobs | false |

## Next steps

The project is scaffolded and build-verified. Before implementation, update the starter dependencies to resolve the direct high and moderate audit findings, then prepare agent context and the detailed implementation plan.

Useful manual steps in the meantime:

- Initialize your own Git repository if you have not already.
- Address the audit findings according to the project's risk tolerance; the full summary is above.
