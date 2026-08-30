import { memo, useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { GLOSSARY, getTermsForSection, sortTerms, type GlossaryTerm } from '@/data/glossary'
import { cn } from '@/lib/utils'
import { IconSearch, IconX, IconChevronRight } from '@tabler/icons-react'

interface Props {
  sectionId: string
  open: boolean
  onToggle: () => void
}

const T = {
  ko: {
    title: '용어 사전',
    searchPlaceholder: '용어 검색...',
    sectionThis: '이 페이지 용어',
    sectionAll: '전체 용어',
    noResults: '검색 결과 없음',
    noPageTerms: '이 섹션에 등록된 용어 없음',
    count: (n: number) => `${n}개`,
    tabLabel: '용어사전',
    openTitle: '용어사전 열기',
    closeTitle: '용어사전 닫기',
  },
  en: {
    title: 'Glossary',
    searchPlaceholder: 'Search terms...',
    sectionThis: 'This Page',
    sectionAll: 'All Terms',
    noResults: 'No results found',
    noPageTerms: 'No terms for this section',
    count: (n: number) => `${n} terms`,
    tabLabel: 'Glossary',
    openTitle: 'Open Glossary',
    closeTitle: 'Close Glossary',
  },
} as const

// Toggle tab — isolated so open/lang changes don't re-render the panel body
const GlossaryTab = memo(function GlossaryTab({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  return (
    <button
      onClick={onToggle}
      title={open ? t.closeTitle : t.openTitle}
      className={cn(
        'flex w-7 shrink-0 flex-col items-center justify-center gap-1.5 border-l border-line transition-colors duration-150',
        open
          ? 'bg-ink/[0.06] text-ink'
          : 'bg-rail text-ink-3 hover:bg-ink/[0.04] hover:text-ink',
      )}
    >
      <motion.span
        animate={{ rotate: open ? 0 : 180 }}
        transition={{ duration: 0.2 }}
        className="text-[11px] leading-none"
      >
        ›
      </motion.span>
      <span
        className="select-none font-mono text-[9px] font-semibold uppercase tracking-widest"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {t.tabLabel}
      </span>
    </button>
  )
})

export function GlossaryPanel({ sectionId, open, onToggle }: Props) {
  return (
    <div className="flex shrink-0 overflow-hidden">
      <GlossaryTab open={open} onToggle={onToggle} />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="glossary-body"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-l border-line bg-rail"
          >
            <GlossaryBody key={sectionId} sectionId={sectionId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GlossaryBody({ sectionId }: { sectionId: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  const [query, setQuery] = useState('')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => searchRef.current?.focus(), 280)
    return () => clearTimeout(id)
  }, [])

  // Terms for current section (highlighted set)
  const pageTerms = useMemo(() => sortTerms(getTermsForSection(sectionId)), [sectionId])
  const pageTermNames = useMemo(() => new Set(pageTerms.map((t) => t.term)), [pageTerms])

  // Remaining terms not in current section
  const otherTerms = useMemo(
    () => sortTerms(GLOSSARY.filter((t) => !pageTermNames.has(t.term))),
    [pageTermNames]
  )

  const filteredPage = useMemo(() => {
    if (!query.trim()) return pageTerms
    const q = query.trim().toLowerCase()
    return pageTerms.filter(
      (term) => term.term.toLowerCase().includes(q) || term.definition[lang].toLowerCase().includes(q)
    )
  }, [query, lang, pageTerms])

  const filteredOther = useMemo(() => {
    if (!query.trim()) return otherTerms
    const q = query.trim().toLowerCase()
    return otherTerms.filter(
      (term) => term.term.toLowerCase().includes(q) || term.definition[lang].toLowerCase().includes(q)
    )
  }, [query, lang, otherTerms])

  const totalCount = filteredPage.length + filteredOther.length

  function handleTermToggle(termName: string) {
    setExpandedTerm((prev) => (prev === termName ? null : termName))
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setExpandedTerm(null)
  }

  return (
    <div className="flex h-full w-[300px] flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-line px-4 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink-3">
            {t.title}
          </span>
          <span className="font-mono text-[10px] text-ink-3/60">{t.count(totalCount)}</span>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch
            size={12}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3/50"
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-card border border-line bg-paper py-1.5 pl-7 pr-7 font-mono text-[11px] text-ink placeholder:text-ink-3/50 focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue/40"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3/50 transition-colors hover:text-ink"
            >
              <IconX size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Term list */}
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {totalCount === 0 && (
          <p className="px-2 py-8 text-center font-mono text-[11px] text-ink-3/50">{t.noResults}</p>
        )}

        {/* This page section */}
        {filteredPage.length > 0 && (
          <div className="mb-1">
            <SectionLabel label={t.sectionThis} count={filteredPage.length} highlight />
            <div className="flex flex-col gap-0.5 px-2">
              {filteredPage.map((term) => (
                <TermRow
                  key={term.term}
                  term={term}
                  expanded={expandedTerm === term.term}
                  onToggle={handleTermToggle}
                />
              ))}
            </div>
          </div>
        )}

        {/* No page terms, not searching */}
        {filteredPage.length === 0 && !query.trim() && (
          <div className="mb-1">
            <SectionLabel label={t.sectionThis} count={0} highlight />
            <p className="px-4 pb-2 font-mono text-[10px] text-ink-3/50">{t.noPageTerms}</p>
          </div>
        )}

        {/* Divider before all terms */}
        {filteredOther.length > 0 && (
          <>
            {filteredPage.length > 0 && <div className="mx-4 my-2 border-t border-line" />}
            <div className="mb-1">
              <SectionLabel label={t.sectionAll} count={filteredOther.length} />
              <div className="flex flex-col gap-0.5 px-2">
                {filteredOther.map((term) => (
                  <TermRow
                    key={term.term}
                    term={term}
                    expanded={expandedTerm === term.term}
                    onToggle={handleTermToggle}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({
  label,
  count,
  highlight = false,
}: {
  label: string
  count: number
  highlight?: boolean
}) {
  return (
    <div className={cn('mb-1.5 flex items-center gap-2 px-4 py-1', highlight && 'bg-ink/[0.05]')}>
      {highlight && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" />}
      <span
        className={cn(
          'font-mono text-[9px] font-semibold uppercase tracking-widest',
          highlight ? 'text-ink-2' : 'text-ink-3/50',
        )}
      >
        {label}
      </span>
      {count > 0 && (
        <span className={cn('ml-auto font-mono text-[9px]', highlight ? 'text-ink-3' : 'text-ink-3/40')}>
          {count}
        </span>
      )}
    </div>
  )
}

const TermRow = memo(function TermRow({
  term,
  expanded,
  onToggle,
}: {
  term: GlossaryTerm
  expanded: boolean
  onToggle: (termName: string) => void
}) {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <button
      onClick={() => onToggle(term.term)}
      className={cn(
        'w-full rounded-card px-3 py-2 text-left transition-colors',
        expanded ? 'bg-ink/[0.06]' : 'hover:bg-ink/[0.04]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-ink">{term.term}</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 text-ink-3/40"
        >
          <IconChevronRight size={11} />
        </motion.span>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-1.5 font-sans text-[10.5px] leading-relaxed text-ink-2">
              {term.definition[lang]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
})
