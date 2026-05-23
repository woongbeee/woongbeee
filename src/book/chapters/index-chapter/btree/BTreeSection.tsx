import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
} from '../../shared'
import { IconBinaryTree } from '@tabler/icons-react'

// ── 텍스트 ────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    introTitle: 'B-Tree 인덱스란?',
    introDesc: 'B-Tree는 Balanced Tree의 줄임말입니다. 여기서 "B"는 Binary(이진)가 아니라 Balanced(균형)를 뜻합니다. 트리의 모든 Leaf 노드가 Root로부터 항상 같은 거리에 있어, 어떤 값을 찾든 동일한 횟수만큼 블록을 읽게 됩니다.',
    introWhyName: '"B"가 Balanced인 이유',
    introWhyNameDesc: '트리에 데이터가 추가·삭제될 때 오라클이 자동으로 구조를 재정렬해서 항상 균형을 유지합니다. 한쪽으로 치우치지 않기 때문에 어떤 값을 찾든 Leaf 노드까지의 깊이가 동일합니다. 데이터가 매우 많아져도 레벨이 조금씩 늘어날 뿐, 항상 적은 수의 블록 읽기로 원하는 값에 도달할 수 있습니다.',
    introWhyOracle: '오라클이 B-Tree를 기본값으로 쓰는 이유',
    introReasons: [
      { icon: '⚡', title: '단건 조회가 빠르다', desc: 'WHERE employee_id = 145처럼 하나의 값을 정확히 찾을 때, 수백만 행이 있어도 트리 깊이만큼만(보통 3~4번) 블록을 읽으면 됩니다.' },
      { icon: '📏', title: '범위 검색도 효율적이다', desc: 'Leaf 블록이 앞뒤로 연결되어 있어서 BETWEEN이나 >, < 조건도 시작 지점을 찾은 뒤 연결 리스트를 따라가기만 하면 됩니다.' },
      { icon: '🔤', title: '정렬 결과를 공짜로 얻는다', desc: '인덱스 자체가 정렬되어 있으므로 ORDER BY 컬럼에 인덱스가 있으면 별도의 정렬 작업 없이 결과를 순서대로 읽을 수 있습니다.' },
      { icon: '🔄', title: '변경에 강하다', desc: 'INSERT·UPDATE·DELETE가 발생해도 트리 구조를 자동으로 재조정해 균형을 유지합니다. 별도 관리 없이도 항상 빠릅니다.' },
    ],
    structureTitle: 'B-Tree 내부 구조',
    structureDesc: 'Oracle B-Tree 인덱스는 Root → Branch → Leaf 3계층으로 구성됩니다. Leaf 블록은 인덱스 키와 해당 행의 ROWID를 정렬된 상태로 저장하며, 양방향으로 연결되어 범위 탐색이 가능합니다.',
    nodeDescs: [
      {
        label: 'Root 노드',
        color: 'amber' as const,
        body: '트리의 진입점. 검색이 항상 여기서 시작됩니다.',
        sub: { term: 'DBA (Data Block Address)', desc: '각 Branch 블록이 디스크의 어느 위치에 있는지를 나타내는 주소값입니다. Root는 DBA를 보고 다음으로 읽을 Branch 블록을 찾습니다.' },
      },
      {
        label: 'Branch 노드',
        color: 'blue' as const,
        body: '키 값을 비교해 어느 Leaf 블록으로 내려갈지 방향을 결정합니다. 실제 데이터는 항상 Leaf 노드에 있습니다.',
        sub: { term: 'LMC (Left Most Child)', desc: 'Branch 블록의 각 엔트리는 키 값과 하위 노드를 가리키는 블록 주소(DBA)를 갖습니다. 그런데 키 값을 가지지 않는 특별한 엔트리가 하나 있는데, 이것이 LMC입니다. 다른 엔트리는 자신의 키 값과 같거나 큰 값을 담은 자식 블록을 가리키는 반면, LMC는 명시적인 키 값 없이 \'첫 번째 키보다 작은 값\'을 담은 자식 블록, 즉 자식 노드 중 가장 왼쪽 끝에 위치한 블록을 가리킵니다.' },
      },
      {
        label: 'Leaf 노드',
        color: 'slate' as const,
        body: '실제 인덱스 키값이 정렬된 순서로 저장되는 곳입니다. 앞뒤 Leaf 블록이 서로 연결되어 있어 범위 검색 시 연결 리스트처럼 순서대로 읽을 수 있습니다.',
        sub: { term: 'ROWID', desc: '각 키값과 함께 저장되는 포인터로, 해당 행이 테이블의 어느 블록 몇 번째 슬롯에 있는지를 정확히 가리킵니다. 오라클은 ROWID로 테이블 블록을 한 번에 직접 찾아갑니다.' },
      },
    ],
    structurePoints: [
      { icon: '⚖️', title: '균형 트리', desc: 'Root → Branch → Leaf, 항상 동일한 깊이. 어떤 행을 찾든 같은 수의 블록 읽기.' },
      { icon: '🔗', title: '이중 연결 Leaf', desc: 'Leaf 블록은 앞뒤로 연결됨. Range Scan 시 다음 블록을 포인터로 바로 이동.' },
      { icon: '🪪', title: 'ROWID 저장', desc: 'Leaf에는 키값 + ROWID. ROWID로 테이블의 정확한 블록과 행을 바로 접근.' },
      { icon: '📌', title: 'Branch는 분기점', desc: 'Branch 블록에는 Leaf로 가는 길잡이 키만 저장. 실제 데이터는 항상 Leaf에.' },
    ],
    searchTitle: 'B-Tree에서 데이터를 찾는 방법',
    searchDesc: '찾고 싶은 값을 선택하면 B-Tree가 Root에서 시작해 어떤 경로로 해당 값을 찾는지 단계별로 보여줍니다.',
    tabSingle: '단일 컬럼 인덱스',
    tabComposite: '복합 인덱스',
    tabSingleDesc: 'EMPLOYEE_ID 단일 컬럼 인덱스입니다. 키값 하나만 비교해 Leaf까지 내려갑니다.',
    tabCompositeDesc: '(DEPARTMENT_ID, SALARY) 복합 인덱스입니다. 첫 번째 컬럼으로 먼저 비교하고, 같을 때만 두 번째 컬럼을 비교합니다.',
    searchLabel: 'EMPLOYEE_ID 선택',
    compositeLabel: '(DEPT_ID, SALARY) 선택',
    stepRoot: 'Root 블록 읽기 — 어느 Branch로 갈지 결정',
    stepBranch: (b: string) => `Branch ${b} 읽기 — 어느 Leaf로 갈지 결정`,
    stepLeaf: (l: string) => `Leaf ${l} 읽기 — 키값 비교 후 ROWID 획득`,
    found: (key: number, rowid: string) => `EMPLOYEE_ID = ${key} 발견 → ROWID: ${rowid}`,
    compositeNote: '복합 인덱스에서 첫 번째 컬럼(선두 컬럼)은 항상 비교에 사용됩니다. 두 번째 컬럼은 첫 번째가 같을 때만 추가로 비교합니다. WHERE 절에 선두 컬럼 없이 두 번째 컬럼만 쓰면 이 인덱스를 탈 수 없습니다.',

    cfTitle: 'Clustering Factor(클러스터링 팩터)',
    cfDesc: 'Clustering Factor는 테이블의 물리적 행 저장 순서가 인덱스 순서와 얼마나 일치하는지를 나타내는 지표입니다. 값이 낮을수록 좋으며, 인접한 인덱스 엔트리들이 같은(또는 가까운) 테이블 블록을 가리켜 범위 스캔의 I/O가 줄어듭니다.',
    cfHowTitle: '계산 방법',
    cfHowDesc: 'Oracle이 인덱스 Leaf 블록을 순서대로 읽으면서 각 ROWID가 가리키는 테이블 블록 번호가 이전 엔트리와 달라질 때마다 카운터를 1씩 증가시킵니다. 같은 블록이면 카운터는 그대로입니다. 최종 카운터 값이 Clustering Factor입니다.',
    cfRangeTitle: '값의 범위',
    cfRangeLow: '블록 수에 가까울수록 좋음 → 행이 인덱스 순서대로 저장됨 → 범위 스캔 시 적은 I/O',
    cfRangeHigh: '행 수에 가까울수록 나쁨 → 행이 무작위로 흩어짐 → 범위 스캔 시 많은 I/O',
    cfExampleTitle: '예시 — EMPLOYEES 테이블',
    cfExampleDesc: '19개 행이 2개 블록에 걸쳐 성(last_name) 알파벳 순으로 저장되어 있습니다.',
    cfTableHeaders: ['인덱스', '인덱스 컬럼', 'Clustering Factor', '이유'],
    cfTableRows: [
      ['EMP_NAME_IX', 'LAST_NAME', '2', '테이블이 이름 알파벳 순 저장 → 인접 엔트리가 같은 블록 가리킴'],
      ['EMP_EMP_ID_PK', 'EMPLOYEE_ID', '19', 'ID가 무작위 배정 → 각 엔트리가 서로 다른 블록을 가리킴'],
    ],
    cfImpactTitle: '실행 계획에 미치는 영향',
    cfImpactDesc: 'CBO는 Clustering Factor × 범위 선택도로 인덱스 범위 스캔의 I/O 비용을 추정합니다. Clustering Factor가 높으면 넓은 범위 스캔 비용이 크게 계산되어 옵티마이저가 Full Table Scan을 선택할 수 있습니다. 낮으면 중간 폭의 범위에서도 인덱스 스캔이 유리하게 유지됩니다.',
    cfTipQuery: 'Clustering Factor 확인:',
  },
  en: {
    introTitle: 'What is a B-Tree Index?',
    introDesc: 'B-Tree stands for Balanced Tree. The "B" does not mean Binary — it means Balanced. Every Leaf node in the tree is always at the same distance from the Root, so Oracle reads exactly the same number of blocks no matter which value it searches for.',
    introWhyName: 'Why "Balanced"?',
    introWhyNameDesc: 'When data is inserted or deleted, Oracle automatically rebalances the tree structure. Because no branch ever grows lopsided, every Leaf node is always at the same depth. As data grows the tree gains a level occasionally, but the number of blocks read to reach any value stays very small.',
    introWhyOracle: 'Why Oracle Uses B-Tree as Its Default',
    introReasons: [
      { icon: '⚡', title: 'Fast single-row lookups', desc: 'For a query like WHERE employee_id = 145, Oracle only reads as many blocks as the tree is deep (typically 3–4), regardless of how many millions of rows exist.' },
      { icon: '📏', title: 'Efficient range searches', desc: 'Leaf blocks are doubly linked, so BETWEEN, >, and < conditions simply find the start point and then follow the linked list forward.' },
      { icon: '🔤', title: 'Free sort order', desc: 'Because the index itself is sorted, an ORDER BY on an indexed column can return results in order without any extra sort step.' },
      { icon: '🔄', title: 'Resilient to changes', desc: 'INSERT, UPDATE, and DELETE are handled automatically — Oracle rebalances the tree on the fly, so no manual maintenance is needed.' },
    ],
    structureTitle: 'B-Tree Internal Structure',
    structureDesc: 'An Oracle B-Tree index has three levels: Root → Branch → Leaf. Leaf blocks store sorted index keys and ROWIDs, doubly linked for efficient range traversal.',
    nodeDescs: [
      {
        label: 'Root Node',
        color: 'amber' as const,
        body: 'The entry point of every search. Oracle always starts here.',
        sub: { term: 'DBA (Data Block Address)', desc: 'A physical address that identifies exactly which disk block each Branch resides in. The Root reads its DBA entries to decide which Branch block to visit next.' },
      },
      {
        label: 'Branch Node',
        color: 'blue' as const,
        body: 'Compares key values to determine which Leaf block to descend into.',
        sub: { term: 'LMC (Left Most Child)', desc: 'Each entry in a Branch block holds a key value and a DBA pointing to a child block. There is one special entry that holds no key — this is the LMC. While every other entry points to the child block that holds values greater than or equal to its own key, the LMC points to the child that holds values smaller than the first keyed entry — in other words, the leftmost child block in the subtree.' },
      },
      {
        label: 'Leaf Node',
        color: 'slate' as const,
        body: 'Stores the actual index key values in sorted order. Adjacent Leaf blocks are doubly linked so range scans can read them in sequence like a linked list.',
        sub: { term: 'ROWID', desc: 'A pointer stored alongside each key that identifies the exact block and row slot in the table. Oracle uses the ROWID to jump directly to the right table block in a single I/O.' },
      },
    ],
    structurePoints: [
      { icon: '⚖️', title: 'Balanced Tree', desc: 'Root → Branch → Leaf, always the same depth. Equal block reads for any row.' },
      { icon: '🔗', title: 'Doubly Linked Leaves', desc: 'Leaf blocks are linked both ways. Range Scan moves to the next block via pointer.' },
      { icon: '🪪', title: 'ROWID Storage', desc: 'Leaf holds key + ROWID. ROWID pinpoints the exact block and row in the table.' },
      { icon: '📌', title: 'Branch as a Signpost', desc: 'Branch blocks only store guide keys to Leaves. Actual data is always in Leaf blocks.' },
    ],
    searchTitle: 'How B-Tree Finds Data',
    searchDesc: 'Select a value to see how the B-Tree finds it step by step, starting from the Root.',
    tabSingle: 'Single-Column Index',
    tabComposite: 'Composite Index',
    tabSingleDesc: 'A single-column index on EMPLOYEE_ID. Only one key value is compared at each level.',
    tabCompositeDesc: 'A composite index on (DEPARTMENT_ID, SALARY). The first column is compared first; the second column is only compared when the first values are equal.',
    searchLabel: 'Select EMPLOYEE_ID',
    compositeLabel: 'Select (DEPT_ID, SALARY)',
    stepRoot: 'Read Root block — decide which Branch to follow',
    stepBranch: (b: string) => `Read Branch ${b} — decide which Leaf to follow`,
    stepLeaf: (l: string) => `Read Leaf ${l} — compare keys and retrieve ROWID`,
    found: (key: number, rowid: string) => `EMPLOYEE_ID = ${key} found → ROWID: ${rowid}`,
    compositeNote: 'In a composite index the leading column is always compared first. The second column is only used when the first column values are equal. Queries that omit the leading column cannot use this index.',

    cfTitle: 'Clustering Factor',
    cfDesc: 'Clustering Factor measures how well a table\'s physical row order matches the index order. The lower the value, the better — adjacent index entries point to the same (or nearby) table blocks, minimizing I/O for range scans.',
    cfHowTitle: 'How it is calculated',
    cfHowDesc: 'Oracle counts how many times the table block number changes as it walks the index leaf blocks in order. If block X and the next entry also point to block X, the counter stays. If it points to a different block, the counter increments. The final count is the Clustering Factor.',
    cfRangeTitle: 'Value range',
    cfRangeLow: 'Near num_blocks → rows stored in index order → few I/Os per range scan',
    cfRangeHigh: 'Near num_rows → rows randomly scattered → many I/Os per range scan',
    cfExampleTitle: 'Example — EMPLOYEES table',
    cfExampleDesc: 'The table has 19 rows spread across 2 blocks, alphabetically sorted by last_name.',
    cfTableHeaders: ['Index', 'Indexed Column', 'Clustering Factor', 'Why'],
    cfTableRows: [
      ['EMP_NAME_IX', 'LAST_NAME', '2', 'Rows stored alphabetically → adjacent entries stay in same block'],
      ['EMP_EMP_ID_PK', 'EMPLOYEE_ID', '19', 'IDs assigned randomly → each entry often points to a different block'],
    ],
    cfImpactTitle: 'Impact on execution plan',
    cfImpactDesc: 'The CBO multiplies Clustering Factor by the selectivity of a range predicate to estimate the I/O cost of an index range scan. A high Clustering Factor makes large range scans look expensive, nudging the optimizer toward a Full Table Scan. A low Clustering Factor keeps range scans competitive even for moderately wide ranges.',
    cfTipQuery: 'Check Clustering Factor:',
  },
}

// ── 정적 트리 데이터 ──────────────────────────────────────────────────────────
//
// B-Tree 구조 규칙:
//   Branch/Root: LMC DBA 1개 + (key, DBA) 쌍 N개 → 자식 N+1개
//   Root의 DBA → Branch 블록 주소 / Branch의 DBA → Leaf 블록 주소

const STATIC_TREE = {
  root: {
    leftmost: { dba: 'DBA:1,10' },
    entries: [
      { key: 153, dba: 'DBA:1,11' },
    ],
  },
  branches: [
    {
      id: 'B0',
      leftmost: { dba: 'DBA:2,1' },
      entries: [
        { key: 108, dba: 'DBA:2,2' },
        { key: 120, dba: 'DBA:2,3' },
      ],
      leaves: [
        { id: 'L0', entries: [{ key: 100, rowid: 'AAA,1,1' }, { key: 101, rowid: 'AAA,1,2' }, { key: 102, rowid: 'AAA,1,3' }] },
        { id: 'L1', entries: [{ key: 108, rowid: 'AAA,2,1' }, { key: 114, rowid: 'AAA,2,2' }, { key: 116, rowid: 'AAA,2,3' }] },
        { id: 'L2', entries: [{ key: 120, rowid: 'AAA,3,1' }, { key: 121, rowid: 'AAA,3,2' }, { key: 122, rowid: 'AAA,3,3' }] },
      ],
    },
    {
      id: 'B1',
      leftmost: { dba: 'DBA:2,4' },
      entries: [
        { key: 145, dba: 'DBA:2,5' },
        { key: 153, dba: 'DBA:2,6' },
      ],
      leaves: [
        { id: 'L3', entries: [{ key: 137, rowid: 'AAA,4,1' }, { key: 138, rowid: 'AAA,4,2' }, { key: 139, rowid: 'AAA,4,3' }] },
        { id: 'L4', entries: [{ key: 145, rowid: 'AAA,5,1' }, { key: 149, rowid: 'AAA,5,2' }, { key: 150, rowid: 'AAA,5,3' }] },
        { id: 'L5', entries: [{ key: 153, rowid: 'AAA,6,1' }, { key: 154, rowid: 'AAA,6,2' }, { key: 156, rowid: 'AAA,6,3' }] },
      ],
    },
  ],
}

// ── 복합 인덱스 트리 데이터 (DEPARTMENT_ID, SALARY) ──────────────────────────
// 키: [dept, salary] 튜플 — 먼저 dept 비교, 같으면 salary 비교

const COMPOSITE_TREE = {
  root: {
    leftmost: { dba: 'DBA:3,1' },
    entries: [{ key: [60, 6000] as [number, number], dba: 'DBA:3,2' }],
  },
  branches: [
    {
      id: 'B0',
      leftmost: { dba: 'DBA:4,1' },
      entries: [
        { key: [50, 4800] as [number, number], dba: 'DBA:4,2' },
        { key: [50, 8300] as [number, number], dba: 'DBA:4,3' },
      ],
      leaves: [
        { id: 'L0', entries: [{ key: [10, 4400] as [number, number], rowid: 'BBB,1,1' }, { key: [20, 6000] as [number, number], rowid: 'BBB,1,2' }, { key: [50, 3500] as [number, number], rowid: 'BBB,1,3' }] },
        { id: 'L1', entries: [{ key: [50, 4800] as [number, number], rowid: 'BBB,2,1' }, { key: [50, 6000] as [number, number], rowid: 'BBB,2,2' }, { key: [50, 8000] as [number, number], rowid: 'BBB,2,3' }] },
        { id: 'L2', entries: [{ key: [50, 8300] as [number, number], rowid: 'BBB,3,1' }, { key: [50, 9000] as [number, number], rowid: 'BBB,3,2' }, { key: [50, 9500] as [number, number], rowid: 'BBB,3,3' }] },
      ],
    },
    {
      id: 'B1',
      leftmost: { dba: 'DBA:4,4' },
      entries: [
        { key: [80, 7000] as [number, number], dba: 'DBA:4,5' },
        { key: [90, 17000] as [number, number], dba: 'DBA:4,6' },
      ],
      leaves: [
        { id: 'L3', entries: [{ key: [60, 6000] as [number, number], rowid: 'BBB,4,1' }, { key: [60, 8000] as [number, number], rowid: 'BBB,4,2' }, { key: [60, 9000] as [number, number], rowid: 'BBB,4,3' }] },
        { id: 'L4', entries: [{ key: [80, 7000] as [number, number], rowid: 'BBB,5,1' }, { key: [80, 8200] as [number, number], rowid: 'BBB,5,2' }, { key: [90, 11000] as [number, number], rowid: 'BBB,5,3' }] },
        { id: 'L5', entries: [{ key: [90, 17000] as [number, number], rowid: 'BBB,6,1' }, { key: [100, 24000] as [number, number], rowid: 'BBB,6,2' }, { key: [100, 51000] as [number, number], rowid: 'BBB,6,3' }] },
      ],
    },
  ],
}

function cmpTuple(a: [number, number], b: [number, number]): number {
  return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]
}

// 키값 → {branchId, leafId, rowid} 매핑
function resolveKey(key: number): SearchPath | null {
  for (const branch of STATIC_TREE.branches) {
    for (const leaf of branch.leaves) {
      const entry = leaf.entries.find((e) => e.key === key)
      if (entry) return { branchId: branch.id, leafId: leaf.id, matchKey: key, rowid: entry.rowid }
    }
  }
  return null
}

function resolveCompositeKey(key: [number, number]): CompositeSearchPath | null {
  for (const branch of COMPOSITE_TREE.branches) {
    for (const leaf of branch.leaves) {
      const entry = leaf.entries.find((e) => cmpTuple(e.key, key) === 0)
      if (entry) return { branchId: branch.id, leafId: leaf.id, matchKey: key, rowid: entry.rowid }
    }
  }
  return null
}

// 다이어그램에 표시할 모든 키값 (정렬)
const ALL_KEYS = STATIC_TREE.branches.flatMap((b) => b.leaves.flatMap((l) => l.entries.map((e) => e.key))).sort((a, b) => a - b)
const ALL_COMPOSITE_KEYS: [number, number][] = COMPOSITE_TREE.branches
  .flatMap((b) => b.leaves.flatMap((l) => l.entries.map((e) => e.key)))
  .sort(cmpTuple)

// ── 탐색 경로 타입 ────────────────────────────────────────────────────────────

interface SearchPath {
  branchId: string
  leafId: string
  matchKey: number
  rowid: string
}

interface CompositeSearchPath {
  branchId: string
  leafId: string
  matchKey: [number, number]
  rowid: string
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function BTreeSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  const [searchTab, setSearchTab] = useState<'single' | 'composite'>('single')

  // 단일 컬럼 상태
  const [selectedKey, setSelectedKey] = useState<number | null>(null)
  const [visibleStep, setVisibleStep] = useState(0)
  const [path, setPath] = useState<SearchPath | null>(null)

  // 복합 인덱스 상태
  const [selectedCompositeKey, setSelectedCompositeKey] = useState<[number, number] | null>(null)
  const [compositeVisibleStep, setCompositeVisibleStep] = useState(0)
  const [compositePath, setCompositePath] = useState<CompositeSearchPath | null>(null)

  function handleSelectKey(key: number) {
    const resolved = resolveKey(key)
    if (!resolved) return
    setSelectedKey(key)
    setPath(resolved)
    setVisibleStep(0)
    setTimeout(() => setVisibleStep(1), 100)
    setTimeout(() => setVisibleStep(2), 700)
    setTimeout(() => setVisibleStep(3), 1400)
  }

  function handleReset() {
    setSelectedKey(null)
    setPath(null)
    setVisibleStep(0)
  }

  function handleSelectCompositeKey(key: [number, number]) {
    const resolved = resolveCompositeKey(key)
    if (!resolved) return
    setSelectedCompositeKey(key)
    setCompositePath(resolved)
    setCompositeVisibleStep(0)
    setTimeout(() => setCompositeVisibleStep(1), 100)
    setTimeout(() => setCompositeVisibleStep(2), 700)
    setTimeout(() => setCompositeVisibleStep(3), 1400)
  }

  function handleResetComposite() {
    setSelectedCompositeKey(null)
    setCompositePath(null)
    setCompositeVisibleStep(0)
  }

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconBinaryTree size={36} color="#7c3aed" stroke={1.5} />}
        title={t.introTitle}
        subtitle={t.introDesc}
      />

      {/* Balanced 설명 callout */}
      <InfoBox variant="tip">
        <span className="font-bold">{t.introWhyName}</span>
        <span style={{ whiteSpace: 'pre-line' }}>{'\n\n' + t.introWhyNameDesc}</span>
      </InfoBox>

      <Divider />

      {/* 구조 설명 + 다이어그램 */}
      <section>
        <SectionTitle>{t.structureTitle}</SectionTitle>
        <Prose>{t.structureDesc}</Prose>
        <StaticBTreeDiagram lang={lang} path={null} visibleStep={0} />

        {/* 노드 설명 */}
        <div className="mt-6 space-y-4">
          {t.nodeDescs.map((node) => {
            const border = node.color === 'amber' ? 'border-amber-200 bg-amber-50'
              : node.color === 'blue' ? 'border-blue-200 bg-blue-50'
              : 'border-slate-200 bg-slate-50'
            const badge = node.color === 'amber' ? 'bg-amber-200 text-amber-800'
              : node.color === 'blue' ? 'bg-blue-200 text-blue-800'
              : 'bg-slate-200 text-slate-700'
            const termColor = node.color === 'amber' ? 'text-amber-700'
              : node.color === 'blue' ? 'text-blue-700'
              : 'text-slate-600'
            return (
              <div key={node.label} className={`rounded-xl border p-4 ${border}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${badge}`}>{node.label}</span>
                  <span className="text-sm text-muted-foreground">{node.body}</span>
                </div>
                <div className="rounded-lg border border-white/80 bg-white/60 px-3 py-2.5">
                  <span className={`font-mono text-[11px] font-bold ${termColor}`}>{node.sub.term}</span>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{node.sub.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.structurePoints.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="rounded-xl border bg-card p-4">
              <div className="mb-2 text-lg">{p.icon}</div>
              <div className="mb-1 text-xs font-bold">{p.title}</div>
              <p className="text-[11px] leading-snug text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Divider />

      {/* 탐색 경로 시뮬레이션 */}
      <section>
        <SectionTitle>{t.searchTitle}</SectionTitle>
        <Prose>{t.searchDesc}</Prose>

        {/* 탭 */}
        <div className="mb-5 flex gap-1 rounded-xl border bg-muted/40 p-1">
          {(['single', 'composite'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSearchTab(tab)}
              className={[
                'flex-1 rounded-lg px-3 py-2 font-mono text-[11px] font-semibold transition-all',
                searchTab === tab
                  ? 'bg-card text-violet-700 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab === 'single' ? t.tabSingle : t.tabComposite}
            </button>
          ))}
        </div>

        {searchTab === 'single' ? (
          <>
            <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">{t.tabSingleDesc}</p>

            {/* 키값 선택 버튼 */}
            <div className="mb-4">
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t.searchLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_KEYS.map((key) => (
                  <button key={key} onClick={() => handleSelectKey(key)}
                    className={[
                      'rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-all',
                      selectedKey === key
                        ? 'border-violet-400 bg-violet-100 font-bold text-violet-800 shadow-sm'
                        : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground',
                    ].join(' ')}>
                    {key}
                  </button>
                ))}
                {selectedKey !== null && (
                  <button onClick={handleReset}
                    className="rounded-lg border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground">
                    ✕ reset
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="min-w-0 flex-[5]">
                <StaticBTreeDiagram lang={lang} path={path} visibleStep={visibleStep} />
              </div>
              <div className="w-56 shrink-0">
                <SearchStepPanel lang={lang} path={path} visibleStep={visibleStep} />
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-[12px] leading-relaxed text-muted-foreground">{t.tabCompositeDesc}</p>

            {/* 복합 키값 선택 버튼 */}
            <div className="mb-4">
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t.compositeLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_COMPOSITE_KEYS.map((key, i) => {
                  const isSelected = selectedCompositeKey?.[0] === key[0] && selectedCompositeKey?.[1] === key[1]
                  return (
                    <button key={i} onClick={() => handleSelectCompositeKey(key)}
                      className={[
                        'rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition-all',
                        isSelected
                          ? 'border-violet-400 bg-violet-100 font-bold text-violet-800 shadow-sm'
                          : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground',
                      ].join(' ')}>
                      ({key[0]}, {key[1]})
                    </button>
                  )
                })}
                {selectedCompositeKey !== null && (
                  <button onClick={handleResetComposite}
                    className="rounded-lg border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition hover:text-foreground">
                    ✕ reset
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="min-w-0 flex-[5]">
                <CompositeBTreeDiagram lang={lang} path={compositePath} visibleStep={compositeVisibleStep} />
              </div>
              <div className="w-56 shrink-0">
                <CompositeSearchStepPanel lang={lang} path={compositePath} visibleStep={compositeVisibleStep} />
              </div>
            </div>

            <div className="mt-4">
              <InfoBox variant="note">{t.compositeNote}</InfoBox>
            </div>
          </>
        )}
      </section>

      <Divider />

      {/* 오라클이 B-Tree를 기본값으로 쓰는 이유 */}
      <section>
        <SectionTitle>{t.introWhyOracle}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.introReasons.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="rounded-xl border bg-card p-4">
              <div className="mb-2 text-lg">{r.icon}</div>
              <div className="mb-1 text-xs font-bold">{r.title}</div>
              <p className="text-[11px] leading-snug text-muted-foreground">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Clustering Factor */}
      <section>
        <SectionTitle>{t.cfTitle}</SectionTitle>
        <Prose>{t.cfDesc}</Prose>

        <ClusteringFactorDiagram lang={lang} />

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="mb-1 font-mono text-[11px] font-bold text-emerald-700">{lang === 'ko' ? '낮은 CF — 좋음' : 'Low CF — Good'}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t.cfRangeLow}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <p className="mb-1 font-mono text-[11px] font-bold text-rose-700">{lang === 'ko' ? '높은 CF — 나쁨' : 'High CF — Bad'}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t.cfRangeHigh}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.cfHowTitle}</p>
          <Prose>{t.cfHowDesc}</Prose>
        </div>

        <div className="mt-4">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.cfExampleTitle}</p>
          <Prose>{t.cfExampleDesc}</Prose>
          <Table headers={t.cfTableHeaders} rows={t.cfTableRows} />
        </div>

        <div className="mt-5">
          <InfoBox variant="note">
            <strong>{t.cfImpactTitle}</strong>
            <br />
            {t.cfImpactDesc}
          </InfoBox>
        </div>

        <div className="mt-4">
          <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.cfTipQuery}</p>
          <div className="rounded-xl border bg-slate-900 px-4 py-3">
            <pre className="font-mono text-[11px] leading-relaxed text-slate-200">{`SELECT index_name, clustering_factor, num_rows, blocks\nFROM   all_indexes\nWHERE  table_name = 'EMPLOYEES';`}</pre>
          </div>
        </div>
      </section>
    </PageContainer>
  )
}

// ── 공용 블록 렌더러 ──────────────────────────────────────────────────────────

function StaticRootBlock({
  leftmost, entries, active,
}: {
  leftmost: { dba: string }
  entries: { key: number; dba: string }[]
  active: boolean
}) {
  return (
    <div className={[
      'rounded-xl border-2 shadow-sm transition-all duration-300',
      active ? 'border-amber-500 bg-amber-100 shadow-amber-200' : 'border-amber-400 bg-amber-50',
    ].join(' ')}>
      <div className="rounded-t-[10px] bg-amber-200 px-3 py-0.5 text-center font-mono text-[9px] font-bold text-amber-800">ROOT</div>
      <div className="flex border-b border-amber-200 px-2 pt-1">
        <span className="w-24 font-mono text-[8px] font-bold text-amber-500">KEY</span>
        <span className="font-mono text-[8px] font-bold text-amber-500">DBA</span>
      </div>
      <div className="flex items-center gap-1 border-b border-amber-100 px-2 py-0.5">
        <span className="w-24 font-mono text-[9px] italic text-amber-400">leftmost</span>
        <span className="font-mono text-[9px] text-amber-600">{leftmost.dba}</span>
      </div>
      {entries.map((e) => (
        <div key={e.key} className="flex items-center gap-1 px-2 py-0.5">
          <span className="w-24 font-mono text-[10px] font-semibold text-amber-900">{e.key}</span>
          <span className="font-mono text-[9px] text-amber-600">{e.dba}</span>
        </div>
      ))}
      <div className="h-1" />
    </div>
  )
}

function StaticBranchBlock({
  leftmost, entries, active,
}: {
  leftmost: { dba: string }
  entries: { key: number; dba: string }[]
  active: boolean
}) {
  return (
    <div className={[
      'rounded-xl border-2 shadow-sm transition-all duration-300',
      active ? 'border-blue-500 bg-blue-100 shadow-blue-200' : 'border-blue-300 bg-blue-50',
    ].join(' ')}>
      <div className="rounded-t-[10px] bg-blue-200 px-3 py-0.5 text-center font-mono text-[9px] font-bold text-blue-800">BRANCH</div>
      <div className="flex border-b border-blue-200 px-2 pt-1">
        <span className="w-24 font-mono text-[8px] font-bold text-blue-400">KEY</span>
        <span className="font-mono text-[8px] font-bold text-blue-400">DBA</span>
      </div>
      <div className="flex items-center gap-1 border-b border-blue-100 px-2 py-0.5">
        <span className="w-24 font-mono text-[9px] italic text-blue-300">leftmost</span>
        <span className="font-mono text-[9px] text-blue-500">{leftmost.dba}</span>
      </div>
      {entries.map((e) => (
        <div key={e.key} className="flex items-center gap-1 px-2 py-0.5">
          <span className="w-24 font-mono text-[10px] font-semibold text-blue-900">{e.key}</span>
          <span className="font-mono text-[9px] text-blue-500">{e.dba}</span>
        </div>
      ))}
      <div className="h-1" />
    </div>
  )
}

function StaticLeafBlock({
  entries, active, matchKey,
}: {
  entries: { key: number; rowid: string }[]
  active: boolean
  matchKey: number | null
}) {
  return (
    <div className={[
      'rounded-xl border-2 shadow-sm transition-all duration-300',
      active ? 'border-slate-500 bg-slate-100 shadow-slate-200' : 'border-slate-300 bg-white',
    ].join(' ')}>
      <div className="rounded-t-[10px] bg-slate-200 px-3 py-0.5 text-center font-mono text-[9px] font-bold text-slate-600">LEAF</div>
      <div className="flex border-b border-slate-200 px-2 pt-1">
        <span className="w-10 font-mono text-[8px] font-bold text-slate-400">KEY</span>
        <span className="font-mono text-[8px] font-bold text-slate-400">ROWID</span>
      </div>
      {entries.map((e) => {
        const isMatch = active && e.key === matchKey
        return (
          <div key={e.key} className={[
            'flex items-center gap-1 px-2 py-0.5 transition-colors duration-300',
            isMatch ? 'bg-emerald-100' : '',
          ].join(' ')}>
            <span className={['w-10 shrink-0 whitespace-nowrap font-mono text-[10px] font-semibold', isMatch ? 'text-emerald-700' : 'text-slate-700'].join(' ')}>{e.key}</span>
            <span className={['whitespace-nowrap font-mono text-[9px]', isMatch ? 'text-emerald-500' : 'text-slate-400'].join(' ')}>{e.rowid}</span>
          </div>
        )
      })}
      <div className="h-1" />
    </div>
  )
}

// ── 다이어그램 (정적 구조 표시 + 탐색 경로 하이라이트) ───────────────────────

function StaticBTreeDiagram({
  lang, path, visibleStep,
}: {
  lang: 'ko' | 'en'
  path: SearchPath | null
  visibleStep: number
}) {
  const isKo = lang === 'ko'
  const title = isKo ? 'B-Tree 구조 한눈에 보기' : 'B-Tree Structure at a Glance'

  const containerRef = useRef<HTMLDivElement>(null)
  const rootRef      = useRef<HTMLDivElement>(null)
  const branchRefs   = useRef<(HTMLDivElement | null)[]>([])
  const leafRefs     = useRef<(HTMLDivElement | null)[][]>([[], []])

  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; active: boolean }[]>([])

  useEffect(() => {
    function measure() {
      const container = containerRef.current
      const rootEl    = rootRef.current
      if (!container || !rootEl) return

      // offsetParent-relative position: not affected by page scroll
      function pos(el: HTMLElement) {
        let ox = 0, oy = 0
        let cur: HTMLElement | null = el
        while (cur && cur !== container) {
          ox += cur.offsetLeft
          oy += cur.offsetTop
          cur = cur.offsetParent as HTMLElement | null
        }
        return {
          cx:     ox + el.offsetWidth / 2,
          top:    oy,
          bottom: oy + el.offsetHeight,
        }
      }

      const rootPos = pos(rootEl)
      const next: typeof lines = []

      branchRefs.current.forEach((bEl, bi) => {
        if (!bEl) return
        const bPos = pos(bEl)
        const activeLine = visibleStep >= 2 && path?.branchId === STATIC_TREE.branches[bi].id
        next.push({ x1: rootPos.cx, y1: rootPos.bottom, x2: bPos.cx, y2: bPos.top, active: activeLine })

        leafRefs.current[bi]?.forEach((lEl, li) => {
          if (!lEl) return
          const lPos = pos(lEl)
          const activeLeaf = visibleStep >= 3 && path?.leafId === STATIC_TREE.branches[bi].leaves[li].id
          next.push({ x1: bPos.cx, y1: bPos.bottom, x2: lPos.cx, y2: lPos.top, active: activeLeaf })
        })
      })

      setLines(next)
    }

    measure()

    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [path, visibleStep])

  return (
    <div className="overflow-x-auto rounded-2xl border bg-slate-50">
    <div ref={containerRef} className="relative min-w-max px-6 py-5">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.active ? '#7c3aed' : '#cbd5e1'}
            strokeWidth={l.active ? 2 : 1.5}
            strokeDasharray={l.active ? 'none' : undefined}
          />
        ))}
      </svg>

      <p className="relative mb-5 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>

      {/* Root */}
      <div className="relative mb-0 flex justify-center">
        <div ref={rootRef}>
          <StaticRootBlock
            leftmost={STATIC_TREE.root.leftmost}
            entries={STATIC_TREE.root.entries}
            active={visibleStep >= 1}
          />
        </div>
      </div>

      <div className="h-8" />

      {/* Branches + Leaves */}
      <div className="relative flex justify-center gap-16">
        {STATIC_TREE.branches.map((branch, bi) => {
          const branchActive = visibleStep >= 2 && path?.branchId === branch.id
          return (
            <div key={branch.id} className="flex flex-col items-center">
              <div ref={(el) => { branchRefs.current[bi] = el }}>
                <StaticBranchBlock
                  leftmost={branch.leftmost}
                  entries={branch.entries}
                  active={branchActive}
                />
              </div>

              <div className="h-8" />

              <div className="flex items-start">
                {branch.leaves.map((leaf, li) => {
                  const leafActive = visibleStep >= 3 && path?.leafId === leaf.id
                  return (
                    <div key={leaf.id} className="flex items-center">
                      {li > 0 && (
                        <div className="flex flex-col items-center px-1 text-blue-300">
                          <span className="font-mono text-[9px] leading-none">←</span>
                          <span className="font-mono text-[9px] leading-none">→</span>
                        </div>
                      )}
                      <div ref={(el) => { leafRefs.current[bi][li] = el }}>
                        <StaticLeafBlock
                          entries={leaf.entries}
                          active={leafActive}
                          matchKey={leafActive ? path!.matchKey : null}
                        />
                      </div>
                    </div>
                  )
                })}
                {bi < STATIC_TREE.branches.length - 1 && (
                  <div className="flex flex-col items-center self-center px-1 text-blue-300">
                    <span className="font-mono text-[9px] leading-none">←</span>
                    <span className="font-mono text-[9px] leading-none">→</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
    </div>
  )
}

// ── 탐색 단계 설명 패널 ───────────────────────────────────────────────────────

function SearchStepPanel({
  lang, path, visibleStep,
}: {
  lang: 'ko' | 'en'
  path: SearchPath | null
  visibleStep: number
}) {
  const isKo = lang === 'ko'

  if (!path) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="font-mono text-[11px] text-slate-400">
          {isKo ? '← EMPLOYEE_ID를 선택하면\n탐색 경로가 여기에 표시됩니다' : '← Select an EMPLOYEE_ID\nto see the search path here'}
        </p>
      </div>
    )
  }

  // path가 null이 아님을 확정 (위에서 early return)
  const p = path
  const rootEntry = STATIC_TREE.root.entries[0]
  const wentToB0 = p.branchId === 'B0'
  const branch = STATIC_TREE.branches.find((b) => b.id === p.branchId)!

  // Branch에서 어느 Leaf로 갔는지 이유 계산
  const leafIndex = branch.leaves.findIndex((l) => l.id === p.leafId)
  const branchEntries = branch.entries

  function rootReason() {
    if (isKo) {
      return wentToB0
        ? `${p.matchKey} < ${rootEntry.key} → LMC(${branch.id})로 이동`
        : `${p.matchKey} ≥ ${rootEntry.key} → ${branch.id}로 이동`
    }
    return wentToB0
      ? `${p.matchKey} < ${rootEntry.key} → follow LMC to ${branch.id}`
      : `${p.matchKey} ≥ ${rootEntry.key} → follow entry to ${branch.id}`
  }

  function branchReason() {
    if (leafIndex === 0) {
      const firstKey = branchEntries[0]?.key
      return isKo
        ? `${p.matchKey} < ${firstKey} → LMC(${p.leafId})로 이동`
        : `${p.matchKey} < ${firstKey} → follow LMC to ${p.leafId}`
    }
    const prevKey = branchEntries[leafIndex - 1]?.key
    const nextKey = branchEntries[leafIndex]?.key
    if (nextKey === undefined) {
      return isKo
        ? `${p.matchKey} ≥ ${prevKey} → ${p.leafId}로 이동`
        : `${p.matchKey} ≥ ${prevKey} → follow entry to ${p.leafId}`
    }
    return isKo
      ? `${prevKey} ≤ ${p.matchKey} < ${nextKey} → ${p.leafId}로 이동`
      : `${prevKey} ≤ ${p.matchKey} < ${nextKey} → follow entry to ${p.leafId}`
  }

  const steps = [
    {
      step: 1,
      dotColor: 'bg-amber-400',
      label: isKo ? 'Root 블록' : 'Root Block',
      reason: rootReason(),
      detail: isKo ? 'Root의 키값과 비교해 어느 Branch로 내려갈지 결정합니다.' : 'Compare the search key against Root entries to decide which Branch to visit.',
    },
    {
      step: 2,
      dotColor: 'bg-blue-400',
      label: isKo ? `Branch ${p.branchId}` : `Branch ${p.branchId}`,
      reason: branchReason(),
      detail: isKo ? 'Branch의 키값과 비교해 어느 Leaf로 내려갈지 결정합니다.' : 'Compare against Branch entries to decide which Leaf to visit.',
    },
    {
      step: 3,
      dotColor: 'bg-slate-400',
      label: isKo ? `Leaf ${p.leafId}` : `Leaf ${p.leafId}`,
      reason: isKo ? `키값 ${p.matchKey} 발견 → ROWID 획득` : `Key ${p.matchKey} found → ROWID retrieved`,
      detail: isKo ? `ROWID(${p.rowid})로 테이블 블록을 직접 읽어 해당 행을 반환합니다.` : `Oracle uses ROWID (${p.rowid}) to jump directly to the table block and return the row.`,
    },
  ]

  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: visibleStep >= s.step ? 1 : 0.12, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="rounded-xl border bg-card p-3.5">
          <div className="mb-1.5 flex items-center gap-2">
            <div className={`h-2 w-2 shrink-0 rounded-full ${s.dotColor}`} />
            <span className="font-mono text-[11px] font-bold text-foreground">{s.label}</span>
          </div>
          <p className="mb-1 font-mono text-[11px] font-semibold text-violet-700">{s.reason}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{s.detail}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ── 복합 인덱스 블록 렌더러 ───────────────────────────────────────────────────

function CompositeRootBlock({ leftmost, entries, active }: {
  leftmost: { dba: string }
  entries: { key: [number, number]; dba: string }[]
  active: boolean
}) {
  return (
    <div className={[
      'rounded-xl border-2 shadow-sm transition-all duration-300',
      active ? 'border-amber-500 bg-amber-100 shadow-amber-200' : 'border-amber-400 bg-amber-50',
    ].join(' ')}>
      <div className="rounded-t-[10px] bg-amber-200 px-3 py-0.5 text-center font-mono text-[9px] font-bold text-amber-800">ROOT</div>
      <div className="flex border-b border-amber-200 px-2 pt-1">
        <span className="w-28 font-mono text-[8px] font-bold text-amber-500">KEY (DEPT, SAL)</span>
        <span className="font-mono text-[8px] font-bold text-amber-500">DBA</span>
      </div>
      <div className="flex items-center gap-1 border-b border-amber-100 px-2 py-0.5">
        <span className="w-28 font-mono text-[9px] italic text-amber-400">leftmost</span>
        <span className="font-mono text-[9px] text-amber-600">{leftmost.dba}</span>
      </div>
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-1 px-2 py-0.5">
          <span className="w-28 shrink-0 whitespace-nowrap font-mono text-[10px] font-semibold text-amber-900">({e.key[0]}, {e.key[1]})</span>
          <span className="font-mono text-[9px] text-amber-600">{e.dba}</span>
        </div>
      ))}
      <div className="h-1" />
    </div>
  )
}

function CompositeBranchBlock({ leftmost, entries, active }: {
  leftmost: { dba: string }
  entries: { key: [number, number]; dba: string }[]
  active: boolean
}) {
  return (
    <div className={[
      'rounded-xl border-2 shadow-sm transition-all duration-300',
      active ? 'border-blue-500 bg-blue-100 shadow-blue-200' : 'border-blue-300 bg-blue-50',
    ].join(' ')}>
      <div className="rounded-t-[10px] bg-blue-200 px-3 py-0.5 text-center font-mono text-[9px] font-bold text-blue-800">BRANCH</div>
      <div className="flex border-b border-blue-200 px-2 pt-1">
        <span className="w-28 font-mono text-[8px] font-bold text-blue-400">KEY (DEPT, SAL)</span>
        <span className="font-mono text-[8px] font-bold text-blue-400">DBA</span>
      </div>
      <div className="flex items-center gap-1 border-b border-blue-100 px-2 py-0.5">
        <span className="w-28 font-mono text-[9px] italic text-blue-300">leftmost</span>
        <span className="font-mono text-[9px] text-blue-500">{leftmost.dba}</span>
      </div>
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-1 px-2 py-0.5">
          <span className="w-28 shrink-0 whitespace-nowrap font-mono text-[10px] font-semibold text-blue-900">({e.key[0]}, {e.key[1]})</span>
          <span className="font-mono text-[9px] text-blue-500">{e.dba}</span>
        </div>
      ))}
      <div className="h-1" />
    </div>
  )
}

function CompositeLeafBlock({ entries, active, matchKey }: {
  entries: { key: [number, number]; rowid: string }[]
  active: boolean
  matchKey: [number, number] | null
}) {
  return (
    <div className={[
      'rounded-xl border-2 shadow-sm transition-all duration-300',
      active ? 'border-slate-500 bg-slate-100 shadow-slate-200' : 'border-slate-300 bg-white',
    ].join(' ')}>
      <div className="rounded-t-[10px] bg-slate-200 px-3 py-0.5 text-center font-mono text-[9px] font-bold text-slate-600">LEAF</div>
      <div className="flex border-b border-slate-200 px-2 pt-1">
        <span className="w-16 font-mono text-[8px] font-bold text-slate-400">KEY</span>
        <span className="font-mono text-[8px] font-bold text-slate-400">ROWID</span>
      </div>
      {entries.map((e, i) => {
        const isMatch = active && matchKey !== null && cmpTuple(e.key, matchKey) === 0
        return (
          <div key={i} className={['flex items-center gap-1 whitespace-nowrap px-2 py-0.5 transition-colors duration-300', isMatch ? 'bg-emerald-100' : ''].join(' ')}>
            <span className={['w-16 shrink-0 font-mono text-[9px] font-semibold', isMatch ? 'text-emerald-700' : 'text-slate-700'].join(' ')}>
              ({e.key[0]},{e.key[1]})
            </span>
            <span className={['font-mono text-[9px]', isMatch ? 'text-emerald-500' : 'text-slate-400'].join(' ')}>{e.rowid}</span>
          </div>
        )
      })}
      <div className="h-1" />
    </div>
  )
}

// ── 복합 인덱스 다이어그램 ────────────────────────────────────────────────────

function CompositeBTreeDiagram({ lang, path, visibleStep }: {
  lang: 'ko' | 'en'
  path: CompositeSearchPath | null
  visibleStep: number
}) {
  const title = lang === 'ko' ? '복합 인덱스 (DEPT_ID, SALARY)' : 'Composite Index (DEPT_ID, SALARY)'

  const containerRef = useRef<HTMLDivElement>(null)
  const rootRef      = useRef<HTMLDivElement>(null)
  const branchRefs   = useRef<(HTMLDivElement | null)[]>([])
  const leafRefs     = useRef<(HTMLDivElement | null)[][]>([[], []])

  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; active: boolean }[]>([])

  useEffect(() => {
    function measure() {
      const container = containerRef.current
      const rootEl    = rootRef.current
      if (!container || !rootEl) return

      function pos(el: HTMLElement) {
        let ox = 0, oy = 0
        let cur: HTMLElement | null = el
        while (cur && cur !== container) {
          ox += cur.offsetLeft
          oy += cur.offsetTop
          cur = cur.offsetParent as HTMLElement | null
        }
        return { cx: ox + el.offsetWidth / 2, top: oy, bottom: oy + el.offsetHeight }
      }

      const rootPos = pos(rootEl)
      const next: typeof lines = []

      branchRefs.current.forEach((bEl, bi) => {
        if (!bEl) return
        const bPos = pos(bEl)
        const activeLine = visibleStep >= 2 && path?.branchId === COMPOSITE_TREE.branches[bi].id
        next.push({ x1: rootPos.cx, y1: rootPos.bottom, x2: bPos.cx, y2: bPos.top, active: activeLine })

        leafRefs.current[bi]?.forEach((lEl, li) => {
          if (!lEl) return
          const lPos = pos(lEl)
          const activeLeaf = visibleStep >= 3 && path?.leafId === COMPOSITE_TREE.branches[bi].leaves[li].id
          next.push({ x1: bPos.cx, y1: bPos.bottom, x2: lPos.cx, y2: lPos.top, active: activeLeaf })
        })
      })

      setLines(next)
    }

    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [path, visibleStep])

  return (
    <div className="overflow-x-auto rounded-2xl border bg-slate-50">
      <div ref={containerRef} className="relative min-w-max px-6 py-5">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {lines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={l.active ? '#7c3aed' : '#cbd5e1'}
              strokeWidth={l.active ? 2 : 1.5}
            />
          ))}
        </svg>

        <p className="relative mb-5 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>

        <div className="relative mb-0 flex justify-center">
          <div ref={rootRef}>
            <CompositeRootBlock
              leftmost={COMPOSITE_TREE.root.leftmost}
              entries={COMPOSITE_TREE.root.entries}
              active={visibleStep >= 1}
            />
          </div>
        </div>

        <div className="h-8" />

        <div className="relative flex justify-center gap-16">
          {COMPOSITE_TREE.branches.map((branch, bi) => {
            const branchActive = visibleStep >= 2 && path?.branchId === branch.id
            return (
              <div key={branch.id} className="flex flex-col items-center">
                <div ref={(el) => { branchRefs.current[bi] = el }}>
                  <CompositeBranchBlock
                    leftmost={branch.leftmost}
                    entries={branch.entries}
                    active={branchActive}
                  />
                </div>
                <div className="h-8" />
                <div className="flex items-start">
                  {branch.leaves.map((leaf, li) => {
                    const leafActive = visibleStep >= 3 && path?.leafId === leaf.id
                    return (
                      <div key={leaf.id} className="flex items-center">
                        {li > 0 && (
                          <div className="flex flex-col items-center px-1 text-blue-300">
                            <span className="font-mono text-[9px] leading-none">←</span>
                            <span className="font-mono text-[9px] leading-none">→</span>
                          </div>
                        )}
                        <div ref={(el) => { leafRefs.current[bi][li] = el }}>
                          <CompositeLeafBlock
                            entries={leaf.entries}
                            active={leafActive}
                            matchKey={leafActive ? path!.matchKey : null}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {bi < COMPOSITE_TREE.branches.length - 1 && (
                    <div className="flex flex-col items-center self-center px-1 text-blue-300">
                      <span className="font-mono text-[9px] leading-none">←</span>
                      <span className="font-mono text-[9px] leading-none">→</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── 복합 인덱스 탐색 단계 설명 패널 ──────────────────────────────────────────

function CompositeSearchStepPanel({ lang, path, visibleStep }: {
  lang: 'ko' | 'en'
  path: CompositeSearchPath | null
  visibleStep: number
}) {
  const isKo = lang === 'ko'

  if (!path) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
        <p className="font-mono text-[11px] text-slate-400">
          {isKo ? '← (DEPT_ID, SALARY)를\n선택하면 경로가 표시됩니다' : '← Select a (DEPT_ID, SALARY)\nto see the path'}
        </p>
      </div>
    )
  }

  const p = path
  const rootEntry = COMPOSITE_TREE.root.entries[0]
  const wentToB0 = p.branchId === 'B0'
  const branch = COMPOSITE_TREE.branches.find((b) => b.id === p.branchId)!
  const leafIndex = branch.leaves.findIndex((l) => l.id === p.leafId)
  const branchEntries = branch.entries

  // 튜플 표기 헬퍼
  function fmt(k: [number, number]) { return `(${k[0]}, ${k[1]})` }

  function rootReason() {
    const cmp = cmpTuple(p.matchKey, rootEntry.key)
    if (isKo) {
      return wentToB0
        ? `${fmt(p.matchKey)} < ${fmt(rootEntry.key)} → LMC(${branch.id})로 이동`
        : `${fmt(p.matchKey)} ≥ ${fmt(rootEntry.key)} → ${branch.id}로 이동`
    }
    return cmp < 0
      ? `${fmt(p.matchKey)} < ${fmt(rootEntry.key)} → follow LMC to ${branch.id}`
      : `${fmt(p.matchKey)} ≥ ${fmt(rootEntry.key)} → follow entry to ${branch.id}`
  }

  function branchReason() {
    if (leafIndex === 0) {
      const firstKey = branchEntries[0]?.key
      return isKo
        ? `${fmt(p.matchKey)} < ${fmt(firstKey)} → LMC(${p.leafId})로 이동`
        : `${fmt(p.matchKey)} < ${fmt(firstKey)} → follow LMC to ${p.leafId}`
    }
    const prevKey = branchEntries[leafIndex - 1]?.key
    const nextKey = branchEntries[leafIndex]?.key
    if (nextKey === undefined) {
      return isKo
        ? `${fmt(p.matchKey)} ≥ ${fmt(prevKey)} → ${p.leafId}로 이동`
        : `${fmt(p.matchKey)} ≥ ${fmt(prevKey)} → follow entry to ${p.leafId}`
    }
    return isKo
      ? `${fmt(prevKey)} ≤ ${fmt(p.matchKey)} < ${fmt(nextKey)} → ${p.leafId}로 이동`
      : `${fmt(prevKey)} ≤ ${fmt(p.matchKey)} < ${fmt(nextKey)} → follow entry to ${p.leafId}`
  }

  // 첫 번째 컬럼 비교 결과를 설명에 녹임
  const dept = p.matchKey[0]
  const sal  = p.matchKey[1]
  const rootDept = rootEntry.key[0]
  const rootCmpDetail = isKo
    ? `DEPT_ID ${dept} ${dept < rootDept ? '<' : '≥'} ${rootDept}${dept === rootDept ? `, SALARY ${sal} 추가 비교` : ''}`
    : `DEPT_ID ${dept} ${dept < rootDept ? '<' : '≥'} ${rootDept}${dept === rootDept ? `, also compare SALARY ${sal}` : ''}`

  const steps = [
    {
      step: 1,
      dotColor: 'bg-amber-400',
      label: isKo ? 'Root 블록' : 'Root Block',
      reason: rootReason(),
      detail: rootCmpDetail,
    },
    {
      step: 2,
      dotColor: 'bg-blue-400',
      label: `Branch ${p.branchId}`,
      reason: branchReason(),
      detail: isKo ? 'Branch의 복합 키값과 순서대로 비교해 Leaf를 결정합니다.' : 'Compare composite keys in order to determine the Leaf.',
    },
    {
      step: 3,
      dotColor: 'bg-slate-400',
      label: `Leaf ${p.leafId}`,
      reason: isKo ? `${fmt(p.matchKey)} 발견 → ROWID 획득` : `${fmt(p.matchKey)} found → ROWID retrieved`,
      detail: isKo ? `ROWID(${p.rowid})로 테이블 블록을 직접 읽습니다.` : `Oracle uses ROWID (${p.rowid}) to jump directly to the table block.`,
    },
  ]

  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: visibleStep >= s.step ? 1 : 0.12, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="rounded-xl border bg-card p-3.5">
          <div className="mb-1.5 flex items-center gap-2">
            <div className={`h-2 w-2 shrink-0 rounded-full ${s.dotColor}`} />
            <span className="font-mono text-[11px] font-bold text-foreground">{s.label}</span>
          </div>
          <p className="mb-1 font-mono text-[11px] font-semibold text-violet-700">{s.reason}</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{s.detail}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ── Clustering Factor Diagram ─────────────────────────────────────────────────

function ClusteringFactorDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'

  // SVG 레이아웃 상수 — 의존 관계 순서대로 선언
  const W = 580
  const ENTRY_H = 20      // 엔트리 한 행 높이
  const HEADER_H = 24     // Leaf 블록 헤더 높이
  const N = 7             // 엔트리 수
  const LEAF_H = HEADER_H + N * ENTRY_H + 8
  const LEAF_W = 115
  const LEAF_Y = 40

  const LEFT_LEAF_X = 20
  const RIGHT_LEAF_X = 310

  const TBL_W = 82
  const TBL_H = 38
  const TBL_Y = LEAF_Y + LEAF_H + 40   // Leaf 아래 여백 40px
  const H = TBL_Y + TBL_H + 30         // 하단 여백 30px

  // 인덱스 엔트리
  const lowCfEntries  = ['Abel','Ande','Atkinson','Austin','Baer','Bissot','Bloom']
  const lowCfBlocks   = [1, 1, 1, 1, 1, 2, 2]
  const highCfEntries = ['100','101','102','103','104','105','106']
  const highCfBlocks  = [2, 1, 2, 1, 2, 1, 2]

  const GOOD = '#10b981'
  const BAD  = '#ef4444'
  const B1F  = '#dbeafe'; const B1S = '#93c5fd'
  const B2F  = '#fce7f3'; const B2S = '#f9a8d4'

  function rowY(i: number, leafY: number) {
    return leafY + HEADER_H + i * ENTRY_H + ENTRY_H / 2 + 2
  }

  function renderSide(
    leafX: number,
    entries: string[],
    blocks: number[],
    cf: number,
    titleLabel: string,
    arrowColor: string,
  ) {
    // 테이블 블록 — 두 블록을 leaf 아래 나란히 배치, gap 10px
    const tbl1X = leafX
    const tbl2X = leafX + TBL_W + 10
    const b1cx  = tbl1X + TBL_W / 2
    const b2cx  = tbl2X + TBL_W / 2
    const leafRight = leafX + LEAF_W

    return (
      <g>
        {/* 제목 */}
        <text x={leafX + (TBL_W * 2 + 10) / 2} y={LEAF_Y - 22}
          textAnchor="middle" fontSize={11} fontWeight="bold"
          fill={arrowColor === GOOD ? '#047857' : '#b91c1c'}>
          {titleLabel}
        </text>
        <text x={leafX + (TBL_W * 2 + 10) / 2} y={LEAF_Y - 8}
          textAnchor="middle" fontSize={10} fill="#94a3b8">
          CF = {cf}
        </text>

        {/* Leaf 블록 배경 */}
        <rect x={leafX} y={LEAF_Y} width={LEAF_W} height={LEAF_H}
          rx={6} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} />
        {/* Leaf 헤더 */}
        <rect x={leafX} y={LEAF_Y} width={LEAF_W} height={HEADER_H}
          rx={6} fill="#e2e8f0" />
        <rect x={leafX} y={LEAF_Y + HEADER_H / 2} width={LEAF_W} height={HEADER_H / 2} fill="#e2e8f0" />
        <text x={leafX + LEAF_W / 2} y={LEAF_Y + 16}
          textAnchor="middle" fontSize={9} fontWeight="bold" fill="#475569">
          {isKo ? 'Index Leaf' : 'Index Leaf'}
        </text>
        {/* 헤더 구분선 */}
        <line x1={leafX} y1={LEAF_Y + HEADER_H}
          x2={leafX + LEAF_W} y2={LEAF_Y + HEADER_H} stroke="#cbd5e1" strokeWidth={1} />

        {/* 엔트리 행 */}
        {entries.map((key, i) => {
          const y = rowY(i, LEAF_Y)
          const blockFill = blocks[i] === 1 ? B1F : B2F
          return (
            <g key={i}>
              <text x={leafX + 8} y={y + 4} fontSize={9} fill="#334155">{key}</text>
              <rect x={leafRight - 30} y={y - 8} width={24} height={15} rx={3} fill={blockFill} />
              <text x={leafRight - 18} y={y + 3}
                textAnchor="middle" fontSize={8} fontWeight="bold"
                fill={blocks[i] === 1 ? '#1d4ed8' : '#9d174d'}>
                B{blocks[i]}
              </text>
            </g>
          )
        })}

        {/* 테이블 블록 1 */}
        <rect x={tbl1X} y={TBL_Y} width={TBL_W} height={TBL_H}
          rx={6} fill={B1F} stroke={B1S} strokeWidth={1.5} />
        <text x={b1cx} y={TBL_Y + 15}
          textAnchor="middle" fontSize={9} fontWeight="bold" fill="#1d4ed8">
          {isKo ? '블록 1' : 'Block 1'}
        </text>
        <text x={b1cx} y={TBL_Y + 28}
          textAnchor="middle" fontSize={8} fill="#3b82f6">
          (Abel~Baer)
        </text>

        {/* 테이블 블록 2 */}
        <rect x={tbl2X} y={TBL_Y} width={TBL_W} height={TBL_H}
          rx={6} fill={B2F} stroke={B2S} strokeWidth={1.5} />
        <text x={b2cx} y={TBL_Y + 15}
          textAnchor="middle" fontSize={9} fontWeight="bold" fill="#9d174d">
          {isKo ? '블록 2' : 'Block 2'}
        </text>
        <text x={b2cx} y={TBL_Y + 28}
          textAnchor="middle" fontSize={8} fill="#db2777">
          (Bissot~)
        </text>

        {/* 화살표: 엔트리 → 테이블 블록 */}
        {entries.map((_, i) => {
          const startY = rowY(i, LEAF_Y) - 2
          const targetX = blocks[i] === 1 ? b1cx : b2cx
          return (
            <line key={i}
              x1={leafRight} y1={startY}
              x2={targetX} y2={TBL_Y}
              stroke={arrowColor} strokeWidth={1.1} strokeDasharray="3,2"
              markerEnd={`url(#cf-arr-${arrowColor === GOOD ? 'g' : 'b'})`}
            />
          )
        })}
      </g>
    )
  }

  return (
    <div className="my-4 overflow-x-auto rounded-xl border bg-slate-50 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto"
        aria-label={isKo ? 'Clustering Factor 비교 다이어그램' : 'Clustering Factor comparison diagram'}>
        <defs>
          <marker id="cf-arr-g" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill={GOOD} />
          </marker>
          <marker id="cf-arr-b" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill={BAD} />
          </marker>
        </defs>

        {/* 세로 구분선 */}
        <line x1={W / 2} y1={8} x2={W / 2} y2={H - 18}
          stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="5,3" />

        {renderSide(
          LEFT_LEAF_X, lowCfEntries, lowCfBlocks, 2,
          isKo ? 'EMP_NAME_IX (낮은 CF — 좋음)' : 'EMP_NAME_IX (Low CF — Good)',
          GOOD,
        )}

        {renderSide(
          RIGHT_LEAF_X, highCfEntries, highCfBlocks, 19,
          isKo ? 'EMP_EMP_ID_PK (높은 CF — 나쁨)' : 'EMP_EMP_ID_PK (High CF — Bad)',
          BAD,
        )}

        {/* 범례 */}
        <rect x={40} y={H - 18} width={9} height={9} rx={2} fill={B1F} stroke={B1S} strokeWidth={1} />
        <text x={53} y={H - 11} fontSize={9} fill="#64748b">{isKo ? '블록 1' : 'Block 1'}</text>
        <rect x={105} y={H - 18} width={9} height={9} rx={2} fill={B2F} stroke={B2S} strokeWidth={1} />
        <text x={118} y={H - 11} fontSize={9} fill="#64748b">{isKo ? '블록 2' : 'Block 2'}</text>
        <line x1={175} y1={H - 14} x2={190} y2={H - 14} stroke={GOOD} strokeWidth={1.5} strokeDasharray="3,2" />
        <text x={194} y={H - 11} fontSize={9} fill="#059669">{isKo ? '집중 I/O (낮은 CF)' : 'Clustered I/O'}</text>
        <line x1={330} y1={H - 14} x2={345} y2={H - 14} stroke={BAD} strokeWidth={1.5} strokeDasharray="3,2" />
        <text x={349} y={H - 11} fontSize={9} fill="#dc2626">{isKo ? '분산 I/O (높은 CF)' : 'Scattered I/O'}</text>
      </svg>
    </div>
  )
}
