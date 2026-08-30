// 두 개 이상의 트랜잭션이 시간 순서대로 실행되는 흐름을 보여주는 공통 컴포넌트

export type TxSession = {
  id: string        // 표시 이름 (예: 'Session A', 'Transaction 1')
  color: string     // tailwind text 색상 (예: 'var(--color-blue)')
  bgColor: string   // 헤더 배경 색상 (예: 'var(--color-rail)')
  borderColor: string
}

export type TxStep =
  | {
      kind: 'single'
      session: string           // TxSession.id 와 일치
      label: string
      sub?: string
      highlight?: 'error' | 'success' | 'warn'
    }
  | {
      kind: 'banner'            // 전체 폭 구분선/초기 상태 표시
      label: string
      color?: string
    }

interface Props {
  sessions: TxSession[]
  steps: TxStep[]
  resultLabel?: string          // 맨 아래 결과 요약 (빨간 배너)
  resultIsGood?: boolean        // true면 초록 배너
  width?: number
  rowHeight?: number
}

const HEADER_H = 22
const TOP_PAD = 8
const COL_W = 154
const COL_GAP = 46

function sessionX(sessions: TxSession[], id: string) {
  const idx = sessions.findIndex((s) => s.id === id)
  return TOP_PAD + idx * (COL_W + COL_GAP) + COL_W / 2
}

export function TxTimeline({
  sessions,
  steps,
  resultLabel,
  resultIsGood = false,
  rowHeight = 42,
}: Props) {
  const W = TOP_PAD * 2 + sessions.length * COL_W + (sessions.length - 1) * COL_GAP
  const timelineTop = HEADER_H + 11
  const contentTop = timelineTop + 8

  const totalRows = steps.length
  const contentH = totalRows * rowHeight
  const resultH = resultLabel ? 23 : 0
  const H = contentTop + contentH + resultH + 12

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl mx-auto block" aria-label="transaction timeline">
      {/* ── 세션 헤더 ── */}
      {sessions.map((s, i) => {
        const x = TOP_PAD + i * (COL_W + COL_GAP)
        return (
          <g key={s.id}>
            <rect x={x} y={3} width={COL_W} height={HEADER_H} rx="4"
              fill={s.bgColor} stroke={s.borderColor} strokeWidth="1" />
            <text x={x + COL_W / 2} y={17} fontSize="9" fill={s.color}
              textAnchor="middle" fontWeight="bold">{s.id}</text>
          </g>
        )
      })}

      {/* ── 세로 타임라인 ── */}
      {sessions.map((s) => {
        const cx = sessionX(sessions, s.id)
        return (
          <line key={s.id}
            x1={cx} y1={timelineTop}
            x2={cx} y2={contentTop + contentH}
            stroke={s.borderColor} strokeWidth="1.5" strokeDasharray="4,3" />
        )
      })}

      {/* ── 스텝 ── */}
      {steps.map((step, i) => {
        const y = contentTop + i * rowHeight

        if (step.kind === 'banner') {
          return (
            <g key={i}>
              <rect x={TOP_PAD} y={y + 3} width={W - TOP_PAD * 2} height={22} rx="4"
                fill="var(--color-paper-sunk)" stroke="var(--color-rail)" strokeWidth="1" />
              <text x={W / 2} y={y + 18} fontSize="8"
                fill={step.color ?? 'var(--color-ink-2)'} textAnchor="middle" fontWeight="bold">
                {step.label}
              </text>
            </g>
          )
        }

        const cx = sessionX(sessions, step.session)
        const sess = sessions.find((s) => s.id === step.session)!
        const rectX = cx - COL_W / 2
        const hasHighlight = step.highlight != null
        const rectFill = step.highlight === 'error' ? 'var(--color-rail)'
          : step.highlight === 'success' ? 'var(--color-rail)'
          : step.highlight === 'warn' ? 'var(--color-rail)'
          : 'white'
        const rectStroke = step.highlight === 'error' ? 'var(--color-red)'
          : step.highlight === 'success' ? 'var(--color-green)'
          : step.highlight === 'warn' ? 'var(--color-amber)'
          : 'var(--color-rail)'
        const dotColor = step.highlight === 'error' ? 'var(--color-red)'
          : step.highlight === 'success' ? 'var(--color-green)'
          : step.highlight === 'warn' ? 'var(--color-amber)'
          : sess.color
        const textColor = step.highlight === 'error' ? 'var(--color-red)'
          : step.highlight === 'success' ? 'var(--color-green)'
          : step.highlight === 'warn' ? 'var(--color-amber)'
          : sess.color
        const subColor = step.highlight === 'error' ? 'var(--color-red)'
          : step.highlight === 'success' ? 'var(--color-green)'
          : step.highlight === 'warn' ? 'var(--color-amber)'
          : 'var(--color-ink-2)'

        const boxH = step.sub ? 26 : 17
        const dotY = y + 9

        return (
          <g key={i}>
            <circle cx={cx} cy={dotY} r="4" fill={dotColor} />
            <rect x={rectX} y={y} width={COL_W} height={boxH} rx="3"
              fill={hasHighlight ? rectFill : 'white'}
              stroke={hasHighlight ? rectStroke : 'var(--color-rail)'}
              strokeWidth={hasHighlight ? 1.5 : 1} />
            <text x={cx} y={y + 11} fontSize="8" fill={textColor}
              textAnchor="middle" fontWeight="bold">{step.label}</text>
            {step.sub && (
              <text x={cx} y={y + 22} fontSize="7.5" fill={subColor} textAnchor="middle">
                {step.sub}
              </text>
            )}
          </g>
        )
      })}

      {/* ── 결과 배너 ── */}
      {resultLabel && (
        <g>
          <rect x={TOP_PAD} y={contentTop + contentH + 3} width={W - TOP_PAD * 2} height={20} rx="4"
            fill={resultIsGood ? 'var(--color-rail)' : 'var(--color-rail)'}
            stroke={resultIsGood ? 'var(--color-green)' : 'var(--color-red)'}
            strokeWidth="1.5" />
          <text x={W / 2} y={contentTop + contentH + 16} fontSize="8"
            fill={resultIsGood ? 'var(--color-green)' : 'var(--color-red)'}
            textAnchor="middle" fontWeight="bold">
            {resultLabel}
          </text>
        </g>
      )}
    </svg>
  )
}
