import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOOK_CHAPTERS } from './bookStructure.tsx'
import type { BookSection } from './bookStructure.tsx'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { IconChevronRight, IconChevronsLeft, IconExternalLink } from '@tabler/icons-react'

interface Props {
  activeSectionId: string
  onSelect: (sectionId: string) => void
  onToggle: () => void
}

function sectionContainsActive(section: BookSection, activeId: string): boolean {
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
  const childActive = hasChildren && section.children!.some((c) => sectionContainsActive(c, activeSectionId))
  const numLabel = [...parentNumbers, sectionIndex + 1].join('.')

  return (
    <div>
      <button
        onClick={() => {
          onSelect(section.id)
          onExpand()
        }}
        className={cn(
          'group flex w-full items-center gap-2 py-1.5 text-left transition-colors rounded-r-md',
          depth === 0 ? 'px-3' : depth === 1 ? 'px-3' : 'px-3',
          isActive
            ? 'bg-ios-orange-light text-ios-orange-dark'
            : isReady
              ? 'text-muted-foreground hover:bg-ios-orange-light/40 hover:text-ios-orange-dark'
              : 'text-muted-foreground/30 cursor-pointer',
        )}
      >
        <span className={cn(
          'shrink-0 font-mono',
          depth === 0 ? 'text-[9px]' : depth === 1 ? 'text-[8px]' : 'text-[8px]',
          isActive ? 'text-ios-orange-dark/60' : isReady ? 'text-muted-foreground/40' : 'text-muted-foreground/20',
        )}>
          {numLabel}
        </span>
        <span className={cn(
          'min-w-0 flex-1 truncate font-mono leading-tight',
          depth === 0 ? 'text-[11px]' : 'text-[10px]',
          isActive ? 'font-bold' : isReady ? 'font-medium' : 'font-normal',
        )}>
          {section.title[lang]}
        </span>
        {section.hasSimulator && (
          <span className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase',
            isActive ? 'bg-ios-orange/20 text-ios-orange-dark' : isReady ? 'bg-muted text-muted-foreground' : 'bg-muted/40 text-muted-foreground/30',
          )}>
            SIM
          </span>
        )}
        {isActive && (
          <motion.span
            layoutId="toc-active"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-ios-orange"
          />
        )}
      </button>

      {hasChildren && (isActive || childActive) && (
        <div className="ml-[1.1rem] border-l border-border/30">
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

export function TableOfContents({ activeSectionId, onSelect, onToggle }: Props) {
  const lang = useSimulationStore((s) => s.lang)
  const defaultOpen = BOOK_CHAPTERS.reduce<Record<string, boolean>>((acc, ch) => {
    acc[ch.id] = ch.sections.some((s) => sectionContainsActive(s, activeSectionId))
    return acc
  }, {})

  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>(defaultOpen)

  function toggleChapter(id: string) {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="shrink-0 flex h-[35px] items-center justify-between px-4 border-b">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {lang === 'ko' ? '목차' : 'Table of Contents'}
        </span>
        <button
          onClick={onToggle}
          title={lang === 'ko' ? '목차 닫기' : 'Close TOC'}
          className="flex items-center gap-0.5 rounded p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
        >
          <IconChevronsLeft size={14} />
        </button>
      </div>

      {/* Chapters */}
      <div className="flex flex-col py-3">
      {BOOK_CHAPTERS.map((chapter) => {
        const isOpen    = !!openChapters[chapter.id]
        const hasActive = chapter.sections.some((s) => sectionContainsActive(s, activeSectionId))
        const isReady   = chapter.num <= 3

        return (
          <div key={chapter.id} className="flex flex-col">
            {/* Chapter header row */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className={cn(
                'group flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                isReady ? 'hover:bg-muted/60' : 'hover:bg-muted/30',
                hasActive && isReady && 'bg-muted/40',
              )}
            >
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.18 }}
                className={cn('shrink-0', isReady ? 'text-muted-foreground/60' : 'text-muted-foreground/25')}
              >
                <IconChevronRight size={12} />
              </motion.span>
              <span className={cn('shrink-0 flex items-center', isReady ? '' : 'opacity-30')}>{chapter.icon}</span>
              {chapter.num > 0 && (
                <span className={cn('font-mono text-[10px] font-bold shrink-0', isReady ? 'text-muted-foreground/50' : 'text-muted-foreground/25')}>
                  {String(chapter.num).padStart(2, '0')}
                </span>
              )}
              <span
                className={cn(
                  'min-w-0 flex-1 truncate font-mono text-[11px] leading-tight transition-colors',
                  isReady
                    ? hasActive ? 'font-bold text-foreground' : 'font-bold text-foreground/80 group-hover:text-foreground'
                    : 'font-medium text-muted-foreground/30',
                )}
              >
                {chapter.title[lang]}
              </span>
              {hasActive && isReady && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ios-orange" />}
            </button>

            {/* Sections */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="sections"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="ml-[1.1rem] border-l border-border/50 pb-1">
                    {chapter.sections.map((section, idx) => (
                      <SectionItem
                        key={section.id}
                        section={section}
                        depth={0}
                        parentNumbers={[]}
                        sectionIndex={idx}
                        activeSectionId={activeSectionId}
                        isReady={isReady}
                        onSelect={onSelect}
                        onExpand={() => setOpenChapters((prev) => ({ ...prev, [chapter.id]: true }))}
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
      <div className="mt-auto flex h-[52px] items-center border-t px-4">
        <a
          href="https://woongbee.notion.site"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/60"
        >
          <span className="font-mono text-[9px] text-muted-foreground/40 transition-colors group-hover:text-muted-foreground">
            created by
          </span>
          <span className="font-mono text-[10px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
            Woongbee
          </span>
          <IconExternalLink size={11} className="ml-auto text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
        </a>
      </div>
    </div>
  )
}
