import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider, Table, SqlBlock,
} from '../../shared'
import { IconBolt } from '@tabler/icons-react'
import { ScanDiagram } from './ScanDiagram'
import type { ScanConfig } from './ScanDiagram'

const LEAVES = [
  { id: 'L1', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 102, rowid: 'AAA,1,2' }, { key: 105, rowid: 'AAA,1,3' }] },
  { id: 'L2', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
  { id: 'L3', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 124, rowid: 'AAA,3,2' }, { key: 128, rowid: 'AAA,3,3' }] },
  { id: 'L4', entries: [{ key: 135, rowid: 'AAA,4,1' }, { key: 141, rowid: 'AAA,4,2' }, { key: 149, rowid: 'AAA,4,3' }] },
  { id: 'L5', entries: [{ key: 155, rowid: 'AAA,5,1' }, { key: 160, rowid: 'AAA,5,2' }, { key: 166, rowid: 'AAA,5,3' }] },
]

const BATCH_GROUPS = [['L1', 'L2'], ['L3', 'L4'], ['L5']]

type Mode = 'idle' | 'batch1' | 'batch2' | 'batch3'

function buildConfig(mode: Mode, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  const activeLeaves = new Set<string>()
  if (mode === 'batch1') BATCH_GROUPS[0].forEach((id) => activeLeaves.add(id))
  if (mode === 'batch2') { BATCH_GROUPS[0].forEach((id) => activeLeaves.add(id)); BATCH_GROUPS[1].forEach((id) => activeLeaves.add(id)) }
  if (mode === 'batch3') LEAVES.forEach((l) => activeLeaves.add(l.id))

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    const isActive = activeLeaves.has(leaf.id)
    for (const e of leaf.entries) {
      entryStates[leaf.id][e.key] = isActive ? 'visited' : 'idle'
    }
    blockStates[leaf.id] = isActive ? 'active' : 'idle'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'EMP_ID',
    legend: mode !== 'idle' ? [
      { color: 'bg-blue-400', label: isKo ? '멀티블록 I/O로 읽은 블록' : 'Blocks read by multi-block I/O' },
      { color: 'bg-slate-200', label: isKo ? '아직 읽지 않음' : 'Not yet read' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Fast Full Scan',
    subtitle: '인덱스 세그먼트 전체를 멀티블록 I/O(Input/Output, 디스크 읽기)로 한꺼번에 읽는 방식이에요. Full Scan보다 훨씬 빠르지만, Leaf를 순서대로 읽지 않아서 결과 순서가 보장되지 않아요.',
    whatTitle: '언제 사용되나요?',
    whatDesc: 'SELECT COUNT(*) 나 집계처럼 인덱스 키값만 있으면 되고 순서는 상관없을 때 옵티마이저(Optimizer, 실행 계획을 짜는 오라클의 두뇌)가 이 방식을 골라요. db_file_multiblock_read_count 파라미터에 설정된 만큼 블록을 한 번에 읽어서 I/O 횟수를 확 줄여줘요.',
    howTitle: '어떻게 동작하나요?',
    step1Title: '① 인덱스 세그먼트에 바로 접근',
    step1Desc: 'Root나 Branch를 거치지 않고 인덱스 세그먼트의 블록을 곧장 읽어요. 트리를 타고 내려가는 비용이 전혀 없어요.',
    step2Title: '② 멀티블록 I/O로 한꺼번에 읽기',
    step2Desc: 'db_file_multiblock_read_count 설정에 따라 한 번의 I/O로 여러 블록을 한꺼번에 읽어요. 물리적으로 저장된 순서대로 읽으니까 결과 순서는 보장되지 않아요.',
    batchLabel: '멀티블록 I/O 배치',
    batches: ['배치 1 (L1, L2)', '배치 2 (L3, L4)', '배치 3 (L5)'],
    traitTitle: '특징',
    traits: [
      { icon: '🚀', title: '전체 읽기 중에 제일 빨라요', desc: '멀티블록 I/O 덕분에 Full Scan보다 I/O 횟수가 훨씬 적어요. 대량 집계 쿼리에 딱이에요.' },
      { icon: '🔀', title: '결과 정렬을 보장하지 않아요', desc: 'Leaf를 순서 없이 읽어서 ORDER BY가 필요하면 별도로 정렬하는 단계가 추가돼요.' },
      { icon: '📊', title: '병렬 처리와 잘 맞아요', desc: '파티션 여부에 상관없이 병렬 쿼리를 쓰면 여러 PX 서버가 인덱스 세그먼트를 나눠서 동시에 읽어요. Full Scan은 단일 블록 I/O 특성 때문에 병렬 효과가 제한적이지만, Fast Full Scan은 멀티블록 I/O와 병렬 처리를 함께 써서 엄청난 속도 향상을 낼 수 있어요.' },
    ],
    parallelNote: 'Fast Full Scan은 인덱스가 파티션되어 있지 않아도 병렬 쿼리를 사용할 수 있어요. 오라클이 인덱스 세그먼트를 여러 범위(granule)로 나눠 각 PX 서버에 나눠 주기 때문에, 파티션 pruning 없이도 병렬 I/O의 이점을 그대로 누릴 수 있어요.',
    vsTitle: 'Index Full Scan vs Index Fast Full Scan',
    vsHeaders: ['항목', 'Index Full Scan', 'Index Fast Full Scan'],
    vsRows: [
      ['I/O 방식',        '단일 블록 I/O (1회 1블록)',      '멀티블록 I/O (1회 N블록)'],
      ['읽기 순서',       'Leaf 체인을 순서대로 읽음',       '물리적 저장 순서 (무작위)'],
      ['결과 정렬',       '✓ 정렬 보장',                    '✗ 정렬 비보장'],
      ['Root/Branch 방문','✓ 트리를 따라 내려감',            '✗ 인덱스 세그먼트 직접 접근'],
      ['병렬 쿼리',       '△ 제한적',                       '✓ 비파티션 인덱스도 가능'],
      ['적합한 쿼리',     'ORDER BY, Covering Index',        'COUNT(*), 집계, 대량 스캔'],
      ['속도',           '상대적으로 느림',                   '상대적으로 빠름'],
    ],
    hintTitle: 'Index Fast Full Scan이 쓰이는 상황',
    hintNote: '인덱스에 있는 컬럼만 필요하고 결과 순서는 상관없을 때 선택돼요. 옵티마이저가 느린 플랜을 고를 때는 INDEX_FFS 힌트로 강제할 수 있어요.',
    examples: [
      { badge: 'COUNT(*)', badgeColor: 'violet' as const,
        desc: 'COUNT(*)는 행이 존재하는지만 확인하면 되니까, 컬럼 값이 필요 없어요. PK 같은 어떤 인덱스든 써서 전체 인덱스 세그먼트를 멀티블록 I/O로 읽으면 돼요. 테이블 블록에 전혀 접근하지 않아서 전체 카운트 중에 가장 빠른 방법이에요.',
        sql: `SELECT COUNT(*)\nFROM employees;\n-- PK 등 어떤 인덱스든 활용 가능\n-- 인덱스 세그먼트를 멀티블록 I/O로 직접 읽음\n-- 테이블 접근 전혀 없음\n-- 실행 계획: INDEX FAST FULL SCAN` },
      { badge: '집계 함수', badgeColor: 'violet' as const,
        desc: 'MAX, MIN, SUM은 정렬된 순서가 필요 없어요. 인덱스 세그먼트 전체를 멀티블록 I/O로 읽으면 되니까, Full Scan(1블록씩)보다 I/O 횟수가 훨씬 적어요. ORDER BY가 없는 집계라면 Fast Full Scan이 Full Scan보다 항상 유리해요.',
        sql: `SELECT MAX(salary), MIN(salary)\nFROM employees;\n-- IDX_EMP_SALARY가 salary 컬럼을 포함\n-- ORDER BY 불필요 → 정렬 순서 무관\n-- Full Scan(단일 블록)보다 I/O 횟수 대폭 감소\n-- 실행 계획: INDEX FAST FULL SCAN` },
      { badge: 'INDEX_FFS 힌트', badgeColor: 'blue' as const,
        desc: '옵티마이저가 Full Scan이나 Full Table Scan을 선택했을 때 Fast Full Scan으로 강제하는 방법이에요. 정렬이 필요 없는 쿼리인데 통계가 오래돼서 잘못된 플랜이 나올 때 유용하게 써요.',
        sql: `SELECT /*+ INDEX_FFS(e IDX_EMP_DEPT_ID) */\n  COUNT(*)\nFROM employees e\nWHERE department_id IS NOT NULL;\n-- 단일 블록 Full Scan 대신 멀티블록 읽기 강제\n-- 통계 갱신이 어려운 환경에서 임시 해결책으로 사용` },
      { badge: 'PARALLEL + INDEX_FFS', badgeColor: 'blue' as const,
        desc: '병렬 처리와 Fast Full Scan을 함께 쓰면 대용량 집계에서 가장 빠른 속도를 낼 수 있어요. 오라클이 인덱스 세그먼트를 granule 단위로 잘라서 각 PX 서버에 나눠 줘요. 인덱스가 파티션되어 있지 않아도 세그먼트 레벨에서 분할이 가능하니까 병렬 처리가 적용돼요.',
        sql: `SELECT /*+ PARALLEL(e 4) INDEX_FFS(e IDX_EMP_SALARY) */\n  SUM(salary)\nFROM employees e;\n-- 4개 PX 서버가 각각 인덱스 세그먼트 일부 담당\n-- 비파티션 인덱스도 granule 단위 분할 가능\n-- 대용량 집계에서 가장 빠른 조합` },
    ],
  },
  en: {
    title: 'Index Fast Full Scan',
    subtitle: 'Reads the entire index segment with multi-block I/O. Much faster than Full Scan, but reads Leaf blocks out of order so results are not sorted.',
    whatTitle: 'When is it used?',
    whatDesc: 'The optimizer chooses Fast Full Scan when only indexed columns are needed (e.g., COUNT(*), aggregations) and sort order does not matter. It reads db_file_multiblock_read_count blocks per I/O call, dramatically reducing I/O count.',
    howTitle: 'How it works',
    step1Title: '① Direct access to the index segment',
    step1Desc: 'Reads index blocks directly without descending Root→Branch. There is no tree traversal cost at all.',
    step2Title: '② Read multiple blocks per I/O call',
    step2Desc: 'Reads db_file_multiblock_read_count blocks in a single I/O call. Blocks are read in physical storage order, so result rows are not sorted.',
    batchLabel: 'Multi-block I/O batch',
    batches: ['Batch 1 (L1, L2)', 'Batch 2 (L3, L4)', 'Batch 3 (L5)'],
    traitTitle: 'Characteristics',
    traits: [
      { icon: '🚀', title: 'Fastest full read', desc: 'Multi-block I/O means far fewer I/O calls than Full Scan. Great for bulk aggregation queries.' },
      { icon: '🔀', title: 'No sort guarantee', desc: 'Leaf blocks are read out of order. An ORDER BY requires an extra sort step.' },
      { icon: '📊', title: 'Works well with parallelism', desc: "Even without a partitioned index, parallel query lets multiple PX servers each read a separate range (granule) of the index segment simultaneously. Full Scan's single-block I/O limits parallel benefit; Fast Full Scan combines multi-block I/O and parallelism for dramatic speed gains." },
    ],
    parallelNote: 'Fast Full Scan supports parallel query even on non-partitioned indexes. Oracle divides the index segment into granules and assigns each to a PX server, so you get the full benefit of parallel I/O without needing partition pruning.',
    vsTitle: 'Index Full Scan vs Index Fast Full Scan',
    vsHeaders: ['Item', 'Index Full Scan', 'Index Fast Full Scan'],
    vsRows: [
      ['I/O method',         'Single-block I/O (1 block/call)',  'Multi-block I/O (N blocks/call)'],
      ['Read order',         'Leaf chain in sorted order',       'Physical storage order (arbitrary)'],
      ['Result sorted',      '✓ Guaranteed',                     '✗ Not guaranteed'],
      ['Root/Branch visit',  '✓ Descends the tree',              '✗ Direct segment access'],
      ['Parallel query',     '△ Limited',                        '✓ Works on non-partitioned index'],
      ['Best for',           'ORDER BY, Covering Index',         'COUNT(*), aggregation, bulk scan'],
      ['Speed',              'Relatively slower',                'Relatively faster'],
    ],
    hintTitle: 'When Index Fast Full Scan Is Chosen',
    hintNote: 'Fast Full Scan is chosen when only indexed columns are needed and result order does not matter. Use INDEX_FFS to force it when the optimizer picks a slower plan.',
    examples: [
      { badge: 'COUNT(*)', badgeColor: 'violet' as const,
        desc: 'COUNT(*) only needs to know that rows exist — it does not need any column data. Any index covering the table (such as the PK) is enough. Oracle reads the entire index with multi-block I/O without touching the table at all, making this the fastest possible full scan.',
        sql: `SELECT COUNT(*)\nFROM employees;\n-- Any non-null index column suffices (e.g., PK)\n-- Multi-block I/O reads all index blocks directly\n-- No table access needed → very fast\n-- Plan: INDEX FAST FULL SCAN` },
      { badge: 'Aggregation', badgeColor: 'violet' as const,
        desc: 'MAX, MIN, SUM on indexed columns do not require sorted order. Oracle reads the entire index segment with multi-block I/O, which dramatically reduces I/O call count compared to Index Full Scan (which reads one block at a time).',
        sql: `SELECT MAX(salary), MIN(salary)\nFROM employees;\n-- IDX_EMP_SALARY covers the salary column\n-- No ORDER BY → sort order irrelevant\n-- Multi-block I/O: far fewer I/O calls than Full Scan\n-- Plan: INDEX FAST FULL SCAN` },
      { badge: 'INDEX_FFS hint', badgeColor: 'blue' as const,
        desc: 'Forces Fast Full Scan when the optimizer chose Full Scan or Full Table Scan. Useful when you know the query does not need sorted output but the optimizer lacks up-to-date statistics to make that judgment.',
        sql: `SELECT /*+ INDEX_FFS(e IDX_EMP_DEPT_ID) */\n  COUNT(*)\nFROM employees e\nWHERE department_id IS NOT NULL;\n-- Forces multi-block read over single-block Full Scan\n-- Effective when statistics are stale` },
      { badge: 'PARALLEL + INDEX_FFS', badgeColor: 'blue' as const,
        desc: 'Combining parallelism with Fast Full Scan is the fastest way to aggregate large tables. Oracle divides the index segment into granules and assigns each to a PX server. This works even when the index is not partitioned, because Fast Full Scan operates at the segment level, not the partition level.',
        sql: `SELECT /*+ PARALLEL(e 4) INDEX_FFS(e IDX_EMP_SALARY) */\n  SUM(salary)\nFROM employees e;\n-- 4 PX servers each read a segment granule\n-- Works on non-partitioned index (granule-level split)\n-- Fastest option for large aggregations` },
    ],
  },
}

export function FastFullScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [mode, setMode] = useState<Mode>('idle')
  const config = buildConfig(mode, isKo)

  const MODES: Mode[] = ['batch1', 'batch2', 'batch3']

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconBolt size={36} color="#7c3aed" stroke={1.5} />}
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

      <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t.batchLabel}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((m, i) => (
          <button key={m} onClick={() => setMode(mode === m ? 'idle' : m)}
            className={[
              'rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all',
              mode === m
                ? 'border-blue-400 bg-blue-100 text-blue-800 shadow-sm'
                : 'border-border text-muted-foreground hover:border-blue-300 hover:text-foreground',
            ].join(' ')}>
            {t.batches[i]}
          </button>
        ))}
      </div>
      <ScanDiagram config={config} title={isKo ? 'Leaf 블록 멀티블록 I/O 읽기' : 'Multi-block I/O Read'} />

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
      <InfoBox variant="note">{t.parallelNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.vsTitle}</SectionTitle>
      <Table headers={t.vsHeaders} rows={t.vsRows} />

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
