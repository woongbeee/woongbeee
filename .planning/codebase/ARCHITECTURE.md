<!-- refreshed: 2026-08-29 -->
# Architecture

**Analysis Date:** 2026-08-29

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         Entry / View Switch                              │
│  `src/main.tsx` → `src/App.tsx`                                          │
│  hash `#simulator` → standalone InternalsSimulatorSection                │
│  ?print=partition-* / ?print=qt-* → single-section print render          │
│  default → <BookLayout />                                                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Book Shell (owns UI state)                         │
│  `src/book/BookLayout.tsx`                                               │
│  state: activeSectionId, tocOpen, tocWidth, glossaryOpen, schemaOpen     │
├──────────────┬───────────────────────────────┬──────────────────────────┤
│ TableOf      │        BookContent            │  GlossaryPanel /         │
│ Contents     │  breadcrumb + Prev/Next +     │  SchemaPanel             │
│ `src/book/   │  <SectionRouter/>             │  `src/book/GlossaryPanel  │
│ TableOf      │  `src/book/BookContent.tsx`   │  .tsx` / `SchemaPanel.tsx`│
│ Contents.tsx`│                               │                          │
└──────┬───────┴───────────────┬───────────────┴──────────────────────────┘
       │                       │
       │ reads                 │ prefix match on sectionId
       ▼                       ▼
┌──────────────────────┐  ┌──────────────────────────────────────────────┐
│  TOC data (SSOT)     │  │  Chapter page components (one per chapter)    │
│  `src/book/          │  │  `src/book/chapters/<chapter>/index.tsx`      │
│  bookStructure.tsx`  │  │  each: sectionId → section component (if/switch)│
│  BOOK_CHAPTERS       │  │  section file: `.../parent/child/ChildSection │
│  flattenSections()   │  │  .tsx` (1 section ID = 1 file)                │
└──────────────────────┘  └───────────────┬──────────────────────────────┘
                                          │ simulator sections only
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Simulator subsystem (Internals / Optimizer)           │
│  `src/components/` OracleDiagram, QueryInput, OptimizerPanel,            │
│  ExecutionPlanViewer, SchemaDiagram, DataPanel                          │
│                                                                         │
│  state:  `src/store/internalsStore.ts` (zustand)                        │
│  engine: `src/lib/optimizer/` (pure TS CBO)                             │
│  data:   `src/data/` (HR + CO schemas, large synthetic dataset)         │
└─────────────────────────────────────────────────────────────────────────┘

Global state:  `src/store/simulationStore.ts` → useLangStore (lang only)
Theme tokens:  `src/lib/theme.ts` (ACCENT_COLORS) + `src/index.css` (CSS vars)
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Top-level view switch: `#simulator` window, `?print=` render, or `BookLayout` | `src/App.tsx` |
| `BookLayout` | Owns all book UI state (`activeSectionId`, panel open/width). Renders header, TOC, content, right panel | `src/book/BookLayout.tsx` |
| `TableOfContents` | Renders `BOOK_CHAPTERS` as collapsible tree, recursive `SectionItem`, `isReady = chapter.num <= 7` gating | `src/book/TableOfContents.tsx` |
| `BookContent` | Breadcrumb, page transition (`AnimatePresence`), Prev/Next nav, hosts `SectionRouter` | `src/book/BookContent.tsx` |
| `SectionRouter` | Maps `sectionId` prefix → chapter page component (`startsWith('internals-')` etc.) | `src/book/BookContent.tsx` (inline fn) |
| `bookStructure.tsx` | Single source of truth for TOC: `BOOK_CHAPTERS`, `getSectionById`, `getAdjacentSections`, `flattenSections` (recursive) | `src/book/bookStructure.tsx` |
| Chapter page (`XxxPage`) | Second-level router: `sectionId` → individual section component via `if` chain | `src/book/chapters/<chapter>/index.tsx` |
| Section component | One rendered page. Owns its inline `T` (ko/en) object + JSX | `src/book/chapters/<chapter>/<parent>/<child>/ChildSection.tsx` |
| `shared.tsx` | Chapter UI primitives (`PageContainer`, `ChapterTitle`, `SectionTitle`, `Prose`, `InfoBox`, `Table`, `ConceptGrid`, `SqlBlock`, `StepList`, `AccordionSection`, `WipBanner`, `SimulatorPlaceholder`, `TermPopup`) | `src/book/chapters/shared.tsx` |
| `GlossaryPanel` | Right-side panel; reads `GLOSSARY`, filters by `sectionId`; remounts on section change via `key` | `src/book/GlossaryPanel.tsx` |
| `SchemaPanel` | Right-side panel shown only for `optimizer-simulator` | `src/book/SchemaPanel.tsx` |
| `internalsStore` | Internals Simulator state machine: `currentStep`, `activeComponents`, `stepLog`, `stepSummary`, `cachedQueries`, `bufferFlushed`; drives `startSimulation()` step loop | `src/store/internalsStore.ts` |
| `useLangStore` | Global `lang: 'ko' \| 'en'` + `setLang`. Exported also as legacy alias `useSimulationStore` | `src/store/simulationStore.ts` |
| optimizer engine | Pure-TS CBO: `optimize(sql)` → `OptimizerResult` (3 phases) | `src/lib/optimizer/planGenerator.ts` (+ `parser.ts`, `estimator.ts`, `stats.ts`) |
| `OracleDiagram` | SVG/DOM diagram of Oracle instance; blocks highlight from `activeComponents` | `src/components/OracleDiagram.tsx` |
| `QueryInput` | SQL input, live log (`stepLog`), summary timeline (`stepSummary`) | `src/components/QueryInput.tsx` |
| `OptimizerPanel` / `ExecutionPlanViewer` | Render `OptimizerResult` / execution plan tree | `src/components/OptimizerPanel.tsx`, `src/components/ExecutionPlanViewer.tsx` |
| `SchemaDiagram` | HR/CO ERD via `@xyflow/react` (React Flow) | `src/components/SchemaDiagram.tsx` |
| data layer | HR (7 tables) + CO (5 tables) schemas, `SAMPLE_QUERIES`, seeded large dataset generator | `src/data/index.ts`, `hrSchema.ts`, `coSchema.ts`, `largeDataGenerator.ts` |

## Pattern Overview

**Overall:** Client-only SPA (no router library, no backend). Single-page interactive textbook with a two-level manual routing scheme driven by string `sectionId`s.

**Key Characteristics:**
- **No react-router.** Navigation is `activeSectionId` state in `BookLayout` + a prefix-matching `SectionRouter`, then a per-chapter `if/switch` router (`XxxPage`).
- **Single source of truth for structure.** `BOOK_CHAPTERS` in `src/book/bookStructure.tsx` defines TOC, breadcrumb, and Prev/Next. Adding a section = edit this array + add a file + add a router branch.
- **Page-per-file rule.** One `sectionId` → one `.tsx` file. TOC tree shape must mirror the directory tree (`parent/child/ChildSection.tsx`).
- **Inline bilingual strings.** Each section defines a local `const T = { ko: {...}, en: {...} }` and does `const t = T[lang]`. No i18n library.
- **Two zustand stores, minimal.** Global store holds only `lang`. Simulator store is isolated to the Internals/Optimizer simulators.
- **Pure-function domain engine.** The CBO optimizer under `src/lib/optimizer/` is framework-free TypeScript, unit-testable in principle (no test runner configured).
- **Shared UI primitives first.** All layout is composed from `src/book/chapters/shared.tsx`; raw `div`/`ul` for content layout is discouraged.
- **Deep hierarchy support.** `flattenSections()` walks `children` recursively to arbitrary depth (SGA sub-tree is 4 levels deep).

## Layers

**View-switch layer:**
- Purpose: choose between full book, standalone simulator window, and print-only single section
- Location: `src/App.tsx`, `src/main.tsx`
- Contains: hash/query-string checks, `<StrictMode>`, `react-scan` init (dev only)
- Depends on: `BookLayout`, `InternalsSimulatorSection`, `PartitionPage`, `QueryTransformPage`, `useLangStore`
- Used by: browser entry (`index.html` → `src/main.tsx`)

**Book shell layer:**
- Purpose: own navigation state + chrome (header, resizable TOC, right panel)
- Location: `src/book/BookLayout.tsx`, `TableOfContents.tsx`, `BookContent.tsx`
- Contains: `useState` for `activeSectionId` and panel flags, drag-to-resize handler, `framer-motion` panel transitions
- Depends on: `bookStructure.tsx`, `useLangStore`, `useInternalsStore` (RUNNING badge only), `src/lib/theme.ts`
- Used by: `App`

**Content routing layer:**
- Purpose: resolve `sectionId` → the right React subtree
- Location: `SectionRouter` in `src/book/BookContent.tsx`; `XxxPage` in each `src/book/chapters/<chapter>/index.tsx`
- Contains: prefix `if` chains (`SectionRouter`) and exact-match `if` chains (chapter pages)
- Depends on: chapter page components, `shared.tsx` (`PageContainer`, `WipBanner`)
- Used by: `BookContent`

**Section content layer:**
- Purpose: render one page of the book
- Location: `src/book/chapters/<chapter>/**/XxxSection.tsx`
- Contains: local `T` ko/en object, JSX built from `shared.tsx` primitives, chapter-local diagram components and `shared/` helpers
- Depends on: `src/book/chapters/shared.tsx`, `useLangStore`, chapter-scoped shared modules (e.g. `internals/shared/OracleInstanceMap.tsx`, `index-chapter/scan/ScanDiagram.tsx`, `optimizer/shared/diagrams.tsx`)
- Used by: chapter page routers

**Simulator layer:**
- Purpose: interactive Oracle instance / optimizer simulations
- Location: `src/components/` (view), `src/store/internalsStore.ts` (state), `src/lib/optimizer/` (engine), `src/data/` (fixtures)
- Contains: async step loop with `setTimeout` delays, `activeComponents: Set<string>` per step, `stepLog` / `stepSummary` arrays, `OptimizerResult`
- Depends on: `useLangStore` (read at run time via `useLangStore.getState().lang`), `optimize()` from `src/lib/optimizer`
- Used by: `InternalsSimulatorSection` (`src/book/chapters/internals/shared/SimulatorSection.tsx`), `OptimizerSimulator` (`src/book/chapters/optimizer/simulator/OptimizerSimulator.tsx`), `JoinSimulatorSection`

**Domain engine layer (CBO):**
- Purpose: mimic Oracle Cost-Based Optimizer as pure functions
- Location: `src/lib/optimizer/`
- Contains: `parser.ts` (SELECT → `ParsedQuery`), `stats.ts` (`TABLE_STATS` for 12 tables), `estimator.ts` (selectivity/cardinality/cost), `planGenerator.ts` (`optimize()` = Query Transformer → Estimator → Plan Generator), `types.ts`, `index.ts` (barrel)
- Depends on: nothing (framework-free)
- Used by: `internalsStore.startSimulation()`, `OptimizerSimulator`, `OptimizerPanel`

## Data Flow

### Primary Request Path (page navigation)

1. User clicks a TOC row → `onSelect(section.id)` in `SectionItem` (`src/book/TableOfContents.tsx:49`)
2. `BookLayout` `setActiveSectionId(id)` updates state (`src/book/BookLayout.tsx:67`)
3. `BookContent` receives `sectionId`, calls `getSectionById(sectionId)` for chapter/breadcrumb, `getAdjacentSections(sectionId)` for Prev/Next (`src/book/BookContent.tsx:30-31`)
4. `SectionRouter` prefix-matches and returns the chapter page, e.g. `<InternalsPage sectionId=… />` (`src/book/BookContent.tsx:121-135`)
5. Chapter page (`src/book/chapters/internals/index.tsx:26`) exact-matches `sectionId` → returns one section component
6. Section component reads `lang` from `useLangStore`, picks `T[lang]`, renders `shared.tsx` primitives

### Internals Simulator Flow

1. User submits SQL in `QueryInput` → `useInternalsStore.startSimulation(query)` (`src/store/internalsStore.ts:145`)
2. `startSimulation` reads current lang: `useLangStore.getState().lang` (`src/store/internalsStore.ts:149`)
3. Library Cache hit check: normalize `trim().toUpperCase()` and compare against `cachedQueries` (`src/store/internalsStore.ts:165-167`)
4. Buffer Cache hit check: `!bufferFlushed && Math.random() > 0.5` (`src/store/internalsStore.ts:169`)
5. `optimize(query)` builds `OptimizerResult` (try/catch swallows parse errors) (`src/store/internalsStore.ts:171-176`)
6. A `StepDef[]` array is assembled (branches on hit/miss); loop runs each step: `setStep`, `addLog`, push to `stepSummary`, `await setTimeout(duration)` (`src/store/internalsStore.ts:290-312`)
7. Each `setStep` sets `activeComponents = new Set(STEP_COMPONENTS[step])` and `dataFlowArrows = getDataFlowArrows(step)` (`src/store/internalsStore.ts:347-352`)
8. `OracleDiagram` re-renders highlighted blocks; `QueryInput` shows live log then summary
9. On completion: non-hit queries are unshifted into `cachedQueries` (FIFO cap 8), `bufferFlushed` reset to `false` (`src/store/internalsStore.ts:314-320`)

### Manual Cache Flush Flow

1. `flushBuffers()` animates DBWn/LGWR/CKPT → disk over ~1.5s, then sets `bufferFlushed: true` (`src/store/internalsStore.ts:330-345`)
2. Next `startSimulation` is forced into Buffer Miss branch

### Language Toggle Flow

1. Header button → `setLang(lang === 'ko' ? 'en' : 'ko')` (`src/book/BookLayout.tsx:72`)
2. `useLangStore` updates; every component subscribed via `useSimulationStore(s => s.lang)` / `useLangStore(s => s.lang)` re-renders with its `T[lang]`
3. `App` effect syncs `document.documentElement.lang` (`src/App.tsx:21-23`)

**State Management:**
- Global: `useLangStore` (zustand) — `lang` only. Legacy alias `useSimulationStore` still used at many call sites; new code should import `useLangStore` from `src/store/simulationStore.ts`.
- Simulator: `useInternalsStore` (zustand) — full step state machine. `startSimulation` is `async` and mutates the store between `await`s.
- UI/layout: local `useState` in `BookLayout` (never lifted to a store).
- No persistence, no URL sync, no context providers.

## Key Abstractions

**`BookChapter` / `BookSection`:**
- Purpose: describe the TOC tree; `BookSection.children?` enables arbitrary nesting; `hasSimulator`, `hiddenInToc` flags
- Examples: `src/book/bookStructure.tsx` (`BOOK_CHAPTERS`)
- Pattern: single declarative array + pure selector functions (`getSectionById`, `getAdjacentSections`, `flattenSections`)

**`sectionId` string convention:**
- Purpose: the routing key. Prefix = chapter (`internals-`, `optimizer-`, `qt-`, `sort-`, `dm-`, `sql-basics-`, `index-`, `join-`, `partition-`, `parallel-`, `intro-`)
- Examples: `internals-sga-buffer-cache`, `optimizer-execution-plans-read`, `qt-or-expansion`
- Pattern: prefix routing in `SectionRouter`, exact routing in chapter pages; nested chapter pages re-route by sub-prefix (e.g. `OptimizerChapterPage` delegates `optimizer-fundamentals*` to `OptimizerFundamentalsPage`)

**Inline `T` bilingual object:**
- Purpose: co-locate translations with the component that uses them
- Examples: nearly every file under `src/book/chapters/`, plus `src/components/LandingPage.tsx`, `src/book/BookLayout.tsx`
- Pattern: `const T = { ko: {...}, en: {...} }` then `const t = T[lang]`

**`OptimizerResult` / `OptimizerPhase` / `ExecutionPlan`:**
- Purpose: structured output of the CBO engine consumed by UI panels
- Examples: `src/lib/optimizer/types.ts`
- Pattern: plain data interfaces; `optimize()` returns `{ plan, phases }`

**`activeComponents: Set<string>` + `STEP_COMPONENTS` map:**
- Purpose: declaratively drive which diagram blocks light up per simulation step
- Examples: `src/store/internalsStore.ts:22-35`
- Pattern: step enum → component-id list; diagram uses `activeComponents.has(id)`

**Chapter-scoped shared modules:**
- Purpose: diagrams/helpers used by multiple sections of one chapter
- Examples: `internals/shared/OracleInstanceMap.tsx`, `internals/shared/shared.tsx` (`TwoColLayout`, `MapPanel`, `TourPanel`), `internals/overview/sga/shared/SgaPositionDiagram.tsx`, `index-chapter/scan/ScanDiagram.tsx`, `optimizer/shared/diagrams.tsx`, `join/shared/JoinAnimator.tsx`, `sql-basics/dml-more/shared.ts`
- Pattern: a `shared/` (or `shared.tsx`/`shared.ts`) file within the chapter directory

## Entry Points

**Browser entry:**
- Location: `index.html` → `src/main.tsx`
- Triggers: page load
- Responsibilities: `createRoot`, `<StrictMode>`, `scan({ enabled: import.meta.env.DEV })`, render `<App />`

**`App`:**
- Location: `src/App.tsx`
- Triggers: rendered by `main.tsx`
- Responsibilities: branch on `window.location.hash === '#simulator'` (standalone simulator), `?print=partition-*` / `?print=qt-*` (single-section print render for PDF export scripts), else `<BookLayout />`; sync `document.documentElement.lang`

**Standalone simulator window:**
- Location: opened via header button `window.open(pathname + '#simulator', ...)` (`src/book/BookLayout.tsx:117`); rendered by `App` → `InternalsSimulatorSection` (`src/book/chapters/internals/shared/SimulatorSection.tsx`)
- Triggers: user clicks "Internals Simulator" in the header
- Responsibilities: full-viewport simulator (OracleDiagram + QueryInput + OptimizerPanel + Schema/Data panels)

**PDF export scripts:**
- Location: `scripts/export-partition-pdf.mjs`, `scripts/export-query-transform-pdf.mjs`, `scripts/merge-partition-pdf.mjs`
- Triggers: run manually with Node (`puppeteer` + `pdf-lib` are devDependencies)
- Responsibilities: drive `?print=<sectionId>` renders to produce PDFs

**Deploy:**
- Location: `.github/workflows/deploy.yml`
- Triggers: push to `main`
- Responsibilities: `npm ci` → `npm run build` (`tsc -b && vite build`) → upload `dist/` to GitHub Pages. `vite.config.ts` sets `base: '/woongbeee/'` for build.

## Architectural Constraints

- **Threading:** Single-threaded browser main thread. Simulations use `async`/`await` over `setTimeout` — no web workers. Long step durations (up to 2400ms) are intentional pacing, not computation.
- **Global state:** Two module-level zustand stores (`useLangStore` in `src/store/simulationStore.ts`, `useInternalsStore` in `src/store/internalsStore.ts`). `src/data/largeDataGenerator.ts` builds a dataset once at module import and caches it (seed derived from `Date.now()`, so output varies per page load).
- **Cross-store coupling:** `internalsStore.ts` imports `useLangStore` and reads it imperatively (`useLangStore.getState().lang`) inside `startSimulation` / step-label maps.
- **Circular imports:** None observed. `shared.tsx` imports one leaf file from a chapter subtree (`sql-basics/dml-more/SqlHighlight.tsx`) — a downward dependency, not a cycle.
- **Routing key coupling:** `sectionId` prefixes in `BOOK_CHAPTERS` must match `SectionRouter` `startsWith` branches and each chapter page's `if` chain. A mismatch renders `null` (blank page).
- **Stats/schema name coupling:** `TABLE_STATS` keys in `src/lib/optimizer/stats.ts` must match table names in `src/data/hrSchema.ts` / `coSchema.ts` or the CBO produces `통계 정보 없음` warnings.
- **TOC readiness gate:** `TableOfContents.tsx` hardcodes `isReady = chapter.num <= 7`; chapters 8–9 render but are visually disabled in the TOC.
- **TypeScript strict flags:** `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` (no `enum`/`namespace` — use `const` object + `as const`), `verbatimModuleSyntax` (type-only imports must use `import type`). `@typescript-eslint/no-explicit-any` is `error`.
- **Styling:** Tailwind utility classes only; no custom CSS files except theme variables in `src/index.css`. React Flow overrides allowed only under `.react-flow` selectors in `index.css`.

## Anti-Patterns

### Using the legacy `useSimulationStore` alias in new code

**What happens:** Many components import `useSimulationStore` from `src/store/simulationStore.ts` (a back-compat alias of `useLangStore`).
**Why it's wrong:** The name implies simulation state but the store only holds `lang`; it obscures intent and perpetuates a deprecated identifier.
**Do this instead:** `import { useLangStore } from '@/store/simulationStore'` and `const lang = useLangStore(s => s.lang)`.

### Bundling multiple sections into one file

**What happens:** A single `.tsx` file exports several section components (historically done; `TransactionSection.tsx` still exports 5 named sections, `sort/index.tsx` and `parallel/index.tsx` contain multiple sections).
**Why it's wrong:** Breaks the "1 section ID = 1 file" rule; TOC tree no longer mirrors the directory tree; harder to locate a page.
**Do this instead:** One `sectionId` → one file at `parent-dir/child-dir/ChildSection.tsx`. Router `index.tsx` only imports and branches. New chapters follow the deep-directory pattern (see `optimizer/execution-plans/read/ReadSection.tsx`).

### Hand-rolling layout with raw `div` / `ul`

**What happens:** Building SQL blocks, step lists, tables, info callouts from scratch inside a section.
**Why it's wrong:** Diverges from the book's visual system and spacing rules; duplicates logic already in `shared.tsx`.
**Do this instead:** Compose from `src/book/chapters/shared.tsx` primitives (`SqlBlock`, `StepList`, `Table`, `InfoBox`, `ConceptGrid`, `AccordionSection`).

### Named sub-components inside SVG diagrams

**What happens:** Defining `function EntityBox(...)` and calling `<EntityBox />` inside an SVG.
**Why it's wrong:** `react-scan` (dev) renders a label overlay on named React components, which visually covers the SVG.
**Do this instead:** Inline all SVG elements as JSX, or assign JSX to a variable and interpolate `{myVar}`. Pull always-on-top elements out of loops and render them last (DOM order = z-order).

### Dead / duplicate chapter entry points

**What happens:** `src/book/chapters/index-chapter/IndexPage.tsx` referenced in CLAUDE.md as dead code; `optimizer` has both a `plan/PlanReadingSection.tsx` and `execution-plans/read/ReadSection.tsx`; `optimizer/join/*` duplicates `join/*` section names.
**Why it's wrong:** Ambiguity about which file is live; risk of editing the wrong one.
**Do this instead:** The live entry point is always `src/book/chapters/<chapter>/index.tsx`. Trace imports from there.

## Error Handling

**Strategy:** Defensive-and-degrade. This is a read-only educational app with no network or persistence, so most "errors" are missing-route or unparseable-SQL cases that render a fallback rather than throw.

**Patterns:**
- `SectionRouter` returns `null` for an unknown prefix; chapter pages return `null` or `<PageContainer><WipBanner /></PageContainer>` for an unknown `sectionId`.
- `BookContent` early-returns `null` when `getSectionById(sectionId)` is `undefined` (`src/book/BookContent.tsx:38`).
- `internalsStore.startSimulation` wraps `optimize(query)` in `try { … } catch { /* silently skip on parse failure */ }` (`src/store/internalsStore.ts:173-176`); `planDesc` falls back to `'N/A'`.
- The CBO engine surfaces problems as data, not exceptions: `ExecutionPlan.warnings[]` (missing stats, low-cardinality FTS) rendered by `OptimizerPanel`.
- Re-entrancy guards: `startSimulation` and `flushBuffers` early-return if `isRunning`.
- No error boundaries, no global handler, no logging framework.

## Cross-Cutting Concerns

**Logging:** None in production. `react-scan` render overlay is enabled only in dev (`src/main.tsx:7`). The simulator's `stepLog` / `stepSummary` are in-UI narration, not diagnostics.

**Validation:** Only the toy SQL parser in `src/lib/optimizer/parser.ts` (SELECT-only, `AND`/`OR` treated alike, regex-based). No form/schema validation elsewhere.

**Internationalization:** Manual. `useLangStore` + inline `T` objects everywhere. `document.documentElement.lang` synced in `App`. Fonts swap per language via CSS variables in `src/index.css`.

**Theming:** `src/lib/theme.ts` `ACCENT_COLORS` maps an `AccentColor` union to Tailwind class sets; each chapter declares its `color` in `BOOK_CHAPTERS`. Base palette + status colors are HSL CSS variables in `src/index.css` (shadcn `base-nova` style).

**Animation:** `framer-motion` for panel open/close, page transitions (`AnimatePresence mode="wait"` in `BookContent`), TOC chevrons, and simulator step transitions.

**Build-time injection:** `__BUILD_DATE__` global replaced by Vite `define` with `"YYYY-MM-DD"` (`vite.config.ts`); shown in the header.

---

*Architecture analysis: 2026-08-29*
