import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider, SqlBlock,
} from '../../shared'
import { IconTarget } from '@tabler/icons-react'
import { ScanDiagram } from './ScanDiagram'
import type { ScanConfig } from './ScanDiagram'

const LEAVES = [
  { id: 'L1', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 102, rowid: 'AAA,1,2' }, { key: 105, rowid: 'AAA,1,3' }] },
  { id: 'L2', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
  { id: 'L3', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 124, rowid: 'AAA,3,2' }, { key: 128, rowid: 'AAA,3,3' }] },
  { id: 'L4', entries: [{ key: 135, rowid: 'AAA,4,1' }, { key: 141, rowid: 'AAA,4,2' }, { key: 149, rowid: 'AAA,4,3' }] },
  { id: 'L5', entries: [{ key: 155, rowid: 'AAA,5,1' }, { key: 160, rowid: 'AAA,5,2' }, { key: 166, rowid: 'AAA,5,3' }] },
]

const ALL_KEYS = LEAVES.flatMap((l) => l.entries.map((e) => e.key))

function buildConfig(targetKey: number | null, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    let hasMatch = false
    for (const e of leaf.entries) {
      if (targetKey === null) {
        entryStates[leaf.id][e.key] = 'idle'
      } else if (e.key === targetKey) {
        entryStates[leaf.id][e.key] = 'matched'
        hasMatch = true
      } else {
        entryStates[leaf.id][e.key] = 'idle'
      }
    }
    blockStates[leaf.id] = hasMatch ? 'matched' : 'idle'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'EMP_ID',
    legend: targetKey !== null ? [
      { color: 'bg-emerald-400', label: isKo ? '찾은 행 (즉시 종료)' : 'Found (scan stops)' },
    ] : [],
  }
}

const T = {
  ko: {
    title: 'Index Unique Scan',
    subtitle: 'PRIMARY KEY 또는 UNIQUE 인덱스에서 = 조건으로 정확히 하나의 행을 찾는 가장 효율적인 스캔입니다. 일치하는 키값을 발견하는 즉시 탐색을 멈춥니다.',
    whatTitle: '언제 사용되나요?',
    whatDesc: 'PK 또는 UNIQUE 제약이 걸린 컬럼에 = 조건을 사용할 때 옵티마이저가 선택합니다. 중복이 없음이 보장되므로 첫 번째 일치 항목을 찾으면 더 이상 탐색하지 않습니다.',
    howTitle: '작동 방식',
    step1Title: '① Root → Branch 탐색',
    step1Desc: '트리를 내려가며 키값이 있는 Leaf 블록을 정확히 찾습니다. 트리 깊이만큼(보통 3~4번) 블록을 읽습니다.',
    step2Title: '② Leaf에서 키값 검색 후 즉시 종료',
    step2Desc: '정렬된 Leaf 안에서 키값을 찾는 즉시 ROWID를 반환하고 스캔을 완전히 멈춥니다. 중복이 없음이 보장되므로 더 이상 탐색할 필요가 없습니다.',
    diagramTitle: 'Unique Scan 시각화',
    keyLabel: 'EMPLOYEE_ID 선택',
    traitTitle: '특징',
    traits: [
      { icon: '⚡', title: '가장 빠른 스캔', desc: 'Leaf를 하나만 방문하고 즉시 종료합니다. Row당 블록 접근 횟수가 최소입니다.' },
      { icon: '🔒', title: 'PK / UNIQUE 전용', desc: '중복이 없음이 보장된 컬럼에서만 동작합니다. 일반 인덱스에는 적용되지 않습니다.' },
      { icon: '1️⃣', title: '정확히 1건 반환', desc: '결과가 0건(없음) 또는 1건(있음)이므로 실행 계획에 ROWS=1이 표시됩니다.' },
    ],
    noteRange: 'UNIQUE 인덱스라도 = 대신 >, BETWEEN 같은 범위 조건을 쓰면 여러 행이 나올 수 있어 Range Scan으로 전환됩니다.',
    hintTitle: 'Index Unique Scan이 쓰이는 때',
    hintNote: 'PK 또는 UNIQUE 제약이 있는 컬럼에 = 조건을 쓰면 오라클은 중복이 없음을 알기 때문에 첫 번째 일치 항목을 찾자마자 스캔을 완전히 멈춥니다.',
    examples: [
      { badge: 'PK 조회', badgeColor: 'violet' as const,
        desc: 'PK 컬럼은 중복이 없음이 DB가 보장합니다. = 조건으로 검색하면 오라클은 트리를 내려가 해당 Leaf에서 키를 찾는 즉시 ROWID를 가져오고 스캔을 종료합니다. 수백만 건이 있어도 블록 읽기 횟수는 트리 깊이(보통 3~4회)에 불과합니다.',
        sql: `SELECT * FROM employees\nWHERE employee_id = 145;\n-- PK_EMPLOYEES: 중복 없음 보장\n-- Root → Branch → Leaf 탐색 후 즉시 종료\n-- 실행 계획: INDEX UNIQUE SCAN, ROWS=1` },
      { badge: 'UNIQUE 컬럼', badgeColor: 'violet' as const,
        desc: 'UNIQUE 제약이 걸린 컬럼도 PK와 동일하게 동작합니다. 이메일처럼 값이 하나만 존재해야 하는 컬럼에 = 조건을 주면 Unique Scan이 선택됩니다.',
        sql: `SELECT * FROM employees\nWHERE email = 'SKING';\n-- UQ_EMP_EMAIL: UNIQUE 제약으로 중복 불가\n-- 일치하는 엔트리 발견 즉시 스캔 종료\n-- 실행 계획: INDEX UNIQUE SCAN` },
      { badge: 'INDEX_RS_ASC 힌트', badgeColor: 'blue' as const,
        desc: 'Unique Scan을 억제하고 Range Scan을 강제합니다. 실무에서는 거의 쓸 일이 없지만, 실행 계획 비교 테스트나 특정 페이징 쿼리 튜닝 시 사용합니다.',
        sql: `SELECT /*+ INDEX_RS_ASC(e PK_EMPLOYEES) */ *\nFROM employees e\nWHERE employee_id = 145;\n-- 일부러 Range Scan으로 강제\n-- Unique Scan이 항상 더 효율적이므로\n-- 실무에서는 거의 사용하지 않음` },
      { badge: '⚠️ Range Scan으로 전환', badgeColor: 'amber' as const,
        desc: 'UNIQUE 인덱스라도 = 이 아닌 범위 조건(>=, BETWEEN 등)을 사용하면 여러 행이 반환될 수 있습니다. 오라클은 중복이 없음을 알지만 범위 내 행이 여러 개일 수 있으므로 첫 번째 일치 후 멈추지 못하고 Range Scan으로 전환됩니다.',
        sql: `SELECT * FROM employees\nWHERE employee_id >= 145;\n-- UNIQUE 인덱스지만 = 조건이 아님\n-- 145 이상인 행이 여러 개 → Range Scan\n-- 실행 계획: INDEX RANGE SCAN (Unique Scan 아님)` },
    ],
  },
  en: {
    title: 'Index Unique Scan',
    subtitle: 'The most efficient scan: finds exactly one row using a = predicate on a PRIMARY KEY or UNIQUE index. The scan stops the moment the matching key is found.',
    whatTitle: 'When is it used?',
    whatDesc: 'The optimizer uses Unique Scan when a = predicate is applied to a column with a PK or UNIQUE constraint. Because no duplicates can exist, Oracle stops at the first match.',
    howTitle: 'How it works',
    step1Title: '① Root → Branch traversal',
    step1Desc: 'Walk down the tree to find the exact Leaf block. This takes exactly tree-depth block reads — typically 3 to 4.',
    step2Title: '② Locate key in Leaf and stop immediately',
    step2Desc: 'Once the key is found in the Leaf, Oracle retrieves the ROWID and halts the scan entirely. No further traversal is needed because duplicates are guaranteed not to exist.',
    diagramTitle: 'Unique Scan Visualization',
    keyLabel: 'Select EMPLOYEE_ID',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '⚡', title: 'Fastest scan', desc: 'Only one Leaf is visited and the scan stops immediately. Minimum block I/Os per row.' },
      { icon: '🔒', title: 'PK / UNIQUE only', desc: 'Only works when no duplicates can exist. Not available for regular indexes.' },
      { icon: '1️⃣', title: 'Returns exactly 1 row', desc: 'The result is either 0 rows (not found) or 1 row (found), so the plan shows ROWS=1.' },
    ],
    noteRange: 'Even on a UNIQUE index, using a range predicate (>, BETWEEN) instead of = can return multiple rows, so Oracle switches to Range Scan.',
    hintTitle: 'When Index Unique Scan Is Chosen',
    hintNote: 'Oracle picks Unique Scan when a = predicate targets a column guaranteed to have no duplicates (PK or UNIQUE constraint). The moment the key is found, the scan stops completely.',
    examples: [
      { badge: 'PK lookup', badgeColor: 'violet' as const,
        desc: 'The database guarantees no duplicate PK values. With a = predicate Oracle descends the tree, finds the key in one Leaf block, retrieves the ROWID, and stops. Even with millions of rows, only tree-depth block reads are needed (typically 3–4).',
        sql: `SELECT * FROM employees\nWHERE employee_id = 145;\n-- PK_EMPLOYEES guarantees no duplicates\n-- Root → Branch → Leaf, then scan stops\n-- Plan shows: INDEX UNIQUE SCAN, ROWS=1` },
      { badge: 'UNIQUE column', badgeColor: 'violet' as const,
        desc: 'A UNIQUE constraint behaves exactly like a PK for scan purposes. Because the constraint prevents duplicates, Oracle knows after finding one match that no more can exist and terminates the scan immediately.',
        sql: `SELECT * FROM employees\nWHERE email = 'SKING';\n-- UQ_EMP_EMAIL: UNIQUE constraint prevents duplicates\n-- Scan halts the instant the entry is found\n-- Plan shows: INDEX UNIQUE SCAN` },
      { badge: 'INDEX_RS_ASC hint', badgeColor: 'blue' as const,
        desc: 'Forces a Range Scan instead of a Unique Scan. Rarely needed in practice — Unique Scan is always more efficient for = predicates. Useful only for controlled execution-plan comparison tests.',
        sql: `SELECT /*+ INDEX_RS_ASC(e PK_EMPLOYEES) */ *\nFROM employees e\nWHERE employee_id = 145;\n-- Suppresses Unique Scan, forces Range Scan\n-- Unique Scan is always faster for = predicates\n-- Avoid in production code` },
      { badge: '⚠️ Switches to Range Scan', badgeColor: 'amber' as const,
        desc: 'Even on a UNIQUE index, a range predicate (>=, BETWEEN) can match multiple rows. Oracle knows values are unique but cannot stop after one match because the range may include more rows, so it falls back to Range Scan.',
        sql: `SELECT * FROM employees\nWHERE employee_id >= 145;\n-- UNIQUE index, but not an = predicate\n-- Multiple rows can match → Range Scan\n-- Plan shows: INDEX RANGE SCAN (not Unique Scan)` },
    ],
  },
}

export function UniqueScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [selectedKey, setSelectedKey] = useState<number | null>(null)
  const config = buildConfig(selectedKey, isKo)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconTarget size={36} color="#7c3aed" stroke={1.5} />}
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
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 font-mono text-[11px] font-bold text-white">2</div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] font-bold text-emerald-700">{t.step2Title}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.step2Desc}</p>
        </div>
      </div>

      <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t.keyLabel}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ALL_KEYS.map((key) => (
          <button key={key} onClick={() => setSelectedKey(selectedKey === key ? null : key)}
            className={[
              'rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-all',
              selectedKey === key
                ? 'border-violet-400 bg-violet-100 font-bold text-violet-800 shadow-sm'
                : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground',
            ].join(' ')}>
            {key}
          </button>
        ))}
      </div>
      <ScanDiagram config={config} title={isKo ? 'Leaf 블록 탐색 경로' : 'Leaf Block Traversal'} />

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
      <InfoBox variant="note">{t.noteRange}</InfoBox>

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
