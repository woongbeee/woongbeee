# External Integrations

**Analysis Date:** 2026-08-29

## Summary

This is a **fully client-side, self-contained SPA** with no backend. It has **no external API calls at runtime** — no `fetch`, `axios`, `XMLHttpRequest`, or `WebSocket` anywhere in `src/`. Every "Oracle database" behavior (SQL parsing, CBO optimizer, execution plans, buffer cache hit/miss, statistics) is a pure TypeScript simulation. The only true external dependencies are a CDN web font, GitHub Pages hosting, and GitHub Actions CI. There is no real Oracle Database connection.

## APIs & External Services

**Runtime HTTP APIs:**
- None. No REST/GraphQL clients, no SDKs that make network calls. Grep for `fetch(` / `axios` / `XMLHttpRequest` / `WebSocket` in `src/` returns nothing.

**Fonts (CDN):**
- Google Fonts - `index.html` loads `https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800` via `<link rel="stylesheet">`, with `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`. This is the active Korean UI font (`--font-sans-ko` in `src/index.css`).
- `@fontsource-variable/geist` (npm) is installed but never imported — no self-hosted font is actually bundled.

**Simulated (not real) Oracle engine:**
- `src/lib/optimizer/` - Pure TS reimplementation of Oracle CBO: `parser.ts` (SQL SELECT parsing), `stats.ts` (`TABLE_STATS` — 12 hardcoded table statistics), `estimator.ts` (selectivity + cost), `planGenerator.ts` (Query Transformer → Estimator → Plan Generator). Entry: `src/lib/optimizer/index.ts` `optimize(sql)`.
- No `oracledb`, `node-oracledb`, JDBC, or any database driver dependency.

## Data Storage

**Databases:**
- None. No database client, no ORM, no connection string. All data is static TypeScript modules:
  - `src/data/hrSchema.ts` - HR schema: 7 tables + sample rows (`HR_SCHEMA`)
  - `src/data/coSchema.ts` - CO (Customer Orders) schema: 5 tables + sample rows (`CO_SCHEMA`)
  - `src/data/largeDataGenerator.ts` - Deterministic synthetic data generator (Mulberry32 seeded PRNG), generated once on import and cached in-module
  - `src/data/index.ts` - Barrel: `SCHEMAS`, `SAMPLE_QUERIES`
  - `src/lib/optimizer/stats.ts` - `TABLE_STATS` simulated NDV / numRows / numBlocks

**File Storage:**
- Local static assets only, served from `public/`: `memory.png` (referenced via `import.meta.env.BASE_URL` in `BufferCacheSection.tsx`), `icons.svg`. No upload/download, no object storage.

**Caching:**
- No HTTP or persistent cache. In-memory only:
  - `internalsStore.ts` `cachedQueries` (max 8, FIFO) simulates the Library Cache
  - `largeDataGenerator.ts` module-level cache of generated datasets
- No `localStorage` / `sessionStorage` / `indexedDB` usage — language selection and all simulator state reset on page reload.

## Authentication & Identity

**Auth Provider:**
- None. No login, no users, no sessions, no tokens, no auth library. The app is fully public and anonymous.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, no error reporting service, no global error boundary wired to a backend.

**Analytics:**
- None. No Google Analytics, Plausible, PostHog, or telemetry.

**Logs:**
- `console` only, and only in dev-time build scripts (`scripts/*.mjs`). No structured logging in the app.

**Dev-only profiling:**
- `react-scan` 0.5.3 - Render performance overlay, enabled solely when `import.meta.env.DEV` (`src/main.tsx`). Not included in production builds.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages - `https://woongbeee.github.io/woongbeee/` (project site; Vite `base: '/woongbeee/'` on build). Purely static.

**CI Pipeline:**
- GitHub Actions - `.github/workflows/deploy.yml`
  - Trigger: `push` to `main`
  - Permissions: `contents: read`, `pages: write`, `id-token: write`; `concurrency: pages` with `cancel-in-progress`
  - Steps: `actions/checkout@v4` → `actions/setup-node@v4` (node 24, `cache: npm`) → `npm ci` → `npm run build` → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3` (`path: dist`) → `actions/deploy-pages@v4`
  - Environment: `github-pages`
- No other CI (no tests, no lint gate in the workflow, no preview deploys).

## Environment Configuration

**Required env vars:**
- None. The app builds and runs with zero configuration. No `.env`, `.env.*`, or `VITE_*` variables exist or are read.

**Build-time constants (not secrets):**
- `__BUILD_DATE__` - Injected by `vite.config.ts` `define` from `new Date().toISOString().slice(0,10)`. Displayed in `src/book/BookLayout.tsx`.
- `import.meta.env.BASE_URL` - Vite built-in, resolves to `/woongbeee/` in production for the `memory.png` asset path.

**Secrets location:**
- None in the repo. Deployment uses GitHub's built-in OIDC (`id-token: write`) for `deploy-pages` — no stored `GITHUB_TOKEN` secret or third-party credentials.

## Webhooks & Callbacks

**Incoming:**
- None. Static site, no server endpoints.

**Outgoing:**
- None.

## Internal "Routing" (no router library)

No `react-router` or similar. `src/App.tsx` branches on `window.location` directly:
- `#simulator` hash → renders `InternalsSimulatorSection` standalone (opened via `window.open(...#simulator, '_blank')` in `BookLayout.tsx`)
- `?print=<sectionId>` query param (`partition-*` or `qt-*` prefix) → renders that single section for PDF export by `scripts/export-*-pdf.mjs`
- Otherwise → `BookLayout`

## Dev-Only Tooling Integrations

- `scripts/export-partition-pdf.mjs`, `scripts/export-query-transform-pdf.mjs` - Puppeteer 25.1.0 drives headless Chromium against a locally running `npm run dev` server (`http://localhost:5173`), hitting `?print=<sectionId>` URLs and calling `page.pdf(...)`. Output written to the user's Desktop (`~/OneDrive/Desktop/...`).
- `scripts/merge-partition-pdf.mjs` - `pdf-lib` 1.17.1 merges per-section PDFs into one file on the Desktop.
- These are manual authoring aids, not part of the build or deploy pipeline.

---

*Integration audit: 2026-08-29*
