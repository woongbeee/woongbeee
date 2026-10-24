import { lazy, memo, Suspense, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLangStore } from '@/store/simulationStore'
import { getAdjacentSections, getSectionById } from './bookStructure.tsx'
import { cn } from '@/lib/utils'
import {
  IconArrowLeft,
  IconArrowRight,
  IconChevronRight,
} from '@tabler/icons-react'

// Chapter pages — 챕터별 청크로 지연 로드 (named export → lazy 용 default 로 감쌈)
const IntroductionPage = lazy(() => import('./chapters/introduction/IntroductionPage').then((m) => ({ default: m.IntroductionPage })))
const DataModelingPage = lazy(() => import('./chapters/data-modeling').then((m) => ({ default: m.DataModelingPage })))
const SqlBasicsPage = lazy(() => import('./chapters/sql-basics').then((m) => ({ default: m.SqlBasicsPage })))
const InternalsPage = lazy(() => import('./chapters/internals').then((m) => ({ default: m.InternalsPage })))
const JoinPage = lazy(() => import('./chapters/join').then((m) => ({ default: m.JoinPage })))
const IndexChapterPage = lazy(() => import('./chapters/index-chapter').then((m) => ({ default: m.IndexChapterPage })))
const PartitionPage = lazy(() => import('./chapters/partition').then((m) => ({ default: m.PartitionPage })))
const ParallelPage = lazy(() => import('./chapters/parallel').then((m) => ({ default: m.ParallelPage })))
const OptimizerChapterPage = lazy(() => import('./chapters/optimizer').then((m) => ({ default: m.OptimizerChapterPage })))
const QueryTransformPage = lazy(() => import('./chapters/query-transform').then((m) => ({ default: m.QueryTransformPage })))
const SortPage = lazy(() => import('./chapters/sort').then((m) => ({ default: m.SortPage })))
const SqlTuningOverviewPage = lazy(() => import('./chapters/sql-tuning/SqlTuningOverviewPage').then((m) => ({ default: m.SqlTuningOverviewPage })))
const QueryTransformLandingPage = lazy(() => import('./chapters/sql-tuning/QueryTransformLandingPage').then((m) => ({ default: m.QueryTransformLandingPage })))
const SortLandingPage = lazy(() => import('./chapters/sql-tuning/SortLandingPage').then((m) => ({ default: m.SortLandingPage })))

interface Props {
  sectionId: string
  onNavigate: (sectionId: string) => void
}

export const BookContent = memo(function BookContent({
  sectionId,
  onNavigate,
}: Props) {
  const lang = useLangStore((s) => s.lang)
  const info = getSectionById(sectionId)
  const adjacent = getAdjacentSections(sectionId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [sectionId])

  if (!info) return null

  const { chapter } = info

  return (
    <div className="bg-paper flex h-full flex-col overflow-hidden">
      {/* Breadcrumb — mono chrome */}
      <div className="border-line bg-rail flex h-11 shrink-0 items-center gap-1.5 border-b px-6">
        <span className="text-ink-2 [&_svg]:text-ink-3 flex items-center gap-1.5 font-mono text-[10px] font-medium [&_svg]:size-3.5">
          {chapter.icon}
          {chapter.num > 0
            ? `${chapter.num.toString().padStart(2, '0')}.`
            : ''}{' '}
          {chapter.title[lang]}
        </span>
        <IconChevronRight size={11} className="text-ink-3/50" />
        <span className="text-ink-3 font-mono text-[10px]">
          {info.section.title[lang]}
        </span>
      </div>

      {/* Content area */}
      <div
        ref={scrollRef}
        className={cn(
          'bg-paper-sunk text-ink min-h-0 flex-1',
          sectionId === 'optimizer-simulator'
            ? 'overflow-hidden'
            : 'overflow-x-hidden overflow-y-auto'
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={sectionId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <Suspense fallback={null}>
              <SectionRouter sectionId={sectionId} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next navigation — mono chrome */}
      <div className="border-line bg-paper flex h-[52px] shrink-0 items-center justify-between border-t px-6">
        <div className="flex-1">
          {adjacent.prev && (
            <button
              onClick={() => onNavigate(adjacent.prev!.section.id)}
              className="group flex items-center gap-2 text-left"
            >
              <IconArrowLeft
                size={14}
                className="text-ink-3 group-hover:text-ink transition-colors"
              />
              <div className="flex flex-col">
                <span className="text-ink-3/60 font-mono text-[9px] tracking-widest uppercase">
                  {lang === 'ko' ? '이전' : 'Previous'}
                </span>
                <span className="text-ink-2 group-hover:text-ink font-mono text-xs transition-colors">
                  {adjacent.prev.section.title[lang]}
                </span>
              </div>
            </button>
          )}
        </div>

        <div className="flex-1 text-right">
          {adjacent.next && (
            <button
              onClick={() => onNavigate(adjacent.next!.section.id)}
              className="group ml-auto flex items-center justify-end gap-2 text-right"
            >
              <div className="flex flex-col">
                <span className="text-ink-3/60 font-mono text-[9px] tracking-widest uppercase">
                  {lang === 'ko' ? '다음' : 'Next'}
                </span>
                <span className="text-ink-2 group-hover:text-ink font-mono text-xs transition-colors">
                  {adjacent.next.section.title[lang]}
                </span>
              </div>
              <IconArrowRight
                size={14}
                className="text-ink-3 group-hover:text-ink transition-colors"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

// Route each sectionId to the right chapter page component
function SectionRouter({ sectionId }: { sectionId: string }) {
  if (sectionId.startsWith('intro-')) return <IntroductionPage />
  if (sectionId.startsWith('dm-'))
    return <DataModelingPage sectionId={sectionId} />
  if (sectionId.startsWith('sql-basics-'))
    return <SqlBasicsPage sectionId={sectionId} />
  if (sectionId.startsWith('internals-'))
    return <InternalsPage sectionId={sectionId} />
  if (sectionId.startsWith('join-')) return <JoinPage sectionId={sectionId} />
  if (sectionId.startsWith('index-'))
    return <IndexChapterPage sectionId={sectionId} />
  if (sectionId.startsWith('partition-'))
    return <PartitionPage sectionId={sectionId} />
  if (sectionId.startsWith('parallel-'))
    return <ParallelPage sectionId={sectionId} />
  if (sectionId.startsWith('optimizer-'))
    return <OptimizerChapterPage sectionId={sectionId} />
  // sql-tuning 챕터: qt-*/sort-* 하위 섹션은 각자 라우터로, 그룹 헤더(부모 노드)는 랜딩 페이지로
  if (sectionId.startsWith('qt-'))
    return <QueryTransformPage sectionId={sectionId} />
  if (sectionId.startsWith('sort-')) return <SortPage sectionId={sectionId} />
  if (sectionId === 'sql-tuning-query-transform')
    return <QueryTransformLandingPage />
  if (sectionId === 'sql-tuning-sort') return <SortLandingPage />
  if (sectionId.startsWith('sql-tuning-')) return <SqlTuningOverviewPage />
  return null
}
