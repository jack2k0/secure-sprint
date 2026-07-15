# SecureSprint E2E quality rules

1. **Locators:** prefer `getByRole` / `getByLabel` / `getByText`; avoid CSS/XPath unless no accessible name.
2. **Waits:** wait for state (`toBeVisible`, `toHaveURL`, network idle only if needed) — never `page.waitForTimeout`.
3. **Auth:** use `storageState` from `auth.setup.ts`; do not re-login in every test except dedicated auth specs.
4. **Isolation:** unique titles/data per run (`E2E-${Date.now()}-…`); clean up via Archive or API when practical.
5. **Assertions:** bind to a named risk (readiness incomplete, live board remote update) — not “page loaded”.
6. **Boundaries:** auth, routing, API, Supabase stay **real**; mock only non-deterministic external APIs.
7. **One risk per file** under `tests/e2e/`.
