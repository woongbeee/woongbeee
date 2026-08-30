import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { useInternalsStore } from '@/store/internalsStore'
import { TableOfContents } from './TableOfContents'
import { BookContent } from './BookContent'
import { GlossaryPanel } from './GlossaryPanel'
import { SchemaPanel } from './SchemaPanel'
import { Badge } from '@/components/ui/badge'
import { IconLanguage, IconSettings, IconChevronRight, IconDatabase, IconSun, IconMoon } from '@tabler/icons-react'

const T: Record<
  'ko' | 'en',
  {
    title: string
    subtitle: string
    langToggle: string
    tocLabel: string
    openTitle: string
    closeTitle: string
    simulator: string
    themeLight: string
    themeDark: string
  }
> = {
  ko: {
    title: 'Oracle DB',
    subtitle: 'Interactive Learning Book',
    langToggle: 'EN',
    tocLabel: '목차',
    openTitle: '목차 열기',
    closeTitle: '목차 닫기',
    simulator: 'Internals Simulator',
    themeLight: '라이트 모드',
    themeDark: '다크 모드',
  },
  en: {
    title: 'Oracle DB',
    subtitle: 'Interactive Learning Book',
    langToggle: '한국어',
    tocLabel: 'TOC',
    openTitle: 'Open TOC',
    closeTitle: 'Close TOC',
    simulator: 'Internals Simulator',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
  },
}

const MIN_WIDTH = 200
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 260

// Vertical tab — only visible when TOC is closed, sits to the right of the panel area
const TocTab = memo(function TocTab({ onToggle }: { onToggle: () => void }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return (
    <button
      onClick={onToggle}
      title={t.openTitle}
      className="flex w-7 shrink-0 flex-col items-center justify-center gap-1.5 border-r border-line bg-rail text-ink-3 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink"
    >
      <IconChevronRight size={13} />
      <span
        className="select-none font-mono text-[9px] font-bold uppercase tracking-widest"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {t.tocLabel}
      </span>
    </button>
  )
})

export function BookLayout() {
  const lang = useSimulationStore((s) => s.lang)
  const setLang = useSimulationStore((s) => s.setLang)
  const theme = useSimulationStore((s) => s.theme)
  const toggleTheme = useSimulationStore((s) => s.toggleTheme)
  const t = T[lang]

  const [tocOpen, setTocOpen]           = useState(true)
  const [tocWidth, setTocWidth]         = useState(DEFAULT_WIDTH)
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [schemaOpen, setSchemaOpen]     = useState(false)
  const [activeSectionId, setActiveSectionId] = useState('intro-overview')

  const toggleToc      = () => setTocOpen((v) => !v)
  const toggleGlossary = () => setGlossaryOpen((v) => !v)
  const toggleSchema   = () => setSchemaOpen((v) => !v)
  const toggleLang     = () => setLang(lang === 'ko' ? 'en' : 'ko')

  const isSimulator = activeSectionId === 'optimizer-simulator'

  // Drag-to-resize
  const onDragStart = (e: React.MouseEvent) => {
    let dragging = true
    const startX = e.clientX
    const startW = tocWidth

    const onMove = (ev: MouseEvent) => {
      if (!dragging) return
      const delta = ev.clientX - startX
      setTocWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + delta)))
    }
    const onUp = () => {
      dragging = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper text-ink">
      {/* ── Top Header — mono chrome ── */}
      <header className="z-20 flex h-11 shrink-0 items-center gap-2.5 border-b border-line bg-paper px-4">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-chip bg-ink text-paper">
          <IconDatabase size={13} stroke={2} />
        </span>
        <span className="font-sans text-[13px] font-semibold tracking-tight text-ink">{t.title}</span>
        <span className="hidden font-mono text-[11px] text-ink-3 sm:inline">{t.subtitle}</span>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-[10px] text-ink-3 lg:inline">updated {__BUILD_DATE__}</span>
          <span className="hidden h-3.5 w-px bg-line lg:block" />
          <button
            onClick={() => window.open(`${window.location.pathname}#simulator`, '_blank', 'width=1400,height=900')}
            className="flex items-center gap-1.5 rounded-chip border border-line bg-paper px-2.5 py-1 font-mono text-[10px] font-medium text-ink-2 transition-colors hover:bg-rail hover:text-ink"
          >
            <IconSettings size={12} />
            {t.simulator}
          </button>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-chip border border-line bg-paper px-2.5 py-1 font-mono text-[10px] font-medium text-ink-2 transition-colors hover:bg-rail hover:text-ink"
          >
            <IconLanguage size={12} />
            {t.langToggle}
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t.themeLight : t.themeDark}
            aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-chip border border-line bg-paper text-ink-2 transition-colors hover:bg-rail hover:text-ink"
          >
            {theme === 'dark' ? <IconSun size={13} /> : <IconMoon size={13} />}
          </button>
          <SimulationBadge />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* TOC: panel + tab (tab only when closed) */}
        <div className="flex shrink-0">
          <AnimatePresence initial={false}>
            {tocOpen && (
              <motion.div
                key="toc-body"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: tocWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-r border-line bg-rail"
              >
                <div className="relative flex h-full" style={{ width: tocWidth }}>
                  <div className="min-w-0 flex-1 overflow-y-auto">
                    <TableOfContents
                      activeSectionId={activeSectionId}
                      onSelect={setActiveSectionId}
                      onToggle={toggleToc}
                    />
                  </div>
                  {/* Drag handle */}
                  <div
                    onMouseDown={onDragStart}
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-line-2 active:bg-line-2"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!tocOpen && <TocTab onToggle={toggleToc} />}
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-hidden">
          <BookContent
            sectionId={activeSectionId}
            onNavigate={setActiveSectionId}
          />
        </main>

        {/* Right panel: Schema for simulator, Glossary elsewhere */}
        {isSimulator ? (
          <SchemaPanel open={schemaOpen} onToggle={toggleSchema} />
        ) : (
          <GlossaryPanel
            sectionId={activeSectionId}
            open={glossaryOpen}
            onToggle={toggleGlossary}
          />
        )}
      </div>
    </div>
  )
}

// Isolated: only re-renders on isRunning changes
const SimulationBadge = memo(function SimulationBadge() {
  const isRunning = useInternalsStore((s) => s.isRunning)
  if (!isRunning) return null
  return (
    <Badge variant="outline" className="border-line font-mono text-[10px] text-ink-2">
      <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" />
      RUNNING
    </Badge>
  )
})
