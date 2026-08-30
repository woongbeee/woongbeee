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
      { color: 'bg-blue', label: isKo ? '방문 (정렬 순 읽기)' : 'Visited (sorted order)' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Full Scan',
    subtitle: '인덱스의 모든 Leaf 블록을 맨 왼쪽부터 맨 오른쪽까지 순서대로 읽는 방식이에요. 테이블 전체를 뒤지는 대신 인덱스만 읽어서 I/O(Input/Output, 디스크 읽기)를 줄이거나, 정렬된 결과를 그대로 돌려줄 때 사용해요.',
    whatTitle: '언제 사용되나요?',
    whatDesc: '인덱스에 있는 컬럼만으로 결과를 만들 수 있을 때(Covering Index), 또는 ORDER BY 절의 컬럼이 인덱스 순서와 딱 맞아서 따로 정렬하지 않아도 될 때 옵티마이저(Optimizer, 실행 계획을 짜는 오라클의 두뇌)가 이 방식을 골라요. WHERE 조건 없이 전체 인덱스를 읽어야 할 때도 쓰여요.\n\n한 번에 1블록씩만 읽는 단일 블록 I/O를 사용하는 이유가 있어요. Leaf 체인 순서를 정확히 지켜야 하기 때문이에요. 여러 블록을 한꺼번에 읽는 멀티블록 I/O로 읽으면 정렬 순서가 뒤섞일 수 있어서, ORDER BY를 없앨 수 있다는 핵심 장점을 잃어버리게 돼요.',
    howTitle: '어떻게 동작하나요?',
    step1Title: '① Root에서 가장 왼쪽 Leaf 찾기',
    step1Desc: '트리를 따라 내려가서 첫 번째(가장 작은 값을 가진) Leaf 블록을 찾아요. 이 수직 탐색은 트리 깊이만큼, 보통 3~4번 블록을 읽어요.',
    step2Title: '② 모든 Leaf를 순서대로 읽기 (단일 블록 I/O)',
    step2Desc: '오른쪽 포인터를 따라 마지막 Leaf까지 한 블록씩 차례로 읽어요. 키값 순서대로 읽으니까 결과도 자동으로 정렬돼서 나와요. Fast Full Scan과 달리 한 번에 딱 1블록씩만 읽어요.',
    diagramTitle: 'Full Scan 시각화',
    showBtn: '전체 스캔 표시',
    hideBtn: '초기화',
    traitTitle: '특징',
    traits: [
      { icon: '📋', title: '결과가 저절로 정렬돼요', desc: 'Leaf를 키값 순서대로 읽으니까 결과도 정렬된 채로 나와요. ORDER BY가 있어도 따로 정렬 작업을 안 해도 돼요.' },
      { icon: '🔍', title: '테이블 블록 접근을 최소화해요', desc: '인덱스 컬럼만 SELECT할 때는 테이블 블록을 아예 안 읽어도 돼요 — 이걸 Index-Only Scan이라고 불러요.' },
      { icon: '🐢', title: 'Fast Full Scan보다는 느려요', desc: '한 번에 1블록씩 읽으니까, 같은 양을 읽을 때 여러 블록을 한꺼번에 읽는 Fast Full Scan보다 느려요.' },
    ],
    vsNote: 'Full Scan과 Fast Full Scan의 핵심 차이점이에요. Full Scan은 Leaf를 순서대로 1블록씩 읽어서 정렬을 보장해줘요. Fast Full Scan은 멀티블록 I/O로 더 빠르게 읽지만, 정렬은 보장하지 않아요.',
    hintTitle: 'Index Full Scan이 쓰이는 상황',
    hintNote: 'Leaf를 순서대로 읽기 때문에 결과가 자동으로 정렬돼요. SELECT하는 컬럼이 모두 인덱스에 있거나(Covering Index), ORDER BY 절 순서가 인덱스 순서와 딱 맞을 때 옵티마이저가 이 방식을 선택해요.',
    examples: [
      { badge: 'ORDER BY 최적화', badgeColor: 'violet' as const,
        desc: 'ORDER BY 컬럼이 인덱스 순서와 일치하면, 인덱스 자체가 이미 정렬되어 있으니까 별도의 Sort 단계가 필요 없어요. 오라클은 가장 왼쪽 Leaf부터 오른쪽으로 순서대로 읽어서 정렬 없이 결과를 바로 돌려줘요.',
        sql: `SELECT employee_id, last_name\nFROM employees\nORDER BY employee_id;\n-- PK 인덱스가 employee_id 순으로 이미 정렬됨\n-- 별도 SORT ORDER BY 단계 없이 반환\n-- 실행 계획: INDEX FULL SCAN (no sort operation)` },
      { badge: 'Covering Index', badgeColor: 'violet' as const,
        desc: 'SELECT 목록의 모든 컬럼이 인덱스에 들어 있으면 테이블 블록을 아예 읽지 않아도 돼요. ROWID(행 주소)로 테이블을 왔다 갔다 하는 랜덤 I/O가 사라지니까, 데이터가 많을수록 특히 효과적이에요.',
        sql: `SELECT employee_id, salary\nFROM employees\nWHERE salary IS NOT NULL;\n-- IDX_EMP_EMP_SALARY(employee_id, salary) 존재 시\n-- 인덱스만으로 결과 생성 → 테이블 블록 미방문\n-- 실행 계획: INDEX FULL SCAN (Index-Only Scan)` },
      { badge: 'INDEX 힌트', badgeColor: 'blue' as const,
        desc: '옵티마이저가 Full Table Scan을 선택했을 때 특정 인덱스로 Full Scan을 강제하는 방법이에요. 인덱스 크기가 테이블보다 훨씬 작아서 I/O가 줄어들 때 쓸 만하지만, SELECT *처럼 인덱스에 없는 컬럼이 있으면 테이블 랜덤 접근이 여전히 일어나요.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_SALARY) */ *\nFROM employees e\nORDER BY salary;\n-- 옵티마이저가 Full Table Scan 선택 시 강제\n-- ⚠️ SELECT *이므로 테이블 랜덤 I/O 발생\n-- salary만 SELECT하면 Index-Only Scan 가능` },
      { badge: 'INDEX_FFS 힌트', badgeColor: 'amber' as const,
        desc: '정렬이 필요 없는 집계 쿼리라면 Full Scan(1블록씩)보다 Fast Full Scan(여러 블록 한꺼번에)이 훨씬 빠를 수 있어요. ORDER BY나 정렬 보장이 필요 없는 상황에서는 INDEX_FFS 힌트로 바꾸는 걸 고려해 보세요.',
        sql: `SELECT /*+ INDEX_FFS(e IDX_EMP_SALARY) */\n  COUNT(*)\nFROM employees e;\n-- 집계이므로 정렬 불필요\n-- Full Scan(1블록씩) 대신 Fast Full Scan(N블록씩)\n-- 같은 데이터를 더 적은 I/O로 읽음` },
    ],
  },
  en: {
    title: 'Index Full Scan',
    subtitle: "Reads every Leaf block from the leftmost to the rightmost in sorted order. Used to avoid a table full scan when only indexed columns are needed, or to return results in sorted order without an extra sort.",
    whatTitle: 'When is it used?',
    whatDesc: "The optimizer chooses Index Full Scan when all required columns are in the index (Covering Index), when the ORDER BY matches the index so no extra sort is needed, or when a full index read is cheaper than a full table scan. Oracle uses single-block I/O because it must read each Leaf block in the exact order they appear in the chain — multi-block I/O would not preserve the sorted sequence that makes Full Scan valuable for ORDER BY elimination.",
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
        icon={<IconScanEye size={36} color="var(--color-purple)" stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>

      <div className="mb-4 flex items-stretch gap-3">
        <div className="flex flex-col items-center">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber font-mono text-[11px] font-bold text-paper">1</div>
          <div className="mt-1 flex-1 border-l-2 border-dashed border-amber/50" />
        </div>
        <div className="pb-2">
          <p className="mb-0.5 font-mono text-[11px] font-bold text-amber">{t.step1Title}</p>
          <p className="text-[11px] leading-relaxed text-ink-2">{t.step1Desc}</p>
        </div>
      </div>

      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue font-mono text-[11px] font-bold text-paper">2</div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] font-bold text-blue">{t.step2Title}</p>
          <p className="text-[11px] leading-relaxed text-ink-2">{t.step2Desc}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode(mode === 'full' ? 'idle' : 'full')}
          className={[
            'rounded-card border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all',
            mode === 'full'
              ? 'border-blue/50 bg-blue/10 text-blue '
              : 'border-line text-ink-2 hover:border-blue/50 hover:text-ink',
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
          <div key={i} className="rounded-panel border bg-paper p-4">
            <div className="mb-2 text-lg">{tr.icon}</div>
            <div className="mb-1 text-xs font-bold">{tr.title}</div>
            <p className="text-[11px] leading-snug text-ink-2">{tr.desc}</p>
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
