---
verified_at: 2026-07-14
scope: secure-starter-dependencies
---

## Result

The standard, non-forced npm remediation updated the lockfile only. It resolved all high and moderate findings from the bootstrap baseline without changing any declared top-level version range or applying a major-version upgrade.

| Package | Before resolved | After resolved | Result |
| --- | ---: | ---: | --- |
| `astro` | 6.3.1 | 6.4.8 | High findings resolved; one low finding remains. |
| `supabase` CLI | 2.98.2 | 2.109.1 | Direct moderate finding resolved. |
| `wrangler` | 4.90.0 | 4.110.0 | Direct moderate finding resolved. |
| `vite` override | 7.3.3 | 7.3.6 | Vulnerable range resolved. |

## Commands and evidence

| Command | Result |
| --- | --- |
| `npm audit --json --package-lock-only` before update | 0 critical, 6 high, 9 moderate, 2 low (17 total). |
| `npm audit fix --dry-run --json` | Proposed compatible updates: Astro 6.4.8, Supabase CLI 2.109.1, Wrangler 4.110.0, Vite 7.3.6; no forced major update. |
| `npm audit fix --package-lock-only` | Completed standard remediation. |
| `npm ci` | Passed, 762 packages installed. |
| `npx astro sync` | Passed. |
| `npm run lint` | Passed. Existing `astro-eslint-parser` compatibility warnings only. |
| `npm run build` | Passed. Existing sitemap warning only because `site` is not set. |
| `npm audit --json --package-lock-only` after update | 0 critical, 0 high, 0 moderate, 3 low (3 total). |

## Residual risk

The remaining three low findings are in the Astro/Cloudflare adapter chain (`astro` and `@astrojs/cloudflare`). npm reports that their automatic fix requires Astro 7, a breaking major upgrade. That upgrade is deliberately out of scope for this security-only change and requires a dedicated compatibility plan before any production deployment.

## Manual follow-up

The built landing page and `/auth/signin` route still need a browser smoke test in the latest Chrome. This is intentionally left as a manual course-review check; it cannot be proven by the build alone.

**Plan-review residual (2026-07-15):** Progress items 1.3 and 2.4 closed from remediation/diff evidence. **3.5 closed 2026-07-16** via Playwright smoke of `/` and `/auth/signin` (see below).


## F-01 Chrome smoke (closed 2026-07-16)

Playwright headless capture against local `npm run dev`:

- `GET /` returned 200; landing screenshot saved.
- `GET /auth/signin` returned 200; Email/Password form present; screenshot saved.
- Full sign-in reached `/app` (post-login board screenshot).

Progress item 3.5 is marked done. Residual risk for production deploy remains separate (Cloudflare secrets / wrangler auth).
