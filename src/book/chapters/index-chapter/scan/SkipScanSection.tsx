import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider, SqlBlock,
} from '../../shared'
import { IconPlayerSkipForward } from '@tabler/icons-react'
import { ScanDiagram } from './ScanDiagram'
import type { ScanConfig } from './ScanDiagram'

// Skip Scan: 복합 인덱스 (GENDER, SALARY)
const LEAVES = [
  { id: 'F-L1', entries: [{ key: 'F/3200', rowid: 'AAA,1,1' }, { key: 'F/4800', rowid: 'AAA,1,2' }, { key: 'F/6000', rowid: 'AAA,1,3' }] },
  { id: 'F-L2', entries: [{ key: 'F/7500', rowid: 'AAA,2,1' }, { key: 'F/9000', rowid: 'AAA,2,2' }, { key: 'F/11000', rowid: 'AAA,2,3' }] },
  { id: 'M-L1', entries: [{ key: 'M/3500', rowid: 'AAA,3,1' }, { key: 'M/5200', rowid: 'AAA,3,2' }, { key: 'M/6800', rowid: 'AAA,3,3' }] },
  { id: 'M-L2', entries: [{ key: 'M/8000', rowid: 'AAA,4,1' }, { key: 'M/9800', rowid: 'AAA,4,2' }, { key: 'M/12000', rowid: 'AAA,4,3' }] },
]

type Mode = 'idle' | 'scan'

const MATCHED_KEYS = new Set(['F/6000', 'F/7500', 'F/9000', 'F/11000', 'M/6800', 'M/8000', 'M/9800', 'M/12000'])
const SKIPPED_KEYS = new Set(['F/3200', 'F/4800', 'M/3500', 'M/5200'])

function buildConfig(mode: Mode, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    let hasMatch = false
    for (const e of leaf.entries) {
      if (mode === 'idle') {
        entryStates[leaf.id][e.key] = 'idle'
      } else if (MATCHED_KEYS.has(String(e.key))) {
        entryStates[leaf.id][e.key] = 'matched'
        hasMatch = true
      } else if (SKIPPED_KEYS.has(String(e.key))) {
        entryStates[leaf.id][e.key] = 'skipped'
      } else {
        entryStates[leaf.id][e.key] = 'idle'
      }
    }
    blockStates[leaf.id] = mode === 'idle' ? 'idle' : hasMatch ? 'matched' : 'active'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'G/SAL',
    legend: mode === 'scan' ? [
      { color: 'bg-emerald-400', label: isKo ? '조건 충족 (SALARY ≥ 6000)' : 'Matched (SALARY ≥ 6000)' },
      { color: 'bg-slate-200',   label: isKo ? '건너뜀 (SALARY < 6000)' : 'Skipped (SALARY < 6000)' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Skip Scan',
    subtitle: '복합 인덱스에서 선두 컬럼이 WHERE 절에 없어도 인덱스를 활용할 수 있는 스캔입니다. 선두 컬럼의 고유값마다 내부적으로 Range Scan을 수행합니다.',
    whatTitle: '언제 사용되나요?',
    whatDesc: '복합 인덱스(GENDER, SALARY)에서 GENDER 없이 SALARY만으로 검색할 때처럼, 선두 컬럼의 Cardinality(고유값 수)가 매우 낮을 때 옵티마이저가 선택합니다. 선두 컬럼 값이 적을수록 내부 Range Scan 횟수가 적어 효율적입니다.',
    howTitle: '작동 방식',
    step1Title: '① 선두 컬럼 고유값 파악',
    step1Desc: "옵티마이저가 통계에서 선두 컬럼(GENDER)의 고유값 목록을 파악합니다. 예: F, M — 이 값의 수가 내부 Range Scan 횟수를 결정합니다.",
    step2Title: '② 각 고유값에 대해 Range Scan 수행',
    step2Desc: "GENDER='F'인 구간에서 SALARY 조건으로 Range Scan, 그 다음 GENDER='M' 구간에서 다시 Range Scan을 수행합니다. 각 구간에서 조건을 만족하지 않는 항목은 건너뜁니다. 모든 구간의 결과를 합쳐 반환합니다.",
    sqlLabel: 'SQL 조건',
    sql: "WHERE salary >= 6000\n-- 인덱스: (gender, salary)\n-- gender 컬럼이 WHERE에 없지만 Skip Scan으로 인덱스 활용",
    showBtn: 'Skip Scan 실행',
    resetBtn: '초기화',
    traitTitle: '특징',
    traits: [
      { icon: '🎯', title: '선두 컬럼 없이도 인덱스 활용', desc: '선두 컬럼이 WHERE에 없어도 인덱스를 탈 수 있어 Full Table Scan을 피할 수 있습니다.' },
      { icon: '📉', title: '선두 컬럼 Cardinality가 낮을 때 유리', desc: "GENDER처럼 'M'/'F' 두 값만 있으면 내부 Range Scan이 2번뿐입니다. 고유값이 많을수록 오히려 비효율적입니다." },
      { icon: '⚠️', title: '고유값이 많으면 비효율', desc: '선두 컬럼 고유값이 100개라면 내부 Range Scan도 100번 수행됩니다. 이 경우 Full Table Scan이 더 나을 수 있습니다.' },
    ],
    cardinalityNote: 'Skip Scan의 효율은 선두 컬럼의 Cardinality에 반비례합니다. 고유값이 2~3개(성별, 상태 코드 등)일 때 가장 효과적이며, 고유값이 수백 개 이상이면 옵티마이저가 Skip Scan 대신 Full Table Scan을 선택하는 경우가 많습니다.',
    hintTitle: 'Index Skip Scan이 쓰이는 때',
    hintNote: '선두 컬럼이 WHERE 절에 없어도 해당 컬럼의 고유값 수(Cardinality)가 매우 적을 때 옵티마이저가 자동으로 선택합니다. INDEX_SS 힌트로 강제할 수 있습니다.',
    examples: [
      { badge: '선두 컬럼 없는 검색', badgeColor: 'violet' as const,
        desc: "복합 인덱스 (gender, salary)에서 gender 없이 salary만 검색할 때, 오라클은 gender의 고유값(M, F)을 통계에서 파악해 'gender=F이면서 salary≥6000'과 'gender=M이면서 salary≥6000'을 각각 Range Scan합니다. 내부적으로 2번의 Range Scan으로 전체 결과를 얻습니다.",
        sql: `-- 인덱스: IDX_EMP_GENDER_SAL (gender, salary)\nSELECT * FROM employees\nWHERE salary >= 6000;\n-- gender 없어도 Skip Scan 동작\n-- 내부: gender=F 구간 Range Scan\n--       gender=M 구간 Range Scan (총 2회)\n-- 실행 계획: INDEX SKIP SCAN` },
      { badge: '상태 코드 + 날짜', badgeColor: 'violet' as const,
        desc: "상태 코드(ACTIVE/INACTIVE)처럼 고유값이 2개인 컬럼이 선두인 복합 인덱스에서 두 번째 컬럼만 검색하면 내부 Range Scan이 2회만 발생합니다. 이 경우 Full Table Scan보다 훨씬 효율적입니다.",
        sql: `-- 인덱스: IDX_EMP_STATUS_DATE (status, hire_date)\nSELECT * FROM employees\nWHERE hire_date >= DATE '2022-01-01';\n-- status 고유값: ACTIVE, INACTIVE (2개)\n-- status=ACTIVE 구간 Range Scan\n-- status=INACTIVE 구간 Range Scan\n-- 총 2회로 결과 수집` },
      { badge: 'INDEX_SS 힌트', badgeColor: 'blue' as const,
        desc: '옵티마이저가 통계 부재나 선택도 추정 오류로 Full Table Scan을 선택했을 때 Skip Scan을 강제합니다. 선두 컬럼 고유값이 적고 비선두 컬럼 조건의 선택도가 높을 때 유효합니다.',
        sql: `SELECT /*+ INDEX_SS(e IDX_EMP_GENDER_SAL) */ *\nFROM employees e\nWHERE salary BETWEEN 5000 AND 8000;\n-- 옵티마이저가 Full Table Scan 선택했을 때\n-- Skip Scan 강제 — gender 고유값이 적을 때 유효` },
      { badge: '⚠️ Skip Scan 비효율 케이스', badgeColor: 'amber' as const,
        desc: '선두 컬럼 고유값이 많을수록 내부 Range Scan 횟수가 그만큼 늘어납니다. department_id가 27개이면 Range Scan이 27번 수행됩니다. 이 경우 인덱스 탐색 오버헤드가 Full Table Scan의 순차 읽기보다 오히려 느려질 수 있습니다.',
        sql: `-- 인덱스: IDX_EMP_DEPT_SAL (department_id, salary)\n-- department_id 고유값 27개\nSELECT * FROM employees\nWHERE salary >= 6000;\n-- 내부 Range Scan 27회 발생\n-- 오버헤드 > Full Table Scan 이득\n-- → 옵티마이저가 Full Table Scan 선택` },
    ],
  },
  en: {
    title: 'Index Skip Scan',
    subtitle: 'Allows Oracle to use a composite index even when the leading column is absent from the WHERE clause. Internally performs a Range Scan for each distinct value of the leading column.',
    whatTitle: 'When is it used?',
    whatDesc: "The optimizer chooses Skip Scan when the leading column's cardinality (number of distinct values) is very low — for example, searching only on SALARY in a (GENDER, SALARY) composite index. The fewer distinct values the leading column has, the fewer internal Range Scans are needed.",
    howTitle: 'How it works',
    step1Title: '① Identify distinct values of the leading column',
    step1Desc: "The optimizer reads the leading column's (GENDER) distinct values from statistics — e.g., F and M. The number of distinct values directly determines how many internal Range Scans will be performed.",
    step2Title: '② Perform a Range Scan for each distinct value',
    step2Desc: "Oracle runs a Range Scan within the GENDER='F' segment using the SALARY predicate, then another within GENDER='M'. Entries that do not satisfy the SALARY condition are skipped within each segment. Results from all segments are merged and returned.",
    sqlLabel: 'SQL condition',
    sql: "WHERE salary >= 6000\n-- Index: (gender, salary)\n-- 'gender' absent from WHERE, but Skip Scan still uses the index",
    showBtn: 'Run Skip Scan',
    resetBtn: 'Reset',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '🎯', title: 'Uses index without leading column', desc: 'The index can be used even when the leading column is missing from the predicate, avoiding a full table scan.' },
      { icon: '📉', title: 'Best with low leading-column cardinality', desc: "With only 'M'/'F', just two Range Scans are needed. More distinct values means more scans and less efficiency." },
      { icon: '⚠️', title: 'Inefficient with high cardinality', desc: 'If the leading column has 100 distinct values, 100 Range Scans are performed. A Full Table Scan is often faster in that case.' },
    ],
    cardinalityNote: "Skip Scan efficiency is inversely proportional to the leading column's cardinality. It works best when the leading column has only 2–3 distinct values (gender, status codes). With hundreds of distinct values the optimizer usually prefers a Full Table Scan.",
    hintTitle: 'When Index Skip Scan Is Chosen',
    hintNote: 'Skip Scan is chosen automatically when the leading column is absent and its cardinality is very low. Use INDEX_SS to force it when the optimizer picks a Full Table Scan instead.',
    examples: [
      { badge: 'No leading column', badgeColor: 'violet' as const,
        desc: "With a composite index on (gender, salary), Oracle looks up gender's distinct values (M, F) from statistics and internally runs 'gender=F AND salary≥6000' and 'gender=M AND salary≥6000' as two separate Range Scans. The result is correct even though gender is not in the WHERE clause.",
        sql: `-- Index: IDX_EMP_GENDER_SAL (gender, salary)\nSELECT * FROM employees\nWHERE salary >= 6000;\n-- gender absent, but Skip Scan still works\n-- Internal: Range Scan for gender=F segment\n--           Range Scan for gender=M segment\n-- Plan: INDEX SKIP SCAN` },
      { badge: 'Status + date', badgeColor: 'violet' as const,
        desc: "A status code column with only 2 distinct values (ACTIVE / INACTIVE) is the ideal leading column for Skip Scan. Oracle performs exactly 2 internal Range Scans — one per status value — making it far cheaper than a Full Table Scan for selective date queries.",
        sql: `-- Index: IDX_EMP_STATUS_DATE (status, hire_date)\nSELECT * FROM employees\nWHERE hire_date >= DATE '2022-01-01';\n-- status: ACTIVE, INACTIVE (2 distinct values)\n-- Range Scan for ACTIVE segment\n-- Range Scan for INACTIVE segment\n-- Only 2 scans needed` },
      { badge: 'INDEX_SS hint', badgeColor: 'blue' as const,
        desc: 'Forces Skip Scan when the optimizer chose Full Table Scan, often because statistics are stale or cardinality estimates are off. Effective when the leading column cardinality is genuinely low and the non-leading predicate is selective.',
        sql: `SELECT /*+ INDEX_SS(e IDX_EMP_GENDER_SAL) */ *\nFROM employees e\nWHERE salary BETWEEN 5000 AND 8000;\n-- Forces Skip Scan over Full Table Scan\n-- Best when leading column has few distinct values` },
      { badge: '⚠️ Skip Scan is inefficient', badgeColor: 'amber' as const,
        desc: 'Each distinct value of the leading column requires one internal Range Scan. With 27 department IDs, Oracle performs 27 Range Scans. The cumulative overhead of 27 tree traversals often exceeds the cost of a single sequential Full Table Scan.',
        sql: `-- Index: IDX_EMP_DEPT_SAL (department_id, salary)\n-- department_id: 27 distinct values\nSELECT * FROM employees\nWHERE salary >= 6000;\n-- 27 internal Range Scans → high overhead\n-- Optimizer prefers Full Table Scan instead` },
    ],
  },
}

export function SkipScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [mode, setMode] = useState<Mode>('idle')
  const config = buildConfig(mode, isKo)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconPlayerSkipForward size={36} color="#7c3aed" stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>

      <div className="mb-4 flex items-stretch gap-3">
        <div className="flex flex-col items-center">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 font-mono text-[11px] font-bold text-white">1</div>
          <div className="mt-1 flex-1 border-l-2 border-dashed border-amber-300" />
        </div>
        <div className="pb-2">
          <p className="mb-0.5 font-mono text-[11px] font-bold text-amber-700">{t.step1Title}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.step1Desc}</p>
        </div>
      </div>

      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-400 font-mono text-[11px] font-bold text-white">2</div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] font-bold text-violet-700">{t.step2Title}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.step2Desc}</p>
        </div>
      </div>

      <div className="mb-3 rounded-lg border bg-slate-900 px-3 py-2">
        <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.sqlLabel}</p>
        <pre className="font-mono text-[11px] leading-relaxed text-slate-300">{t.sql}</pre>
      </div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode(mode === 'scan' ? 'idle' : 'scan')}
          className={[
            'rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all',
            mode === 'scan'
              ? 'border-violet-400 bg-violet-100 text-violet-800 shadow-sm'
              : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground',
          ].join(' ')}
        >
          {mode === 'scan' ? t.resetBtn : t.showBtn}
        </button>
      </div>
      <ScanDiagram config={config} title={isKo ? '(GENDER, SALARY) 복합 인덱스 Leaf 블록' : '(GENDER, SALARY) Composite Index Leaf Blocks'} />

      <Divider />

      <SectionTitle>{t.traitTitle}</SectionTitle>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {t.traits.map((tr, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="mb-2 text-lg">{tr.icon}</div>
            <div className="mb-1 text-xs font-bold">{tr.title}</div>
            <p className="text-[11px] leading-snug text-muted-foreground">{tr.desc}</p>
          </div>
        ))}
      </div>
      <InfoBox variant="warning">{t.cardinalityNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <Prose>{t.hintNote}</Prose>
      <div className="mt-4 grid gap-3">
        {t.examples.map((ex, i) => (
          <SqlBlock key={i} badge={ex.badge} badgeColor={ex.badgeColor} desc={ex.desc} sql={ex.sql} />
        ))}
      </div>
    </PageContainer>
  )
}
