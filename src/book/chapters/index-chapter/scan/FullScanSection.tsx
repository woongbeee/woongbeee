import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider, SqlBlock,
} from '../../shared'
import { IconScanEye } from '@tabler/icons-react'
import { ScanDiagram } from './ScanDiagram'
import type { ScanConfig } from './ScanDiagram'

const LEAVES = [
  { id: 'L1', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 102, rowid: 'AAA,1,2' }, { key: 105, rowid: 'AAA,1,3' }] },
  { id: 'L2', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
  { id: 'L3', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 124, rowid: 'AAA,3,2' }, { key: 128, rowid: 'AAA,3,3' }] },
  { id: 'L4', entries: [{ key: 135, rowid: 'AAA,4,1' }, { key: 141, rowid: 'AAA,4,2' }, { key: 149, rowid: 'AAA,4,3' }] },
  { id: 'L5', entries: [{ key: 155, rowid: 'AAA,5,1' }, { key: 160, rowid: 'AAA,5,2' }, { key: 166, rowid: 'AAA,5,3' }] },
]

type Mode = 'full' | 'idle'

function buildConfig(mode: Mode, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    for (const e of leaf.entries) {
      entryStates[leaf.id][e.key] = mode === 'full' ? 'visited' : 'idle'
    }
    blockStates[leaf.id] = mode === 'full' ? 'active' : 'idle'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'EMP_ID',
    legend: mode === 'full' ? [
      { color: 'bg-blue-400', label: isKo ? '방문 (정렬 순 읽기)' : 'Visited (sorted order)' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Full Scan',
    subtitle: '인덱스의 모든 Leaf 블록을 처음부터 끝까지 순서대로 읽습니다. 테이블 풀 스캔 대신 인덱스만 읽어 I/O를 줄이거나, 정렬된 결과를 보장할 때 사용합니다.',
    whatTitle: '언제 사용되나요?',
    whatDesc: '인덱스 컬럼만으로 결과를 만들 수 있을 때(Covering Index), 또는 ORDER BY 절의 컬럼이 인덱스와 일치해 별도 정렬 없이 결과를 돌려줄 수 있을 때 옵티마이저가 선택합니다. WHERE 조건 없이 전체 인덱스를 읽어야 할 때도 사용됩니다.',
    howTitle: '작동 방식',
    step1Title: '① Root에서 가장 왼쪽 Leaf 탐색',
    step1Desc: '트리를 따라 내려가 첫 번째(가장 작은) Leaf 블록을 찾습니다. 이 수직 탐색은 트리 깊이만큼(보통 3~4번) 블록을 읽습니다.',
    step2Title: '② 모든 Leaf를 순서대로 읽기 (단일 블록 I/O)',
    step2Desc: '오른쪽 포인터를 따라 마지막 Leaf까지 한 블록씩 읽습니다. 키값 순으로 읽으므로 결과가 정렬되어 나옵니다. Fast Full Scan과 달리 한 번에 1블록씩 읽는 단일 블록 I/O를 사용합니다.',
    diagramTitle: 'Full Scan 시각화',
    showBtn: '전체 스캔 표시',
    hideBtn: '초기화',
    traitTitle: '특징',
    traits: [
      { icon: '📋', title: '결과가 정렬됨', desc: 'Leaf를 키값 순서대로 읽으므로 결과가 정렬되어 나옵니다. ORDER BY 절이 있을 때 추가 정렬 없이 결과를 반환할 수 있습니다.' },
      { icon: '🔍', title: '테이블 블록 접근 최소화', desc: '인덱스 컬럼만 SELECT할 경우 테이블 블록을 전혀 읽지 않아도 됩니다(Index-Only Scan).' },
      { icon: '🐢', title: 'Fast Full Scan보다 느림', desc: '단일 블록 I/O를 사용하므로 같은 양의 데이터를 읽을 때 Fast Full Scan보다 느립니다.' },
    ],
    vsNote: 'Full Scan과 Fast Full Scan의 핵심 차이: Full Scan은 Leaf를 순서대로 1블록씩 읽어 정렬을 보장하지만, Fast Full Scan은 멀티블록 I/O로 더 빠르게 읽되 정렬을 보장하지 않습니다.',
    hintTitle: 'Index Full Scan이 쓰이는 때',
    hintNote: 'Leaf를 순서대로 읽기 때문에 정렬이 보장됩니다. SELECT 컬럼이 모두 인덱스에 있거나(Covering Index), ORDER BY 절이 인덱스 순서와 일치할 때 옵티마이저가 선택합니다.',
    examples: [
      { badge: 'ORDER BY 최적화', badgeColor: 'violet' as const,
        desc: 'ORDER BY 컬럼이 인덱스와 일치하면 인덱스 자체가 이미 정렬되어 있으므로 별도의 Sort 단계가 필요 없습니다. 오라클은 가장 왼쪽 Leaf부터 오른쪽으로 순서대로 읽어 결과를 정렬 없이 반환합니다.',
        sql: `SELECT employee_id, last_name\nFROM employees\nORDER BY employee_id;\n-- PK 인덱스가 employee_id 순으로 이미 정렬됨\n-- 별도 SORT ORDER BY 단계 없이 반환\n-- 실행 계획: INDEX FULL SCAN (no sort operation)` },
      { badge: 'Covering Index', badgeColor: 'violet' as const,
        desc: 'SELECT 목록의 모든 컬럼이 인덱스에 포함되어 있으면 테이블 블록을 전혀 읽지 않아도 됩니다. ROWID로 테이블을 방문하는 랜덤 I/O가 없어지므로 대용량 데이터에서 특히 효과적입니다.',
        sql: `SELECT employee_id, salary\nFROM employees\nWHERE salary IS NOT NULL;\n-- IDX_EMP_EMP_SALARY(employee_id, salary) 존재 시\n-- 인덱스만으로 결과 생성 → 테이블 블록 미방문\n-- 실행 계획: INDEX FULL SCAN (Index-Only Scan)` },
      { badge: 'INDEX 힌트', badgeColor: 'blue' as const,
        desc: '옵티마이저가 Full Table Scan을 선택했을 때 특정 인덱스로 Full Scan을 강제합니다. 인덱스 크기가 테이블보다 훨씬 작아 I/O가 줄어들 때 유효하지만, SELECT *처럼 인덱스에 없는 컬럼이 있으면 테이블 랜덤 접근이 여전히 발생합니다.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_SALARY) */ *\nFROM employees e\nORDER BY salary;\n-- 옵티마이저가 Full Table Scan 선택 시 강제\n-- ⚠️ SELECT *이므로 테이블 랜덤 I/O 발생\n-- salary만 SELECT하면 Index-Only Scan 가능` },
      { badge: 'INDEX_FFS 힌트', badgeColor: 'amber' as const,
        desc: '정렬이 필요 없는 집계 쿼리라면 Full Scan(단일 블록 I/O)보다 Fast Full Scan(멀티블록 I/O)이 훨씬 빠릅니다. ORDER BY나 정렬 보장이 필요 없는 상황에서는 INDEX_FFS로 전환하는 것을 고려하세요.',
        sql: `SELECT /*+ INDEX_FFS(e IDX_EMP_SALARY) */\n  COUNT(*)\nFROM employees e;\n-- 집계이므로 정렬 불필요\n-- Full Scan(1블록씩) 대신 Fast Full Scan(N블록씩)\n-- 같은 데이터를 더 적은 I/O로 읽음` },
    ],
  },
  en: {
    title: 'Index Full Scan',
    subtitle: "Reads every Leaf block from the leftmost to the rightmost in sorted order. Used to avoid a table full scan when only indexed columns are needed, or to return results in sorted order without an extra sort.",
    whatTitle: 'When is it used?',
    whatDesc: "The optimizer chooses Index Full Scan when all required columns are in the index (Covering Index), when the ORDER BY matches the index so no extra sort is needed, or when a full index read is cheaper than a full table scan.",
    howTitle: 'How it works',
    step1Title: '① Find the leftmost Leaf',
    step1Desc: 'Descend the tree to the first (smallest) Leaf block. This vertical traversal takes tree-depth block reads — typically 3 to 4.',
    step2Title: '② Read all Leaf blocks in order (single-block I/O)',
    step2Desc: 'Follow the right pointer through every Leaf to the last one, reading one block at a time. Because Leafs are read in key order, results come back sorted. Unlike Fast Full Scan, this uses single-block I/O — one block per I/O call.',
    diagramTitle: 'Full Scan Visualization',
    showBtn: 'Show full scan',
    hideBtn: 'Reset',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '📋', title: 'Results are sorted', desc: 'Reading Leafs in key order means results come back sorted — an ORDER BY can be satisfied without an extra sort step.' },
      { icon: '🔍', title: 'Avoids table I/O', desc: 'If only indexed columns are selected, Oracle never touches the table blocks (Index-Only Scan).' },
      { icon: '🐢', title: 'Slower than Fast Full Scan', desc: 'Single-block I/O means more I/O calls than Fast Full Scan for the same amount of data.' },
    ],
    vsNote: 'Key difference from Fast Full Scan: Full Scan reads Leafs one block at a time in order (sorted, slower); Fast Full Scan uses multi-block I/O (faster, but unordered).',
    hintTitle: 'When Index Full Scan Is Chosen',
    hintNote: 'Full Scan reads every Leaf in order, so results are inherently sorted. The optimizer chooses it when the ORDER BY matches the index, or when all selected columns are in the index (Covering Index).',
    examples: [
      { badge: 'ORDER BY', badgeColor: 'violet' as const,
        desc: "When ORDER BY matches the index column order, the index is already sorted — Oracle just reads Leaf blocks left to right and returns rows without a separate Sort step. This eliminates the SORT ORDER BY operation from the execution plan.",
        sql: `SELECT employee_id, last_name\nFROM employees\nORDER BY employee_id;\n-- Index is already sorted by employee_id\n-- No separate SORT ORDER BY in the plan\n-- Plan shows: INDEX FULL SCAN (no sort operation)` },
      { badge: 'Covering Index', badgeColor: 'violet' as const,
        desc: 'When every column in the SELECT list is stored in the index, Oracle never needs to visit the table blocks. All random I/O to table blocks is eliminated — only sequential index reads are needed. This is called an Index-Only Scan.',
        sql: `SELECT employee_id, salary\nFROM employees\nWHERE salary IS NOT NULL;\n-- IDX_EMP_EMP_SALARY(employee_id, salary) covers all columns\n-- Table blocks never touched\n-- Plan shows: INDEX FULL SCAN (Index-Only Scan)` },
      { badge: 'INDEX hint', badgeColor: 'blue' as const,
        desc: 'Forces Full Scan on a specific index when the optimizer chose a Full Table Scan. Effective when the index is much smaller than the table, but if SELECT * is used, random table I/O still occurs because non-indexed columns must be fetched.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_SALARY) */ *\nFROM employees e\nORDER BY salary;\n-- Forces Index Full Scan over Full Table Scan\n-- ⚠️ SELECT * causes random table I/O per ROWID\n-- Use SELECT salary only for true Index-Only Scan` },
      { badge: 'INDEX_FFS hint', badgeColor: 'amber' as const,
        desc: 'When sort order does not matter (aggregation, COUNT), Fast Full Scan reads multiple blocks per I/O call and is significantly faster than Full Scan. Switch to INDEX_FFS whenever the query has no ORDER BY requirement.',
        sql: `SELECT /*+ INDEX_FFS(e IDX_EMP_SALARY) */\n  COUNT(*)\nFROM employees e;\n-- No sort needed → multi-block I/O is better\n-- Same data read in fewer I/O calls than Full Scan` },
    ],
  },
}

export function FullScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [mode, setMode] = useState<Mode>('idle')
  const config = buildConfig(mode, isKo)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconScanEye size={36} color="#7c3aed" stroke={1.5} />}
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
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-400 font-mono text-[11px] font-bold text-white">2</div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] font-bold text-blue-700">{t.step2Title}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.step2Desc}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode(mode === 'full' ? 'idle' : 'full')}
          className={[
            'rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all',
            mode === 'full'
              ? 'border-blue-400 bg-blue-100 text-blue-800 shadow-sm'
              : 'border-border text-muted-foreground hover:border-blue-300 hover:text-foreground',
          ].join(' ')}
        >
          {mode === 'full' ? t.hideBtn : t.showBtn}
        </button>
      </div>
      <ScanDiagram config={config} title={isKo ? 'Leaf 블록 순차 탐색' : 'Sequential Leaf Traversal'} />

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
      <InfoBox variant="tip">{t.vsNote}</InfoBox>

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
