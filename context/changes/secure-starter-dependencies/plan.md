# Secure Starter Dependencies Implementation Plan

## Overview

Update the starter's dependency graph to remove the known direct audit findings before SecureSprint feature work begins. The change is intentionally narrow: it updates package metadata and the lockfile only when a compatible update is available, then proves that the Astro/Cloudflare application still builds.

## Current State Analysis

The bootstrapped Astro 6 application builds and lints successfully, but the recorded audit baseline contains 1 direct high finding (Astro) and 2 direct moderate findings (Supabase CLI and Wrangler). A fresh lockfile-only audit confirms the same total: 0 critical, 6 high, 9 moderate, and 2 low findings. No application test runner exists yet, so this change must not claim test coverage it cannot run.

The repository uses npm with a committed lockfile, Node 22 in CI, and Cloudflare SSR. The CI workflow already runs clean installation, Astro sync, lint, and build. The dependency update has to preserve that path.

## Desired End State

`package.json` and `package-lock.json` resolve compatible versions that address the direct Astro, Supabase CLI, Wrangler, and Vite findings where fixes are available. A clean install, Astro synchronization, lint, and production build succeed with the configured Supabase environment variables. The final audit evidence records whether all direct findings were eliminated; any remaining finding has a concrete compatibility reason and follow-up, rather than being silently ignored.

### Key Discoveries:

- The original audit baseline and the requirement to address direct findings are recorded in `context/changes/bootstrap-verification/verification.md:64` and `AGENTS.md:11`.
- Direct vulnerable dependency thresholds are Astro `>=6.4.6`, Supabase CLI `>=2.98.3`, Wrangler `>=4.102`, and Vite `>=7.3.5`; the current root specs are in `package.json:26`, `package.json:52`, `package.json:55`, and `package.json:57`.
- CI already verifies `npm ci`, `npx astro sync`, lint, and build on Node 22 in `.github/workflows/ci.yml:14`–`.github/workflows/ci.yml:24`.
- The Cloudflare adapter uses Astro server output and Node compatibility settings in `astro.config.mjs:11` and `wrangler.jsonc:4`; this is the compatibility boundary to recheck after upgrades.

## What We're NOT Doing

- Adding SecureSprint product features, database migrations, tests, or authentication changes.
- Running `npm audit fix --force`, manually editing transitive packages, or accepting a major-version upgrade without a separate plan.
- Changing deployment secrets, publishing a deployment, or initializing a Git remote.
- Treating unrelated transitive findings as resolved without audit evidence.

## Implementation Approach

First inspect the non-forced audit remediation proposal and current outdated versions, so the exact change is evidence-led. Apply only compatible package and lockfile updates, inspect the resulting diff, and then run the existing CI-equivalent verification sequence. This preserves npm reproducibility and catches incompatible Astro/Cloudflare upgrades before any product work depends on the starter.

## Critical Implementation Details

Do not use a forced audit repair. The update may alter the Astro and Wrangler runtime chain even without a major version change, so package changes must be followed by `astro sync` and a production build with the same Supabase variables used by CI. The historical bootstrap verification is evidence of the starting point and must not be overwritten.

## Phase 1: Establish an Evidence-Led Upgrade Set

### Overview

Determine the smallest safe compatible remediation set before changing tracked files.

### Changes Required:

#### 1. Dependency audit evidence

**File**: no tracked source change in this phase

**Intent**: Capture the current direct findings and inspect npm's standard, non-forced remediation proposal. This prevents an opaque lockfile change and establishes the comparison point for the final result.

**Contract**: Run `npm audit --json --package-lock-only`, `npm audit fix --dry-run`, and `npm outdated`; identify the proposed versions for Astro, Supabase CLI, Wrangler, and the Vite override. Do not execute an update in this phase.

### Success Criteria:

#### Automated Verification:

- The audit JSON identifies the direct findings and their fix versions.
- The dry-run contains no required forced/major upgrade; otherwise execution stops for a new compatibility decision.

#### Manual Verification:

- Review the dry-run and confirm that its scope is restricted to dependency remediation.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the review was successful before proceeding to the next phase.

---

## Phase 2: Apply Compatible Dependency and Lockfile Updates

### Overview

Apply the reviewed non-forced package updates and leave the repository with a deterministic dependency graph.

### Changes Required:

#### 1. Package manifest and lockfile

**File**: `package.json`

**Intent**: Update only the direct specifications or override needed to obtain the reviewed compatible remediation set.

**Contract**: Keep the existing Astro, Cloudflare, Supabase, and npm conventions. Do not add feature dependencies or change scripts in this security-only change.

**File**: `package-lock.json`

**Intent**: Record the exact resolved dependency graph corresponding to `package.json`.

**Contract**: Regenerate through npm; never hand-edit entries. `npm ci` must install this lockfile cleanly.

### Success Criteria:

#### Automated Verification:

- `npm ci` succeeds from the updated lockfile.
- `npm audit --json --package-lock-only` shows no direct Astro, Supabase CLI, Wrangler, or Vite finding, or produces a documented compatible-version limitation.
- `git diff --check` reports no whitespace errors in the package metadata changes.

#### Manual Verification:

- Inspect the manifest and lockfile diff; it contains only reviewed dependency-graph changes.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the diff review was successful before proceeding to the next phase.

---

## Phase 3: Prove the Cloudflare Starter Still Works

### Overview

Run the existing CI-equivalent checks against the updated graph and retain concise execution evidence for the next implementation change.

### Changes Required:

#### 1. Verification evidence

**File**: `context/changes/secure-starter-dependencies/verification.md`

**Intent**: Record commands, final audit counts, installed direct dependency versions, and the build outcome so a lower-capability implementation model does not have to infer the security baseline.

**Contract**: Add a dated, human-readable result. Preserve `context/changes/bootstrap-verification/verification.md` unchanged as the pre-update baseline.

### Success Criteria:

#### Automated Verification:

- `npx astro sync` succeeds.
- `npm run lint` succeeds.
- `npm run build` succeeds with `SUPABASE_URL` and `SUPABASE_KEY` supplied, matching CI.
- A final `npm audit --json --package-lock-only` result is saved in the verification evidence.

#### Manual Verification:

- Run the built application or preview locally and verify that the landing page and existing sign-in route render without a server error.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the smoke test was successful before marking the change implemented.

## Testing Strategy

### Unit Tests:

- No application unit-test suite is introduced by this dependency-only change.
- The next foundation F-02 introduces the course-required test plan and readiness-rule tests.

### Integration Tests:

- Use `astro sync`, lint, and the production build as integration checks for the Astro, Cloudflare adapter, and Supabase SSR dependency graph.

### Manual Testing Steps:

1. Review the non-forced audit dry-run before applying changes.
2. After the build, open the landing page and `/auth/signin` in the latest Chrome.
3. Confirm the sign-in page renders and no server error is visible.

## Performance Considerations

No product runtime behavior changes. Avoid widening the dependency graph; the desired result is a safer, reproducible graph with no added client payload by design.

## Migration Notes

No data migration is involved. If the standard audit proposal requires a major version or changes Astro/Cloudflare configuration, stop this change, restore the reviewed package state, and create a separate compatibility plan rather than forcing an upgrade.

## References

- Product sequence: `context/foundation/roadmap.md` (F-01)
- Security baseline: `context/changes/bootstrap-verification/verification.md:64`
- Repository safety rules: `AGENTS.md:7`, `AGENTS.md:11`, `AGENTS.md:20`
- Package metadata: `package.json:5`, `package.json:16`, `package.json:26`, `package.json:52`, `package.json:55`, `package.json:57`
- CI verification: `.github/workflows/ci.yml:14`
- Cloudflare runtime boundary: `astro.config.mjs:11`, `wrangler.jsonc:4`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Establish an Evidence-Led Upgrade Set

#### Automated

- [x] 1.1 Capture the lockfile-only audit and non-forced remediation proposal
- [x] 1.2 Verify the proposal does not require a forced or major upgrade

#### Manual

- [ ] 1.3 Review the remediation scope

### Phase 2: Apply Compatible Dependency and Lockfile Updates

#### Automated

- [x] 2.1 Install the updated lockfile with npm ci
- [x] 2.2 Verify the direct audit findings are resolved or explicitly limited
- [x] 2.3 Check the dependency metadata diff for whitespace errors

#### Manual

- [ ] 2.4 Review that the dependency diff matches the approved scope

### Phase 3: Prove the Cloudflare Starter Still Works

#### Automated

- [x] 3.1 Run Astro synchronization
- [x] 3.2 Run lint
- [x] 3.3 Run the production build with CI-equivalent Supabase variables
- [x] 3.4 Save the final audit evidence

#### Manual

- [ ] 3.5 Smoke-test landing and sign-in routes in Chrome
