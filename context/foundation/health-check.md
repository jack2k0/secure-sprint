---
project: 10x-astro-starter
checked_at: 2026-08-11T09:53:00Z
health_status: needs-attention
context_type: brownfield
language_family: js
stack_assessment_available: false
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - ci_cd
  - configuration
audit_findings:
  critical: 0
  high: 12
  moderate: 1
  low: 1
test_runner_detected: true
ci_provider: GitHub Actions
recommended_fixes: 8
---

## Status addendum — 2026-08-29

This report is a snapshot from 2026-08-11. Recorded here so a reader does not chase items that are
already closed:

| Finding                                         | Status                                                                                                                                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #2 Restore bounded lint and type-check scope    | **closed** — `tsconfig.json` and ESLint exclude the reference trees; `npm run lint` and `npx astro check` complete with the normal heap                                                                    |
| #6 Repair local hooks and safe formatting scope | **closed** — `prepare: husky` restored the pre-commit hooks and `.prettierignore` bounds formatting                                                                                                        |
| #7 Prove deployment from current HEAD           | **closed** — version `d5ed879e` deployed from `d76693e` on 2026-08-29, smoke-tested                                                                                                                        |
| #8 Add `.editorconfig`                          | **closed**                                                                                                                                                                                                 |
| #1 Patch the vulnerable Astro/Cloudflare chain  | **open** — every finding is reachable only through the `astro` 6 → 7 and `@astrojs/cloudflare` 13 → 14 majors, and `npm audit fix` does not reduce the count. Recorded as a dated exception in `AGENTS.md` |
| #3 Make E2E execution real                      | **open** — the workflow still exits zero with `Skipping E2E` when secrets are absent                                                                                                                       |
| #4 Add a full type-check gate                   | **open**                                                                                                                                                                                                   |
| #5 Add a security gate                          | **open**                                                                                                                                                                                                   |

## Dependency Health

### Lockfile

Status: present (`package-lock.json`)
Package manager: npm

### Security Audit

Tool: `npm audit --json`
Summary: 0 CRITICAL, 12 HIGH, 1 MODERATE, 1 LOW
Direct vs transitive: HIGH 2 direct / 10 transitive; MODERATE 1 direct; LOW 1 transitive.

#### CRITICAL findings

None.

#### HIGH findings

- **astro** (direct, 6.4.8) — XSS advisories and affected `esbuild`/`sharp` chain. Fix: plan and verify the paired Astro 7.2 + Cloudflare adapter 14 upgrade.
- **wrangler** (direct, 4.110.0) — affected `miniflare` chain. Fix: update to at least 4.120.1.
- **@cloudflare/vite-plugin** (transitive) — affected through `miniflare` and `wrangler`. Fix: update the Wrangler/Cloudflare toolchain.
- **brace-expansion** (transitive) — unbounded/exponential expansion DoS. Fix: resolve to 1.1.18+ or 5.0.9+.
- **fast-uri** (transitive) — host-confusion advisories. Fix: resolve to 3.1.5+.
- **js-yaml** (transitive) — quadratic CPU consumption. Fix: resolve to 4.3.1+.
- **miniflare** (transitive) — affected `sharp`/`undici` chain. Fix: update Wrangler.
- **nanoid** (transitive) — non-terminating generator edge cases. Fix: resolve to 3.3.17+.
- **postcss** (transitive) — source-map path traversal/file disclosure. Fix: resolve above 8.5.22.
- **sharp** (transitive) — inherited libvips vulnerabilities. Fix: resolve to 0.35.0+ through the Astro/Cloudflare upgrade.
- **svgo** (transitive) — incomplete script removal. Fix: resolve to 4.0.2+.
- **undici** (transitive) — response desynchronization, disclosure, crash and injection advisories. Fix: resolve to 7.29.0+ through Wrangler/Miniflare.

MODERATE: **@astrojs/cloudflare** (direct, 13.5.0) is affected through Astro. The audit proposes adapter 14.2.0 as the paired major upgrade.

LOW: **esbuild** (transitive) has a Windows development-server file-read advisory; resolve to 0.28.1+ through the Astro upgrade.

### Outdated Dependencies

Packages with major version gaps: 8

- **@astrojs/cloudflare**: 13.5.0 → 14.2.0
- **@astrojs/react**: 5.0.4 → 6.0.2
- **@eslint/js**: 9.39.4 → 10.0.1
- **astro**: 6.4.8 → 7.2.0
- **eslint**: 9.39.4 → 10.8.1
- **eslint-plugin-astro**: 1.7.0 → 3.1.0 (two major versions)
- **lint-staged**: 16.4.0 → 17.3.0
- **typescript**: 5.9.3 → 7.0.2 (two major versions)

## Test Suite

Test runner: Vitest
Tests found: 46 tests in 6 files
Test execution: passing

Configuration: `vitest.config.ts`
Framework: Vitest 4.1.10

Playwright also enumerates 5 tests in 5 files (including auth setup), but the latest GitHub Actions E2E run skipped execution because all required secrets were empty. No current browser-level pass is proven.

## CI/CD

Provider: GitHub Actions
Configuration: `.github/workflows/ci.yml`, `.github/workflows/playwright.yml`

| Stage      | Status | Notes                                                                                    |
| ---------- | ------ | ---------------------------------------------------------------------------------------- |
| Lint       | ✓      | `npm run lint` in default CI; current committed HEAD passed, current local worktree OOMs |
| Test       | ✓      | Vitest via `npm test`                                                                    |
| Build      | ✓      | `npm run build`                                                                          |
| Type check | ✗      | no `astro check` or equivalent CI step                                                   |
| Security   | ✗      | no `npm audit`, CodeQL, Dependabot, or equivalent gate                                   |

The latest default CI run for HEAD `c6f331c` passed on 2026-07-15. The E2E workflow also reported success, but its log says `Skipping E2E` and ran zero browser tests. There is no deployment stage.

## Configuration

### High severity

- **`tsconfig.json` / `eslint.config.js` scope** — `include: ["**/*"]` and missing ignores pull the untracked 5.7 GB `legacy_projekt/` tree into type-aware tooling. Both `npm run lint` and `astro check` currently exhaust a 4 GB Node heap. Fix: explicitly exclude `legacy_projekt/`, `.agents/`, and local package stores from TypeScript/ESLint, or move the legacy case study outside this project.

### Medium severity

- **`.github/workflows/ci.yml`** — strict TypeScript exists, but CI never runs a full type check or security audit. Fix: add `npx astro check` and `npm audit --audit-level=high` after dependency remediation.
- **`.github/workflows/playwright.yml`** — missing secrets produce a successful no-op. Fix: configure the four required secrets and fail or clearly mark the job skipped when absent; upload the actual reporter/trace paths.
- **Husky setup** — `.husky/pre-commit` exists, but `package.json` has no `prepare` script and Git has no active hooks path. Fix: restore Husky installation (`npm pkg set scripts.prepare="husky"`, then `npm run prepare`) or remove the dead claim.
- **Formatting scope** — no `.prettierignore`; `prettier --write .` can traverse local reference trees and touch preserved `context/` artifacts. Fix: add explicit safe ignores or scope the command to application files.
- **Deployment drift** — stack notes say Cloudflare Pages with auto-deploy, while the repository uses Workers and manual Wrangler deploy. The active deployment predates HEAD. Fix: choose one contract, add verified deployment automation, and smoke-test the deployed HEAD.

### Low severity

- **`.editorconfig`** — missing cross-editor baseline. Fix: add a small UTF-8/LF/two-space configuration.

## Stack Assessment Cross-Reference

No `stack-assessment.md` found. Run `/10x-stack-assess` for quality-gate analysis.

## Recommended Fixes

### Fix before agent work (Category A)

### 1. Patch the vulnerable Astro/Cloudflare dependency chain

**Impact**: the public application currently uses two directly affected HIGH packages and one directly affected MODERATE package.
**Severity**: high
**Effort**: significant (> 1 hour)
**Fix**:

Create a dedicated upgrade change. Update Wrangler first, then upgrade Astro and its Cloudflare adapter together. Regenerate the lockfile and run `npm audit --json`, `npm run lint`, `npm test`, `npm run build`, and authenticated smoke tests. Do not use blind `npm audit fix --force`.

### 2. Restore bounded lint and type-check scope

**Impact**: the agent cannot prove code quality in the current worktree because lint and type diagnostics run out of memory.
**Severity**: high
**Effort**: moderate (15–30 min)
**Fix**:

Exclude local reference trees from `tsconfig.json` and ESLint, then rerun `npm run lint` and `npx astro check` with the normal heap limit.

### 3. Make E2E execution real

**Impact**: a green workflow currently proves only installation, not browser behavior.
**Severity**: high
**Effort**: moderate (15–30 min)
**Fix**:

Set `E2E_EMAIL`, `E2E_PASSWORD`, `SUPABASE_URL`, and `SUPABASE_KEY` as Actions secrets; remove the successful skip; run the four Chromium specs and retain trace/report artifacts.

### 4. Add a full type-check gate

**Impact**: strict TypeScript settings are not enforced end-to-end in CI.
**Severity**: medium
**Effort**: quick (< 5 min)
**Fix**:

After fixing tool scope, add a `check` script for `astro check` and call `npm run check` in `.github/workflows/ci.yml`.

### 5. Add a security gate

**Impact**: new advisories can appear while CI remains green, as happened here.
**Severity**: medium
**Effort**: quick (< 5 min)
**Fix**:

After dependency remediation, add `npm audit --audit-level=high` to CI and enable Dependabot or an equivalent scheduled dependency check.

### 6. Repair local hooks and safe formatting scope

**Impact**: documented pre-commit checks are inactive, and the broad format command can touch preserved artifacts.
**Severity**: medium
**Effort**: moderate (15–30 min)
**Fix**:

Restore Husky installation and add a `.prettierignore`, or narrow the format script to approved application paths.

### 7. Prove deployment from current HEAD

**Impact**: the live site responds, but its active Cloudflare version predates the current HEAD, so production parity is unknown.
**Severity**: medium
**Effort**: moderate (15–30 min)
**Fix**:

After security fixes, deploy the verified HEAD, record the commit/version mapping, then smoke-test `/`, protected `/app`, auth, CRUD, readiness, CSV, and live refresh.

### 8. Add `.editorconfig`

**Impact**: editors can disagree on basic line endings and indentation.
**Severity**: low
**Effort**: quick (< 5 min)
**Fix**:

Add UTF-8, LF, final newline, trimmed trailing whitespace, and two-space indentation defaults.

### Addressed in upcoming lessons (Category B)

No expected Category B gaps remain: agent instructions, CI configuration, and Cloudflare deployment configuration already exist. The findings above are repair work, not missing course scaffolding.

## Summary

Health status: needs-attention

The product has a reproducible lockfile, a working Vitest suite (46/46), a successful build, and default GitHub CI on the committed HEAD. It is not ready for another public release: the dependency audit has 12 HIGH findings, local lint/type diagnostics OOM because tool scope includes a huge reference tree, E2E is false-green, and the active deployment is older than HEAD.

Next step: close the public-access and RLS risks identified in the project audit, then repair dependency/tooling gates and deploy a verified HEAD.
