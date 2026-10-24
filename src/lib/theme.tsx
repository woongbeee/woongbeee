// ============================================================================
// theme.tsx — 디자인 토큰의 유일한 TypeScript 매핑 지점
//
// 색(hex)·폰트 원본 값은 여기에 두지 않는다 → src/styles/tokens.css.
// 이 파일은 그 토큰을 가리키는 Tailwind 클래스 / var(--…) 문자열 "매핑"만:
//   · InfoBox variant → 좌측선·라벨 색 + ko/en 라벨 (INFOBOX_VARIANT / INFOBOX_LEGACY_COLOR)
//   · 다이어그램·코드 색 (DIAGRAM / DATA_PALETTE / CODE)
//   · AccentColor — 챕터 색 키 타입 (bookStructure.tsx 의 chapter.color)
//
// 컴포넌트 파일에 색상 맵(Record<…, {bg,text,border}>)을 새로 만들지 말고 여기서 import.
// 이 파일에 `#rrggbb` 리터럴이 있으면 버그다 (2026-08-30 기준 0개).
// ============================================================================

// ── 챕터 / 액센트 색 (레거시) ────────────────────────────────────────────────
// bookStructure.tsx 의 chapter.color 키. 클래스 세트는 Phase 3 에서 토큰 기반으로 재정의.

export type AccentColor =
  | 'blue'
  | 'violet'
  | 'emerald'
  | 'orange'
  | 'cyan'
  | 'rose'
  | 'amber'
  | 'teal'
  | 'brand-pink'
  | 'brand-navy'
  | 'brand-teal'
  | 'brand-orange'
  | 'brand-salmon'

// ── InfoBox variant ──────────────────────────────────────────────────────────
// shared.tsx <InfoBox> 가 참조. Notion 콜아웃 = 좌측 3px 색선 + mono 색 라벨(배경 없음).

export type InfoVariant =
  | 'tip'
  | 'note'
  | 'warning'
  | 'usage'
  | 'summary'
  | 'danger'
/** 구버전 <InfoBox color=…> 경로용. */
export type InfoColor = 'info' | 'tip' | 'warning' | 'danger'

export interface InfoVariantDef {
  /** 좌측 border 색 클래스 (border-l-*). */
  border: string
  /** 라벨 텍스트 색 클래스 (text-*). */
  label: string
  ko: string
  en: string
}

export const INFOBOX_VARIANT: Record<InfoVariant, InfoVariantDef> = {
  tip: {
    border: 'border-l-blue',
    label: 'text-blue',
    ko: '더 알아보기',
    en: 'Advanced',
  },
  note: {
    border: 'border-l-slate',
    label: 'text-slate',
    ko: '참고',
    en: 'Note',
  },
  warning: {
    border: 'border-l-amber',
    label: 'text-amber',
    ko: '주의',
    en: 'Caution',
  },
  usage: {
    border: 'border-l-green',
    label: 'text-green',
    ko: '어디서 사용할까?',
    en: 'When to Use',
  },
  summary: {
    border: 'border-l-slate',
    label: 'text-slate',
    ko: '핵심 정리',
    en: 'Summary',
  },
  danger: {
    border: 'border-l-red',
    label: 'text-red',
    ko: '위험',
    en: 'Danger',
  },
}

/** 구버전 <InfoBox color=…> 경로. */
export const INFOBOX_LEGACY_COLOR: Record<
  InfoColor,
  Pick<InfoVariantDef, 'border' | 'label'>
> = {
  info: { border: 'border-l-blue', label: 'text-blue' },
  tip: { border: 'border-l-blue', label: 'text-blue' },
  warning: { border: 'border-l-amber', label: 'text-amber' },
  danger: { border: 'border-l-red', label: 'text-red' },
}

// ── 다이어그램(SVG) 색 ───────────────────────────────────────────────────────
// SVG fill/stroke, inline style 에 그대로 넣는 var(--color-*) 문자열.
// tokens.css §2c 와 이름이 일치한다 (테마 따라 자동 스왑). Phase 3에서 각
// 다이어그램 파일의 하드코딩 hex를 이것으로 치환한다.

/** 오퍼레이션/계열 구분용 — 채도 높은 확정색 순환 (teal·파스텔 없음). */
export const DATA_PALETTE = [
  'var(--color-blue)',
  'var(--color-green)',
  'var(--color-amber)',
  'var(--color-purple)',
  'var(--color-red)',
  'var(--color-slate)',
] as const

/** 셸/구조 색. */
export const DIAGRAM = {
  paper: 'var(--color-paper)',
  paperSunk: 'var(--color-paper-sunk)',
  rail: 'var(--color-rail)',
  line: 'var(--color-line)',
  line2: 'var(--color-line-2)',
  ink: 'var(--color-ink)',
  ink2: 'var(--color-ink-2)',
  ink3: 'var(--color-ink-3)',
  accent: 'var(--color-accent)',
  blue: 'var(--color-blue)',
  green: 'var(--color-green)',
  red: 'var(--color-red)',
  amber: 'var(--color-amber)',
  purple: 'var(--color-purple)',
  slate: 'var(--color-slate)',
} as const

/** 코드 블록 색 — 함몰된 웜 그레이 배경 + 확정색 문법 강조. */
export const CODE = {
  bg: 'var(--color-code-bg)',
  border: 'var(--color-code-border)',
  fg: 'var(--color-ink)',
  bar: 'var(--color-rail)',
  keyword: 'var(--color-sy-kw)',
  fn: 'var(--color-sy-fn)',
  string: 'var(--color-sy-str)',
  number: 'var(--color-sy-num)',
  comment: 'var(--color-sy-com)',
  error: 'var(--color-red)',
} as const
