import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, InfoBox, Divider, SqlBlock,
} from '../../shared'
import { IconArrowsHorizontal } from '@tabler/icons-react'
import { ScanDiagram } from './ScanDiagram'
import type { ScanConfig } from './ScanDiagram'

// ── 고정 Leaf 데이터 ──────────────────────────────────────────────────────────

const LEAVES = [
  { id: 'L1', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 102, rowid: 'AAA,1,2' }, { key: 105, rowid: 'AAA,1,3' }] },
  { id: 'L2', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
  { id: 'L3', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 124, rowid: 'AAA,3,2' }, { key: 128, rowid: 'AAA,3,3' }] },
  { id: 'L4', entries: [{ key: 135, rowid: 'AAA,4,1' }, { key: 141, rowid: 'AAA,4,2' }, { key: 149, rowid: 'AAA,4,3' }] },
  { id: 'L5', entries: [{ key: 155, rowid: 'AAA,5,1' }, { key: 160, rowid: 'AAA,5,2' }, { key: 166, rowid: 'AAA,5,3' }] },
]

// ── 시나리오 ──────────────────────────────────────────────────────────────────

type ScenarioId = 'between' | 'gt' | 'like'

interface Scenario {
  id: ScenarioId
  labelKo: string
  labelEn: string
  sql: string
  // 조건에 맞는 key 목록
  matched: number[]
  // 방문한 key 목록 (matched 포함)
  visited: number[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'between',
    labelKo: 'BETWEEN 108 AND 128',
    labelEn: 'BETWEEN 108 AND 128',
    sql: 'WHERE employee_id BETWEEN 108 AND 128',
    matched: [108, 114, 116, 120, 124, 128],
    visited: [108, 114, 116, 120, 124, 128],
  },
  {
    id: 'gt',
    labelKo: '>= 135',
    labelEn: '>= 135',
    sql: 'WHERE employee_id >= 135',
    matched: [135, 141, 149, 155, 160, 166],
    visited: [135, 141, 149, 155, 160, 166],
  },
  {
    id: 'like',
    labelKo: 'LIKE 1__  (100~199)',
    labelEn: 'LIKE 1__  (100~199)',
    sql: "WHERE last_name LIKE '1%'",
    matched: [100, 102, 105, 108, 114, 116, 120, 124, 128, 135, 141, 149, 155, 160, 166],
    visited: [100, 102, 105, 108, 114, 116, 120, 124, 128, 135, 141, 149, 155, 160, 166],
  },
]

function buildConfig(scenario: Scenario | null, isKo: boolean): ScanConfig {
  const entryStates: ScanConfig['entryStates'] = {}
  const blockStates: ScanConfig['blockStates'] = {}

  for (const leaf of LEAVES) {
    entryStates[leaf.id] = {}
    let hasMatch = false
    let hasVisit = false
    for (const e of leaf.entries) {
      if (!scenario) {
        entryStates[leaf.id][e.key] = 'idle'
        continue
      }
      if (scenario.matched.includes(e.key)) {
        entryStates[leaf.id][e.key] = 'matched'
        hasMatch = true
        hasVisit = true
      } else if (scenario.visited.includes(e.key)) {
        entryStates[leaf.id][e.key] = 'visited'
        hasVisit = true
      } else {
        entryStates[leaf.id][e.key] = 'idle'
      }
    }
    blockStates[leaf.id] = !scenario ? 'idle' : hasMatch ? 'matched' : hasVisit ? 'active' : 'idle'
  }

  return {
    leaves: LEAVES,
    entryStates,
    blockStates,
    scanArrows: [],
    keyLabel: 'EMP_ID',
    legend: scenario ? [
      { color: 'bg-emerald-400', label: isKo ? '조건 충족 (반환)' : 'Matched (returned)' },
      { color: 'bg-slate-300',   label: isKo ? '범위 외 (건너뜀)' : 'Out of range (skipped)' },
    ] : [],
  }
}

// ── 텍스트 ────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'Index Range Scan',
    subtitle: '인덱스 스캔 방법 중 가장 자주 쓰이는 방식이에요. B-Tree에서 범위의 시작점을 찾은 다음, Leaf 블록들이 이어진 연결 리스트를 따라 끝점까지 차례차례 읽어나가요.',
    whatTitle: '언제 사용되나요?',
    whatDesc: 'BETWEEN, >, >=, <, <= 조건이나 LIKE \'A%\' 처럼 범위를 나타내는 조건에서 옵티마이저(Optimizer)가 선택해요. 인덱스 키가 정렬되어 있기 때문에 시작점을 한 번 찾으면 끝점까지 Leaf를 순서대로 훑기만 하면 되거든요. 스캔이 처리하는 키값의 수는 조건의 선택도(Selectivity)에 따라 달라져요. 선택도가 높을수록(결과 행 수가 적을수록) 읽는 블록도 줄어들고, 반대로 선택도가 낮아서 테이블 데이터의 상당 부분을 반환해야 하는 경우엔 Full Table Scan이 오히려 더 빠를 수 있어요.',
    howTitle: '작동 방식',
    diagramTitle: 'Range Scan 시각화',
    scenarioLabel: '시나리오 선택',
    traitTitle: '특징',
    traits: [
      { icon: '✅', title: '결과가 정렬되어 나와요', desc: 'Leaf를 순서대로 읽기 때문에 별도로 ORDER BY 정렬을 하지 않아도 결과가 자동으로 정렬된 순서로 나와요.' },
      { icon: '📌', title: '범위가 좁을수록 유리해요', desc: '범위가 좁을수록 읽어야 할 블록 수가 줄어들어요. 반대로 범위가 너무 넓으면 Full Table Scan이 더 빠를 수 있어요.' },
      { icon: '🔗', title: 'Leaf 연결 리스트를 활용해요', desc: '각 Leaf 블록은 앞뒤 블록과 연결되어 있어서, 포인터 하나만 따라가면 다음 블록으로 바로 이동할 수 있어요.' },
    ],
    noteMultiBlock: 'Range Scan은 조건에 따라 여러 Leaf 블록을 읽을 수 있어요. 각 Leaf에서 ROWID(행 주소)를 꺼낸 뒤 테이블 블록을 별도로 방문하기 때문에, 결과 건수가 많아질수록 랜덤 I/O(입출력)도 그만큼 많아진답니다.',
    stepVerticalTitle: '① 수직 탐색 — Root → Branch → Leaf',
    stepVerticalDesc: '검색은 항상 Root(루트)에서 시작해요. 범위 조건의 시작값과 Branch(브랜치) 키를 비교하면서 트리를 내려가, 조건을 처음으로 만족하는 키가 들어 있는 Leaf 블록에 도달해요. 이 과정에서는 트리의 깊이만큼(보통 3~4번) 블록을 읽으면 돼요.',
    stepHorizontalTitle: '② 수평 탐색 — Leaf 체인을 앞쪽으로 이동',
    stepHorizontalDesc: 'Leaf 블록에 도달한 다음부터는 각 블록의 오른쪽 포인터를 따라 다음 Leaf로 이동하면서 범위 끝까지 키를 모아요. Leaf 블록은 이중 연결 리스트로 이어져 있기 때문에, 트리를 다시 탐색하지 않고도 순서대로 쭉 읽을 수 있어요.',
    diagramAnnotation: '다이어그램 범례',
    annotationVertical: '수직 탐색: 트리를 내려가 시작점을 찾아요',
    annotationHorizontal: 'Leaf 블록 간 양방향 연결 포인터',
    annotationMatched: '조건을 만족하는 키값 (결과로 반환)',
    hintTitle: 'Index Range Scan이 선택되는 경우',
    hintNote: '범위 조건이 있고 해당 컬럼에 인덱스가 존재하면 옵티마이저가 자동으로 Range Scan을 선택해요. 특정 인덱스를 직접 지정하고 싶다면 INDEX 힌트를 사용하면 돼요.',
    bindPeekNote: 'Bind Variable Peeking(바인드 변수 엿보기) — 바인드 변수(:val)를 쓰면 옵티마이저는 쿼리가 처음 파싱(Parsing, 분석)될 때의 값만 보고 실행 계획을 확정해요. 그 이후에는 다른 값이 들어와도 처음 만든 계획을 그대로 재사용하거든요. 예를 들어 처음 :salary = 100(아주 소수인 값)으로 파싱되어 Range Scan으로 최적화됐다면, 나중에 :salary = 1(대다수에 해당하는 값)이 들어와도 같은 Range Scan 계획이 그대로 쓰여요. Oracle 11g부터는 Adaptive Cursor Sharing(적응형 커서 공유)으로 이 문제를 어느 정도 완화했지만, 통계가 오래됐거나 바인드 값의 분포가 극단적일 때는 여전히 엉뚱한 실행 계획이 선택될 수 있어서 INDEX 힌트로 강제하는 경우가 생기기도 해요.',
    examples: [
      { badge: 'BETWEEN', badgeColor: 'violet' as const,
        desc: 'BETWEEN은 시작값과 끝값을 모두 포함하는 범위 조건이에요. 인덱스가 salary 순으로 정렬되어 있으니, 5000이 있는 Leaf까지 트리를 내려간 뒤 8000을 넘는 키를 만날 때까지 오른쪽 Leaf를 순서대로 읽어나가요.',
        sql: `SELECT * FROM employees\nWHERE salary BETWEEN 5000 AND 8000;\n-- ① IDX_EMP_SALARY에서 5000 위치로 내려감\n-- ② Leaf 오른쪽으로 이동하며 8000까지 수집\n-- ③ 각 ROWID(행 주소)로 테이블 블록에 랜덤 접근` },
      { badge: '>=', badgeColor: 'violet' as const,
        desc: '>= 조건은 시작점은 있지만 끝이 열려 있는 범위예요. 인덱스에서 시작점을 찾은 뒤 마지막 Leaf까지 전부 읽어야 해요. 결과 건수가 많으면 Full Table Scan보다 느려질 수 있으니 선택도를 꼭 확인하세요.',
        sql: `SELECT * FROM employees\nWHERE hire_date >= DATE '2020-01-01';\n-- IDX_EMP_HIRE_DATE에서 2020-01-01 위치 탐색\n-- 이후 모든 Leaf를 끝까지 순방향 스캔\n-- 결과가 전체의 20% 이상이면 Full Scan이 유리할 수 있음` },
      { badge: 'LIKE', badgeColor: 'violet' as const,
        desc: "앞쪽에 고정 문자열이 있는 LIKE('K%')는 'K' 이상 'L' 미만인 범위로 바뀌어 Range Scan이 가능해요. 반면 뒤쪽에만 와일드카드가 있는 LIKE('%K')는 시작점을 정할 수 없어서 인덱스를 쓸 수 없고, Full Table Scan이 일어나요.",
        sql: `SELECT * FROM employees\nWHERE last_name LIKE 'K%';\n-- 'K%' → 'K' 이상 'L' 미만 범위로 변환\n-- IDX_EMP_LAST_NAME으로 Range Scan 가능\n\n-- ⚠️ 아래는 인덱스 사용 불가\nSELECT * FROM employees\nWHERE last_name LIKE '%ing'; -- Full Table Scan` },
      { badge: 'INDEX 힌트', badgeColor: 'blue' as const,
        desc: '옵티마이저가 Full Table Scan을 선택했는데 특정 인덱스를 쓰도록 강제하고 싶을 때 써요. 통계 정보가 오래됐거나 바인드 변수 Peeking 문제로 엉뚱한 실행 계획이 나올 때 특히 유용해요.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_SALARY) */ *\nFROM employees e\nWHERE salary >= 6000;\n-- 옵티마이저가 Full Scan을 선택하더라도\n-- IDX_EMP_SALARY로 Range Scan을 강제함` },
    ],
  },
  en: {
    title: 'Index Range Scan',
    subtitle: 'The most common index scan method. Oracle finds the start of the range in the B-Tree, then follows the Leaf linked list forward until the end of the range.',
    whatTitle: 'When is it used?',
    whatDesc: "The optimizer chooses Range Scan for range predicates: BETWEEN, >, >=, <, <=, and LIKE 'A%'. Because the index is sorted, once the start point is found Oracle just walks the Leaf blocks in order to the end point. The number of keys processed by the scan depends on how selective the predicate is — a highly selective predicate reads few rows, while a low-selectivity predicate (returning a large fraction of the table) can make a Full Table Scan cheaper.",
    howTitle: 'How it works',
    diagramTitle: 'Range Scan Visualization',
    scenarioLabel: 'Select scenario',
    traitTitle: 'Characteristics',
    traits: [
      { icon: '✅', title: 'Results are sorted', desc: 'Reading Leaf blocks in order means results come back sorted — no extra ORDER BY sort step needed.' },
      { icon: '📌', title: 'Better with low selectivity', desc: 'A narrow range means fewer blocks read. A very wide range can make a Full Table Scan faster.' },
      { icon: '🔗', title: 'Uses Leaf linked list', desc: 'Each Leaf block has a forward pointer to the next, so moving between blocks costs a single pointer follow.' },
    ],
    noteMultiBlock: 'Range Scan may visit multiple Leaf blocks. After retrieving each ROWID, Oracle visits the table block separately — so more result rows means more random I/Os.',
    stepVerticalTitle: '① Vertical Traversal — Root → Branch → Leaf',
    stepVerticalDesc: 'Every search starts at the Root. Oracle compares the range start value against Branch keys and descends the tree, landing on the Leaf block that contains the first qualifying key. This takes exactly tree-depth block reads — typically 3 to 4.',
    stepHorizontalTitle: '② Horizontal Traversal — Forward along the Leaf Chain',
    stepHorizontalDesc: 'Once the start Leaf is reached, Oracle follows the right pointer from each Leaf block to the next, collecting matching keys until the range end is found. Because Leaf blocks are doubly linked, no additional tree traversal is needed — just sequential pointer follows.',
    diagramAnnotation: 'Diagram legend',
    annotationVertical: 'Vertical: descend tree to locate range start',
    annotationHorizontal: 'Doubly-linked pointers between Leaf blocks',
    annotationMatched: 'Matched key (returned to caller)',
    hintTitle: 'When Index Range Scan Is Chosen',
    hintNote: 'Range Scan is selected automatically when a range predicate matches an indexed column. Use the INDEX hint to force a specific index.',
    bindPeekNote: "Bind Variable Peeking — when a bind variable (:val) is used, the optimizer inspects its value only at first parse time and locks in an execution plan. That plan is reused for all subsequent executions regardless of the actual value passed in. For example, if :salary = 100 (very selective) is seen first and a Range Scan plan is chosen, later executions with :salary = 1 (matching most rows) still use the same Range Scan — even though a Full Table Scan would be cheaper. Oracle 11g introduced Adaptive Cursor Sharing to mitigate this, but stale statistics or extreme value skew can still produce wrong plans, which is why the INDEX hint is sometimes needed as a workaround.",
    examples: [
      { badge: 'BETWEEN', badgeColor: 'violet' as const,
        desc: 'BETWEEN defines a closed range with both start and end values. Oracle descends to the Leaf containing 5000, then walks right through the linked list until it sees a key above 8000. Because both bounds are known, the scan stops cleanly.',
        sql: `SELECT * FROM employees\nWHERE salary BETWEEN 5000 AND 8000;\n-- ① Descend IDX_EMP_SALARY to key 5000\n-- ② Walk Leaf chain right until key > 8000\n-- ③ Random table I/O for each ROWID collected` },
      { badge: '>=', badgeColor: 'violet' as const,
        desc: '>= is an open-ended range — the start is known but there is no upper bound. Oracle finds the start key and reads all remaining Leaf blocks to the right. If the result set is very large (>~20% of rows), a Full Table Scan may be cheaper.',
        sql: `SELECT * FROM employees\nWHERE hire_date >= DATE '2020-01-01';\n-- Descend IDX_EMP_HIRE_DATE to 2020-01-01\n-- Read every Leaf to the right (no upper bound)\n-- High row count → consider Full Table Scan` },
      { badge: 'LIKE', badgeColor: 'violet' as const,
        desc: "A leading wildcard LIKE 'K%' is rewritten as a range (≥ 'K' and < 'L'), so the index start point is known and Range Scan applies. A trailing wildcard LIKE '%K' has no fixed start point, so Oracle cannot use the index and falls back to Full Table Scan.",
        sql: `SELECT * FROM employees\nWHERE last_name LIKE 'K%';\n-- Rewritten: last_name >= 'K' AND last_name < 'L'\n-- Range Scan on IDX_EMP_LAST_NAME\n\n-- ⚠️ Cannot use index:\nSELECT * FROM employees\nWHERE last_name LIKE '%ing'; -- Full Table Scan` },
      { badge: 'INDEX hint', badgeColor: 'blue' as const,
        desc: 'When the optimizer picks a Full Table Scan despite an available index — often due to stale statistics or bind variable peeking — the INDEX hint forces the specified index. Use it as a short-term workaround while the root cause is fixed.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_SALARY) */ *\nFROM employees e\nWHERE salary >= 6000;\n-- Forces Range Scan on IDX_EMP_SALARY\n-- even if optimizer chose Full Table Scan` },
    ],
  },
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────

export function RangeScanSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null)
  const scenario = SCENARIOS.find((s) => s.id === selectedScenario) ?? null
  const config = buildConfig(scenario, isKo)

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconArrowsHorizontal size={36} color="#7c3aed" stroke={1.5} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>

      {/* 수직 탐색 설명 */}
      <div className="mb-4 flex items-stretch gap-3">
        <div className="flex flex-col items-center">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 font-mono text-[11px] font-bold text-white">1</div>
          <div className="mt-1 flex-1 border-l-2 border-dashed border-amber-300" />
        </div>
        <div className="pb-2">
          <p className="mb-0.5 font-mono text-[11px] font-bold text-amber-700">{t.stepVerticalTitle}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.stepVerticalDesc}</p>
        </div>
      </div>

      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 font-mono text-[11px] font-bold text-white">2</div>
        <div>
          <p className="mb-0.5 font-mono text-[11px] font-bold text-emerald-700">{t.stepHorizontalTitle}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.stepHorizontalDesc}</p>
        </div>
      </div>

      {/* 시나리오 선택 */}
      <div className="mb-4">
        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {t.scenarioLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(selectedScenario === s.id ? null : s.id)}
              className={[
                'rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-all',
                selectedScenario === s.id
                  ? 'border-violet-400 bg-violet-100 font-bold text-violet-800 shadow-sm'
                  : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground',
              ].join(' ')}
            >
              {isKo ? s.labelKo : s.labelEn}
            </button>
          ))}
        </div>
        {scenario && (
          <div className="mt-3 rounded-lg border bg-slate-900 px-3 py-2">
            <span className="font-mono text-[11px] text-slate-300">{scenario.sql}</span>
          </div>
        )}
      </div>

      <ScanDiagram config={config} title={isKo ? 'Leaf 블록 탐색 경로' : 'Leaf Block Traversal'} />

      {/* 다이어그램 보충 설명 */}
      <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.diagramAnnotation}</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">ROOT → BRANCH</span>
            {t.annotationVertical}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <span className="rounded bg-slate-200 px-1.5 py-0.5 font-bold text-slate-600">← →</span>
            {t.annotationHorizontal}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" />
            {t.annotationMatched}
          </span>
        </div>
      </div>

      <Divider />

      {/* 특징 */}
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
      <InfoBox variant="note">{t.noteMultiBlock}</InfoBox>

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <Prose>{t.hintNote}</Prose>
      <div className="mt-4 grid gap-3">
        {t.examples.map((ex, i) => (
          <SqlBlock key={i} badge={ex.badge} badgeColor={ex.badgeColor} desc={ex.desc} sql={ex.sql} />
        ))}
      </div>

      <Divider />

      <InfoBox variant="note">{t.bindPeekNote}</InfoBox>
    </PageContainer>
  )
}
