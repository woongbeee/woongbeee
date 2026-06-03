import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
  Table,
} from '../../shared'
import { IconLayersLinked } from '@tabler/icons-react'

// ── Text ──────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    pageTitle: '복합·특수 인덱스',
    pageSubtitle:
      '복합 인덱스, 함수 기반 인덱스(FBI), Reverse Key, IOT, 가시성 상태, 키 압축까지 — 상황에 맞는 인덱스 유형을 선택하는 방법을 알아봐요.',

    compositeTitle: '복합 인덱스 (Composite Index)',
    compositeDesc:
      '복합 인덱스(Concatenated Index라고도 불러요)는 테이블의 여러 컬럼을 묶어서 만드는 인덱스예요. WHERE 조건에 인덱스의 첫 번째 컬럼(선두 컬럼)이 포함된 쿼리라면 검색 속도를 확 높여줄 수 있어요. 그래서 인덱스를 만들 때 컬럼 순서가 굉장히 중요합니다. 보통은 가장 자주 검색에 쓰이는 컬럼을 맨 앞에 배치해요.',
    orderTitle: '컬럼 순서 규칙',
    orderIndexExample: 'CREATE INDEX emp_dept_job_ix ON employees (dept_id, job_id)',
    orderRules: [
      { rule: '선두 컬럼 포함 → Index Range Scan 가능', ok: true, example: 'WHERE dept_id = 60' },
      { rule: '선두 컬럼 + 추가 컬럼 → 더 좁은 범위로 검색', ok: true, example: "WHERE dept_id = 60 AND job_id = 'IT_PROG'" },
      { rule: '선두 컬럼 없음 → Full Table Scan (또는 Skip Scan)', ok: false, example: "WHERE job_id = 'IT_PROG' (dept_id 빠짐)" },
      { rule: '선두 컬럼 값의 종류가 적을 때 → Skip Scan으로 가능할 수도', ok: null, example: 'WHERE salary = 9000 (DEPT_ID 값 종류가 적다면)' },
    ],

    fbiTitle: 'FBI (Function-Based Index, 함수 기반 인덱스)',
    fbiDesc:
      'FBI(Function-Based Index)는 컬럼 값을 그대로 저장하는 대신, 함수나 계산식을 적용한 결과를 인덱스에 저장하는 방식이에요. B-Tree나 Bitmap 인덱스 둘 다 만들 수 있어요. 산술 계산식, SQL 내장 함수, 직접 만든 PL/SQL 함수 등 다양한 표현식을 인덱싱할 수 있고, 쿼리에 해당 함수가 그대로 들어있을 때만 오라클이 이 인덱스를 활용해요.',
    fbiHeaders: ['표현식', '용도', 'SQL 예시'],
    fbiRows: [
      ['UPPER(last_name)', '대소문자 상관없이 이름 검색', "WHERE UPPER(last_name) = 'SMITH'"],
      ['12 * salary * commission_pct', '연간 총수입 조건으로 검색', 'WHERE (12 * salary * commission_pct) < 30000'],
      ['EXTRACT(YEAR FROM hire_date)', '입사 연도로 검색', 'WHERE EXTRACT(YEAR FROM hire_date) = 2023'],
    ],

    iotTitle: 'IOT (Index-Organized Table, 인덱스 구조 테이블)',
    iotWhat:
      'IOT(Index-Organized Table)는 테이블 자체가 B-Tree 인덱스 구조로 저장되는 특별한 테이블이에요. ' +
      '일반 힙(Heap) 테이블은 빈 자리가 있으면 거기에 행을 집어넣지만, IOT는 기본 키(Primary Key) 순서에 맞춰 정렬된 상태로 Leaf 블록에 행을 저장해요. ' +
      'B-Tree의 각 엔트리가 기본 키 컬럼뿐 아니라 나머지 컬럼 값도 함께 담고 있죠. 한마디로, 인덱스가 곧 데이터고 데이터가 곧 인덱스예요.',
    iotStructTitle: '내부 구조 — Leaf 블록에 뭐가 들어있나요?',
    iotStructDesc:
      'DEPARTMENTS 테이블을 IOT로 만들면 기본 키인 DEPARTMENT_ID 순서대로 Leaf 블록에 저장돼요. ' +
      '별도의 기본 키 인덱스를 따로 만들 필요가 없어요 — 이미 인덱스가 테이블이니까요.',
    iotOverflowTitle: '행이 너무 크면? — Overflow Segment',
    iotOverflowDesc:
      'Leaf 블록 하나에 담기에는 너무 큰 행이 있을 수 있어요. 그럴 때는 OVERFLOW 옵션으로 별도 세그먼트(Overflow Segment)를 지정해요. ' +
      'PCTTHRESHOLD(임계 비율)로 "Leaf 블록 공간의 몇 %까지만 쓰겠다"를 정하고, 그 한계를 넘는 컬럼은 Overflow Segment로 빠져요. ' +
      'Leaf 블록을 가볍게 유지해서 Branch 블록의 탐색 효율을 높이는 효과가 있어요.',
    iotSecondaryTitle: '보조 인덱스 (Secondary Index)',
    iotSecondaryDesc:
      'IOT에서 기본 키 외 다른 컬럼으로도 검색해야 할 때는 Secondary Index(보조 인덱스)를 따로 만들어요. ' +
      '일반 테이블의 인덱스 엔트리는 물리적 ROWID(행 주소)를 저장하지만, IOT의 Secondary Index는 논리적 ROWID(Logical ROWID)를 저장해요. ' +
      '논리적 ROWID에는 Primary Key 값이 포함되어 있어서, 물리적 위치가 바뀌어도 올바른 행을 찾아갈 수 있어요.',
    iotWhenTitle: '언제 쓰면 좋아요?',
    iotWhenItems: [
      '기본 키 또는 기본 키 앞부분 컬럼으로만 주로 조회하는 테이블',
      '정보 검색 시스템, 공간(Spatial) 데이터, OLAP 애플리케이션',
      '조회 결과를 기본 키 순서로 정렬해서 반환해야 하는 경우',
      '기본 키 인덱스를 따로 만들지 않고 저장 공간을 절약하고 싶을 때',
    ],
    iotLimitTitle: '제약사항도 알아두세요',
    iotLimitItems: [
      '기본 키(Primary Key) 제약이 반드시 있어야 해요',
      'LONG 타입 컬럼은 사용할 수 없어요 (LOB은 가능)',
      '가상 컬럼(Virtual Column)을 정의할 수 없어요',
      '테이블 클러스터(Table Cluster)에 포함할 수 없어요',
    ],

    reverseTitle: 'Reverse Key Index',
    reverseDesc:
      'Reverse Key Index는 컬럼 순서는 그대로 두면서 인덱스 키의 바이트를 거꾸로 뒤집어 저장하는 B-Tree 인덱스예요. 예를 들어 키 값이 20이고 일반 B-Tree에서 헥사로 C1,15라면, Reverse Key Index는 이걸 15,C1로 뒤집어 저장해요.\n\n이 방식은 왜 쓸까요? 1, 2, 3처럼 순서대로 증가하는 기본 키를 계속 삽입하면, 새 데이터가 항상 B-Tree의 가장 오른쪽 블록에만 몰리면서 경합이 심해져요. 바이트를 뒤집으면 삽입 위치가 여러 Leaf 블록에 고루 분산되죠. 단, 범위 검색(Range Scan)은 사용할 수 없어요 — 뒤집어 저장하다 보니 원래의 논리적 순서가 깨지기 때문이에요.',
    reverseHeaders: ['원본 키', 'HEX', '역순 저장'],
    reverseDemoRows: [['20', 'C1,15', '15,C1'], ['21', 'C1,16', '16,C1'], ['22', 'C1,17', '17,C1']],

    invisibleTitle: 'Invisible / Unusable Index',
    invisibleHeaders: ['상태', '설명'],
    invisibleRows: [
      ['Usable', 'CBO가 활용함 / DML 발생 시 자동으로 인덱스 유지 / 저장 공간 사용'],
      ['Unusable', 'CBO가 무시함 / DML 발생해도 인덱스 유지 안 함 / 공간 차지 안 함 — 대량 데이터 적재 시 성능 향상에 활용'],
      ['Invisible', 'CBO가 무시함 / DML 발생 시 인덱스는 계속 유지 / 공간 사용 — 인덱스를 바로 지우기 전에 영향을 미리 테스트할 때 유용'],
    ],

    keyCompressTitle: '인덱스 키 압축 (Key / Prefix Compression)',
    keyCompressDesc: '복합 인덱스에서 앞쪽 컬럼 값이 반복될 때, 그 값을 딱 한 번만 저장하는 방식이에요. Leaf 블록 안에서 같은 선두 값이 계속 나오면 공간 낭비가 심한데, 이 압축 기법을 쓰면 공간을 크게 아끼고 블록 하나에 더 많은 인덱스 항목을 담을 수 있어 I/O 횟수도 줄어들어요.',
    keyCompressHowTitle: '압축 전/후 비교',
    keyCompressNote: '압축은 Leaf 블록에만 적용돼요. Branch 블록은 이미 길 안내에 필요한 최소한의 키만 저장하고 있어서 따로 압축이 필요 없거든요. 그리고 컬럼 하나짜리 UNIQUE 인덱스에는 이 압축을 쓸 수 없어요.',
    keyCompressAdvancedTitle: 'Advanced Index Compression (Oracle 12c 이상)',
    keyCompressAdvancedDesc: '기존 Prefix Compression은 "앞에서 몇 번째 컬럼까지 압축할게"라고 직접 지정해야 했어요. 반면 Advanced Compression은 블록마다 가장 효율적인 압축 방식을 오라클이 알아서 골라줘요. Unique 인덱스든 Non-unique 인덱스든 모두 지원하고, COMPRESS ADVANCED 한 줄만 추가하면 바로 활성화돼요.',
  },
  en: {
    pageTitle: 'Composite & Special Indexes',
    pageSubtitle:
      'Composite indexes, Function-Based Indexes (FBI), Reverse Key, IOT, visibility states, and key compression — learn how to choose the right index type for each situation.',

    compositeTitle: 'Composite (Concatenated) Index',
    compositeDesc:
      'A composite index, also called a concatenated index, is an index on multiple columns in a table. Composite indexes can speed retrieval of data for SELECT statements in which the WHERE clause references all or the leading portion of the columns in the composite index. Therefore, the order of the columns used in the definition is important. In general, the most commonly accessed columns go first.',
    orderTitle: 'Column Order Rules',
    orderIndexExample: 'CREATE INDEX emp_dept_job_ix ON employees (dept_id, job_id)',
    orderRules: [
      { rule: 'Leading column present → Index Range Scan', ok: true, example: 'WHERE dept_id = 60' },
      { rule: 'Leading + additional columns → narrower range', ok: true, example: "WHERE dept_id = 60 AND job_id = 'IT_PROG'" },
      { rule: 'No leading column → Full Table Scan (or Skip Scan)', ok: false, example: "WHERE job_id = 'IT_PROG' (no dept_id)" },
      { rule: 'Non-leading only → Skip Scan (if leading is low-cardinality)', ok: null, example: 'WHERE salary = 9000 (if DEPT_ID is low-cardinality)' },
    ],

    fbiTitle: 'Function-Based Index (FBI)',
    fbiDesc:
      'A function-based index computes the value of a function or expression involving one or more columns and stores it in an index. A function-based index can be either a B-tree or a bitmap index. The indexed function can be an arithmetic expression or an expression that contains a SQL function, user-defined PL/SQL function, package function, or C callout. The database uses the function-based index only when the function is included in a query.',
    fbiHeaders: ['Expression', 'Use case', 'SQL Example'],
    fbiRows: [
      ['UPPER(last_name)', 'Case-insensitive search', "WHERE UPPER(last_name) = 'SMITH'"],
      ['12 * salary * commission_pct', 'Annual salary predicate', 'WHERE (12 * salary * commission_pct) < 30000'],
      ['EXTRACT(YEAR FROM hire_date)', 'Year-based search', 'WHERE EXTRACT(YEAR FROM hire_date) = 2023'],
    ],

    iotTitle: 'Index-Organized Table (IOT)',
    iotWhat:
      'An index-organized table (IOT) is a table stored in a variation of a B-tree index structure. ' +
      'In a heap-organized table, rows are inserted wherever they fit. ' +
      'In an IOT, rows are stored in a B-tree index ordered by the primary key — each leaf entry holds both the key columns and the non-key column values. ' +
      'The index is the data, and the data is the index.',
    iotStructTitle: 'Internal Structure — What is inside a Leaf block?',
    iotStructDesc:
      'When DEPARTMENTS is created as an IOT, rows are stored in leaf blocks ordered by DEPARTMENT_ID. ' +
      'No separate primary key index is needed — the index already is the table.',
    iotOverflowTitle: 'Row too large? — Overflow Segment',
    iotOverflowDesc:
      'When a row is too large to fit efficiently in a leaf block, you can designate a separate overflow segment. ' +
      'The PCTTHRESHOLD clause defines the percentage of leaf block space reserved for key columns; ' +
      'columns that push the row past that threshold spill to the overflow segment. ' +
      'This keeps leaf blocks lean and branch-block traversal efficient.',
    iotSecondaryTitle: 'Secondary Indexes on an IOT',
    iotSecondaryDesc:
      'To query an IOT on non-primary-key columns, create a secondary index. ' +
      'Unlike regular indexes that store physical rowids, secondary indexes on IOTs store logical rowids — ' +
      'logical rowids embed the primary key value, so the correct row can be found even after physical relocation.',
    iotWhenTitle: 'When to use an IOT',
    iotWhenItems: [
      'Table accessed predominantly by primary key or its leading prefix',
      'Information retrieval, spatial data, and OLAP applications',
      'Queries requiring rows returned in primary-key order',
      'When you want to eliminate the separate primary key index and save space',
    ],
    iotLimitTitle: 'Limitations to know',
    iotLimitItems: [
      'Primary key constraint is mandatory',
      'LONG columns are not supported (LOB columns are)',
      'Virtual columns cannot be defined',
      'Cannot be part of a table cluster',
    ],

    reverseTitle: 'Reverse Key Index',
    reverseDesc:
      'A reverse key index is a type of B-tree index that physically reverses the bytes of each index key while keeping the column order. For example, if the index key is 20, and the two bytes stored in hex are C1,15 in a standard B-tree index, a reverse key index stores them as 15,C1.\n\nReversing the key solves the problem of contention for leaf blocks in the right side of a B-tree index — sequentially increasing values (1, 2, 3...) always insert into the rightmost block. Reversal distributes inserts across all leaf keys in the index. Trade-off: because the data is not sorted by column key when stored, reverse key indexes eliminate the ability to run an index range scan.',
    reverseHeaders: ['Original Key', 'HEX', 'Reversed'],
    reverseDemoRows: [['20', 'C1,15', '15,C1'], ['21', 'C1,16', '16,C1'], ['22', 'C1,17', '17,C1']],

    invisibleTitle: 'Invisible / Unusable Index',
    invisibleHeaders: ['State', 'Description'],
    invisibleRows: [
      ['Usable', 'Used by CBO / maintained on DML / consumes space'],
      ['Unusable', 'Ignored by CBO / NOT maintained on DML / no space — use for bulk loads'],
      ['Invisible', 'Ignored by CBO / maintained on DML / consumes space — use to test before dropping'],
    ],

    keyCompressTitle: 'Index Key Compression (Prefix Compression)',
    keyCompressDesc: 'Stores repeated leading column values only once per group in a Leaf block. When many index entries share the same leading value(s), key compression reduces space significantly and packs more entries per block — improving I/O efficiency.',
    keyCompressHowTitle: 'Before vs After compression',
    keyCompressNote: 'Compression applies to Leaf blocks only. Branch blocks already store only the minimum key prefix needed for routing, so no further compression is needed. Cannot be applied to single-column UNIQUE indexes.',
    keyCompressAdvancedTitle: 'Advanced Index Compression (Oracle 12c+)',
    keyCompressAdvancedDesc: 'While Prefix Compression requires you to specify a fixed number of leading columns to compress, Advanced Compression automatically selects the best compression method per block. Works on both unique and non-unique indexes — just add COMPRESS ADVANCED.',
  },
}


export function CompositeSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLayersLinked size={36} stroke={1.5} className="text-violet-500" />}
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
      />

      {/* ── Composite Index ── */}
      <SectionTitle>{t.compositeTitle}</SectionTitle>
      <Prose>{t.compositeDesc}</Prose>

      <SubTitle>{t.orderTitle}</SubTitle>
      <div className="mb-4">
        <SqlBlock sql={t.orderIndexExample} />
      </div>
      <div className="mb-6 overflow-hidden rounded-xl border">
        {t.orderRules.map((r, i) => (
          <div key={i} className={cn('flex items-start gap-3 border-b px-4 py-3 last:border-b-0', i % 2 === 1 ? 'bg-muted/20' : '')}>
            <span className={cn('mt-0.5 shrink-0 text-sm font-bold',
              r.ok === true ? 'text-emerald-500' : r.ok === false ? 'text-rose-500' : 'text-amber-500'
            )}>
              {r.ok === true ? '✓' : r.ok === false ? '✗' : '△'}
            </span>
            <div>
              <div className="text-xs font-semibold">{r.rule}</div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{r.example}</div>
            </div>
          </div>
        ))}
      </div>


      <Divider />

      {/* ── FBI ── */}
      <SectionTitle>{t.fbiTitle}</SectionTitle>
      <Prose>{t.fbiDesc}</Prose>
      <Table headers={t.fbiHeaders} rows={t.fbiRows} />

      <Divider />

      {/* ── IOT ── */}
      <SectionTitle>{t.iotTitle}</SectionTitle>
      <Prose>{t.iotWhat}</Prose>

      <SubTitle>{t.iotStructTitle}</SubTitle>
      <Prose>{t.iotStructDesc}</Prose>
      <IotStorageVisual lang={lang} />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-2 font-mono text-xs font-bold text-amber-700">{t.iotOverflowTitle}</div>
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">{t.iotOverflowDesc}</p>
          <div className="rounded-lg bg-muted/40 p-3 font-mono text-[10px] leading-relaxed whitespace-pre text-foreground">
            {`CREATE TABLE orders_iot (\n  order_id     NUMBER PRIMARY KEY,\n  customer_id  NUMBER,\n  order_date   DATE,\n  description  VARCHAR2(2000)  -- 큰 컬럼\n)\nORGANIZATION INDEX\nPCTTHRESHOLD 20\nOVERFLOW SEGMENT IN overflow_ts;`}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-2 font-mono text-xs font-bold text-blue-700">{t.iotSecondaryTitle}</div>
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">{t.iotSecondaryDesc}</p>
          <div className="rounded-lg bg-muted/40 p-3 font-mono text-[10px] leading-relaxed whitespace-pre text-foreground">
            {`-- IOT 생성\nCREATE TABLE employees_iot (\n  employee_id   NUMBER PRIMARY KEY,\n  last_name     VARCHAR2(50),\n  department_id NUMBER\n)\nORGANIZATION INDEX;\n\n-- 보조 인덱스 생성\nCREATE INDEX emp_dept_idx\n  ON employees_iot(department_id);`}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InfoBox variant="tip" title={t.iotWhenTitle}>
          <ul className="mt-1 space-y-1">
            {t.iotWhenItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]">
                <span className="mt-0.5 shrink-0 font-mono text-rose-400">▸</span>{item}
              </li>
            ))}
          </ul>
        </InfoBox>
        <InfoBox variant="warning" title={t.iotLimitTitle}>
          <ul className="mt-1 space-y-1">
            {t.iotLimitItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]">
                <span className="mt-0.5 shrink-0 font-mono text-blue-400">▸</span>{item}
              </li>
            ))}
          </ul>
        </InfoBox>
      </div>

      <Divider />

      {/* ── Reverse Key ── */}
      <SectionTitle>{t.reverseTitle}</SectionTitle>
      <Prose>{t.reverseDesc}</Prose>
      <div className="mb-2 sm:max-w-xs">
        <Table headers={t.reverseHeaders} rows={t.reverseDemoRows} />
      </div>

      <Divider />

      {/* ── Invisible / Unusable ── */}
      <SectionTitle>{t.invisibleTitle}</SectionTitle>
      <Table headers={t.invisibleHeaders} rows={t.invisibleRows} />

      <Divider />

      {/* ── Key Compression ── */}
      <SectionTitle>{t.keyCompressTitle}</SectionTitle>
      <Prose>{t.keyCompressDesc}</Prose>

      <SubTitle>{t.keyCompressHowTitle}</SubTitle>
      <KeyCompressionVisual lang={lang} />

      <div className="mt-4">
        <InfoBox variant="note">{t.keyCompressNote}</InfoBox>
      </div>

      <div className="mt-8">
        <SubTitle>{t.keyCompressAdvancedTitle}</SubTitle>
        <Prose>{t.keyCompressAdvancedDesc}</Prose>
        <div className="grid gap-3 md:grid-cols-2">
          <SqlBlock
            badge="Prefix Compression"
            badgeColor="violet"
            desc={lang === 'ko'
              ? '앞에서 몇 번째 컬럼까지 압축 키로 쓸지 직접 지정해요. COMPRESS만 쓰면 기본값(비고유 컬럼 전체)이 적용돼요.'
              : 'Specify N leading columns as the prefix key. COMPRESS alone uses the default (all non-unique columns).'}
            sql={`-- 기본값: 모든 선두 컬럼 압축\nCREATE INDEX ord_mode_stat_ix\n  ON orders(order_mode, order_status)\n  COMPRESS;\n\n-- 첫 번째 컬럼만 압축\nCREATE INDEX ord_mode_stat_ix\n  ON orders(order_mode, order_status)\n  COMPRESS 1;`}
          />
          <SqlBlock
            badge="Advanced Compression"
            badgeColor="blue"
            desc={lang === 'ko'
              ? '오라클이 블록마다 가장 좋은 압축 방식을 알아서 골라줘요. Unique 인덱스에도 쓸 수 있어요.'
              : 'Oracle selects optimal compression per block automatically. Works on unique indexes too.'}
            sql={`-- Advanced High (Oracle 12.2+, 기본값)\nCREATE INDEX hr_emp_mgr_dept_ix\n  ON hr.employees(manager_id, department_id)\n  COMPRESS ADVANCED;\n\n-- 압축 상태 확인\nSELECT compression\nFROM   dba_indexes\nWHERE  index_name = 'HR_EMP_MGR_DEPT_IX';\n-- Result: ADVANCED HIGH`}
          />
        </div>
      </div>
    </PageContainer>
  )
}

// ── Key Compression Visual ────────────────────────────────────────────────────

function KeyCompressionVisual({ lang }: { lang: 'ko' | 'en' }) {
  const uncompressed = [
    { mode: 'online', status: '0', rowid: 'AAAPvCAAFAAAAFaAAa' },
    { mode: 'online', status: '0', rowid: 'AAAPvCAAFAAAAFaAAg' },
    { mode: 'online', status: '0', rowid: 'AAAPvCAAFAAAAFaAAl' },
    { mode: 'online', status: '2', rowid: 'AAAPvCAAFAAAAFaAAm' },
    { mode: 'online', status: '2', rowid: 'AAAPvCAAFAAAAFaAAr' },
    { mode: 'direct', status: '0', rowid: 'AAAPvCAAFAAAAFaAAs' },
    { mode: 'direct', status: '1', rowid: 'AAAPvCAAFAAAAFaAAv' },
  ]

  const compressedGroups = [
    {
      prefix: 'online, 0',
      color: 'blue' as const,
      rowids: ['AAAPvCAAFAAAAFaAAa', 'AAAPvCAAFAAAAFaAAg', 'AAAPvCAAFAAAAFaAAl'],
    },
    {
      prefix: 'online, 2',
      color: 'violet' as const,
      rowids: ['AAAPvCAAFAAAAFaAAm', 'AAAPvCAAFAAAAFaAAr'],
    },
    {
      prefix: 'direct, 0',
      color: 'orange' as const,
      rowids: ['AAAPvCAAFAAAAFaAAs'],
    },
    {
      prefix: 'direct, 1',
      color: 'rose' as const,
      rowids: ['AAAPvCAAFAAAAFaAAv'],
    },
  ]

  const colorMap = {
    blue:   { bg: 'bg-blue-100',   border: 'border-blue-300',   text: 'text-blue-800',   badge: 'bg-blue-200 text-blue-900' },
    violet: { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-800', badge: 'bg-violet-200 text-violet-900' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-200 text-orange-900' },
    rose:   { bg: 'bg-rose-100',   border: 'border-rose-300',   text: 'text-rose-800',   badge: 'bg-rose-200 text-rose-900' },
  }

  const rowColors = [
    'bg-blue-50', 'bg-blue-50', 'bg-blue-50',
    'bg-violet-50', 'bg-violet-50',
    'bg-orange-50',
    'bg-rose-50',
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: Uncompressed */}
      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {lang === 'ko' ? '압축 전 (Leaf Block)' : 'Before Compression (Leaf Block)'}
          </span>
          <span className="ml-auto rounded bg-rose-100 px-2 py-0.5 font-mono text-[9px] font-bold text-rose-700">
            7 × (mode + status + rowid)
          </span>
        </div>
        <div className="grid grid-cols-[72px_56px_1fr] divide-x border-b bg-muted/20 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="px-3 py-1.5">order_mode</div>
          <div className="px-3 py-1.5">status</div>
          <div className="px-3 py-1.5">ROWID</div>
        </div>
        {uncompressed.map((row, i) => (
          <div
            key={i}
            className={cn('grid grid-cols-[72px_56px_1fr] divide-x border-b last:border-b-0 font-mono text-[10px]', rowColors[i])}
          >
            <div className="px-3 py-1.5 font-semibold">{row.mode}</div>
            <div className="px-3 py-1.5">{row.status}</div>
            <div className="px-3 py-1.5 text-muted-foreground">{row.rowid}</div>
          </div>
        ))}
        <div className="border-t bg-muted/20 px-4 py-2 font-mono text-[9px] text-muted-foreground">
          {lang === 'ko'
            ? '중복 낭비: "online"이 5번, "direct"가 2번, "0"이 4번 반복 저장되고 있어요'
            : 'Duplicated: "online" ×5, "direct" ×2, "0" ×4 …'}
        </div>
      </div>

      {/* Right: Compressed */}
      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {lang === 'ko' ? '압축 후 (Leaf Block)' : 'After Compression (Leaf Block)'}
          </span>
          <span className="ml-auto rounded bg-emerald-100 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-700">
            {lang === 'ko' ? '선두 컬럼 1회 저장' : 'prefix stored once'}
          </span>
        </div>
        <div className="divide-y">
          {compressedGroups.map((grp, gi) => {
            const c = colorMap[grp.color]
            return (
              <div key={gi} className={cn('px-3 py-2', c.bg)}>
                <div className={cn('mb-1.5 flex items-center gap-2 rounded px-2 py-1 border', c.border)}>
                  <span className={cn('font-mono text-[9px] font-bold uppercase tracking-wider', c.text)}>
                    {lang === 'ko' ? '공통 접두사' : 'prefix'}
                  </span>
                  <span className={cn('rounded px-1.5 py-0.5 font-mono text-[10px] font-bold', c.badge)}>
                    {grp.prefix}
                  </span>
                </div>
                <div className="space-y-0.5 pl-4">
                  {grp.rowids.map((rid, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <span className={cn('h-1 w-1 rounded-full shrink-0', c.text.replace('text-', 'bg-'))} />
                      <span className="font-mono text-[10px] text-muted-foreground">{rid}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t bg-muted/20 px-4 py-2 font-mono text-[9px] text-muted-foreground">
          {lang === 'ko'
            ? '앞쪽 컬럼 중복 제거 → 블록 하나에 더 많은 항목을 담을 수 있어요'
            : 'Leading column deduplication → more entries per block'}
        </div>
      </div>
    </div>
  )
}

// ── IOT Storage Visual ────────────────────────────────────────────────────────

function IotStorageVisual({ lang }: { lang: 'ko' | 'en' }) {
  const heapRows = [
    { id: 20, name: 'Marketing',   mgr: 201, loc: 1800, color: 'bg-blue-50' },
    { id: 50, name: 'Shipping',    mgr: 121, loc: 1500, color: 'bg-blue-50' },
    { id: 30, name: 'Purchasing',  mgr: 114, loc: 1700, color: 'bg-violet-50' },
    { id: 60, name: 'IT',          mgr: 103, loc: 1400, color: 'bg-violet-50' },
  ]

  const iotLeaves = [
    {
      label: lang === 'ko' ? 'Leaf 블록 1' : 'Leaf Block 1',
      rows: [
        { id: 20, name: 'Marketing',  mgr: 201, loc: 1800 },
        { id: 30, name: 'Purchasing', mgr: 114, loc: 1700 },
        { id: 40, name: 'HR',         mgr: 203, loc: 2400 },
      ],
    },
    {
      label: lang === 'ko' ? 'Leaf 블록 2' : 'Leaf Block 2',
      rows: [
        { id: 50, name: 'Shipping', mgr: 121, loc: 1500 },
        { id: 60, name: 'IT',       mgr: 103, loc: 1400 },
        { id: 70, name: 'Finance',  mgr: 108, loc: 1900 },
      ],
    },
  ]

  const col = 'grid-cols-[36px_96px_36px_48px]'

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {/* Heap */}
      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {lang === 'ko' ? '힙(Heap) 테이블' : 'Heap-Organized Table'}
          </span>
          <span className="ml-auto rounded bg-rose-100 px-2 py-0.5 font-mono text-[9px] font-bold text-rose-700">
            {lang === 'ko' ? 'PK 순서 보장 ✗' : 'No PK order guarantee'}
          </span>
        </div>
        <div className={`grid ${col} gap-0 divide-x border-b bg-muted/20 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground`}>
          <div className="px-2 py-1.5">ID</div>
          <div className="px-2 py-1.5">NAME</div>
          <div className="px-2 py-1.5">MGR</div>
          <div className="px-2 py-1.5">LOC</div>
        </div>
        {heapRows.map((r, i) => (
          <div key={i} className={cn(`grid ${col} gap-0 divide-x border-b last:border-b-0 font-mono text-[10px]`, r.color)}>
            <div className="px-2 py-1.5 font-bold">{r.id}</div>
            <div className="px-2 py-1.5">{r.name}</div>
            <div className="px-2 py-1.5 text-muted-foreground">{r.mgr}</div>
            <div className="px-2 py-1.5 text-muted-foreground">{r.loc}</div>
          </div>
        ))}
        <div className="border-t bg-rose-50/60 px-3 py-2 font-mono text-[9px] text-rose-700">
          {lang === 'ko'
            ? 'PK 순서로 읽으려면: Block1 → Block2 → Block1 (불규칙 I/O)'
            : 'To read in PK order: Block1 → Block2 → Block1 (random I/O)'}
        </div>
      </div>

      {/* IOT */}
      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            IOT (ORGANIZATION INDEX)
          </span>
          <span className="ml-auto rounded bg-emerald-100 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-700">
            {lang === 'ko' ? 'PK 순서 정렬 ✓' : 'PK-ordered ✓'}
          </span>
        </div>
        <div className="divide-y">
          {iotLeaves.map((leaf, li) => (
            <div key={li} className={cn('px-3 py-2', li === 0 ? 'bg-emerald-50/40' : 'bg-teal-50/40')}>
              <div className={`mb-1.5 font-mono text-[9px] font-bold uppercase tracking-wider ${li === 0 ? 'text-emerald-700' : 'text-teal-700'}`}>
                {leaf.label}
              </div>
              <div className={`grid ${col} gap-0 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1 mb-1`}>
                <div>ID</div><div>NAME</div><div>MGR</div><div>LOC</div>
              </div>
              {leaf.rows.map((r, ri) => (
                <div key={ri} className={`grid ${col} gap-0 font-mono text-[10px]`}>
                  <div className="py-0.5 font-bold">{r.id}</div>
                  <div className="py-0.5">{r.name}</div>
                  <div className="py-0.5 text-muted-foreground">{r.mgr}</div>
                  <div className="py-0.5 text-muted-foreground">{r.loc}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t bg-emerald-50/60 px-3 py-2 font-mono text-[9px] text-emerald-700">
          {lang === 'ko'
            ? 'PK 순서로 읽으려면: Block1 → Block2 (순차 I/O) · 별도 PK 인덱스 불필요'
            : 'To read in PK order: Block1 → Block2 (sequential I/O) · no separate PK index needed'}
        </div>
      </div>
    </div>
  )
}

