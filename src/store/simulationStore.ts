import { create } from 'zustand'

export type Lang = 'ko' | 'en'
export type Theme = 'light' | 'dark'

const THEME_KEY = 'oracle-book-theme'

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* localStorage unavailable — fall through */
  }
  try {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    /* no matchMedia */
  }
  return 'light'
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

interface AppState {
  lang: Lang
  setLang: (lang: Lang) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useLangStore = create<AppState>((set, get) => ({
  lang: 'ko',
  setLang: (lang) => set({ lang }),

  theme: initialTheme(),
  setTheme: (theme) => {
    persistTheme(theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    persistTheme(next)
    set({ theme: next })
  },
}))

// Legacy alias — keeps existing `useSimulationStore(s => s.lang)` and
// `useSimulationStore(s => s.setLang)` call sites working without change.
export const useSimulationStore = useLangStore
