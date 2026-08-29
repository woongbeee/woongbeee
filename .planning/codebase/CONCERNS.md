# Codebase Concerns

**Analysis Date:** 2026-08-29

This is an educational SPA (interactive Oracle textbook). There is no backend, no
user data, no auth, and no database — so classic production risks (secrets, PII,
SQL injection, scaling) are mostly absent. The real concerns are **dead code**,
**stale documentation**, **incomplete chapters**, a **regex SQL "parser"** that
only has to look plausible, and the **absence of routing / persistence / tests**.

---

## Tech Debt

### Orphaned / dead files (never imported, still compiled & shipped)

**`src/components/LandingPage.tsx`** (~200 lines)
- Issue: Zero import sites. `App.tsx` no longer has the `AppView: 'landing' | 'book'`
  toggle that CLAUDE.md still documents — it renders `<BookLayout />` unconditionally.
- Files: `src/components/LandingPage.tsx`, plus the now-dead `#root.landing` rule at
  `src/index.css:142` (nothing adds the `.landing` class anymore).
- Impact: Confuses new contributors; `tsc` and ESLint pass because the file is
  syntactically valid and self-contained. Bundled dead weight.
- Fix approach: Delete `LandingPage.tsx` and the `#root.landing { … }` block in
  `src/index.css`. Update CLAUDE.md "앱 진입점 및 뷰 전환" section.

**`src/book/chapters/optimizer/plan/PlanReadingSection.tsx`** (1063 lines)
- Issue: Imported and routed in `src/book/chapters/optimizer/index.tsx:9,40`
  (`sectionId === 'optimizer-plan-reading'`), but **no `optimizer-plan-reading`
  section ID exists in `src/book/bookStructure.tsx`**. Unreachable via navigation.
- Impact: 1000+ lines of maintained-but-unused content. Largest single dead file.
- Fix approach: Either register `optimizer-plan-reading` in `BOOK_CHAPTERS` or
  delete the file + its import/branch.

**`src/book/chapters/internals/overview/sga/undo-segment/UndoSegmentSection.tsx`**
- Issue: `export function UndoSegmentSection()` is never imported. `internals/index.tsx`
  has no `internals-sga-undo-segment` branch and `bookStructure.tsx` has no such
  section. Its sibling SGA pages (buffer-cache, shared-pool, redo-log-buffer,
  large-pool) are all wired; this one was left behind.
- Impact: Dead file; `noUnusedLocals` does not catch it because it is `export`ed.
- Fix approach: Delete, or add the section ID + router branch if the page is wanted.

**`src/book/chapters/optimizer/index.tsx:42`** — `optimizer-join-overview` branch
- Issue: Router handles `optimizer-join-overview` but only `optimizer-join`
  (+ `-nested-loop`, `-hash`, `-sort-merge`) exist in `bookStructure.tsx`.
  Harmless fallthrough, but signals drift between router and TOC.

### Stale documentation (multiple sources disagree with the code)

**`README.md`**
- Chapter list is wrong: README says "1 SQL 기본 문법 … 9 병렬 처리" (9 chapters,
  different order). Actual app (`bookStructure.tsx`, CLAUDE.md) is "0 Introduction,
  1 Data Modeling, 2 SQL Basics, 3 Internals, 4 Join, 5 Index, 6 Partition,
  7 Parallel, 8 Optimizer, 9 SQL Tuning".
- References `playwright` for verification (see below) which is not installed.
- Fix approach: Regenerate the chapter table from `BOOK_CHAPTERS`.

**`CLAUDE.md`**
- "앱 진입점 및 뷰 전환" describes a landing/book view toggle in `App.tsx` that no
  longer exists.
- Says `src/book/chapters/index-chapter/IndexPage.tsx` is dead code — the file has
  already been deleted (not present in `src/`).
- Says `WipBanner` is "현재 `BitmapSection`, `CompositeSection`에 적용 중" — neither
  `src/book/chapters/index-chapter/bitmap/BitmapSection.tsx` nor
  `.../composite/CompositeSection.tsx` contains a `<WipBanner />` anymore.
- Fix approach: Sweep CLAUDE.md against current `src/` during the next doc pass.

**`src/data/largeDataGenerator.ts:1-12,453`**
- Header comment claims "앱 최초 import 시 1회 생성" / "이 파일을 import하면 즉시
  생성이 시작됨". Not true — generation is lazy behind `getLargeDataset()`
  (`largeDataGenerator.ts:456-461`); importing the module does nothing.
- Fix approach: Correct the comment to describe the lazy singleton.

**`components.json`**
- `"iconLibrary": "lucide"` but `lucide-react` is not a dependency (removed from
  `package.json`) and CLAUDE.md mandates `@tabler/icons-react`. Also declares a
  `@/hooks` alias — there is no `src/hooks/` directory.
- Fix approach: Set `"iconLibrary": "tabler"`, drop the unused hooks alias.

### Accidentally-committed scratch files at repo root

All added in commit `a83927f` ("Optimizer section in process"), none in `.gitignore`:

- **`C:UserswoongOneDriveDesktopbuffer_cache_pages.txt`** (28 KB) — a Windows
  absolute path that got collapsed into a literal filename (the `:` became a
  fullwidth `：`, byte sequence `\357\200\272`). Contains a raw text dump of Oracle
  documentation pages. `git` cannot even address it normally ("outside repository").
- **`verify_01_landing.png`** (232 KB) — a one-off screenshot.
- **`verify_storage.mjs`** — a Playwright script (`import { chromium } from 'playwright'`)
  that cannot run: `playwright` is not installed; only `puppeteer` is
  (`scripts/*.mjs` use `puppeteer`). Also hardcodes a machine-specific Chrome path
  `C:/Users/woong/AppData/Local/ms-playwright/...` and `localhost:5199`.
- Fix approach: `git rm` all three; add `verify_*.png`, `verify_*.mjs`, and
  `*.txt` (or a `scratch/` dir) to `.gitignore`.

### Duplicated content: two parallel "Join" chapters

- `src/book/chapters/join/` — Chapter 4, sections `join-nested-loop`, `join-hash`,
  `join-sort-merge`, `join-semi`, `join-simulator` (large: 500-680 lines each).
- `src/book/chapters/optimizer/join/` — Chapter 8, sections `optimizer-join-*`
  (smaller: 155-211 lines each), plus `NestedLoopSection.tsx` / `HashJoinSection.tsx`
  / `SortMergeSection.tsx` **filenames collide** with the Chapter 4 versions.
- Impact: Nested Loop / Hash / Sort-Merge join are explained twice, in two
  different component trees, with duplicated `T` translation blocks and diagrams.
  Bug fixes / wording changes must be made in both. Filename collisions make
  grep/navigation error-prone.
- Fix approach: Decide which chapter owns the deep explanation; have the other
  link to it or render a short summary. If both must exist, rename the optimizer
  copies (`OptimizerNestedLoopSection.tsx`, …).

### Two "optimizer simulators", one real and one faked

- `src/book/chapters/optimizer/simulator/OptimizerSimulator.tsx` (1510 lines) —
  11 fully **hardcoded** queries with pre-baked `planRows`. Does **not** call the
  CBO engine in `src/lib/optimizer/`.
- The *Internals* simulator (`src/store/internalsStore.ts` → `optimize()`) is the
  only consumer of the real CBO engine.
- Impact: The "Optimizer" chapter's flagship interactive feature is a slideshow;
  the genuinely interesting `planGenerator.ts` cost model is buried in the
  Internals chapter. Any improvement to the CBO model is invisible in the chapter
  that teaches CBO.
- Fix approach: Wire `OptimizerSimulator` to `optimize()` for at least the simple
  queries, or clearly label it "curated examples".

### Dead public API surface in `src/lib/optimizer/index.ts`

- `estimateJoinCost`, `generateAccessPaths`, `computeSelectivity`, `getColumnStats`,
  `getTableStats`, `parseSQL` are re-exported from `src/lib/optimizer/index.ts:1-4`
  but have **no consumers outside `src/lib/optimizer/`**. Only `optimize` and the
  `OptimizerResult` type are used (by `internalsStore.ts`, `OptimizerPanel.tsx`,
  `ExecutionPlanViewer.tsx`).
- Impact: Implies a public API that nothing depends on; widens the refactor
  blast-radius unnecessarily.
- Fix approach: Trim the barrel to `optimize` + types, or document that the rest
  is intentional future surface.

### Incomplete `lang` store migration

- `src/store/simulationStore.ts` exports `useLangStore` and a "legacy alias"
  `useSimulationStore = useLangStore`. CLAUDE.md: "새 코드에서는 `useLangStore`를
  사용할 것".
- Reality: **117** files import `useSimulationStore`, only **16** import
  `useLangStore`. The migration is ~12% done and stalled.
- The file is also misnamed: `simulationStore.ts` holds only `{ lang, setLang }`;
  the actual simulation state lives in `internalsStore.ts`.
- Fix approach: Codemod all `useSimulationStore` → `useLangStore`, delete the
  alias, rename the file to `langStore.ts`.

### Incomplete CSS-variable migration & dead dark-mode styling

- `src/index.css:42-56` — a block of "legacy aliases — kept for gradual migration"
  (`--bg-base`, `--sapphire-bright`, `--tangerine`, …). Half-migrated to shadcn vars.
- `@custom-variant dark (&:is(.dark *))` is defined and **7 files** use `dark:`
  classes (`OptimizerSimulator.tsx`, `shared.tsx`, `GlossaryPanel.tsx`,
  `sql-basics/dml-more/JoinSection.tsx`, `SqlHighlight.tsx`, `ui/badge.tsx`,
  `ui/button.tsx`), but **nothing ever applies the `.dark` class** and
  `color-scheme: light` is hardcoded (`src/index.css:7`). All `dark:` variants are
  dead.
- Fix approach: Either ship a theme toggle or strip `dark:` classes and the
  `@custom-variant dark` line; finish or remove the legacy-alias block.

### Uncommitted design refactor in flight

- Working tree (as of analysis) has un-committed edits: `src/App.tsx`,
  `src/book/BookContent.tsx`, `src/book/bookStructure.tsx`,
  `src/book/chapters/introduction/IntroductionPage.tsx`, `src/book/chapters/shared.tsx`,
  `src/index.css`, `index.html`, plus untracked `src/lib/theme.ts`.
- The change centralizes chapter colors into `src/lib/theme.ts` (`ACCENT_COLORS`),
  removes the inline `COLOR_MAP` / `COLOR_CARD` / `SQL_BADGE` maps, adds a
  `--font-sans-ko` / `--font-sans-en` swap driven by `document.documentElement.lang`,
  and adds `--color-brand-*` hex vars.
- Concern: `IntroductionPage.tsx:310,343` now do `ACCENT_COLORS[s.color as AccentColor]`
  / `ACCENT_COLORS[card.color as AccentColor]` with **no `?? fallback`**. The `as`
  cast bypasses the type check; a data typo (`'blu'`) yields `c = undefined` →
  `c.bg` throws at render. `shared.tsx:339` got this right
  (`ACCENT_COLORS[badgeColor as AccentColor] ?? ACCENT_COLORS.blue`).
- Fix approach: Add the same `?? ACCENT_COLORS.blue` fallback in `IntroductionPage`,
  or type the `strengths[].color` / `userCards[].color` fields as `AccentColor` so
  the cast is unnecessary.

---

## Known Bugs

### Race condition / no cancellation in the Internals simulation loop

- Files: `src/store/internalsStore.ts:145-321` (`startSimulation`),
  `src/store/internalsStore.ts:323-328` (`resetSimulation`),
  `src/components/QueryInput.tsx:199-214`.
- Symptoms:
  1. `startSimulation` is `async` and `await`s `setTimeout` between steps (total
     ~13-17 s). It captures `const store = get()` **once** at line 146. Line 262
     later reads `store.bufferFlushed` — a value that is **10+ seconds stale** by
     the time that step runs. If the user hits "Buffer Flush" mid-run the state
     read is wrong (mitigated only because the Buffer Flush button is `disabled`
     while `isRunning`).
  2. There is **no way to abort** a running loop. `resetSimulation()`
     (`QueryInput.tsx` "Reset" button, also `disabled` during run) sets state back
     to `initialState`, but the in-flight `for` loop keeps calling `get().setStep`
     / `set(...)` on every remaining tick, overwriting the reset. The only guard is
     `if (store.isRunning) return` at the **entry** of `startSimulation`.
  3. The `#simulator` popup window (`App.tsx:9`, opened via `window.open` in
     `BookLayout.tsx:117`) runs a **separate** Zustand store instance in its own
     JS heap. State is not shared with the main window — "open in new window"
     silently discards all context.
- Trigger: Start a simulation; the buttons that could interfere are disabled, so
  users rarely hit it — but navigating away (unmounting `SimulatorSection`) leaves
  the loop running and calling `set()` on an unmounted-view store.
- Workaround: none in code (buttons disabled).
- Fix approach: Add an `AbortController` / generation counter (`runId`) checked at
  the top of each loop iteration; bump it in `resetSimulation` and on unmount.
  Read `bufferFlushed` fresh via `get()` inside the loop instead of from the
  captured `store`.

### Non-deterministic Buffer Cache Hit/Miss

- File: `src/store/internalsStore.ts:169` —
  `const bufferCacheHit = !store.bufferFlushed && Math.random() > 0.5`.
- Symptom: The same query produces Hit or Miss at random 50/50. For a teaching
  tool this makes the Buffer Cache lesson non-reproducible and impossible to
  screenshot deterministically. Library Cache Hit is correctly deterministic
  (exact-match against `cachedQueries`); Buffer Cache is a coin flip.
- Fix approach: Model it deterministically (e.g. Hit if the same query ran within
  the session and buffers were not flushed), or expose a toggle.

### Regex SQL "parser" — silent wrong results on anything non-trivial

- File: `src/lib/optimizer/parser.ts`.
- Known gaps (all fail *silently* — the simulation still "runs" with garbage):
  - `detectPredicateType` (line 28) handles `'BETWEEN'`, but `parsePredicates`
    has **no branch that ever produces a `BETWEEN` operator** — `BETWEEN` clauses
    fall through the comparison-operator loop and are dropped.
  - `OR` is split the same as `AND` (line 40 + comment "treats OR same as AND for
    simplicity") — selectivity math is wrong for any `OR` query.
  - No subquery, no parenthesized predicates, no `HAVING`, no aggregate-aware
    column parsing: `SELECT COUNT(*), dept FROM …` splits on the comma **inside**
    `COUNT(*)` (line 165), yielding columns `['*)', 'dept']`.
  - `resolveColumnRef` defaults an unqualified column to `tables[0]`
    (`parser.ts:119`) — wrong table attribution in any multi-table query without
    aliases.
- Impact: `internalsStore.startSimulation` wraps `optimize(query)` in
  `try { … } catch {}` (`internalsStore.ts:172-176`) and shows plan `'N/A'` with
  **no error message to the user**. A malformed or unsupported query looks like it
  "worked".
- Fix approach: Surface parse failures in the UI (a red "couldn't parse this
  query" note in `QueryInput`), and document the supported SQL subset next to the
  input. Longer term, restrict the sample queries / input to the grammar the
  parser actually handles.

### `dangerouslySetInnerHTML` on user SQL input

- File: `src/components/QueryInput.tsx:242` —
  `dangerouslySetInnerHTML={{ __html: highlightSQL(input) }}`.
- Current state: `highlightSQL` (`QueryInput.tsx:25-37`) escapes `&`, `<`, `>`
  before injecting `<span>`s, and the output is element-content only, so this is
  **currently safe**.
- Why it's a concern: it is the only `dangerouslySetInnerHTML` in the codebase and
  it operates on free-text user input. Any future edit to `highlightSQL` that
  forgets an escape, or that starts emitting attributes, becomes reflected XSS.
  There is no test guarding the escaping.
- Fix approach: Replace with a token-array render (`highlightSQL` returns
  `{text, cls}[]`, map to `<span>`), eliminating raw HTML entirely.

### `noUnusedParameters` worked around with a bare hook call

- `src/book/chapters/join/index.tsx:11` — `useSimulationStore((s) => s.lang)` is
  called and the result discarded, purely to subscribe the component to language
  changes for re-render. Works, but it is a non-obvious pattern; a reader will
  "clean it up" and break language switching on the Join chapter landing page.
- Fix approach: Comment the intent, or read `lang` and actually use it (even in a
  `key`).

---

## Security Considerations

Low overall — static SPA, no server, no secrets, no user accounts.

**Third-party script in the production bundle: `react-scan`**
- Files: `package.json:26` (listed under `dependencies`, **not** `devDependencies`),
  `src/main.tsx:3,7` — `import { scan } from 'react-scan'; scan({ enabled: import.meta.env.DEV })`.
- Risk: The `enabled` flag is runtime-gated, but the **import is unconditional**,
  so Rollup bundles `react-scan` into `dist/` and ships it to GitHub Pages. It is
  a dev-only render profiler executing in users' browsers (dead-code, but present).
- Recommendation: Move `react-scan` to `devDependencies` and guard the import,
  e.g. `if (import.meta.env.DEV) { const { scan } = await import('react-scan'); scan() }`,
  so it is tree-shaken out of the production build.

**No dependency pinning / audit in CI**
- `.github/workflows/deploy.yml` runs `npm ci && npm run build` only. No
  `npm audit`, no lockfile-freshness check, no Dependabot config
  (`.github/` has only `workflows/deploy.yml`).
- Recommendation: Add `npm audit --audit-level=high` (non-blocking) and a
  Dependabot config.

**`.claude/settings.local.json`** (uncommitted change)
- The working tree adds `"Bash(npx *)"` to the allow-list. Broadens what tooling
  can run without prompting. Not shipped to users, but worth a deliberate review
  before committing.

---

## Performance Bottlenecks

### Heavy deps, no code-splitting

- Files: `src/main.tsx`, every `src/book/chapters/**/index.tsx` (all statically
  imported in `src/book/BookContent.tsx:10-20`).
- Problem: `framer-motion` (~12.x), `@xyflow/react` (React Flow, used only by
  `src/components/SchemaDiagram.tsx`), `@base-ui/react`, plus ~120 chapter section
  files are all in the **initial bundle**. Every `SectionRouter` branch
  (`BookContent.tsx:121-136`) imports its chapter page eagerly.
- Impact: First load pulls the entire book (58k+ LOC of TSX) before the user reads
  page one. `@xyflow/react` (a graph-layout lib) loads even for readers who never
  open the Schema panel.
- Improvement path: `React.lazy()` per chapter page in `SectionRouter`;
  `Suspense` boundary in `BookContent`. Lazy-import `@xyflow/react` inside
  `SchemaDiagram`. Consider `manualChunks` in `vite.config.ts` to split
  `framer-motion` / React Flow.

### `largeDataGenerator` builds 351k rows synchronously on the main thread

- File: `src/data/largeDataGenerator.ts:423-450` (`generateLargeDataset`, default
  `scale = 1.0` → EMP 10k + PROD 1k + ORD 50k + ORDER_ITEMS 100k + AUDIT_LOG 200k),
  entered via `getLargeDataset()` (`largeDataGenerator.ts:456-461`).
- Current blast radius is small: the only caller is
  `src/book/chapters/index-chapter/bitmap/BitmapSection.tsx:5,261`
  (`getLargeTable('EMPLOYEES')`), and it is lazy — nothing generates until a user
  navigates to `index-bitmap`.
- But: `getLargeTable('EMPLOYEES')` still forces **all five** tables to build
  (`getLargeDataset()` returns the whole `LargeDataset`), so visiting one bitmap
  page does ~350k object allocations + string formatting on the main thread,
  freezing the tab for the duration (`elapsedMs` is measured but never surfaced).
- Improvement path: Generate tables individually / on demand; drop the default
  `scale` for the in-app path (the bitmap viz only needs a few thousand rows);
  or move generation to a Web Worker. At minimum, memoize per-table not per-dataset.

### `react-scan` render overlay in dev

- File: `src/main.tsx:7`. Not a production issue, but per CLAUDE.md it renders
  label overlays over named React components — see "Fragile Areas".

---

## Fragile Areas

### `react-scan` overlay vs. named subcomponents inside SVG

- Files: any SVG-heavy diagram — e.g.
  `src/book/chapters/data-modeling/RelationshipSection.tsx` (IE/Barker notation),
  `src/book/chapters/index-chapter/btree/BTreeSection.tsx` (1459 lines),
  `src/book/chapters/internals/storage/StorageSection.tsx` (1475 lines),
  `src/book/chapters/internals/shared/OracleInstanceMap.tsx`.
- Why fragile: `react-scan` (dev) draws a labeled overlay on every *named* React
  component. A `function EntityBox()` called as `<EntityBox />` **inside** an
  `<svg>` gets an HTML overlay painted on top of the SVG, corrupting the diagram
  in dev. CLAUDE.md documents the rule: inside SVG, render all elements inline or
  assign JSX to a variable (`{myVar}`) — never `<NamedSubcomponent />`.
- Safe modification: Follow the CLAUDE.md rule for every new SVG diagram; there is
  no lint rule enforcing it, so it relies on tribal knowledge.
- Test coverage: none.

### Router ⇄ TOC drift (three lists must stay in sync by hand)

- Files: `src/book/bookStructure.tsx` (`BOOK_CHAPTERS`), `src/book/BookContent.tsx`
  (`SectionRouter` prefix branches), and each chapter's `index.tsx`
  (`if (sectionId === '…')` chains).
- Why fragile: A section ID exists in up to three places with no cross-check. The
  current drift artifacts: `optimizer-plan-reading` and `optimizer-join-overview`
  routed but not in the TOC; `UndoSegmentSection` file exists but no ID or route.
  Add a section and forget one spot → silent blank page (`SectionRouter` /
  chapter `index.tsx` both `return null` on no match — `BookContent.tsx:135`,
  `internals/index.tsx:50`, etc.).
- Safe modification: Follow the "새 섹션 추가 체크리스트" in CLAUDE.md exactly.
- Improvement path: A dev-time assertion that every `BOOK_CHAPTERS` leaf ID
  resolves to a non-null render, and vice-versa.

### Chapter `index.tsx` files that `return null` on unknown `sectionId`

- Files: `src/book/chapters/internals/index.tsx:50`,
  `src/book/chapters/optimizer/index.tsx` (falls through to a landing page — good),
  `src/book/chapters/index-chapter/index.tsx:82`,
  `src/book/chapters/query-transform/index.tsx:39` (falls through to `WipBanner`),
  `src/book/chapters/join/index.tsx:20` (falls through to `WipBanner`).
- Why fragile: `internals/index.tsx` and `index-chapter/index.tsx` render a blank
  screen (`null`) for an unmatched ID instead of a visible "not implemented"
  state. A typo in `bookStructure.tsx` produces a white page with no console error.
- Safe modification: Add a visible fallback (`<WipBanner />` / `SimulatorPlaceholder`)
  to every chapter router, matching `join` / `query-transform`.

### Huge single-file section components

- Files (top offenders):
  `src/book/chapters/sql-basics/dml-more/shared.ts` (1931 lines),
  `src/book/chapters/optimizer/simulator/OptimizerSimulator.tsx` (1510),
  `src/book/chapters/internals/storage/StorageSection.tsx` (1475),
  `src/book/chapters/index-chapter/btree/BTreeSection.tsx` (1459),
  `src/data/glossary.ts` (1289, 150 entries),
  `src/book/chapters/sql-basics/dml-more/RollupSection.tsx` (1258),
  `src/book/chapters/index-chapter/table-access/TableAccessSection.tsx` (1250),
  `src/book/chapters/optimizer/plan/PlanReadingSection.tsx` (1063, **dead**),
  `src/book/chapters/optimizer/shared/diagrams.tsx` (1049).
- Why fragile: Each mixes a large bilingual `T` object, multiple SVG diagrams, and
  interactive state in one file. HMR is slow; merge conflicts are large; the
  "1 page = 1 file" rule in CLAUDE.md is at odds with files this size (they are
  single sections that grew).
- Safe modification: Extract diagrams into `shared/` subfiles; keep `T` data
  separate from JSX where practical.

### Index-position React keys everywhere

- Scope: `key={i}` / `key={idx}` / `key={index}` appears **207 times across 76
  files** (`src/book/**`, `src/components/**`).
- Why fragile: Fine for the many truly static lists, but risky in the interactive
  ones — e.g. `src/components/QueryInput.tsx:59` (`stepLog.map((log, i) => …key={i}`)
  and `:221` (`SAMPLE_QUERIES`). Any list that reorders/filters mid-animation
  (framer-motion `AnimatePresence`) with an index key will mis-animate or reuse
  DOM. `SummaryTimeline` (`QueryInput.tsx:164`) already works around this with
  `key={s.step + i}`.
- Safe modification: Use stable IDs for any list that is filtered, reordered, or
  animated.

### No error boundary

- Files: `src/main.tsx`, `src/App.tsx`, `src/book/BookLayout.tsx`.
- Why fragile: A render throw in any one section component (e.g. the
  `ACCENT_COLORS[... as AccentColor]` `undefined` path above) takes down the whole
  app to a blank page — there is no `<ErrorBoundary>` anywhere.
- Fix approach: Wrap `<SectionRouter>` in `BookContent` with an error boundary
  that renders a "this section failed to load" card and a reset button.

---

## Scaling Limits

Not applicable in the usual sense — static single-page site on GitHub Pages, no
backend, no concurrent users, no data store. The only "scaling" axis is:

**Content volume vs. initial bundle**
- Current: ~130 section files, 58k+ LOC TSX, all statically imported. Build
  succeeds; `tsc -b` passes.
- Limit: As chapters 8-9 fill in, the eager-import model in `SectionRouter` means
  every new page inflates the first-load bundle. No hard limit, but load time
  degrades linearly with content.
- Scaling path: per-chapter `React.lazy` (see Performance).

---

## Dependencies at Risk

**`react-scan` (`^0.5.3`)** — mis-categorized
- Risk: Pre-1.0 dev tool sitting in `dependencies`, imported unconditionally in
  `src/main.tsx`. Ships to production (dead-code but bundled). API churn likely
  before 1.0.
- Impact: Larger bundle; potential build break on a minor bump.
- Migration plan: Move to `devDependencies`, dynamic-import behind
  `import.meta.env.DEV`.

**`playwright` referenced but absent**
- Risk: `verify_storage.mjs` imports `playwright`; it is not in `package.json`
  (only `puppeteer`). The script is permanently broken and misleads anyone trying
  to run "verification".
- Migration plan: Delete `verify_storage.mjs` or rewrite it with `puppeteer`
  (matching `scripts/export-*.mjs`).

**`lucide-react` — half-removed**
- Risk: Removed from `package.json`, but `components.json` still says
  `"iconLibrary": "lucide"` and CLAUDE.md notes "일부 구형 컴포넌트에서 잔존".
  Grep of `src/` finds **no** `lucide-react` imports — the migration to Tabler is
  actually complete in code, only the config/docs lag.
- Migration plan: Fix `components.json`; update the CLAUDE.md dependency note.

**Bleeding-edge major versions**
- `vite ^8.0.1`, `react ^19.2`, `tailwindcss ^4.2` (CSS-first config in
  `src/index.css`), `@vitejs/plugin-react ^6`, `typescript-eslint ^8`. All very
  new. `deploy.yml` pins `node-version: 24`.
- Risk: Tailwind v4's `@theme` / `@custom-variant` syntax and the Vite 8 plugin
  API are still stabilizing; ecosystem plugins (`prettier-plugin-tailwindcss
  ^0.7`) may lag.
- Migration plan: Keep the lockfile committed (it is — `package-lock.json`
  tracked); avoid `^` drift by considering exact pins for the build-critical
  toolchain; watch Tailwind v4 release notes.

---

## Missing Critical Features

### No client-side router

- Files: `src/book/BookLayout.tsx:66` — `useState('intro-overview')` **is** the
  navigation state. `src/App.tsx:9,13` read `window.location.hash` /
  `?print=` once at mount (not reactive).
- Blocks:
  - **Deep links / sharing** — no URL reflects the current section; you cannot
    link someone to "Buffer Cache".
  - **Browser back/forward** — do nothing.
  - **Refresh** — always returns to `intro-overview`.
  - **Scroll restoration** — handled manually (`BookContent.tsx:34-36` scrolls to
    top on section change) but back-nav can't restore position.
- Fix approach: Adopt `react-router` (hash history for GitHub Pages) or a minimal
  `hashchange` listener that syncs `activeSectionId` ↔ `location.hash`.

### No state persistence

- Files: no `persist` middleware, no `localStorage` / `sessionStorage` anywhere
  (grep confirms). `src/store/simulationStore.ts` (`lang`), `BookLayout.tsx`
  (`tocOpen`, `tocWidth`, `glossaryOpen`, `activeSectionId`).
- Blocks: Language choice, sidebar width, last-read section — all reset on every
  reload. A returning reader starts over in Korean at the intro.
- Fix approach: `zustand/middleware` `persist` on the lang store; persist
  `tocWidth` / `activeSectionId` to `localStorage`.

### No automated tests

- No test runner (CLAUDE.md: "테스트 프레임워크 없음"), no `*.test.*` files, CI
  runs `npm run build` only (`tsc -b` type-check + bundle).
- Highest-value untested logic:
  - `src/lib/optimizer/parser.ts` + `estimator.ts` + `planGenerator.ts` — pure
    functions, trivially unit-testable, currently only "tested" by looking
    plausible in the UI.
  - `src/book/bookStructure.tsx` `flattenSections` / `getSectionById` /
    `getAdjacentSections` — recursive, powers all navigation.
  - `highlightSQL` escaping (`src/components/QueryInput.tsx`) — XSS-adjacent.
- Fix approach: Add Vitest; start with `src/lib/optimizer/**` and
  `bookStructure` navigation helpers. A snapshot test that every `BOOK_CHAPTERS`
  leaf renders without throwing would catch router/TOC drift.

### No lint gate in CI

- `.github/workflows/deploy.yml` never runs `npm run lint`. `eslint.config.js`
  only enforces `@typescript-eslint/no-explicit-any: error` on top of the
  recommended sets. Lint regressions merge freely.
- Fix approach: Add a `lint` step (and optionally `tsc --noEmit` separately for a
  clearer failure) before `build` in the workflow.

---

## Test Coverage Gaps

**`src/lib/optimizer/` (parser, estimator, planGenerator, stats)**
- What's not tested: SQL parsing edge cases (aggregates, `BETWEEN`, `OR`,
  aliases, multi-table), selectivity math, plan cost comparison, table-name ↔
  `TABLE_STATS` key alignment (CLAUDE.md warns these must match
  `hrSchema.ts` / `coSchema.ts`).
- Files: `src/lib/optimizer/parser.ts`, `estimator.ts`, `planGenerator.ts`,
  `stats.ts`.
- Risk: The teaching content (cost numbers, chosen access paths shown to learners)
  can be wrong and nobody notices; a rename in `stats.ts` silently breaks CBO for
  a table.
- Priority: High (pure functions, cheap to cover, user-facing correctness).

**Navigation helpers in `src/book/bookStructure.tsx`**
- What's not tested: `flattenSections` (recursive `walk`), `getSectionById`,
  `getAdjacentSections` at depth ≥ 3 (SGA subsections go 4 deep). Prev/Next
  correctness across chapter boundaries.
- Risk: A structural edit breaks Prev/Next or breadcrumbs app-wide.
- Priority: High.

**`highlightSQL` HTML escaping** — `src/components/QueryInput.tsx:25-37`
- What's not tested: that `<`, `>`, `&` in user SQL stay escaped in the injected
  HTML.
- Risk: reflected XSS if a future edit regresses escaping.
- Priority: Medium.

**Simulation loop state machine** — `src/store/internalsStore.ts`
- What's not tested: Library Cache Hit/Miss branching, FIFO eviction of
  `cachedQueries` (max 8), `bufferFlushed` reset on completion, step sequence
  length for hit vs miss paths.
- Risk: Regressions in the core interactive feature.
- Priority: Medium.

**Every section renders without throwing**
- What's not tested: A smoke test iterating all `BOOK_CHAPTERS` leaf IDs through
  `SectionRouter`.
- Risk: The `ACCENT_COLORS[... as AccentColor]` `undefined` crash, router/TOC
  drift, blank `return null` pages.
- Priority: Medium — highest value-per-effort once Vitest + Testing Library are in.

---

*Concerns audit: 2026-08-29*
