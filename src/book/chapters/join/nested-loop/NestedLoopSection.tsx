import { useState } from 'react'
import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: 'Nested Loop Join',
    subtitle: 'Outer 테이블의 각 행마다 Inner 테이블을 반복 탐색하는 조인이에요. Inner 테이블에 선택도 높은 인덱스가 있을 때 가장 효율적이에요.',

    whatTitle: 'Nested Loop Join이란?',
    whatDesc:
      'Nested Loop Join은 이중 FOR 루프로 동작해요. 외부 루프는 outer table(driving table)에서 행을 하나씩 가져오고, 내부 루프는 가져온 행의 조인 키를 사용해 inner table에서 일치하는 행을 찾아요.\n\nInner 테이블에 조인 조건을 만족하는 인덱스가 있으면 각 내부 루프 반복에서 인덱스 탐색만으로 끝나므로 매우 효율적이에요. Outer 행 하나당 Inner 테이블을 처음부터 다시 읽는 게 아니라, 인덱스로 바로 접근해요.',

    pseudoTitle: '동작 원리 (의사 코드)',
    pseudoDesc: '다음 의사 코드처럼 동작해요.',
    pseudoSql: `FOR each row erow IN outer_table LOOP
  FOR each row drow IN inner_table
    WHERE inner_table.join_key = erow.join_key LOOP
      output joined row (erow, drow)
  END LOOP
END LOOP`,

    simTitle: 'Nested Loop 시뮬레이션',
    simOuter: 'Outer 테이블',
    simInner: 'Inner 테이블',
    simMatch: '현재 매칭',
    simPrev: '이전',
    simNext: '다음',
    simReset: '리셋',
    simDone: '완료',

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Nested Loop Join 강제 (d를 inner로)
SELECT /*+ USE_NL(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 특정 인덱스를 사용하는 Nested Loop 강제
SELECT /*+ USE_NL_WITH_INDEX(d dept_id_pk) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Nested Loop 방지
SELECT /*+ NO_USE_NL(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,

    summaryTitle: 'Nested Loop Join 핵심 정리',
    summaryItems: [
      'Outer 행마다 Inner 테이블을 반복 탐색해요 — Inner 인덱스가 없으면 비효율적이에요.',
      'Inner 테이블에 선택도 높은 인덱스가 있을 때 가장 효율적이에요.',
      '힌트: USE_NL(테이블) (강제), USE_NL_WITH_INDEX(테이블 인덱스), NO_USE_NL(테이블) (방지).',
    ],
  },
  en: {
    title: 'Nested Loop Join',
    subtitle: 'For each row in the outer table, Oracle probes the inner table for matching rows — most efficient when the inner table has a highly selective index.',

    whatTitle: 'What Is a Nested Loop Join?',
    whatDesc:
      'A Nested Loop Join operates as two nested FOR loops. The outer loop fetches rows one by one from the outer (driving) table; the inner loop uses the join key from each fetched row to look up matching rows in the inner table.\n\nWhen the inner table has an index that satisfies the join condition, each inner loop iteration is just an index lookup — Oracle does not restart a full scan from the beginning for every outer row.',

    pseudoTitle: 'How It Works (Pseudocode)',
    pseudoDesc: 'The algorithm operates as follows.',
    pseudoSql: `FOR each row erow IN outer_table LOOP
  FOR each row drow IN inner_table
    WHERE inner_table.join_key = erow.join_key LOOP
      output joined row (erow, drow)
  END LOOP
END LOOP`,

    simTitle: 'Nested Loop Simulation',
    simOuter: 'Outer Table',
    simInner: 'Inner Table',
    simMatch: 'Current Match',
    simPrev: 'Prev',
    simNext: 'Next',
    simReset: 'Reset',
    simDone: 'Done',

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Nested Loop Join (d as inner table)
SELECT /*+ USE_NL(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Force Nested Loop with a specific index
SELECT /*+ USE_NL_WITH_INDEX(d dept_id_pk) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress Nested Loop Join
SELECT /*+ NO_USE_NL(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,

    summaryTitle: 'Nested Loop Join Key Takeaways',
    summaryItems: [
      'Probes the inner table once per outer row — inefficient without an index on the inner table.',
      'Most efficient when the inner table has a highly selective index on the join column.',
      'Hints: USE_NL(table) (force), USE_NL_WITH_INDEX(table index), NO_USE_NL(table) (suppress).',
    ],
  },
}

function NLSimulation({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const outerRows = [
    { id: 'E10', dept: 10 },
    { id: 'E20', dept: 20 },
    { id: 'E30', dept: 30 },
  ]
  const innerRows = [
    { id: 'D10', dept: 10 },
    { id: 'D20', dept: 20 },
    { id: 'D30', dept: 30 },
  ]
  const [step, setStep] = useState(0)
  const maxStep = outerRows.length
  const outerIdx = step < maxStep ? step : maxStep - 1
  const matchInner = innerRows.find((r) => r.dept === outerRows[outerIdx]?.dept)

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {t.simTitle}
      </p>
      <div className="flex flex-wrap gap-6 mb-5">
        <div>
          <p className="mb-2 font-mono text-[10px] text-muted-foreground">{t.simOuter}</p>
          <div className="flex flex-col gap-1.5">
            {outerRows.map((r, i) => (
              <div
                key={r.id}
                className={cn(
                  'rounded-lg border px-4 py-2 font-mono text-xs transition-all',
                  step < maxStep && i === outerIdx
                    ? 'border-blue-400 bg-blue-100 font-bold text-blue-800'
                    : step >= maxStep && i === outerIdx
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-border bg-card text-muted-foreground',
                )}
              >
                {r.id} <span className="text-[10px] opacity-60">dept={r.dept}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center text-2xl text-muted-foreground/30">→</div>

        <div>
          <p className="mb-2 font-mono text-[10px] text-muted-foreground">{t.simInner}</p>
          <div className="flex flex-col gap-1.5">
            {innerRows.map((r) => (
              <div
                key={r.id}
                className={cn(
                  'rounded-lg border px-4 py-2 font-mono text-xs transition-all',
                  step < maxStep && r.dept === outerRows[outerIdx]?.dept
                    ? 'border-orange-400 bg-orange-100 font-bold text-orange-800'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {r.id} <span className="text-[10px] opacity-60">dept={r.dept}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-1.5">
          <p className="font-mono text-[10px] text-muted-foreground">{t.simMatch}</p>
          <div
            className={cn(
              'rounded-lg border px-4 py-2 font-mono text-xs min-w-[140px]',
              step >= maxStep
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : matchInner
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-100 text-muted-foreground',
            )}
          >
            {step >= maxStep
              ? `✓ ${t.simDone}`
              : matchInner
                ? `✓ ${outerRows[outerIdx].id} ↔ ${matchInner.id}`
                : `✗ no match`}
          </div>
          <p className="font-mono text-[9px] text-muted-foreground">
            {lang === 'ko' ? `${Math.min(step + 1, maxStep)} / ${maxStep} 반복` : `Iteration ${Math.min(step + 1, maxStep)} / ${maxStep}`}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { label: `← ${t.simPrev}`, onClick: () => setStep((s) => Math.max(0, s - 1)), disabled: step === 0 },
          { label: `${t.simNext} →`, onClick: () => setStep((s) => Math.min(maxStep, s + 1)), disabled: step >= maxStep },
          { label: `↺ ${t.simReset}`, onClick: () => setStep(0), disabled: false },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className="rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function JoinNestedLoopSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.pseudoTitle}</SectionTitle>
      <Prose>{t.pseudoDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.pseudoSql} />
      </div>

      <Divider />

      <SectionTitle>{t.simTitle}</SectionTitle>
      <NLSimulation lang={lang} />

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">
          <ul className="list-none space-y-1">
            {t.summaryItems.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
