# Technology Stack

**Analysis Date:** 2026-08-29

## Languages

**Primary:**
- TypeScript ~5.9.3 - All application code under `src/` (`.ts` / `.tsx`). Strict mode enabled, `any` banned via ESLint.
- TSX / JSX - React components throughout `src/book/`, `src/components/`

**Secondary:**
- CSS - Single global stylesheet `src/index.css` (Tailwind v4 CSS-first config + theme variables). `src/App.css` is a 1-line placeholder.
- HTML - `index.html` (Vite entry, Korean `lang="ko"`, Google Fonts preconnect)
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
- `tailwindcss` 4.2.2 - Utility-first CSS, v4 CSS-first (`@import "tailwindcss"` in `src/index.css`)
- `tw-animate-css` 1.4.0 - Animation utility classes (`@import "tw-animate-css"`)
- `@base-ui/react` 1.3.0 - Headless primitives backing shadcn components (`src/components/ui/button.tsx`, `badge.tsx`, `separator.tsx`)
- `class-variance-authority` 0.7.1 - Variant styling for `src/components/ui/*`
- `clsx` 2.1.1 + `tailwind-merge` 3.5.0 - `cn()` helper in `src/lib/utils.ts`
- `@fontsource-variable/geist` 5.2.8 - Installed but not imported anywhere in `src/`; active font is Nanum Gothic via Google Fonts `<link>` in `index.html`
- shadcn/ui - Style `base-nova`, config in `components.json` (`iconLibrary: lucide`, but code standardizes on Tabler)
- `lucide-react` - Listed in CLAUDE.md as legacy; no `lucide-react` imports found in current `src/`

**Dev tooling / diagnostics:**
- `react-scan` 0.5.3 - Dev-only render profiler, `scan({ enabled: import.meta.env.DEV })` in `src/main.tsx`. Must not ship to production. Note: renders label overlays on named components — SVG diagrams avoid named subcomponents because of this.

## Configuration

**Environment:**
- No `.env` files, no runtime environment variables, no `import.meta.env.VITE_*` custom vars.
- Only built-in Vite env flags used: `import.meta.env.DEV` (`src/main.tsx`), `import.meta.env.BASE_URL` (`src/book/chapters/internals/overview/sga/buffer-cache/BufferCacheSection.tsx` for `memory.png`).
- Build-time constant: `__BUILD_DATE__` injected by `vite.config.ts` `define` as a `"YYYY-MM-DD"` string; typed in `src/build-env.d.ts`; rendered in `src/book/BookLayout.tsx` ("last updated ...").
- Language state (`ko` / `en`) is in-memory Zustand only — not persisted (no `localStorage`).

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
