import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOOK_CHAPTERS } from './bookStructure.tsx'
import type { BookSection } from './bookStructure.tsx'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import {
  IconChevronRight,
  IconChevronsLeft,
  IconExternalLink,
} from '@tabler/icons-react'

interface Props {
  activeSectionId: string
  onSelect: (sectionId: string) => void
  onToggle: () => void
}

function sectionContainsActive(
  section: BookSection,
  activeId: string
): boolean {
  if (section.id === activeId) return true
  if (!section.children) return false
  return section.children.some((c) => sectionContainsActive(c, activeId))
}

function SectionItem({
  section,
  depth,
  parentNumbers,
  sectionIndex,
  activeSectionId,
  isReady,
  onSelect,
  onExpand,
}: {
  section: BookSection
  depth: number
  parentNumbers: number[]
  sectionIndex: number
  activeSectionId: string
  isReady: boolean
  onSelect: (id: string) => void
  onExpand: () => void
}) {
  const lang = useSimulationStore((s) => s.lang)
  const isActive = section.id === activeSectionId
  const hasChildren = !!section.children?.length
  const childActive =
    hasChildren &&
    section.children!.some((c) => sectionContainsActive(c, activeSectionId))
  const numLabel = [...parentNumbers, sectionIndex + 1].join('.')

  return (
    <div>
      <button
        onClick={() => {
          onSelect(section.id)
          onExpand()
        }}
        className={cn(
          'group rounded-chip flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors',
          isActive
            ? 'bg-ink/[0.06] text-ink'
            : isReady
              ? 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'
              : 'text-ink-3/40 cursor-default'
        )}
      >
        <span
          className={cn(
            'shrink-0 font-mono tabular-nums',
            depth === 0 ? 'text-[9px]' : 'text-[8px]',
            isActive
              ? 'text-ink-3'
              : isReady
                ? 'text-ink-3/50'
                : 'text-ink-3/25'
          )}
        >
          {numLabel}
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-sans leading-tight',
            depth === 0 ? 'text-[12px]' : 'text-[11px]',
            isActive ? 'font-medium' : 'font-normal'
          )}
        >
          {section.title[lang]}
        </span>
        {section.hasSimulator && (
          <span
            className={cn(
              'rounded-chip shrink-0 px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-wide uppercase',
              isActive
                ? 'bg-ink/10 text-ink'
                : isReady
                  ? 'bg-ink/[0.06] text-ink-3'
                  : 'bg-ink/[0.03] text-ink-3/40'
            )}
          >
            SIM
          </span>
        )}
        {isActive && (
          <motion.span
            layoutId="toc-active"
            className="bg-ink h-1.5 w-1.5 shrink-0 rounded-full"
          />
        )}
      </button>

      {hasChildren && (isActive || childActive) && (
        <div className="border-line ml-[1.1rem] border-l">
          {section.children!.map((child, cidx) => (
            <SectionItem
              key={child.id}
              section={child}
              depth={depth + 1}
              parentNumbers={[...parentNumbers, sectionIndex + 1]}
              sectionIndex={cidx}
              activeSectionId={activeSectionId}
              isReady={isReady}
              onSelect={onSelect}
              onExpand={onExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TableOfContents({
  activeSectionId,
  onSelect,
  onToggle,
}: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const defaultOpen = BOOK_CHAPTERS.reduce<Record<string, boolean>>(
    (acc, ch) => {
      acc[ch.id] = ch.sections.some((s) =>
        sectionContainsActive(s, activeSectionId)
      )
      return acc
    },
    {}
  )

  const [openChapters, setOpenChapters] =
    useState<Record<string, boolean>>(defaultOpen)

  function toggleChapter(id: string) {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header — mono chrome */}
      <div className="border-line flex h-11 shrink-0 items-center justify-between border-b px-4">
        <span className="text-ink-3 font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
          {lang === 'ko' ? '목차' : 'Contents'}
        </span>
        <button
          onClick={onToggle}
          title={lang === 'ko' ? '목차 닫기' : 'Close TOC'}
          className="rounded-chip text-ink-3 hover:bg-ink/[0.05] hover:text-ink flex items-center p-1 transition-colors"
        >
          <IconChevronsLeft size={14} />
        </button>
      </div>

      {/* Chapters */}
      <div className="flex flex-col px-2 py-3">
        {BOOK_CHAPTERS.map((chapter) => {
          const isOpen = !!openChapters[chapter.id]
          const hasActive = chapter.sections.some((s) =>
            sectionContainsActive(s, activeSectionId)
          )
          const isReady = chapter.num <= 9
          const allHidden = chapter.sections.every((s) => s.hiddenInToc)
          const hiddenSection = allHidden ? chapter.sections[0] : undefined

          return (
            <div key={chapter.id} className="flex flex-col">
              {/* Chapter header row */}
              <button
                onClick={() => {
                  if (hiddenSection) {
                    onSelect(hiddenSection.id)
                    setOpenChapters((prev) => ({ ...prev, [chapter.id]: true }))
                  } else {
                    toggleChapter(chapter.id)
                  }
                }}
                className={cn(
                  'group rounded-chip flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors',
                  isReady ? 'hover:bg-ink/[0.04]' : 'cursor-default',
                  hasActive && isReady && 'bg-ink/[0.06]'
                )}
              >
                <motion.span
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'shrink-0',
                    isReady ? 'text-ink-3' : 'text-ink-3/35'
                  )}
                >
                  <IconChevronRight size={12} />
                </motion.span>
                <span
                  className={cn(
                    '[&_svg]:text-ink-3 flex shrink-0 items-center',
                    !isReady && 'opacity-35'
                  )}
                >
                  {chapter.icon}
                </span>
                {chapter.num > 0 && (
                  <span
                    className={cn(
                      'shrink-0 font-mono text-[10px] font-medium tabular-nums',
                      isReady ? 'text-ink-3/60' : 'text-ink-3/30'
                    )}
                  >
                    {String(chapter.num).padStart(2, '0')}
                  </span>
                )}
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate font-sans text-[12.5px] leading-tight transition-colors',
                    isReady
                      ? hasActive
                        ? 'text-ink font-semibold'
                        : 'text-ink-2 group-hover:text-ink font-medium'
                      : 'text-ink-3/45 font-normal'
                  )}
                >
                  {chapter.title[lang]}
                </span>
                {hasActive && isReady && (
                  <span className="bg-ink h-1.5 w-1.5 shrink-0 rounded-full" />
                )}
              </button>

              {/* Sections — not rendered when all sections are hidden in TOC */}
              <AnimatePresence initial={false}>
                {isOpen && !allHidden && (
                  <motion.div
                    key="sections"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-line ml-[1.1rem] border-l pb-1">
                      {chapter.sections
                        .filter((s) => !s.hiddenInToc)
                        .map((section, idx) => (
                          <SectionItem
                            key={section.id}
                            section={section}
                            depth={0}
                            parentNumbers={[]}
                            sectionIndex={idx}
                            activeSectionId={activeSectionId}
                            isReady={isReady}
                            onSelect={onSelect}
                            onExpand={() =>
                              setOpenChapters((prev) => ({
                                ...prev,
                                [chapter.id]: true,
                              }))
                            }
                          />
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Developer credit — pinned to bottom */}
      <div className="border-line mt-auto flex h-[52px] items-center border-t px-4">
        <a
          href="https://woongbee.notion.site"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-chip hover:bg-ink/[0.04] flex flex-1 items-center gap-2 px-1 py-1.5 transition-colors"
        >
          <span className="text-ink-3/60 group-hover:text-ink-3 font-mono text-[9px] transition-colors">
            created by
          </span>
          <span className="text-ink-2 group-hover:text-ink font-mono text-[10px] font-semibold transition-colors">
            Woongbee
          </span>
          <IconExternalLink
            size={11}
            className="text-ink-3/40 group-hover:text-ink-3 ml-auto transition-colors"
          />
        </a>
      </div>
    </div>
  )
}
