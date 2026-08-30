# Technology Stack

**Analysis Date:** 2026-08-29
**Updated:** 2026-08-30 — design-system refactor (token CSS, font swap, theme toggle)

## Languages

**Primary:**
- TypeScript ~5.9.3 - All application code under `src/` (`.ts` / `.tsx`). Strict mode enabled, `any` banned via ESLint.
- TSX / JSX - React components throughout `src/book/`, `src/components/`

**Secondary:**
- CSS - Two stylesheets: `src/styles/tokens.css` (the design-token source — `@theme` color/font/radius vars, light + dark via `[data-theme]`) and `src/index.css` (`@import` lines + structural rules only: `body`, `#root`, bare-`border` default color, `.react-flow__*` overrides). `src/App.css` is a 35-byte placeholder.
- HTML - `index.html` (Vite entry; `<html lang>` synced to the store by `App.tsx`; Google Fonts `<link>` for Noto Sans KR + Inter + Newsreader + JetBrains Mono)
- JavaScript (ESM `.mjs`) - Build-time PDF export scripts in `scripts/` (not part of the app bundle)

## Runtime

**Environment:**
- Browser (client-side SPA only, no server runtime)
- Node.js 24 for build/CI (`node-version: 24` in `.github/workflows/deploy.yml`); local dev observed on Node v24.6.0
- README states "Node.js 18 이상" as the minimum for local dev

**Package Manager:**
- npm 11.5.1 (local); CI uses `npm ci`
- Lockfile: `package-lock.json` present, `lockfileVersion: 3`

## Frameworks

**Core:**
- React 19.2.4 (`react`, `react-dom`) - UI framework, `StrictMode` + `createRoot` in `src/main.tsx`
- Vite 8.0.1 - Dev server (HMR) and production bundler; config in `vite.config.ts`
- Zustand 5.0.12 - Global state management (`src/store/simulationStore.ts` for `lang`, `src/store/internalsStore.ts` for the Internals Simulator)

**Testing:**
- None - No test framework, no test files. CLAUDE.md: "테스트 프레임워크 없음." Verification is `npm run build` (type check) + manual/Puppeteer screenshot checks (`verify_storage.mjs`, `verify_01_landing.png`).

**Build/Dev:**
- Vite 8.0.1 - `npm run dev` / `npm run build` / `npm run preview`
- `@vitejs/plugin-react` 6.0.1 - React Fast Refresh + JSX transform
- `@tailwindcss/vite` 4.2.2 - Tailwind v4 integration as a Vite plugin (no `tailwind.config.js`)
- TypeScript `tsc -b` - Project-references build (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`) run before `vite build`
- ESLint 9.39.4 (flat config `eslint.config.js`) - `npm run lint`
- Prettier 3.8.1 + `prettier-plugin-tailwindcss` 0.7.2 - Formatting (no `format` script; run `npx prettier --write .`)
- Puppeteer 25.1.0 + `pdf-lib` 1.17.1 - Dev-only chapter → PDF export tooling (`scripts/*.mjs`), requires `npm run dev` running

## Key Dependencies

**Critical:**
- `framer-motion` 12.38.0 - All simulation/diagram animations (component highlight transitions, arrows, `AnimatePresence`). Imported in ~40 chapter section files.
- `@xyflow/react` 12.10.1 - React Flow ERD graph rendering. Used only in `src/components/SchemaDiagram.tsx` (imports `@xyflow/react/dist/style.css`).
- `zustand` 5.0.12 - App-wide state; every chapter page reads `lang` from it.
- `@tabler/icons-react` 3.44.0 - Primary icon library (~113 import sites). Convention: `size={36}` titles, `size={20}` grids, `size={16}` inline, `stroke={1.5}`.

**UI / Styling:**
- `tailwindcss` 4.2.2 - Utility-first CSS, v4 CSS-first (`@import "tailwindcss"` in `src/index.css`; tokens generated from `@theme` in `src/styles/tokens.css`)
- `tw-animate-css` 1.4.0 - Animation utility classes (`@import "tw-animate-css"`)
- `@base-ui/react` 1.3.0 - Headless primitives backing shadcn components (`src/components/ui/button.tsx`, `badge.tsx`, `separator.tsx`)
- `class-variance-authority` 0.7.1 - Variant styling for `src/components/ui/*`
- `clsx` 2.1.1 + `tailwind-merge` 3.5.0 - `cn()` helper in `src/lib/utils.ts`
- **Design tokens** - `src/styles/tokens.css` is the single source for every color/font/radius value. `src/lib/theme.tsx` is the single TS mapping module (`INFOBOX_VARIANT`, `DIAGRAM`, `DATA_PALETTE`, `CODE` — Tailwind class / `var(--color-*)` strings only, zero hex). Components use token utilities (`bg-paper`, `text-ink`, `text-blue`, `border-line`, `rounded-card`). Full spec + migration status in repo-root `DESIGN.md`.
- **Fonts** (Google Fonts `<link>`) - Noto Sans KR (KO all roles), Inter (EN UI/headings), Newsreader (EN long-form body), JetBrains Mono (code/data/badges). Swap by `<html lang>` → `:root:lang(en)` overriding `--font-sans-active` / `--font-read-active`.
- `@fontsource-variable/geist` 5.2.8 - **Dead dependency**, never imported.
- shadcn/ui - Style `base-nova`, config in `components.json` (`iconLibrary: lucide`, but code standardizes on Tabler). shadcn HSL vars survive in `tokens.css` §1 for react-flow overrides only (Phase 3 removal).
- `lucide-react` - No imports in `src/`; migration to Tabler complete in code, only `components.json` lags.

**Dev tooling / diagnostics:**
- `react-scan` 0.5.3 - Dev-only render profiler, `scan({ enabled: import.meta.env.DEV })` in `src/main.tsx`. Must not ship to production. Note: renders label overlays on named components — SVG diagrams avoid named subcomponents because of this.

## Configuration

**Environment:**
- No `.env` files, no runtime environment variables, no `import.meta.env.VITE_*` custom vars.
- Only built-in Vite env flags used: `import.meta.env.DEV` (`src/main.tsx`), `import.meta.env.BASE_URL` (`src/book/chapters/internals/overview/sga/buffer-cache/BufferCacheSection.tsx` for `memory.png`).
- Build-time constant: `__BUILD_DATE__` injected by `vite.config.ts` `define` as a `"YYYY-MM-DD"` string; typed in `src/build-env.d.ts`; rendered in `src/book/BookLayout.tsx` ("last updated ...").
- Language state (`ko` / `en`) is in-memory Zustand only — not persisted.
- Theme state (`light` / `dark`) IS persisted: `src/store/simulationStore.ts` reads/writes `localStorage['oracle-book-theme']` (init: stored → `prefers-color-scheme` → `light`); `App.tsx` reflects it onto `<html data-theme>`.

**Build:**
- `vite.config.ts` - `base: '/woongbeee/'` on build (GitHub Pages project path), `/` in dev; aliases `@` → `./src`; plugins `react()`, `tailwindcss()`; `define.__BUILD_DATE__`
- `tsconfig.json` - Solution file, references `tsconfig.app.json` + `tsconfig.node.json`, defines `@/*` path alias
- `tsconfig.app.json` - `target`/`lib` ES2023, `module` ESNext, `moduleResolution` bundler, `jsx: react-jsx`, `noEmit`. Strict flags: `strict`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` (no `enum`/`namespace`), `verbatimModuleSyntax` (type imports must be `import type`), `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`
- `tsconfig.node.json` - Applies the same strict flags to `vite.config.ts` (Node `types`)
- `eslint.config.js` - Flat config: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` (Vite preset), `eslint-config-prettier`. Custom rule: `@typescript-eslint/no-explicit-any: 'error'`. Ignores `dist`.
- `.prettierrc` - `semi: false`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: 'es5'`, plugin `prettier-plugin-tailwindcss`
- `components.json` - shadcn/ui config (style `base-nova`, `cssVariables: true`, aliases to `@/components`, `@/lib`, `@/hooks`)

## Platform Requirements

**Development:**
- Node.js >= 18 (README); Node 24 used by CI
- npm (lockfile v3)
- Modern browser for the dev server (`http://localhost:5173`)
- Optional for PDF export scripts: Puppeteer-managed Chromium, dev server running

**Production:**
- Static hosting — GitHub Pages at `https://woongbeee.github.io/woongbeee/`
- CI: `.github/workflows/deploy.yml` on push to `main` — `actions/checkout@v4`, `actions/setup-node@v4` (node 24, npm cache), `npm ci`, `npm run build`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (`path: dist`), `actions/deploy-pages@v4`
- Output: `dist/` static bundle; must be served under the `/woongbeee/` base path
- No server, database, or backend of any kind — all "Oracle" behavior is simulated in TypeScript in the browser

---

*Stack analysis: 2026-08-29*
