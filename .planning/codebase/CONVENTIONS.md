# Coding Conventions

**Analysis Date:** 2026-08-29

This is a React 19 + Vite 8 + TypeScript 5.9 single-page app — an interactive Oracle DB education book ("Dynamic Oracle 교육서"). All source lives under `src/`. There is **no test framework** (see `TESTING.md`); `npm run build` (`tsc -b && vite build`) is the only correctness gate.

## Enforcement Tooling

| Tool | Config | Scope |
|------|--------|-------|
| TypeScript strict | `tsconfig.app.json` | Type errors block `npm run build` |
| ESLint 9 (flat config) | `eslint.config.js` | TS/React syntax, hooks rules, react-refresh only |
| Prettier 3 + `prettier-plugin-tailwindcss` | `.prettierrc` | All formatting + Tailwind class ordering |
| `eslint-config-prettier` | in `eslint.config.js` extends | Disables ESLint rules that would fight Prettier |

**Run before every commit:**
```bash
npm run build            # tsc -b + vite build — the real gate
npm run lint             # eslint .
npx prettier --write .   # no "format" script; run directly
```

ESLint has exactly one custom rule beyond the recommended presets: `@typescript-eslint/no-explicit-any: 'error'`. Everything else is `js.configs.recommended` + `tseslint.configs.recommended` + `reactHooks.configs.flat.recommended` + `reactRefresh.configs.vite`.

## TypeScript Rules (strict — these are compile errors)

From `tsconfig.app.json` `compilerOptions`:

- **`strict: true`** — full strict mode.
- **`noUnusedLocals` / `noUnusedParameters`** — unused variables and params fail the build. Prefix intentionally-unused with `_` or remove them.
- **`erasableSyntaxOnly`** — no `enum`, no `const enum`, no `namespace`. Use a `const` object + `as const` instead. `as const` appears in 34 files; the codebase never declares an `enum`.
  ```ts
  // src/lib/optimizer/parser.ts
  const COMPARISON_OPS = ['<=', '>=', '<>', '!=', '<', '>', '='] as const
  ```
- **`verbatimModuleSyntax`** — type-only imports MUST be `import type { ... }` (44 files) or inline `import { type X }` (10 files). Mixing a value and a type in one non-`type` import group is an error.
  ```ts
  import { type ReactNode, useEffect, useRef, useState } from 'react'   // inline type
  import type { OptimizerResult } from '@/lib/optimizer/types'          // type-only
  ```
- **`noFallthroughCasesInSwitch`** — every `case` must `break`/`return`. `switch` on a discriminated union is common in `src/lib/optimizer/estimator.ts`.
- **`noUncheckedSideEffectImports`** — bare side-effect imports must resolve.
- **No `any`.** When a value is genuinely dynamic use `unknown` and narrow, or `Record<string, unknown>` (see `src/book/chapters/sql-basics/dml-more/shared.ts` `overrideResult.rows: Record<string, unknown>[]`).
- **Path alias `@/` → `src/`** (`tsconfig.app.json` paths + `vite.config.ts` resolve.alias). Use `@/...` for cross-area imports; relative `../` is used *within* a chapter directory.

## Module Exports

**Named exports only.** The single exception is `src/App.tsx`, which has both `export function App()` and `export default App` because Vite's entry (`src/main.tsx`) imports it as default. Nothing else in `src/` uses `export default` (verified: 1 match repo-wide).

- Components: `export function ComponentName(props: Props) { ... }` — 214 `export function` declarations.
- Data / constants: `export const BOOK_CHAPTERS: BookChapter[] = [...]`, `export const ACCENT_COLORS: Record<AccentColor, AccentColorSet> = {...}`.
- Types: `export interface Foo {}` / `export type Bar = ...` (106 interfaces vs 66 type aliases — prefer `interface` for object shapes, `type` for unions/aliases).
- shadcn/ui primitives (`src/components/ui/*.tsx`) additionally export their `cva` variants and carry `// eslint-disable-next-line react-refresh/only-export-components` on the export line — the only `eslint-disable` comments in the codebase (`button.tsx:58`, `badge.tsx:52`).

### Barrel files

- `src/data/index.ts` re-exports schemas, `SCHEMAS`, `SAMPLE_QUERIES`, and the large-data generator. Import data from `@/data/index` or `@/data`.
- `src/lib/optimizer/index.ts` re-exports the optimizer surface (`parseSQL`, `optimize`, `generateAccessPaths`, `getTableStats`, …) plus `export type * from './types'`.
- Chapter directories use an `index.tsx` (or `XxxSection.tsx`) **router file** that only imports child section components and branches on `sectionId` — no content lives there.

## Naming Patterns

**Files:**
- React components / pages / sections: `PascalCase.tsx` — `IntroductionPage.tsx`, `SqlProcessingSection.tsx`, `OracleDiagram.tsx`, `SchemaDiagram.tsx`.
- Chapter router entry point: lowercase `index.tsx` (e.g. `src/book/chapters/join/index.tsx`).
- Non-component TS modules: `camelCase.ts` — `simulationStore.ts`, `internalsStore.ts`, `planGenerator.ts`, `hrSchema.ts`, `largeDataGenerator.ts`, `bookStructure.tsx`.
- Shared per-chapter helpers: `shared.ts` / `shared.tsx`.
- shadcn/ui primitives: lowercase `button.tsx`, `badge.tsx`, `card.tsx`, `separator.tsx` (kept as generated).
- Node build scripts: `kebab-case.mjs` under `scripts/` (`export-partition-pdf.mjs`).

**Directories:** `kebab-case` — `data-modeling/`, `index-chapter/`, `sql-basics/dml-more/`, `execution-plans/sql-processing/`. Directory tree mirrors the TOC tree (see CLAUDE.md "1페이지 = 1파일" rule).

**Identifiers:**
- Components / types / interfaces: `PascalCase` (`BookSection`, `AccentColorSet`, `OptimizerResult`).
- Functions / variables / props: `camelCase` (`getSectionById`, `startSimulation`, `activeComponents`, `sectionId`).
- Module-level constants (config maps, seed data, lookup tables): `SCREAMING_SNAKE_CASE` — `BOOK_CHAPTERS`, `ACCENT_COLORS`, `STEP_COMPONENTS`, `SQL_KEYWORDS`, `SYSTEM_PARAMS`, `INITIAL_CACHED_QUERIES`, `VARIANT_DEFS`, `KW_GROUPS`.
- Local helper constants inside a function: `camelCase`.
- Private module locals derived at import time: leading underscore is used occasionally (`const _hrEmpTable = HR_SCHEMA.find(...)` in `sql-basics/dml-more/shared.ts`).
- String-literal union types over enums: `type Lang = 'ko' | 'en'`, `type AccessPathType = 'FULL_TABLE_SCAN' | 'INDEX_UNIQUE_SCAN' | ...`, `type SimulationStep = 'idle' | 'parsing' | ...`.
- zustand store hooks: `useXxxStore` (`useLangStore`, `useInternalsStore`). `useSimulationStore` is a **legacy alias** for `useLangStore` — new code should import `useLangStore` (CLAUDE.md), though 153 call sites still read `useSimulationStore((s) => s.lang)`.

## Code Style (Prettier)

From `.prettierrc` — do not hand-format against these:
- **No semicolons** (`semi: false`).
- **Single quotes** (`singleQuote: true`); double quotes only where a string contains an apostrophe, or in the generated shadcn/ui files.
- **2-space indent** (`tabWidth: 2`).
- **`trailingComma: "es5"`** — trailing commas in arrays/objects, not in function params.
- **Tailwind classes auto-sorted** by `prettier-plugin-tailwindcss`. Never reorder classes by hand.
- Column alignment of object literals (aligning `:` in `VARIANT_DEFS`, `STEP_TEXTS`, `ACCENT_COLORS`) is done manually and Prettier tolerates it — keep the existing alignment when editing those tables.

## Import Organization

No enforced import-sort rule; the de-facto order across files is:

1. React / third-party packages — `react`, `framer-motion`, `zustand`, `@xyflow/react`, `@tabler/icons-react`.
2. `@/` absolute imports — stores, `@/lib/utils`, `@/lib/theme`, `@/data`, `@/components/...`.
3. Relative imports — `./bookStructure.tsx`, `../shared`, `./chapters/introduction/IntroductionPage`.
4. `import type { ... }` lines usually grouped with their area (kept separate from value imports per `verbatimModuleSyntax`).

Icon imports from `@tabler/icons-react` are frequently multi-line and destructured (see `IntroductionPage.tsx`).

## React / Component Conventions

- **Function components only**, declared with `function` (not arrow consts). Props typed inline or via a local `interface Props` / `interface XxxProps`.
  ```ts
  // inline (most common for small components)
  export function PageContainer({ children, className }: { children: ReactNode; className?: string }) { ... }

  // named interface (components with many props)
  interface TermPopupProps { label: string; title: string; open: boolean; onOpen: () => void; onClose: () => void; children: ReactNode }
  export function TermPopup({ label, title, open, onOpen, onClose, children }: TermPopupProps) { ... }
  ```
- Chapter page components take exactly `{ sectionId: string }` (or nothing) and read `lang` from the store internally — never pass `lang` as a prop:
  ```ts
  export function JoinPage({ sectionId }: { sectionId: string }) {
    const lang = useSimulationStore((s) => s.lang)
    if (sectionId === 'join-overview') return <JoinOverviewSection />
    ...
  }
  ```
- **`React.memo`** is used sparingly for expensive top-level views: `export const BookContent = memo(function BookContent({ ... }) { ... })` (6 `memo(` call sites total).
- **Hooks in use:** `useState` (153 uses), `useRef` (35), `useEffect` (29), `useMemo` (11). **No `useCallback`** anywhere (0 uses) — do not add it without reason. **No custom hooks** (`export function use*` — 0 matches); shared logic lives in zustand stores or pure helper modules.
- `useEffect` cleanup: event listeners are always removed in the returned cleanup (see `TermPopup` keydown/mousedown handlers in `src/book/chapters/shared.tsx`).
- Scroll-to-top / scroll-into-view on data change is done via `ref.current?.scrollTo(...)` inside `useEffect([sectionId])` (`BookContent.tsx`, `QueryInput.tsx` `LiveLog`).
- `key` props: array index (`key={i}`) is the norm for static content lists; stable identifiers (`key={tag}`, `key={s.title}`, `key={card.org}`, `key={sectionId}`) are used where an item has a natural id.

## Styling Conventions

- **Tailwind utility classes only.** No component-level CSS files. The only stylesheet is `src/index.css` (theme CSS variables, `@import "tailwindcss"`, and `.react-flow` overrides). `src/App.css` exists but is essentially empty (35 bytes).
- Conditional / merged class names go through **`cn()`** from `src/lib/utils.ts` (`twMerge(clsx(inputs))`). Always use `cn(...)` when combining a base class string with conditionals — never string concatenation.
  ```ts
  className={cn('mt-4 mb-4 rounded-lg border p-4', def.color)}
  className={cn('flex items-start gap-3', interactive && 'cursor-pointer')}
  ```
- **Color is centralized.** `src/lib/theme.ts` `ACCENT_COLORS: Record<AccentColor, AccentColorSet>` maps 13 accent keys (`blue`, `violet`, `emerald`, `orange`, `cyan`, `rose`, `amber`, `teal`, `brand-navy`, `brand-teal`, `brand-pink`, `brand-orange`, `brand-salmon`) to `{ icon, text, border, bg, dot, badge }` class strings. Chapter/section components pick an `AccentColor` and read the set — they do not write `text-blue-600` etc. inline for chapter theming. `index.css` also defines an `ios-*` palette (`bg-ios-blue-light`, `text-ios-orange-dark`, …) used by `InfoBox` and `shared.tsx` step colors.
- Prefer the shared layout primitives in `src/book/chapters/shared.tsx` (`PageContainer`, `ChapterTitle`, `SectionTitle`, `Prose`, `Divider`, `InfoBox`, `Table`, `ConceptGrid`, `SqlBlock`, `StepList`, `AccordionSection`, `WipBanner`) instead of hand-rolling `div`/`ul`. CLAUDE.md: "새 UI를 만들기 전에 반드시 이 목록을 먼저 확인하라."
- Page layout spacing rules (from CLAUDE.md): `<Divider />` only *between* sections, never right after `<ChapterTitle>` or after the last section; don't stack `mt-N` wrappers on top of `SectionTitle` (its `mt-8` is built in); final summary `InfoBox` gets an `mt-8` wrapper.

## Icons

- **`@tabler/icons-react` is the default** icon library. Standard sizes: `size={36}` for `ChapterTitle` icons, `size={20}` for `ConceptGrid` / data-array icons, `size={16}` (or `13`/`14`) for inline icons. `stroke={1.5}` is the default; `InfoBox` variant icons use `stroke={2}`.
- `lucide-react` is listed as a dependency but only lingers in older components — **do not use it in new code** (CLAUDE.md).

## Bilingual String Pattern (`T` object)

Every chapter/section component that renders copy defines a local `const T` at the top of the file with `ko` and `en` keys, then `const t = T[lang]`. **108 files** follow this. There is no i18n library.

```ts
const T = {
  ko: { hero: '오라클이란?', heroSub: '세계에서 가장 널리 쓰이는 관계형 데이터베이스...' },
  en: { hero: 'What is Oracle?', heroSub: "Introducing Oracle — the world's most widely used..." },
}

export function IntroductionPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return <h1>{t.hero}</h1>
}
```

Variations seen:
- Data arrays keyed by language: `const LANDING_ITEMS = { ko: [...], en: [...] }` then `LANDING_ITEMS[lang]` (`optimizer/index.tsx`).
- Per-string bilingual objects on data records: `label: { ko: '...', en: '...' }`, `desc: { ko: '...', en: '...' }` — pervasive in `bookStructure.tsx`, `glossary.ts`, and `sql-basics/dml-more/shared.ts` step definitions.
- Store-side text tables: `STEP_TEXTS = { ko: {...}, en: {...} }` and `STEP_PROCESS_LABEL: Record<string, ...>` keyed `'ko' | 'en'` in `src/store/internalsStore.ts`; `startSimulation()` resolves language via `useLangStore.getState().lang`.
- Multi-paragraph Korean copy is written as string concatenation with explicit `'\n\n'` separators and rendered through `<Prose>` (which applies `whitespace-pre-line`).
- Inline conditional for one-off UI strings: `{lang === 'ko' ? '이전' : 'Previous'}`.

Korean copy follows CLAUDE.md tone rules: friendly `~해요 / ~거예요 / ~거든요`, English acronyms spelled out in parentheses on first use (e.g. `RDBMS(Relational Database Management System)`).

## State Management

- **zustand v5**, `create<T>()` in `src/store/`. Two stores, deliberately split:
  - `simulationStore.ts` — global `{ lang, setLang }` only. Canonical hook `useLangStore`; `useSimulationStore` is a back-compat alias.
  - `internalsStore.ts` — Internals Simulator state + actions (`startSimulation`, `resetSimulation`, `flushBuffers`, `setStep`, `addLog`, `setHighlightedStep`).
- Store shape convention: separate `interface XxxState` and `interface XxxActions`, a module-level `const initialState: XxxState`, then `create<XxxState & XxxActions>((set, get) => ({ ...initialState, action: () => set(...) }))`.
- Reads use a selector: `useInternalsStore((s) => s.stepLog)`, `useSimulationStore((s) => s.lang)` — never destructure the whole store.
- Async actions live in the store and use `set(...)` / `get()` with `await new Promise((r) => setTimeout(r, ms))` for stepped animation (`startSimulation`, `flushBuffers`).
- `Set` is used as a state value (`activeComponents: Set<string>`); always replace with `new Set(...)`, never mutate in place.
- Cross-store reads use `useLangStore.getState().lang` inside an action (not a hook).

## Error Handling

Minimal by design — this is a client-only educational app with no network calls, no user data persistence, and no backend.

- **The only `try/catch` in `src/`** is in `src/store/internalsStore.ts` `startSimulation()`, wrapping `optimize(query)`:
  ```ts
  let optimizerResult: OptimizerResult | null = null
  try {
    optimizerResult = optimize(query)
  } catch {
    // silently skip on parse failure
  }
  ```
  Pattern: bare `catch {}` (no binding), swallow, fall back to `null`, and downstream code guards with `optimizerResult?.plan` / `chosenPlan ? ... : 'N/A'`.
- **No `throw` statements** anywhere in `src/` (verified). Pure helpers (parser, estimator) return safe defaults instead — e.g. `computeSelectivity` returns `0.1` when stats are missing, `parseSQL` returns an empty `ParsedQuery` for non-SELECT input.
- **Null-object / guard-clause pattern** is the norm: `if (!info) return null` (`BookContent`), `?? []`, `?? ''`, `Array.find(...)!` only where data is known-present at import time.
- `main.tsx` uses a non-null assertion on the mount node: `document.getElementById('root')!`.
- No React error boundaries.

## Logging

- **No logging framework.** `console.*` does not appear anywhere in `src/` (0 matches).
- Node build scripts (`scripts/*.mjs`, `verify_storage.mjs`) use `console.log` / `console.error` freely with emoji prefixes — that's fine for scripts, not for `src/`.
- The Internals Simulator has its own in-app "log": `internalsStore.stepLog` (array of `{ step, message, timestamp }`) rendered by `LiveLog` in `src/components/QueryInput.tsx`. Add simulation-visible messages there, not to `console`.

## Comments

- **Section banner comments** organize long files: `// ── SqlBlock ─────────────────` , `// ─── Oracle CBO Estimator ────`. Used heavily in `shared.tsx`, `internalsStore.ts`, `estimator.ts`, `parser.ts`, `SqlHighlight.tsx`.
- Inline `//` comments explain *why* (formula source, Oracle behavior being modeled), e.g. `// sel = 1 / NDV  (Oracle formula)`, `// Oracle multiplies independent selectivities`.
- JSDoc `/** ... */` is used for: file headers in `scripts/*.mjs`, individual props in prop interfaces (`SqlBlock`'s `title`/`desc`), and the `build-env.d.ts` global. It is **not** used comprehensively on functions/components.
- Korean and English comments are both acceptable; CLAUDE.md and many section headers are Korean.
- No `TODO` / `FIXME` / `HACK` / `XXX` markers exist in `src/` (verified) — incomplete sections are marked in the UI with `<WipBanner />` instead (currently `BitmapSection`, `CompositeSection`, and `sql-tuning-*` wrapper routes).

## Function Design

- **Pure helper modules** (`src/lib/optimizer/*`, `src/data/largeDataGenerator.ts`, `sql-basics/dml-more/shared.ts`): small single-purpose functions, explicit return types on the exported ones, no side effects, deterministic. `largeDataGenerator.ts` uses a seeded Mulberry32 PRNG and caches its result at module load so repeated imports are stable.
- Discriminated-union `switch` with a `default` branch returning a safe fallback is the standard shape for the estimator/parser.
- Bilingual data builders take the resolved dataset and return `{ ko, en }`-keyed structures (`buildExampleQueries(emps)` in `sql-basics/dml-more/shared.ts`).
- Lookup tables (`Record<Key, Value>` consts) are preferred over `if/else` chains for mapping keys to classes/labels/icons (`ACCENT_COLORS`, `VARIANT_DEFS`, `CATEGORY_CLASS`, `STEP_COLOR`, `RESULT_CLS`).
- Router components are the one place long `if (sectionId === '...') return <X />` chains are acceptable and expected.

## Adding New Code — Checklist (from CLAUDE.md)

**New section:**
1. Add the section entry to `BOOK_CHAPTERS` in `src/book/bookStructure.tsx` (single source of truth for TOC / breadcrumb / Prev-Next).
2. Create `parent-dir/child-dir/ChildSection.tsx` mirroring the TOC tree (one section id → one `.tsx` file; never bundle multiple sections into one file as functions).
3. Add `import` + `if (sectionId === '...')` branch to the parent chapter router.
4. In the new file: `const T = { ko, en }` object, then the `export function XxxSection()` component.

**New chapter:** also add a `SectionRouter` prefix branch in `src/book/BookContent.tsx` (prefix must match the section-id prefix, e.g. `startsWith('internals-')`), and ensure `chapter.color` is a valid `AccentColor` key. Full-height simulator sections are rendered by `SectionRouter` without the layout wrapper.
