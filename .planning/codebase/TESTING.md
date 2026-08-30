# Testing Patterns

**Analysis Date:** 2026-08-29
**Updated:** 2026-08-30 — manual-QA surface note (theme × lang) added

## Summary — There Is No Test Suite

This project has **no automated tests and no test framework**. Verified against `package.json`, `package-lock.json`, the full `src/` tree, and repo config:

- No `jest`, `vitest`, `mocha`, `jasmine`, `ava`, `@testing-library/*`, `@playwright/test`, or `cypress` in `dependencies` or `devDependencies` (`package.json`).
- No `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `cypress.config.*` anywhere in the repo.
- No `*.test.ts(x)` / `*.spec.ts(x)` files, and no `__tests__/`, `test/`, `tests/`, or `e2e/` directories under `src/` or the repo root.
- No `describe(` / `it(` / `test(` / `expect(` test-style calls in `src/` (the only `.test(` matches are `RegExp.prototype.test`, e.g. `src/lib/optimizer/parser.ts:203`).
- No `"test"` script in `package.json` `scripts` (only `dev`, `build`, `lint`, `preview`).
- CLAUDE.md states explicitly: **"테스트 프레임워크 없음"** ("no test framework") and **"변경 후에는 반드시 `npm run build`로 타입 오류 확인"** ("after changes, always verify type errors with `npm run build`").

## Test Framework

**Runner:** None.

**Assertion Library:** None.

**Run Commands:**
```bash
# There is no test command. The de-facto verification pipeline:
npm run build     # tsc -b && vite build  — TypeScript strict compile is the real gate
npm run lint      # eslint .              — TS/React syntax, hooks rules, no-explicit-any
npm run preview   # serve dist/ for manual smoke-check of a production build
npm run dev       # Vite dev server for interactive manual testing (HMR)
```

## What Stands In For Tests

### 1. TypeScript strict compilation (primary gate)

`npm run build` runs `tsc -b` across `tsconfig.app.json` + `tsconfig.node.json` before Vite bundles. Strict flags catch a large class of errors that tests would otherwise cover:

- `strict`, `noUnusedLocals`, `noUnusedParameters`
- `noFallthroughCasesInSwitch` — guards the many `switch` statements in `src/lib/optimizer/`
- `erasableSyntaxOnly`, `verbatimModuleSyntax`, `noUncheckedSideEffectImports`
- `@typescript-eslint/no-explicit-any: 'error'` (in `eslint.config.js`)

Treat a clean `npm run build` as the definition of "passing" for this repo.

### 2. ESLint

`eslint.config.js` (flat config) extends `js.configs.recommended`, `tseslint.configs.recommended`, `reactHooks.configs.flat.recommended`, `reactRefresh.configs.vite`, and `eslint-config-prettier`. It validates React Hooks rules (exhaustive-deps, rules-of-hooks) and react-refresh boundaries — the closest thing to a "component contract" check in the project.

### 3. Manual visual verification via headless browser scripts (ad hoc, not CI)

These are **one-off developer utilities**, not a test suite. They render pages in a headless browser and save screenshots / PDFs for a human to eyeball. They are not wired into any script or CI job and their runners are only partially declared as deps.

| Script | Purpose | Browser lib | Notes |
|--------|---------|-------------|-------|
| `verify_storage.mjs` (repo root) | Screenshots the Internals → Storage section accordions; logs `console` errors | `playwright` (`import { chromium }`) | `playwright` is **not** in `package.json`; uses a hard-coded local Chromium path. Output: `verify_01_landing.png` … `verify_08_tablespace_lmt.png` (some committed) |
| `scripts/export-partition-pdf.mjs` | Renders every `partition-*` section via `?print=<sectionId>` and writes per-section A4 PDFs to `~/OneDrive/Desktop/partition-pdf/` | `puppeteer` (in `devDependencies`) | Requires `npm run dev` running on `localhost:5173` first. Uses injected print CSS, `page.pdf(...)` with header/footer templates |
| `scripts/export-query-transform-pdf.mjs` | Same as above for `qt-*` sections | `puppeteer` | — |
| `scripts/merge-partition-pdf.mjs` | Merges the exported partition PDFs | `pdf-lib` (in `devDependencies`) | Post-processing helper |

`src/App.tsx` supports these scripts with a **print mode**: `?print=partition-...` or `?print=qt-...` renders only that section standalone (no layout chrome); `#simulator` renders the Internals Simulator full-screen.

### 4. Deployment as smoke test

`.github/workflows/deploy.yml` runs on push to `main`: `npm ci` → `npm run build` → deploy `dist/` to GitHub Pages. The workflow **only builds** — no `npm test`, no `npm run lint`. A broken `tsc` is the only thing that fails the pipeline.

### 5. Manual visual QA surface (design system)

Since the 2026-08-30 token migration, every screen must read correctly in **4 combinations**: `{light, dark} × {ko, en}` (theme toggle + language toggle in the header). Nothing automates this. Known debt: ~114 chapter files were token-migrated by script (`DESIGN.md §6`, `CONCERNS.md`), so diagrams that relied on pale hue fills or 7+ distinct colors need a human pass in `npm run dev`. A future smoke test that renders every `BOOK_CHAPTERS` leaf under both `data-theme` values would catch contrast/rendering regressions.

## Test File Organization

**Not applicable** — no test files exist.

If tests were introduced, the codebase layout suggests co-locating them next to sources (`src/lib/optimizer/parser.test.ts` beside `parser.ts`), since the project already keeps per-area helpers and types adjacent to their consumers (`shared.ts`, `types.ts` inside each feature directory).

## Test Structure

**Not applicable.**

## Mocking

**Not applicable** — no mocking framework, no `vi.mock` / `jest.mock`, no manual mocks.

Note for any future test author: the app already isolates the parts most worth testing behind pure, dependency-free modules, so mocking would rarely be needed:

- `src/lib/optimizer/parser.ts` — `parseSQL(sql): ParsedQuery`, pure string→object.
- `src/lib/optimizer/estimator.ts` — `computeSelectivity`, `combineSelectivities`, cost estimators; pure, reads from `stats.ts` constants.
- `src/lib/optimizer/planGenerator.ts` — `optimize(sql): OptimizerResult`, pure.
- `src/lib/optimizer/stats.ts` — static `TABLE_STATS` fixture data (12 tables of NDV / numRows / numBlocks).
- `src/data/largeDataGenerator.ts` — **deterministic** seeded Mulberry32 PRNG, result cached at module load; identical output every run.
- `src/data/hrSchema.ts`, `src/data/coSchema.ts` — static schema + sample rows.
- `src/book/chapters/sql-basics/dml-more/shared.ts` — pure query/step builders over the HR sample data.

zustand stores (`src/store/simulationStore.ts`, `src/store/internalsStore.ts`) are plain `create(...)` stores and can be driven directly via `useInternalsStore.getState().startSimulation(...)` without React, though `startSimulation` uses real `setTimeout` delays (would need fake timers).

## Fixtures and Factories

No test fixtures. The nearest equivalents are the app's own seed/sample data, which double as ready-made fixtures:

- `SAMPLE_QUERIES` — `src/data/index.ts` (5 example SQL strings).
- `INITIAL_CACHED_QUERIES` — `src/store/internalsStore.ts` (3 seed queries for the Library Cache).
- `HR_SCHEMA` / `CO_SCHEMA` — `src/data/hrSchema.ts`, `src/data/coSchema.ts`.
- `TABLE_STATS` — `src/lib/optimizer/stats.ts`.
- `EMPLOYEES` sample array — derived from `HR_SCHEMA` in `src/book/chapters/sql-basics/dml-more/shared.ts`.

## Coverage

**Requirements:** None enforced. No coverage tooling installed, no thresholds, no `--coverage` anywhere.

## Test Types

- **Unit Tests:** None.
- **Integration Tests:** None.
- **E2E Tests:** None (the `playwright` / `puppeteer` scripts are manual visual-verification / PDF-export utilities, not assertions).
- **Type "tests":** Implicit, via `tsc -b` strict mode on every build.

## Common Patterns

**Async testing:** Not applicable. Be aware that the main async surface (`internalsStore.startSimulation`, `internalsStore.flushBuffers`) sequences UI state with `await new Promise((r) => setTimeout(r, duration))` and would require fake timers to test.

**Error testing:** Not applicable. The only failure path in `src/` is the bare `try { optimize(query) } catch {}` in `startSimulation` (falls back to `optimizerResult = null`, then downstream `?.` guards). There are no `throw` statements in `src/` to assert against.

## Recommendation If Tests Are Added

Given the current stack (Vite 8 + React 19 + TS strict), the low-friction choice is **Vitest** (shares Vite config, native ESM/TS, `@/` alias already resolvable). Highest-value first targets, all pure and deterministic:

1. `src/lib/optimizer/parser.ts` — table/column/predicate/JOIN extraction from SQL strings.
2. `src/lib/optimizer/estimator.ts` — selectivity/cardinality/cost formulas against `stats.ts` fixtures.
3. `src/lib/optimizer/planGenerator.ts` — end-to-end `optimize()` on `SAMPLE_QUERIES`.
4. `src/data/largeDataGenerator.ts` — assert PRNG determinism and `getCardinalityRatio` / `recommendIndexType` outputs.
5. `src/book/bookStructure.tsx` — `getSectionById`, `getAdjacentSections`, `flattenSections` recursion over the n-deep TOC.

---

*Testing analysis: 2026-08-29*
