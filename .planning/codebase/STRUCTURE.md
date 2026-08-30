# Codebase Structure

**Analysis Date:** 2026-08-29
**Updated:** 2026-08-30 — added `src/styles/`, `src/lib/theme.tsx`, `DESIGN.md`; `src/index.css` scope narrowed

## Directory Layout

```
oracleDataBaseSystem/
├── index.html                 # Vite HTML entry; loads /src/main.tsx, Google font links
├── package.json               # Scripts: dev / build / lint / preview
├── vite.config.ts             # base '/woongbeee/' on build, @ alias, __BUILD_DATE__ define
├── tsconfig.json              # Project references → tsconfig.app.json + tsconfig.node.json
├── tsconfig.app.json          # Strict flags: noUnusedLocals/Params, erasableSyntaxOnly, verbatimModuleSyntax
├── eslint.config.js           # flat config; @typescript-eslint/no-explicit-any: error
├── .prettierrc                # prettier + prettier-plugin-tailwindcss
├── components.json            # shadcn config (base-nova style)
├── README.md                  # Public-facing overview
├── CLAUDE.md                  # PRIMARY architecture reference — read first
├── DESIGN.md                  # Design-system spec + token catalog + migration status
├── .github/workflows/deploy.yml   # GitHub Pages CI (push to main → build → deploy dist/)
├── scripts/                   # Node PDF-export helpers (puppeteer + pdf-lib)
│   ├── export-partition-pdf.mjs
│   ├── export-query-transform-pdf.mjs
│   └── merge-partition-pdf.mjs
├── public/                    # Static assets copied as-is (icons.svg, memory.png)
├── dist/                      # Build output (gitignored)
├── .planning/codebase/        # These analysis docs
└── src/
    ├── main.tsx               # createRoot, StrictMode, react-scan (dev), render <App/>
    ├── App.tsx                # View switch: #simulator / ?print= / BookLayout; syncs <html lang> + <html data-theme>
    ├── index.css              # @import (tailwindcss, tokens.css, tw-animate-css) + structural rules only (body, #root, bare-border color, .react-flow__*)
    ├── styles/
    │   └── tokens.css         # THE design source — @theme color/font/radius vars, light + [data-theme=dark]/[light]
    ├── build-env.d.ts         # Ambient decl for __BUILD_DATE__
    ├── assets/                # (empty)
    ├── book/                  # Book shell + all chapter content
    │   ├── BookLayout.tsx     # Owns activeSectionId + panel state; header, TOC, content, right panel
    │   ├── BookContent.tsx    # Breadcrumb, Prev/Next, SectionRouter (prefix → chapter page)
    │   ├── bookStructure.tsx  # BOOK_CHAPTERS (SSOT for TOC) + getSectionById / getAdjacentSections
    │   ├── TableOfContents.tsx# Recursive collapsible TOC tree; isReady gate (chapter.num <= 7)
    │   ├── GlossaryPanel.tsx  # Right panel; filters GLOSSARY by sectionId
    │   ├── SchemaPanel.tsx    # Right panel for optimizer-simulator only
    │   └── chapters/
    │       ├── shared.tsx     # Chapter UI primitives — CHECK HERE BEFORE BUILDING NEW UI
    │       ├── introduction/
    │       │   └── IntroductionPage.tsx        # Chapter 0 — single file (intro-* )
    │       ├── data-modeling/                  # Chapter 1 (dm-*)
    │       │   ├── index.tsx                   # router
    │       │   ├── DataModelOverviewSection.tsx, EntitySection.tsx, AttributeSection.tsx,
    │       │   │   RelationshipSection.tsx, IdentifierSection.tsx      # top-level sections
    │       │   └── sql/                        # dm-sql-* group
    │       │       ├── NormalizationSection.tsx, JoinSection.tsx, TransactionSection.tsx,
    │       │       │   NullSection.tsx, IdentifierTypeSection.tsx
    │       ├── sql-basics/                     # Chapter 2 (sql-basics-*)
    │       │   ├── index.tsx                   # router (inline landing for sql-basics-dml-more)
    │       │   ├── commands/                   # DdlDmlDclSection, DDLSection, DMLSection, DCLSection, TCLSection
    │       │   └── dml-more/                   # ClausesSection, JoinSection, NullSection, DateSection,
    │       │       │                           #   WindowFuncSection, MergeSection, RollupSection, PivotSection,
    │       │       │                           #   ExecutionSection (simulator)
    │       │       ├── shared.ts               # chapter-local helpers (Employee/ExampleQuery/ExecStep, EMPLOYEES)
    │       │       ├── SqlHighlight.tsx        # imported by chapters/shared.tsx
    │       │       ├── EmpRow.tsx, MiniSimulator.tsx
    │       ├── internals/                      # Chapter 3 (internals-*)
    │       │   ├── index.tsx                   # router (flat if-chain, 25 branches)
    │       │   ├── storage/StorageSection.tsx
    │       │   ├── overview/
    │       │   │   ├── OverviewSection.tsx
    │       │   │   ├── sga/SgaSection.tsx
    │       │   │   ├── sga/buffer-cache/BufferCacheSection.tsx
    │       │   │   ├── sga/shared-pool/SharedPoolSection.tsx
    │       │   │   ├── sga/redo-log-buffer/RedoLogBufferSection.tsx
    │       │   │   ├── sga/large-pool/LargePoolSection.tsx
    │       │   │   ├── sga/undo-segment/UndoSegmentSection.tsx
    │       │   │   ├── sga/shared/SgaPositionDiagram.tsx     # shared by 4 SGA pages
    │       │   │   ├── pga/PgaSection.tsx, uga/UgaSection.tsx
    │       │   │   └── process/ ProcessOverviewSection.tsx, ServerProcessSection.tsx, BackgroundProcessSection.tsx
    │       │   ├── concurrency/ ConcurrencySection, MvccSection, IsolationSection, LocksSection,
    │       │   │   │             DeadlockSection, TxTimeline.tsx
    │       │   ├── transaction/ TransactionSection.tsx (exports 5 named sections), TransactionAcid/Commit/Overview/Savepoint
    │       │   └── shared/
    │       │       ├── OracleInstanceMap.tsx   # Internals-only diagram (highlightIds prop)
    │       │       ├── shared.tsx              # TwoColLayout, MapPanel, TourPanel
    │       │       └── SimulatorSection.tsx    # InternalsSimulatorSection (full-height)
    │       ├── join/                           # Chapter 4 (join-*)
    │       │   ├── index.tsx
    │       │   ├── overview/, nested-loop/, hash/, sort-merge/, semi/   # XxxSection.tsx each
    │       │   ├── simulator/JoinSimulatorSection.tsx
    │       │   └── shared/JoinAnimator.tsx
    │       ├── index-chapter/                  # Chapter 5 (index-*)  [dir name ≠ chapter id 'index']
    │       │   ├── index.tsx                   # router + local IndexLayout wrapper
    │       │   ├── btree/, bitmap/, composite/ (+ IndexTypesOverview.tsx),
    │       │   │   unusable/, usage/
    │       │   ├── scan/ RangeScanSection, UniqueScanSection, FullScanSection,
    │       │   │   │      FastFullScanSection, SkipScanSection, ScanDiagram.tsx (shared)
    │       │   └── table-access/ RowidSection.tsx, TableAccessSection.tsx
    │       ├── partition/                      # Chapter 6 (partition-*)
    │       │   ├── index.tsx
    │       │   └── PartitionOverviewSection.tsx, PartitionStrategiesSection.tsx,
    │       │       PartitionRange/List/Hash/Composite/Reference Section.tsx,
    │       │       PartitionIndexesSection.tsx, PartitionPruningSection.tsx, PartitionWiseJoinSection.tsx
    │       ├── parallel/                       # Chapter 7 (parallel-*)
    │       │   ├── index.tsx
    │       │   └── ParallelOverviewSection.tsx, ParallelDopSection.tsx, ParallelCoordinatorSection.tsx
    │       ├── optimizer/                      # Chapter 8 (optimizer-*)
    │       │   ├── index.tsx                   # router; delegates optimizer-fundamentals* / optimizer-execution-plans*
    │       │   ├── fundamentals/ WhatIsOptimizerSection.tsx (sub-router),
    │       │   │   │              sql-processing/, adaptive/, approx/, spm/  (XxxSection.tsx)
    │       │   ├── execution-plans/ ExecutionPlansSection.tsx (sub-router),
    │       │   │   │                 intro/, explain/, display/, read/, compare/  (XxxSection.tsx)
    │       │   ├── stats/StatsSection.tsx, access-path/AccessPathSection.tsx, plan/PlanReadingSection.tsx
    │       │   ├── join/ JoinOverviewSection, NestedLoopSection, HashJoinSection, SortMergeSection
    │       │   ├── simulator/OptimizerSimulator.tsx   # full-height, no layout wrapper
    │       │   └── shared/diagrams.tsx         # ExplainPlanTable, PlanRow types
    │       ├── query-transform/                # Chapter 9 sub-group (qt-*)
    │       │   ├── index.tsx
    │       │   └── overview/, or-expansion/, view-merging/, predicate-pushing/,
    │       │       subquery-unnesting/, materialized-view/, star-transformation/, join-factorization/
    │       └── sort/                           # Chapter 9 sub-group (sort-*)
    │           └── index.tsx                   # ALL sort sections in one file
    ├── components/             # Simulator + landing view components (not book chrome)
    │   ├── LandingPage.tsx     # (present; standalone landing view component)
    │   ├── OracleDiagram.tsx   # Instance diagram, reads internalsStore.activeComponents
    │   ├── QueryInput.tsx      # SQL input + LiveLog + SummaryTimeline (named exports)
    │   ├── OptimizerPanel.tsx  # renders OptimizerResult
    │   ├── ExecutionPlanViewer.tsx  # execution-plan tree
    │   ├── SchemaDiagram.tsx   # React Flow ERD (SchemaDiagramView)
    │   ├── DataPanel.tsx       # SchemaView / TableView
    │   └── ui/                 # shadcn primitives: badge, button, card, separator
    ├── store/
    │   ├── simulationStore.ts  # useLangStore (lang + theme/toggleTheme, theme→localStorage) + legacy alias useSimulationStore
    │   └── internalsStore.ts   # useInternalsStore — simulator step state machine + STEP_* maps + STEP_TEXTS
    ├── lib/
    │   ├── theme.tsx           # TS token mapping — INFOBOX_VARIANT, DIAGRAM, DATA_PALETTE, CODE (zero hex); ACCENT_COLORS legacy
    │   ├── utils.ts            # cn() = twMerge(clsx(...))
    │   └── optimizer/          # Pure-TS CBO engine
    │       ├── index.ts        # barrel
    │       ├── parser.ts       # SELECT → ParsedQuery
    │       ├── stats.ts        # TABLE_STATS (12 tables) + getTableStats / getColumnStats
    │       ├── estimator.ts    # generateAccessPaths, estimateJoinCost, computeSelectivity
    │       ├── planGenerator.ts# optimize(sql) → OptimizerResult (3 phases)
    │       └── types.ts        # ParsedQuery, AccessPath, ExecutionPlan, OptimizerResult, ...
    └── data/
        ├── index.ts           # barrel: SCHEMAS, SAMPLE_QUERIES, re-exports
        ├── types.ts           # Schema, SchemaTable, ColumnDef, ForeignKey, RowData
        ├── hrSchema.ts        # HR — 7 tables + sample rows
        ├── coSchema.ts        # CO (Customer Orders) — 5 tables + sample rows
        └── largeDataGenerator.ts  # Mulberry32-seeded synthetic dataset, built once on import
```

## Directory Purposes

**`src/book/`:**
- Purpose: the book shell (navigation chrome) plus every chapter's content
- Contains: `BookLayout`, `BookContent`, `TableOfContents`, `bookStructure.tsx`, `GlossaryPanel`, `SchemaPanel`, and `chapters/`
- Key files: `bookStructure.tsx` (TOC single source of truth), `BookContent.tsx` (`SectionRouter`)

**`src/book/chapters/<chapter>/`:**
- Purpose: one chapter of the textbook
- Contains: `index.tsx` (router that maps `sectionId` → section component), one file per section, chapter-local `shared/` diagrams/helpers
- Key files: `index.tsx` per chapter; `shared.tsx` at `chapters/` root for cross-chapter primitives

**`src/components/`:**
- Purpose: heavier interactive widgets — simulators, ERD, landing view
- Contains: `OracleDiagram`, `QueryInput`, `OptimizerPanel`, `ExecutionPlanViewer`, `SchemaDiagram`, `DataPanel`, `LandingPage`, `ui/`
- Key files: `OracleDiagram.tsx`, `QueryInput.tsx` (both bound to `useInternalsStore`)

**`src/components/ui/`:**
- Purpose: shadcn/ui primitives
- Contains: `badge.tsx`, `button.tsx`, `card.tsx`, `separator.tsx`
- Generated: partially (shadcn CLI); Committed: Yes

**`src/store/`:**
- Purpose: zustand global state
- Contains: `simulationStore.ts` (lang), `internalsStore.ts` (simulator)
- Key files: both

**`src/lib/`:**
- Purpose: framework-agnostic helpers
- Contains: `theme.tsx`, `utils.ts`, `optimizer/` (CBO engine)
- Key files: `optimizer/planGenerator.ts` (`optimize()`), `theme.tsx` (token mapping — pairs with `src/styles/tokens.css`)

**`src/data/`:**
- Purpose: schema fixtures and synthetic data for simulators and ERD
- Contains: `hrSchema.ts`, `coSchema.ts`, `largeDataGenerator.ts`, `types.ts`, `index.ts`
- Key files: `index.ts` (barrel — import `SCHEMAS`, `SAMPLE_QUERIES` from here)

**`scripts/`:**
- Purpose: Node PDF export tooling driving `?print=<sectionId>` renders
- Generated: No; Committed: Yes

**`public/`:**
- Purpose: static assets served verbatim
- Contains: `icons.svg`, `memory.png`
- Generated: No; Committed: Yes

**`dist/`:**
- Purpose: Vite build output
- Generated: Yes; Committed: No (`.gitignore`)

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell, loads `/src/main.tsx`
- `src/main.tsx`: React root, `react-scan` (dev), renders `<App/>`
- `src/App.tsx`: top-level view switch (`#simulator`, `?print=`, else `BookLayout`)

**Configuration:**
- `vite.config.ts`: `base` path, `@` alias, `__BUILD_DATE__`
- `tsconfig.app.json`: strict compiler flags, `@/*` path alias
- `eslint.config.js`: flat config, `no-explicit-any: error`
- `.prettierrc`: formatting + Tailwind class sorting
- `components.json`: shadcn settings
- `src/styles/tokens.css`: the design source — every color/font/radius value
- `src/index.css`: `@import`s + structural CSS only

**Core Logic:**
- `src/book/bookStructure.tsx`: `BOOK_CHAPTERS` (TOC data) + selectors
- `src/book/BookContent.tsx`: `SectionRouter` prefix routing + `DARK_READY` per-chapter theme opt-in
- `src/store/internalsStore.ts`: simulator state machine + `startSimulation()` step loop
- `src/lib/optimizer/planGenerator.ts`: `optimize(sql)` CBO pipeline
- `src/lib/theme.tsx`: token mapping (`INFOBOX_VARIANT`, `DIAGRAM`, `DATA_PALETTE`, `CODE`)

**Testing:**
- None. No test runner or test files. `npm run build` (`tsc -b && vite build`) is the correctness gate. `verify_storage.mjs` at repo root is an ad-hoc puppeteer check, not a suite.

## Naming Conventions

**Files:**
- Section components: `PascalCaseSection.tsx` (e.g. `BufferCacheSection.tsx`, `RangeScanSection.tsx`). Chapter-1 top-level sections drop `Section`-only convention sometimes (`EntitySection.tsx` keeps it).
- Chapter router: always `index.tsx`, exporting `XxxPage` (`InternalsPage`, `OptimizerChapterPage`, `IndexChapterPage`).
- Chapter-local shared code: `shared.tsx` / `shared.ts`, or a `shared/` directory for multiple helpers.
- Diagram/helper components: `PascalCase.tsx` (`OracleInstanceMap.tsx`, `ScanDiagram.tsx`, `JoinAnimator.tsx`, `SgaPositionDiagram.tsx`).
- Stores: `camelCaseStore.ts`, hook exported as `useXxxStore`.
- Engine files: lowercase single word (`parser.ts`, `estimator.ts`, `stats.ts`).
- Data files: `camelCaseSchema.ts`.
- shadcn primitives: lowercase (`badge.tsx`, `button.tsx`).

**Directories:**
- `kebab-case` matching the `sectionId` segment: `execution-plans/`, `sort-merge/`, `redo-log-buffer/`, `dml-more/`.
- A directory represents a TOC parent node; its children live at `parent/child/ChildSection.tsx`.
- Exception: chapter `index === 'index'` uses directory name `index-chapter/` to avoid clashing with `index.tsx`.

**Identifiers:**
- `sectionId`: `kebab-case`, chapter-prefixed (`internals-sga-buffer-cache`, `qt-or-expansion`, `sort-memory`).
- Exports: named exports only, PascalCase for components. `export default App` in `App.tsx` is the sole exception (Vite entry).
- Translation object: always `T`, accessed as `const t = T[lang]`.
- Type-only imports: `import type { ... }` (enforced by `verbatimModuleSyntax`).

## Where to Add New Code

**New book section (most common task):**
1. Add a `BookSection` entry (with `id`, `title.ko/en`) to the right chapter/parent in `src/book/bookStructure.tsx` (`BOOK_CHAPTERS`).
2. Create the file at `src/book/chapters/<chapter>/<parent-dir>/<child-dir>/ChildSection.tsx` — one section ID, one file.
3. Add `if (sectionId === '<id>') return <ChildSection />` to that chapter's router (`index.tsx`, or the relevant sub-router such as `optimizer/execution-plans/ExecutionPlansSection.tsx`).
4. In the file: declare `const T = { ko: {...}, en: {...} }`, read `const lang = useLangStore(s => s.lang)`, `const t = T[lang]`, build JSX from `src/book/chapters/shared.tsx` primitives following the page layout rules (`ChapterTitle` first, `Divider` only between sections, `InfoBox variant="summary"` in an `mt-8` wrapper last).

**New chapter:**
1. Add a `BookChapter` to `BOOK_CHAPTERS` (`color` must be a key of the `AccentColor` union in `src/lib/theme.tsx`).
2. Create `src/book/chapters/<chapter>/index.tsx` exporting `XxxPage({ sectionId })`.
3. Add a prefix branch to `SectionRouter` in `src/book/BookContent.tsx` (`if (sectionId.startsWith('<prefix>-')) return <XxxPage sectionId={sectionId} />`); add the prefix to `DARK_READY` if the chapter's content uses design tokens.
4. Full-height simulator sections need special handling in `SectionRouter` (rendered without the layout wrapper — see `optimizer-simulator`).
5. If the chapter should be selectable in the TOC, ensure its `num` is within the `isReady = chapter.num <= 7` gate in `src/book/TableOfContents.tsx` (raise the number when ready).

**New shared UI primitive:**
- Add to `src/book/chapters/shared.tsx` as a named export; use only design tokens (`src/styles/tokens.css`) / `src/lib/theme.tsx` mappings — no hex or `font-family` literals. Document it in CLAUDE.md's component table and `DESIGN.md §5`.

**New chapter-local diagram/helper:**
- `src/book/chapters/<chapter>/shared/` (or `shared.tsx` if the chapter has just one).

**New simulator widget:**
- Component in `src/components/`; state in `src/store/internalsStore.ts` (or a new store if unrelated to Internals).

**New CBO capability:**
- Extend `src/lib/optimizer/` (`parser.ts` for syntax, `estimator.ts` for costing, `planGenerator.ts` for plan shape); update `types.ts`; re-export from `index.ts`.

**New schema table / sample query:**
- `src/data/hrSchema.ts` or `coSchema.ts`; keep table names in sync with `TABLE_STATS` keys in `src/lib/optimizer/stats.ts`. Add queries to `SAMPLE_QUERIES` in `src/data/index.ts`.

**New glossary term:**
- Append to `GLOSSARY` in `src/data/glossary.ts` with `sectionIds` listing where it applies. No wiring needed — `GlossaryPanel` picks it up.

## Special Directories

**`dist/`:**
- Purpose: production bundle from `vite build`
- Generated: Yes; Committed: No

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents (this file, ARCHITECTURE.md, etc.)
- Generated: Yes (by GSD map-codebase); Committed: Yes

**`node_modules/`, `.idea/`, `.github/`:**
- `node_modules/`: deps, gitignored
- `.idea/` + `.idea/codeStyles`, `.idea/inspectionProfiles`: JetBrains IDE settings, gitignored
- `.github/workflows/deploy.yml`: Pages deployment CI

**`src/assets/`:**
- Purpose: intended for bundled assets; currently empty. Static assets that must not be processed go in `public/`.

**Repo-root stray files (not part of the app):**
- `verify_01_landing.png`, `verify_storage.mjs`, `C:UserswoongOneDriveDesktopbuffer_cache_pages.txt` — ad-hoc verification artifacts; not imported by `src/`.

---

*Structure analysis: 2026-08-29*
