import { motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { SectionTitle, SubTitle, Prose, InfoBox } from '../../shared'

function Divider() {
  return <div className="my-12 border-t" />
}

// ── Translations ──────────────────────────────────────────────────────────────

const T = {
  ko: {
    whatTitle: '인덱스란?',
    whatDesc:
      '인덱스는 테이블(또는 테이블 클러스터)에 딸려 있는 선택적인 구조예요. 원할 때 만들고, 필요 없으면 지울 수 있죠. 인덱스를 만들거나 지워도 테이블 안의 데이터에는 아무런 영향이 없어요. 그저 데이터를 더 빨리 찾을 수 있도록 도와주는 역할을 합니다.',
    whatAnalogyTitle: '이해하기 쉬운 비유 — HR 매니저의 파일 박스',
    whatAnalogyDesc:
      '인사 담당자가 직원 폴더를 여러 개의 박스에 아무렇게나 넣어 두었다고 상상해보세요. Whalen(직원 번호 200)을 찾으려면 모든 박스를 처음부터 하나씩 뒤져야 해요. 정말 귀찮겠죠?\n\n인덱스는 바로 이 문제를 해결해줍니다. 모든 직원 번호와 그 폴더 위치를 미리 정리된 목록으로 만들어 두는 거예요:\n  ID 100 → Box 3, 1번째\n  ID 101 → Box 7, 8번째\n  ID 200 → Box 1, 10번째\n\n이제 Whalen을 찾고 싶다면 목록에서 200번을 찾아 "Box 1, 10번째"로 바로 달려가면 됩니다!',
    whatHeapTitle: '인덱스가 없으면 어떻게 될까?',
    whatHeapDesc:
      '인덱스가 없는 테이블에서 값을 찾으려면 Full Table Scan(테이블 전체 읽기)을 해야 해요. 예를 들어, 인덱스가 없는 hr.departments 테이블에서 location 2700을 찾으면 모든 블록의 모든 행을 처음부터 끝까지 읽어야 합니다. 데이터가 많아질수록 이 방식은 엄청나게 느려지죠.\n\n오라클의 일반 테이블은 힙(heap) 구조예요. "heap"은 그냥 빈 자리가 있으면 거기에 데이터를 넣는 방식이라서, 데이터가 논리적인 순서 없이 이리저리 흩어져 저장됩니다.',
    whatPoints: [
      { icon: '🔗', text: '테이블과 완전히 독립되어 있어요 — 인덱스를 만들거나 지워도 테이블 데이터는 전혀 바뀌지 않습니다' },
      { icon: '⚡', text: '속도에만 영향을 줘요 — 인덱스가 있든 없든 조회 결과는 똑같고, 빠르기만 달라집니다' },
      { icon: '🔄', text: 'DML(Data Manipulation Language, INSERT/UPDATE/DELETE)이 일어날 때마다 Oracle이 인덱스를 자동으로 갱신해줍니다' },
      { icon: '🤖', text: 'Oracle 19c부터는 자동 인덱싱(Automated Indexing)을 지원해요 — 실제 사용 패턴을 보고 인덱스를 알아서 만들고 관리해줍니다' },
    ],

    whenTitle: '인덱스를 만들어야 할 때',
    whenItems: [
      {
        ok: true,
        title: '해당 컬럼을 자주 조회하고, 결과 행이 전체의 일부일 때',
        desc: '인덱스가 걸린 컬럼을 자주 찾는데 결과 행이 전체의 일부에 불과하다면, 인덱스 스캔이 Full Table Scan(테이블 전체 읽기)보다 훨씬 빨라요. 찾는 행이 적을수록(선택도가 낮을수록) 인덱스 효과가 더 크게 나타납니다.',
        example: 'WHERE employee_id = 145  -- 1행만 반환',
      },
      {
        ok: true,
        title: 'FK(Foreign Key, 외래 키) 컬럼',
        desc: '부모 테이블의 행이 삭제되거나 수정될 때, Oracle은 자식 테이블에 연결된 행이 있는지 확인해야 해요. FK 컬럼에 인덱스가 없으면 자식 테이블 전체에 자물쇠(Full Table Lock)가 걸려서 여러 사람이 동시에 작업하기가 어려워집니다. FK 컬럼에는 꼭 인덱스를 만들어 주세요!',
        example: 'FOREIGN KEY (department_id) REFERENCES departments(department_id)',
      },
      {
        ok: false,
        title: '쿼리가 테이블 행 대부분을 가져올 때',
        desc: '인덱스를 통해 블록을 하나하나 찾아가면 오히려 Full Table Scan(테이블 전체 읽기)보다 I/O가 더 많아질 수 있어요. 전체 행의 상당 부분을 읽어야 한다면 그냥 처음부터 끝까지 쭉 읽는 게 더 빠릅니다.',
        example: 'WHERE salary > 1000  -- 대부분의 행이 해당',
      },
      {
        ok: false,
        title: 'DML(Data Manipulation Language, INSERT/UPDATE/DELETE)이 매우 잦은 테이블',
        desc: '인덱스가 있으면 데이터를 추가·수정·삭제할 때마다 인덱스도 함께 업데이트해야 해서 속도가 느려져요. 인덱스가 많을수록 이 부담도 커집니다. 쓰기 작업이 굉장히 많은 테이블이라면 인덱스를 최대한 줄이는 게 좋아요.',
        example: '수백 행 미만의 코드 테이블 또는 대량 INSERT가 잦은 로그 테이블',
      },
    ],
    whenOk: '인덱스 생성 권장',
    whenNo: '인덱스 생성 비권장',

    costTitle: '인덱스를 쓰면 드는 비용',
    costItems: [
      { icon: '💾', title: '디스크 공간', desc: '인덱스는 테이블과 별도로 저장 공간을 차지해요. 테이블과 다른 테이블스페이스에 저장할 수도 있습니다.' },
      { icon: '🔄', title: 'DML(Data Manipulation Language) 오버헤드', desc: 'INSERT, UPDATE, DELETE 할 때마다 인덱스도 함께 갱신해야 해요. 인덱스가 많을수록 쓰기 속도가 느려집니다.' },
      { icon: '🧠', title: '옵티마이저(Optimizer) 부담', desc: '인덱스가 많아지면 옵티마이저가 최적의 실행 방법을 고르는 데 더 오래 걸려요.' },
    ],
    optimizerNote: '옵티마이저(Optimizer)란 SQL을 실행하기 전에 "어떤 순서로, 어떤 방법으로 데이터를 읽을지" 를 결정해주는 Oracle의 핵심 엔진이에요. 인덱스가 많을수록 선택지도 늘어나서 결정하는 데 시간이 더 걸립니다. 옵티마이저에 대해서는 뒤에 나오는 챕터에서 자세히 다룰 거예요!',

    stateTitle: '인덱스 상태',
    stateDesc: '인덱스에는 두 가지 독립적인 상태가 있어요. 하나는 Usability(DML로 인덱스를 계속 갱신할지 여부)이고, 다른 하나는 Visibility(옵티마이저가 이 인덱스를 사용할지 여부)예요. Unusable 상태의 인덱스는 옵티마이저가 무시하고 DML 갱신도 하지 않아요. 대량 데이터를 빠르게 넣어야 할 때, 인덱스를 아예 지웠다가 다시 만드는 대신 Unusable로 바꿨다가 재구성하는 방법을 쓰기도 합니다.',
    usabilityRows: [
      { state: 'Usable', dml: '✓ 갱신', optimizer: '✓ 사용', space: '✓ 소비', badge: 'emerald', use: '정상 운영' },
      { state: 'Unusable', dml: '✗ 갱신 안 함', optimizer: '✗ 무시', space: '✗ 없음', badge: 'rose', use: '대량 데이터 로드 성능 향상용' },
    ],
    visibilityRows: [
      { state: 'Visible', dml: '✓ 갱신', optimizer: '✓ 사용', space: '✓ 소비', badge: 'emerald', use: '정상 운영' },
      { state: 'Invisible', dml: '✓ 갱신', optimizer: '✗ 무시', space: '✓ 소비', badge: 'amber', use: '삭제 전 영향 미리 테스트용' },
    ],
    stateHeaderAspect: '상태',
    stateHeaderDml: 'DML 갱신',
    stateHeaderOpt: '옵티마이저',
    stateHeaderSpace: '공간',
    stateHeaderUse: '용도',

    typesTitle: '인덱스 종류 한눈에 보기',
    types: [
      { name: 'B-Tree Index',           color: 'violet',  icon: '🌲', badge: '기본값', desc: '가장 흔하게 쓰이는 인덱스예요. Root → Branch → Leaf로 이어지는 균형 잡힌 트리 구조로, 웬만한 상황에서는 이걸 쓰면 됩니다.' },
      { name: 'Bitmap Index',           color: 'emerald', icon: '🗺️', badge: 'DW',    desc: '값의 종류가 아주 적은 컬럼에 어울려요. 비트(0/1) 연산으로 여러 조건을 한꺼번에 처리할 수 있습니다.' },
      { name: 'Function-Based Index',   color: 'orange',  icon: 'ƒ',  badge: 'FBI',   desc: '함수나 표현식의 결과값을 키로 저장해요. 대소문자 구분 없이 검색할 때 자주 활용됩니다.' },
      { name: 'Composite Index',        color: 'purple',  icon: '⊕',  badge: '복합',  desc: '컬럼 2개 이상을 묶어서 하나의 인덱스로 만들어요. WHERE 조건에 첫 번째 컬럼이 꼭 포함되어야 효과가 있습니다.' },
      { name: 'Reverse Key Index',      color: 'rose',    icon: '↔',  badge: 'RAC',   desc: '키 값을 거꾸로 뒤집어서 저장해요. 숫자가 순서대로 증가하는 값들이 특정 블록에 몰리는 현상을 막아줍니다.' },
      { name: 'Index-Organized Table',  color: 'amber',   icon: '⬡',  badge: 'IOT',   desc: '테이블 자체가 B-Tree 인덱스 구조로 이루어져 있어요. 기본 키로만 조회하는 테이블에 딱 맞습니다.' },
    ],

  },
  en: {
    whatTitle: 'What is an Index?',
    whatDesc:
      'An index is an optional structure, associated with a table or table cluster, that can sometimes speed data access. Indexes are schema objects that are logically and physically independent of the data in the objects with which they are associated. Thus, you can drop or create an index without physically affecting the indexed table.',
    whatAnalogyTitle: 'The Official Analogy — HR Manager\'s File Boxes',
    whatAnalogyDesc:
      'Imagine an HR manager who stores employee folders in a set of boxes at random. To find Whalen (employee ID 200), the manager must search through every box in sequence.\n\nAn index solves this by maintaining a sorted list of every employee ID with its folder location:\n  ID 100 → Box 3, position 1\n  ID 101 → Box 7, position 8\n  ID 200 → Box 1, position 10\n\nNow finding Whalen means looking up 200 in the list and going directly to "Box 1, position 10."',
    whatHeapTitle: 'What happens without an index?',
    whatHeapDesc:
      'If a heap-organized table has no indexes, the database must perform a full table scan to find a value. For example, a query of location 2700 in the unindexed hr.departments table requires the database to search every row in every block. This approach does not scale well as data volumes increase.\n\nA standard Oracle table is heap-organized: rows are inserted wherever free space is available, with no guaranteed sort order. Physical storage order has no relation to logical data order.',
    whatPoints: [
      { icon: '🔗', text: 'Logically and physically independent from the table — creating or dropping an index never touches the table data' },
      { icon: '⚡', text: 'Affects only the speed of execution — query results are identical with or without an index' },
      { icon: '🔄', text: 'Automatically maintained by Oracle on every DML (INSERT / UPDATE / DELETE) — no user action required' },
      { icon: '🤖', text: 'Starting with Oracle 19c, Automated Indexing monitors the workload and creates or manages indexes automatically' },
    ],

    whenTitle: 'When to Create an Index',
    whenItems: [
      {
        ok: true,
        title: 'The indexed columns are queried frequently and return a small percentage of rows',
        desc: 'When a query selects a low percentage of rows (low selectivity), an index scan is far cheaper than a Full Table Scan. The lower the selectivity — the fewer rows returned — the more an index helps.',
        example: 'WHERE employee_id = 145  -- returns 1 row',
      },
      {
        ok: true,
        title: 'Referential integrity (foreign key) columns',
        desc: 'When a parent row is deleted or updated, Oracle must verify no child rows reference it. Without an index on the FK column, Oracle acquires a full table lock on the child table, severely hurting concurrency. Always index foreign key columns.',
        example: 'FOREIGN KEY (department_id) REFERENCES departments(department_id)',
      },
      {
        ok: false,
        title: 'Queries that return most rows of the table',
        desc: 'Accessing blocks individually through an index generates more I/O than a single sequential Full Table Scan when a large fraction of rows matches. The optimizer will often prefer a full scan in this case.',
        example: 'WHERE salary > 1000  -- matches most rows',
      },
      {
        ok: false,
        title: 'Tables with very frequent DML',
        desc: 'Every INSERT, UPDATE, and DELETE must update all indexes on the table. The more indexes, the higher the write overhead. On tables with heavy DML, minimizing index count is often better than maximizing read optimization.',
        example: 'High-frequency log tables or small code lookup tables',
      },
    ],
    whenOk: 'Recommended',
    whenNo: 'Not Recommended',

    costTitle: 'The Cost of Indexes',
    costItems: [
      { icon: '💾', title: 'Disk Space', desc: 'Each index is a separate segment and occupies its own storage. It can be placed in a different tablespace from the table.' },
      { icon: '🔄', title: 'DML Overhead', desc: 'Every INSERT, UPDATE, and DELETE must also update all indexes on the table. The more indexes, the higher the write cost.' },
      { icon: '🧠', title: 'Optimizer Overhead', desc: 'More indexes give the optimizer more execution paths to evaluate, which increases parse time.' },
    ],
    optimizerNote: 'The Optimizer is Oracle\'s core engine that decides how to execute a SQL statement — which path to take, which indexes to use, and in what order to read data. The more indexes exist, the more choices it has to evaluate. We\'ll cover the Optimizer in depth in a later chapter.',

    stateTitle: 'Index States',
    stateDesc: 'An index has two independent state dimensions: Usability (whether DML maintains it) and Visibility (whether the optimizer uses it). An unusable index, which is ignored by the optimizer, is not maintained by DML operations. Instead of dropping an index and later re-creating it, you can make it unusable and then rebuild it — useful for improving bulk load performance.',
    usabilityRows: [
      { state: 'Usable', dml: '✓ Maintained', optimizer: '✓ Used', space: '✓ Consumed', badge: 'emerald', use: 'Normal operation' },
      { state: 'Unusable', dml: '✗ Not maintained', optimizer: '✗ Ignored', space: '✗ None', badge: 'rose', use: 'Speed up bulk loads' },
    ],
    visibilityRows: [
      { state: 'Visible', dml: '✓ Maintained', optimizer: '✓ Used', space: '✓ Consumed', badge: 'emerald', use: 'Normal operation' },
      { state: 'Invisible', dml: '✓ Maintained', optimizer: '✗ Ignored', space: '✓ Consumed', badge: 'amber', use: 'Test before dropping' },
    ],
    stateHeaderAspect: 'State',
    stateHeaderDml: 'DML',
    stateHeaderOpt: 'Optimizer',
    stateHeaderSpace: 'Space',
    stateHeaderUse: 'Use Case',

    typesTitle: 'Index Types at a Glance',
    types: [
      { name: 'B-Tree Index',           color: 'violet',  icon: '🌲', badge: 'Default', desc: 'The most common index type. Uses a balanced Root → Branch → Leaf tree structure and works well in most situations.' },
      { name: 'Bitmap Index',           color: 'emerald', icon: '🗺️', badge: 'DW',      desc: 'Best for columns with few distinct values. Uses bitwise operations to process multiple conditions at once.' },
      { name: 'Function-Based Index',   color: 'orange',  icon: 'ƒ',  badge: 'FBI',     desc: 'Stores the result of a function or expression as the key. Commonly used for case-insensitive searches.' },
      { name: 'Composite Index',        color: 'purple',  icon: '⊕',  badge: 'Composite', desc: 'Combines two or more columns into a single index. Most effective when the leading column appears in the WHERE clause.' },
      { name: 'Reverse Key Index',      color: 'rose',    icon: '↔',  badge: 'RAC',     desc: 'Stores key bytes in reverse order. Spreads inserts across leaf blocks to avoid hot-block contention on sequential keys.' },
      { name: 'Index-Organized Table',  color: 'amber',   icon: '⬡',  badge: 'IOT',     desc: 'The table itself is the B-Tree index. Well-suited for tables accessed almost exclusively by primary key.' },
    ],

  },
} as const

// ── Color maps ─────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, { border: string; bg: string; badge: string; icon: string; heading: string }> = {
  violet:  { border: 'border-violet-200',  bg: 'bg-violet-50/60',  badge: 'bg-violet-100 text-violet-700',   icon: 'bg-violet-100',  heading: 'text-violet-800' },
  emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50/60', badge: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-100', heading: 'text-emerald-800' },
  orange:  { border: 'border-orange-200',  bg: 'bg-orange-50/60',  badge: 'bg-orange-100 text-orange-700',   icon: 'bg-orange-100',  heading: 'text-orange-800' },
  purple:  { border: 'border-purple-200',  bg: 'bg-purple-50/60',  badge: 'bg-purple-100 text-purple-700',   icon: 'bg-purple-100',  heading: 'text-purple-800' },
  rose:    { border: 'border-rose-200',    bg: 'bg-rose-50/60',    badge: 'bg-rose-100 text-rose-700',       icon: 'bg-rose-100',    heading: 'text-rose-800' },
  amber:   { border: 'border-amber-200',   bg: 'bg-amber-50/60',   badge: 'bg-amber-100 text-amber-700',     icon: 'bg-amber-100',   heading: 'text-amber-800' },
}

const BADGE_COLOR: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rose:    'bg-rose-100 text-rose-700 border-rose-200',
  amber:   'bg-amber-100 text-amber-700 border-amber-200',
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

// ── StateTable sub-component ──────────────────────────────────────────────────

type StateRow = { state: string; dml: string; optimizer: string; space: string; badge: string; use: string }
type StateHeaders = { aspect: string; dml: string; optimizer: string; space: string; use: string }

function StateTable({ rows, headers }: { rows: StateRow[]; headers: StateHeaders }) {
  return (
    <div className="mb-5 overflow-hidden rounded-xl border text-xs">
      <div className="grid grid-cols-[110px_1fr_1fr_1fr_1fr] divide-x border-b bg-muted/40 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {[headers.aspect, headers.dml, headers.optimizer, headers.space, headers.use].map((h, i) => (
          <div key={i} className="px-3 py-2">{h}</div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} className={cn('grid grid-cols-[110px_1fr_1fr_1fr_1fr] divide-x', i % 2 === 1 && 'bg-muted/20')}>
          <div className="flex items-center px-3 py-2.5">
            <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold', BADGE_COLOR[row.badge])}>
              {row.state}
            </span>
          </div>
          <div className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.dml}</div>
          <div className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.optimizer}</div>
          <div className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.space}</div>
          <div className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{row.use}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────


export function IndexTypesOverview() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <div className="mx-auto max-w-6xl space-y-2 px-8 pb-12">

      {/* ── 1. 인덱스란? ── */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
        <p className="mb-2 text-xs font-bold text-violet-800">{t.whatAnalogyTitle}</p>
        <Prose className="text-[12px] text-violet-900/80 whitespace-pre-line">{t.whatAnalogyDesc}</Prose>
      </div>

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
        <p className="mb-2 text-xs font-bold text-amber-800">{t.whatHeapTitle}</p>
        <Prose className="text-[12px] text-amber-900/80">{t.whatHeapDesc}</Prose>
      </div>

      <div className="mb-6 space-y-2">
        {t.whatPoints.map((p, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
          >
            <span className="mt-0.5 text-base leading-none">{p.icon}</span>
            <p className="text-xs leading-relaxed text-muted-foreground">{p.text}</p>
          </motion.div>
        ))}
      </div>

      <Divider />

      {/* ── 2. 언제 인덱스를 만들까? ── */}
      <SectionTitle>{t.whenTitle}</SectionTitle>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {t.whenItems.map((item, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className={cn(
              'rounded-xl border p-4',
              item.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/40',
            )}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span className={cn('text-sm font-bold', item.ok ? 'text-emerald-500' : 'text-rose-500')}>
                {item.ok ? '✓' : '✗'}
              </span>
              <span className={cn('text-xs font-bold', item.ok ? 'text-emerald-700' : 'text-rose-700')}>
                {item.ok ? t.whenOk : t.whenNo}
              </span>
            </div>
            <p className="mb-2 text-xs font-semibold text-foreground">{item.title}</p>
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
            <code className={cn(
              'block rounded px-2 py-1 font-mono text-[10px]',
              item.ok ? 'bg-emerald-100/60 text-emerald-800' : 'bg-rose-100/60 text-rose-800',
            )}>
              {item.example}
            </code>
          </motion.div>
        ))}
      </div>

      <Divider />

      {/* ── 3. 인덱스의 대가 ── */}
      <SectionTitle>{t.costTitle}</SectionTitle>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {t.costItems.map((item, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2 rounded-xl border bg-card p-4"
          >
            <span className="text-xl">{item.icon}</span>
            <p className="text-xs font-bold">{item.title}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <InfoBox variant="note">{t.optimizerNote}</InfoBox>

      <Divider />

      {/* ── 4. 인덱스 종류 ── */}
      <SectionTitle>{t.typesTitle}</SectionTitle>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.types.map((type, i) => {
          const c = TYPE_COLOR[type.color]
          return (
            <motion.div
              key={type.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-5',
                c.border, c.bg,
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-lg', c.icon)}>
                  {type.icon}
                </div>
                <span className={cn('rounded-full px-2 py-0.5 font-mono text-[10px] font-bold', c.badge)}>
                  {type.badge}
                </span>
              </div>
              <div className={cn('text-sm font-bold', c.heading)}>{type.name}</div>
              <p className="text-[11px] leading-snug text-muted-foreground">{type.desc}</p>
            </motion.div>
          )
        })}
      </div>

      <Divider />

      {/* ── 5. 인덱스 상태 ── */}
      <SectionTitle>{t.stateTitle}</SectionTitle>
      <Prose>{t.stateDesc}</Prose>

      <SubTitle>Usability</SubTitle>
      <StateTable
        rows={t.usabilityRows as unknown as StateRow[]}
        headers={{ aspect: t.stateHeaderAspect, dml: t.stateHeaderDml, optimizer: t.stateHeaderOpt, space: t.stateHeaderSpace, use: t.stateHeaderUse }}
      />

      <SubTitle>Visibility</SubTitle>
      <StateTable
        rows={t.visibilityRows as unknown as StateRow[]}
        headers={{ aspect: t.stateHeaderAspect, dml: t.stateHeaderDml, optimizer: t.stateHeaderOpt, space: t.stateHeaderSpace, use: t.stateHeaderUse }}
      />

      <InfoBox variant="tip">
        {lang === 'ko'
          ? 'Invisible 인덱스는 DML(Data Manipulation Language)로 계속 갱신되지만 옵티마이저에게는 보이지 않아요. 실제 운영 중인 인덱스를 바로 삭제하기 전에 Invisible로 바꿔서 "이게 없어지면 성능이 어떻게 될까?" 를 미리 확인하는 용도로 쓰입니다.'
          : 'An Invisible index is still maintained by DML but hidden from the optimizer. Use it to safely test the impact of dropping an index in production before actually removing it.'}
      </InfoBox>

    </div>
  )
}
