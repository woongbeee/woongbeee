// Shared UI primitives for book chapter pages — Notion style, token-driven.
// 색은 src/styles/tokens.css (§2c) 토큰만. 매핑은 src/lib/theme.tsx.
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  INFOBOX_VARIANT,
  INFOBOX_LEGACY_COLOR,
  type InfoVariant,
  type InfoColor,
} from '@/lib/theme'
import { useSimulationStore } from '@/store/simulationStore'
import { SqlHighlight } from './sql-basics/dml-more/SqlHighlight'
import { IconHammer, IconChevronDown, IconX } from '@tabler/icons-react'

const H2 = 'mt-8 mb-4 font-sans text-[1.375rem] font-semibold leading-[1.3] tracking-[-0.01em] text-ink'
const PROSE = 'mb-4 whitespace-pre-line font-read text-[15px] leading-[1.75] text-ink-2'
const CARD = 'rounded-card border border-line bg-paper'
const CALLOUT = 'mt-4 mb-4 rounded-card border border-line border-l-[3px] bg-paper-sunk px-4 py-3.5'
// 키커 라벨: 영문은 모노 대문자 eyebrow, 한글은 sans. JetBrains Mono 에 한글 글리프가
// 없어서 mono 로 두면 시스템 폰트로 폴백돼 본문(Noto Sans KR)과 따로 논다.
const CALLOUT_LABEL = 'mb-1.5 flex items-center gap-1.5 text-[10px] font-bold'
const CALLOUT_LABEL_EN = 'font-mono uppercase tracking-[0.1em]'
const CALLOUT_LABEL_KO = 'font-sans tracking-[0.02em]'
const CALLOUT_TITLE = 'mb-1 font-sans text-[13px] font-semibold text-ink'
const CALLOUT_BODY = 'font-read text-[13.5px] leading-[1.65] text-ink'

export function WipBanner() {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <div className={cn(CARD, 'mb-6 flex items-start gap-3 border-l-[3px] border-l-amber bg-paper-sunk px-4 py-3')}>
      <IconHammer size={16} className="mt-0.5 shrink-0 text-amber" />
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-amber">Work In Progress</p>
        <p className="mt-1 font-read text-[12.5px] leading-[1.6] text-ink-2">
          {lang === 'ko'
            ? '이 챕터는 아직 작성 중이에요. 내용이 불완전하거나 변경될 수 있습니다.'
            : 'This chapter is still being written. Content may be incomplete or change.'}
        </p>
      </div>
    </div>
  )
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-4xl px-8 pt-8 pb-16', className)}>{children}</div>
}

export type Lang = 'ko' | 'en'

export function ChapterTitle({ icon, title, subtitle }: { icon?: ReactNode; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {icon && <span className="shrink-0 [&_svg]:text-ink-3">{icon}</span>}
        <h1 className="text-balance font-sans text-[2rem] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
          {title}
        </h1>
      </div>
      {subtitle &&
        (typeof subtitle === 'string' ? (
          <p className="mt-3 whitespace-pre-line font-read text-[15px] leading-[1.7] text-ink-2">{subtitle}</p>
        ) : (
          <div className="mt-3 font-read text-[15px] leading-[1.7] text-ink-2">{subtitle}</div>
        ))}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className={H2}>{children}</h2>
}

export function SubTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 font-sans text-[15px] font-semibold text-ink">{children}</h3>
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(PROSE, className)}>{children}</p>
}

export function InfoBox({
  variant,
  color,
  icon,
  title,
  children,
}: {
  variant?: InfoVariant
  color?: InfoColor
  icon?: string
  title?: string
  children: ReactNode
}) {
  const lang = useSimulationStore((s) => s.lang)
  const v = variant ? INFOBOX_VARIANT[variant] : null
  const d = v ?? INFOBOX_LEGACY_COLOR[color ?? 'tip']
  const kicker = v ? v[lang] : null

  return (
    <div className={cn(CALLOUT, d.border)}>
      {kicker && (
        <div className={cn(CALLOUT_LABEL, lang === 'en' ? CALLOUT_LABEL_EN : CALLOUT_LABEL_KO, d.label)}>
          {kicker}
        </div>
      )}
      {title && (
        <div className={CALLOUT_TITLE}>
          {icon && <span className="mr-1.5">{icon}</span>}
          {title}
        </div>
      )}
      <div className={CALLOUT_BODY}>{children}</div>
    </div>
  )
}

// ── Table ────────────────────────────────────────────────────────────────────
// 개념·비교 설명용 표 (읽기 중심). 셀은 전부 font-sans — 한글 설명이 mono 로
// 깨지지 않도록. 쿼리 결과/데이터 그리드(모노스페이스)는 <ResultTable> 을 쓴다.
// 첫 열은 행 라벨로 강조. ✓/✕/일부 류 셀은 자동으로 상태색이 붙는다.

const CELL_TONE: Record<string, string> = {
  '✓': 'text-green', O: 'text-green', '○': 'text-green', 'X': 'text-red',
  '✗': 'text-red', '✕': 'text-red', '×': 'text-red',
  안전: 'text-green', 가능: 'text-green', 지원: 'text-green', 유지: 'text-green',
  불가: 'text-red', 미지원: 'text-red', 발생: 'text-red', 손실: 'text-red',
  일부: 'text-amber', 부분: 'text-amber', 제한: 'text-amber', 조건부: 'text-amber',
}
const cellTone = (s: string) => CELL_TONE[s.trim()] ?? ''

export function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mb-6 overflow-x-auto rounded-card border border-line">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line bg-rail">
            {headers.map((h, i) => (
              <th
                key={i}
                className={cn(
                  'whitespace-nowrap px-3.5 py-2.5 font-sans text-[11px] font-semibold text-ink-2',
                  i === 0 ? 'text-left' : 'text-left',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-line last:border-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'px-3.5 py-2.5 align-top font-sans leading-relaxed',
                    ci === 0 ? 'text-[12px] font-medium text-ink' : 'text-[12.5px] text-ink',
                    ci !== 0 && cellTone(cell),
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── ResultTable ──────────────────────────────────────────────────────────────
// 쿼리 결과 그리드. 모노스페이스 데이터 · # 거터 · PK/FK 뱃지 · 상태색 셀 ·
// 선택 행 · 툴바/푸터 메타 스트립. (개념 표는 <Table>)

type ResultTone = 'green' | 'amber' | 'red' | 'blue' | 'purple'

export type ResultCell =
  | string
  | number
  | null
  | { v: ReactNode; tone?: ResultTone; strong?: boolean; align?: 'left' | 'right' }

export interface ResultColumn {
  label: string
  badge?: 'PK' | 'FK'
  align?: 'left' | 'right'
  /** 선택: 컬럼 타입 힌트 서브행 (예: "NUMBER(12) NOT NULL"). */
  type?: string
}

const RESULT_TONE: Record<ResultTone, string> = {
  green: 'text-green',
  amber: 'text-amber',
  red: 'text-red',
  blue: 'text-blue',
  purple: 'text-purple',
}

const looksNumeric = (s: string) => /^-?[\d,]+(\.\d+)?%?$/.test(s.trim())

export function ResultTable({
  title,
  meta = [],
  columns,
  rows,
  selectedRow,
  footer = [],
  numbered = true,
}: {
  title?: string
  meta?: string[]
  columns: ResultColumn[]
  rows: ResultCell[][]
  selectedRow?: number
  footer?: string[]
  numbered?: boolean
}) {
  const hasToolbar = !!title || meta.length > 0
  const hasTypeRow = columns.some((c) => c.type)

  return (
    <div className="mb-6 overflow-hidden rounded-card border border-line-2">
      {hasToolbar && (
        <div className="flex items-center overflow-x-auto whitespace-nowrap border-b border-line-2 bg-rail font-mono text-[10.5px] text-ink-2">
          {title && (
            <span className="flex items-center gap-1.5 border-r border-line-2 bg-paper px-3 py-2 font-medium text-ink">
              <span className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-ink-3" />
              {title}
            </span>
          )}
          {meta.map((m, i) => (
            <span key={i} className={cn('px-3 py-2', i === meta.length - 1 && 'ml-auto')}>
              {m}
            </span>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr className="bg-rail">
              {numbered && (
                <th className="w-9 border-b border-r border-line-2 px-2 py-2 text-right font-mono text-[10px] font-bold text-ink-3">
                  #
                </th>
              )}
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    'border-b border-r border-line-2 px-3 py-2 font-mono text-[10.5px] font-bold tracking-[0.04em] text-ink-2 last:border-r-0',
                    c.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {c.label}
                  {c.badge && (
                    <span
                      className={cn(
                        'ml-1.5 rounded-[2px] px-1 py-px align-[1px] text-[8.5px] font-bold',
                        c.badge === 'PK' ? 'bg-blue/15 text-blue' : 'bg-purple/15 text-purple',
                      )}
                    >
                      {c.badge}
                    </span>
                  )}
                </th>
              ))}
            </tr>
            {hasTypeRow && (
              <tr className="bg-rail/60">
                {numbered && <td className="border-b border-r border-line-2" />}
                {columns.map((c, i) => (
                  <td
                    key={i}
                    className="border-b border-r border-line px-3 py-1 font-mono text-[9px] text-ink-3 last:border-r-0"
                  >
                    {c.type ?? ''}
                  </td>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isSel = selectedRow === ri
              return (
                <tr
                  key={ri}
                  className={cn(
                    'border-b border-line last:border-0',
                    isSel ? 'bg-blue/[0.06]' : 'hover:bg-ink/[0.03]',
                  )}
                >
                  {numbered && (
                    <td
                      className={cn(
                        'border-r border-line-2 px-2 py-1.5 text-right font-mono text-[10px] tabular-nums',
                        isSel
                          ? 'border-l-2 border-l-blue bg-blue/15 font-medium text-blue'
                          : 'bg-rail text-ink-3',
                      )}
                    >
                      {ri + 1}
                    </td>
                  )}
                  {row.map((cell, ci) => {
                    const col = columns[ci]
                    const isNull = cell === null
                    const obj = !isNull && typeof cell === 'object' ? cell : null
                    const content: ReactNode = isNull ? '(null)' : obj ? obj.v : (cell as string | number)
                    const align =
                      obj?.align ?? col?.align ?? (looksNumeric(String(content ?? '')) ? 'right' : 'left')
                    return (
                      <td
                        key={ci}
                        className={cn(
                          'border-r border-line px-3 py-1.5 font-mono text-[12px] tabular-nums last:border-r-0',
                          align === 'right' ? 'text-right' : 'text-left',
                          isNull ? 'italic text-ink-3' : 'text-ink',
                          obj?.tone && RESULT_TONE[obj.tone],
                          obj?.strong && 'font-medium',
                        )}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {footer.length > 0 && (
        <div className="flex overflow-x-auto whitespace-nowrap border-t border-line-2 bg-rail font-mono text-[10px] text-ink-2">
          {footer.map((f, i) => (
            <span
              key={i}
              className={cn('border-r border-line px-3 py-1.5', i === footer.length - 1 && 'ml-auto border-r-0')}
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function ConceptGrid({
  items,
}: {
  items: Array<{ icon: ReactNode; title: string; desc: string; color?: string }>
}) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className={cn(CARD, 'flex gap-3 p-4')}>
          <span className="shrink-0 text-xl leading-none">{item.icon}</span>
          <div>
            <div className="mb-0.5 font-sans text-[13px] font-semibold text-ink">{item.title}</div>
            <div className="font-read text-[12.5px] leading-[1.6] text-ink-2">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SimulatorPlaceholder({ label }: { label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-line-2 p-12 text-ink-3">
      <span className="text-4xl">🚧</span>
      <span className="font-mono text-sm font-semibold">{label}</span>
      <span className="font-mono text-xs text-ink-3/60">Coming soon</span>
    </div>
  )
}

export function Divider() {
  return <div className="my-8 border-t border-line" />
}

// ── StepList ──────────────────────────────────────────────────────────────────
// 순서가 있는 단계를 번호 배지 + 카드로. 배지 = 단색 (blue accent / 회색 pending).

export function StepList({
  steps,
  activeIndex,
  onStepClick,
}: {
  steps: { title: string; desc: string }[]
  activeIndex?: number
  onStepClick?: (i: number) => void
}) {
  const interactive = onStepClick !== undefined
  return (
    <div className="my-4 flex flex-col gap-3">
      {steps.map((s, i) => {
        const isActive = activeIndex === i
        const filled = isActive || !interactive
        return (
          <div
            key={i}
            onClick={() => onStepClick?.(i)}
            className={cn('flex items-start gap-3', interactive && 'cursor-pointer')}
          >
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums transition-all',
                filled ? 'bg-blue text-white' : 'bg-ink/15 text-ink-3',
              )}
            >
              {i + 1}
            </span>
            <div
              className={cn(
                'flex-1 rounded-card border px-4 py-2 transition-all',
                isActive
                  ? 'border-blue bg-blue/[0.06]'
                  : 'border-line bg-paper' + (interactive ? ' hover:border-line-2' : ''),
              )}
            >
              <p className={cn('font-sans text-[12px] font-semibold', isActive ? 'text-blue' : 'text-ink')}>
                {s.title}
              </p>
              <p className="mt-0.5 font-read text-[11px] leading-relaxed text-ink-2">{s.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── AccordionSection ──────────────────────────────────────────────────────────
export function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-line bg-paper">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors duration-150 hover:bg-ink/[0.03]"
      >
        <span className="font-sans text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</span>
        <IconChevronDown
          size={16}
          className={cn('shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <>
          <div className="border-b border-line" />
          <div className="px-5 py-5">{children}</div>
        </>
      )}
    </div>
  )
}

// ── SqlBlock ─────────────────────────────────────────────────────────────────
// header/badge/desc 가 있으면 카드형, 없으면 단순 코드 영역.
export function SqlBlock({
  sql,
  activeClause,
  badge,
  title,
  desc,
  className,
}: {
  sql: string
  activeClause?: string
  badge?: string
  badgeColor?: string
  title?: string
  desc?: string
  className?: string
}) {
  const hasHeader = badge || title || desc
  if (!hasHeader) {
    return (
      <div className={cn('overflow-x-auto rounded-card border border-line-2 bg-code-bg px-4 py-3', className)}>
        <SqlHighlight sql={sql} activeClause={activeClause} />
      </div>
    )
  }
  return (
    <div className={cn('overflow-hidden rounded-card border border-line-2', className)}>
      <div className="border-b border-line bg-rail px-4 py-2.5">
        <div className="flex items-center gap-2">
          {badge && (
            <span className="shrink-0 rounded-chip border border-line bg-paper px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.04em] text-ink-2">
              {badge}
            </span>
          )}
          {title && <p className="font-sans text-[12.5px] font-semibold text-ink">{title}</p>}
        </div>
        {desc && <p className="mt-1 font-read text-[12px] leading-relaxed text-ink-2">{desc}</p>}
      </div>
      <div className="overflow-x-auto bg-code-bg px-4 py-3">
        <SqlHighlight sql={sql} activeClause={activeClause} />
      </div>
    </div>
  )
}

// ── TermPopup ────────────────────────────────────────────────────────────────
interface TermPopupProps {
  label: string
  title: string
  open: boolean
  onOpen: () => void
  onClose: () => void
  children: ReactNode
}

export function TermPopup({ label, title, open, onOpen, onClose, children }: TermPopupProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [open, onClose])

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        onClick={() => (open ? onClose() : onOpen())}
        className="cursor-pointer font-semibold text-ink underline decoration-blue decoration-dotted underline-offset-2 transition-opacity hover:opacity-70"
      >
        {label}
      </button>

      {open && (
        <div className="absolute left-full top-1/2 z-40 ml-2.5 w-96 -translate-y-1/2">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 border-8 border-transparent border-r-line-2" />
          <div className="overflow-hidden rounded-card border border-line bg-paper shadow-lg">
            <div className="flex items-center gap-2 border-b border-line bg-rail px-4 py-3">
              <span className="font-mono text-xs font-semibold text-ink">{title}</span>
              <button
                onClick={onClose}
                className="ml-auto text-ink-3/60 transition-colors hover:text-ink"
                aria-label="닫기"
              >
                <IconX size={13} />
              </button>
            </div>
            <div className="px-4 py-3.5 font-read text-[13px] leading-relaxed text-ink-2">{children}</div>
          </div>
        </div>
      )}
    </div>
  )
}
