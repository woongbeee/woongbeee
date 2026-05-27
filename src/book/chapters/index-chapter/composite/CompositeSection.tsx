import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { Divider, InfoBox, SqlBlock } from '../../shared'

// ── Text ──────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    compositeTitle: '복합 인덱스 (Composite Index)',
    compositeDesc:
      '복합 인덱스(Concatenated Index라고도 불러요)는 테이블의 여러 컬럼을 묶어서 만드는 인덱스예요. WHERE 조건에 인덱스의 첫 번째 컬럼(선두 컬럼)이 포함된 쿼리라면 검색 속도를 확 높여줄 수 있어요. 그래서 인덱스를 만들 때 컬럼 순서가 굉장히 중요합니다. 보통은 가장 자주 검색에 쓰이는 컬럼을 맨 앞에 배치해요.\n\n오라클 공식 예시: CREATE INDEX employees_ix ON employees (last_name, job_id, salary) — 세 컬럼을 모두 쓰거나, last_name만 쓰거나, last_name과 job_id를 함께 쓰는 쿼리는 이 인덱스를 탈 수 있어요. 하지만 last_name 없이 job_id만 조건으로 쓰는 쿼리는 이 인덱스를 사용하지 못해요.',
    orderTitle: '컬럼 순서 규칙',
    orderRules: [
      { rule: '선두 컬럼 포함 → Index Range Scan 가능', ok: true, example: 'WHERE dept_id = 60' },
      { rule: '선두 컬럼 + 추가 컬럼 → 더 좁은 범위로 검색', ok: true, example: 'WHERE dept_id = 60 AND job_id = \'IT_PROG\'' },
      { rule: '선두 컬럼 없음 → Full Table Scan (또는 Skip Scan)', ok: false, example: 'WHERE job_id = \'IT_PROG\' (dept_id 빠짐)' },
      { rule: '선두 컬럼 값의 종류가 적을 때 → Skip Scan으로 가능할 수도', ok: null, example: 'WHERE salary = 9000 (DEPT_ID 값 종류가 적다면)' },
    ],
    fbiTitle: 'FBI(Function-Based Index, 함수 기반 인덱스)',
    fbiDesc:
      'FBI(Function-Based Index)는 컬럼 값을 그대로 저장하는 대신, 함수나 계산식을 적용한 결과를 인덱스에 저장하는 방식이에요. B-Tree나 Bitmap 인덱스 둘 다 만들 수 있어요. 산술 계산식, SQL 내장 함수, 직접 만든 PL/SQL 함수 등 다양한 표현식을 인덱싱할 수 있고, 쿼리에 해당 함수가 그대로 들어있을 때만 오라클이 이 인덱스를 활용해요.',
    fbiExamples: [
      { expr: 'UPPER(last_name)', use: '대소문자 상관없이 이름 검색', sql: "WHERE UPPER(last_name) = 'SMITH'" },
      { expr: '12 * salary * commission_pct', use: '연간 총수입 조건으로 검색', sql: "WHERE (12 * salary * commission_pct) < 30000" },
      { expr: 'EXTRACT(YEAR FROM hire_date)', use: '입사 연도로 검색', sql: "WHERE EXTRACT(YEAR FROM hire_date) = 2023" },
    ],
    reverseTitle: 'Reverse Key Index',
    reverseDesc:
      'Reverse Key Index는 컬럼 순서는 그대로 두면서 인덱스 키의 바이트를 거꾸로 뒤집어 저장하는 B-Tree 인덱스예요. 예를 들어 키 값이 20이고 일반 B-Tree에서 헥사로 C1,15라면, Reverse Key Index는 이걸 15,C1로 뒤집어 저장해요.\n\n이 방식은 왜 쓸까요? 1, 2, 3처럼 순서대로 증가하는 기본 키를 계속 삽입하면, 새 데이터가 항상 B-Tree의 가장 오른쪽 블록에만 몰리면서 경합이 심해져요. 바이트를 뒤집으면 삽입 위치가 여러 Leaf 블록에 고루 분산되죠. 단, 범위 검색(Range Scan)은 사용할 수 없어요 — 뒤집어 저장하다 보니 원래의 논리적 순서가 깨지기 때문이에요.',
    reverseDemo: [
      { original: 20, hex: 'C1,15', reversed: '15,C1' },
      { original: 21, hex: 'C1,16', reversed: '16,C1' },
      { original: 22, hex: 'C1,17', reversed: '17,C1' },
    ],
    iotTitle: 'IOT(Index-Organized Table, 인덱스 구조 테이블)',
    iotWhat:
      'IOT(Index-Organized Table)는 테이블 자체가 B-Tree 인덱스 구조로 저장되는 특별한 테이블이에요. ' +
      '일반 힙(Heap) 테이블은 빈 자리가 있으면 거기에 행을 집어넣지만, IOT는 기본 키(Primary Key) 순서에 맞춰 정렬된 상태로 Leaf 블록에 행을 저장해요. ' +
      'B-Tree의 각 엔트리가 기본 키 컬럼뿐 아니라 나머지 컬럼 값도 함께 담고 있죠. 한마디로, 인덱스가 곧 데이터고 데이터가 곧 인덱스예요.',
    iotVsHeap: {
      heap: { label: '힙 테이블', steps: ['Index Leaf에서 ROWID(행 주소) 획득', 'ROWID로 Data Block 접근', '총 2번 I/O(입출력) 발생'] },
      iot:  { label: 'IOT', steps: ['B-Tree Leaf에 데이터가 바로 저장', '추가 블록 접근 불필요', '총 1번 I/O(입출력)로 끝'] },
    },
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
    invisibleTitle: 'Invisible / Unusable Index',
    invisibleRows: [
      { state: 'Usable', desc: 'CBO가 활용함 / DML 발생 시 자동으로 인덱스 유지 / 저장 공간 사용', color: 'emerald' },
      { state: 'Unusable', desc: 'CBO가 무시함 / DML 발생해도 인덱스 유지 안 함 / 공간 차지 안 함 — 대량 데이터 적재 시 성능 향상에 활용', color: 'rose' },
      { state: 'Invisible', desc: 'CBO가 무시함 / DML 발생 시 인덱스는 계속 유지 / 공간 사용 — 인덱스를 바로 지우기 전에 영향을 미리 테스트할 때 유용', color: 'amber' },
    ],
    keyCompressTitle: '인덱스 키 압축 (Key / Prefix Compression)',
    keyCompressDesc: '복합 인덱스에서 앞쪽 컬럼 값이 반복될 때, 그 값을 딱 한 번만 저장하는 방식이에요. Leaf 블록 안에서 같은 선두 값이 계속 나오면 공간 낭비가 심한데, 이 압축 기법을 쓰면 공간을 크게 아끼고 블록 하나에 더 많은 인덱스 항목을 담을 수 있어 I/O 횟수도 줄어들어요.',
    keyCompressHowTitle: '압축 전/후 비교',
    keyCompressNote: '압축은 Leaf 블록에만 적용돼요. Branch 블록은 이미 길 안내에 필요한 최소한의 키만 저장하고 있어서 따로 압축이 필요 없거든요. 그리고 컬럼 하나짜리 UNIQUE 인덱스에는 이 압축을 쓸 수 없어요.',
    keyCompressAdvancedTitle: 'Advanced Index Compression (Oracle 12c 이상)',
    keyCompressAdvancedDesc: '기존 Prefix Compression은 "앞에서 몇 번째 컬럼까지 압축할게"라고 직접 지정해야 했어요. 반면 Advanced Compression은 블록마다 가장 효율적인 압축 방식을 오라클이 알아서 골라줘요. Unique 인덱스든 Non-unique 인덱스든 모두 지원하고, COMPRESS ADVANCED 한 줄만 추가하면 바로 활성화돼요.',
  },
  en: {
    compositeTitle: 'Composite (Concatenated) Index',
    compositeDesc:
      'A composite index, also called a concatenated index, is an index on multiple columns in a table. Composite indexes can speed retrieval of data for SELECT statements in which the WHERE clause references all or the leading portion of the columns in the composite index. Therefore, the order of the columns used in the definition is important. In general, the most commonly accessed columns go first.\n\nFrom the Oracle docs: CREATE INDEX employees_ix ON employees (last_name, job_id, salary) — queries that access all three columns, only last_name, or last_name and job_id use this index. Queries that do not access last_name do not use the index.',
    orderTitle: 'Column Order Rules',
    orderRules: [
      { rule: 'Leading column present → Index Range Scan', ok: true, example: 'WHERE dept_id = 60' },
      { rule: 'Leading + additional columns → narrower range', ok: true, example: "WHERE dept_id = 60 AND job_id = 'IT_PROG'" },
      { rule: 'No leading column → Full Table Scan (or Skip Scan)', ok: false, example: "WHERE job_id = 'IT_PROG' (no dept_id)" },
      { rule: 'Non-leading only → Skip Scan (if leading is low-cardinality)', ok: null, example: 'WHERE salary = 9000 (if DEPT_ID is low-cardinality)' },
    ],
    fbiTitle: 'Function-Based Index (FBI)',
    fbiDesc:
      'A function-based index computes the value of a function or expression involving one or more columns and stores it in an index. A function-based index can be either a B-tree or a bitmap index. The indexed function can be an arithmetic expression or an expression that contains a SQL function, user-defined PL/SQL function, package function, or C callout. The database uses the function-based index only when the function is included in a query.',
    fbiExamples: [
      { expr: 'UPPER(last_name)', use: 'Case-insensitive search', sql: "WHERE UPPER(last_name) = 'SMITH'" },
      { expr: '12 * salary * commission_pct', use: 'Annual salary predicate', sql: "WHERE (12 * salary * commission_pct) < 30000" },
      { expr: 'EXTRACT(YEAR FROM hire_date)', use: 'Year-based search', sql: "WHERE EXTRACT(YEAR FROM hire_date) = 2023" },
    ],
    reverseTitle: 'Reverse Key Index',
    reverseDesc:
      'A reverse key index is a type of B-tree index that physically reverses the bytes of each index key while keeping the column order. For example, if the index key is 20, and the two bytes stored in hex are C1,15 in a standard B-tree index, a reverse key index stores them as 15,C1.\n\nReversing the key solves the problem of contention for leaf blocks in the right side of a B-tree index — sequentially increasing values (1, 2, 3...) always insert into the rightmost block. Reversal distributes inserts across all leaf keys in the index. Trade-off: because the data is not sorted by column key when stored, reverse key indexes eliminate the ability to run an index range scan.',
    reverseDemo: [
      { original: 20, hex: 'C1,15', reversed: '15,C1' },
      { original: 21, hex: 'C1,16', reversed: '16,C1' },
      { original: 22, hex: 'C1,17', reversed: '17,C1' },
    ],
    iotTitle: 'Index-Organized Table (IOT)',
    iotWhat:
      'An index-organized table (IOT) is a table stored in a variation of a B-tree index structure. ' +
      'In a heap-organized table, rows are inserted wherever they fit. ' +
      'In an IOT, rows are stored in a B-tree index ordered by the primary key — each leaf entry holds both the key columns and the non-key column values. ' +
      'The index is the data, and the data is the index.',
    iotVsHeap: {
      heap: { label: 'Heap Table', steps: ['Index Leaf → ROWID', 'Fetch Data Block by ROWID', 'Total: 2 I/Os'] },
      iot:  { label: 'IOT', steps: ['Data in B-Tree Leaf directly', 'No extra block fetch needed', 'Total: 1 I/O'] },
    },
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
    invisibleTitle: 'Invisible / Unusable Index',
    invisibleRows: [
      { state: 'Usable', desc: 'Used by CBO / maintained on DML / consumes space', color: 'emerald' },
      { state: 'Unusable', desc: 'Ignored by CBO / NOT maintained on DML / no space — use for bulk loads', color: 'rose' },
      { state: 'Invisible', desc: 'Ignored by CBO / maintained on DML / consumes space — use to test before dropping', color: 'amber' },
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
    <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">

      {/* Composite index */}
      <section>
        <h2 className="mb-1 text-lg font-bold">{t.compositeTitle}</h2>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.compositeDesc}</p>

        {/* Column order rules */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.orderTitle}</h3>
        <div className="mb-6 overflow-hidden rounded-xl border">
          {t.orderRules.map((r, i) => (
            <div key={i} className={cn('flex items-start gap-3 border-b px-4 py-3 last:border-b-0', i % 2 === 1 ? 'bg-muted/20' : '')}>
              <span className={cn('mt-0.5 shrink-0 text-sm',
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

        {/* Index on (DEPT_ID, JOB_ID) visual */}
        <CompositeIndexVisual />
      </section>

      {/* FBI */}
      <section>
        <h3 className="mb-1 text-sm font-bold">{t.fbiTitle}</h3>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.fbiDesc}</p>
        <div className="space-y-3">
          {t.fbiExamples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-[1fr_1fr_1.5fr] gap-4 rounded-xl border bg-card px-5 py-4"
            >
              <div>
                <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">{lang === 'ko' ? '표현식' : 'Expression'}</div>
                <div className="font-mono text-xs font-bold text-orange-700">{ex.expr}</div>
              </div>
              <div>
                <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">{lang === 'ko' ? '용도' : 'Use case'}</div>
                <div className="text-xs">{ex.use}</div>
              </div>
              <div>
                <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">SQL</div>
                <div className="font-mono text-[10px] text-foreground/80">{ex.sql}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── IOT ── */}
      <section>
        <h3 className="mb-1 text-sm font-bold">{t.iotTitle}</h3>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{t.iotWhat}</p>

        {/* Heap vs IOT I/O 비교 카드 */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-sm">
          {(['heap', 'iot'] as const).map((k) => {
            const side = t.iotVsHeap[k]
            return (
              <div key={k} className={cn('rounded-xl border p-4',
                k === 'iot' ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-muted/20'
              )}>
                <div className={cn('mb-2 font-mono text-xs font-bold', k === 'iot' ? 'text-emerald-700' : 'text-foreground')}>
                  {side.label}
                </div>
                <ul className="space-y-1">
                  {side.steps.map((s, i) => (
                    <li key={i} className={cn('text-[11px]', i === 2 ? 'font-bold' : 'text-muted-foreground')}>{s}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Leaf 블록 구조 시각화 */}
        <h3 className="mb-1 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.iotStructTitle}</h3>
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t.iotStructDesc}</p>
        <IotStorageVisual lang={lang} />

        {/* Overflow + Secondary Index */}
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

        {/* When / Limits */}
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
      </section>

      <Divider />

      {/* ── Reverse Key ── */}
      <section>
        <h3 className="mb-1 text-sm font-bold">{t.reverseTitle}</h3>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.reverseDesc}</p>
        <div className="overflow-hidden rounded-xl border sm:max-w-xs">
          <div className="grid grid-cols-3 divide-x border-b bg-muted/40 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="px-3 py-2">{lang === 'ko' ? '원본 키' : 'Original Key'}</div>
            <div className="px-3 py-2">HEX</div>
            <div className="px-3 py-2">{lang === 'ko' ? '역순 저장' : 'Reversed'}</div>
          </div>
          {t.reverseDemo.map((r, i) => (
            <div key={i} className={cn('grid grid-cols-3 divide-x font-mono text-xs', i % 2 === 1 ? 'bg-muted/20' : '')}>
              <div className="px-3 py-2 font-bold">{r.original}</div>
              <div className="px-3 py-2 text-muted-foreground">{r.hex}</div>
              <div className="px-3 py-2 font-bold text-rose-700">{r.reversed}</div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Invisible / Unusable */}
      <section className="pb-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.invisibleTitle}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {t.invisibleRows.map((r, i) => {
            const c = r.color === 'emerald'
              ? 'border-emerald-200 bg-emerald-50/60'
              : r.color === 'rose'
              ? 'border-rose-200 bg-rose-50/60'
              : 'border-amber-200 bg-amber-50/60'
            const tc = r.color === 'emerald' ? 'text-emerald-700'
              : r.color === 'rose' ? 'text-rose-700' : 'text-amber-700'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn('rounded-xl border p-4', c)}
              >
                <div className={cn('mb-1.5 font-mono text-xs font-bold', tc)}>{r.state}</div>
                <p className="text-[11px] leading-snug text-muted-foreground">{r.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      <Divider />

      {/* Key Compression */}
      <section>
        <h2 className="mb-1 text-lg font-bold">{t.keyCompressTitle}</h2>
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.keyCompressDesc}</p>

        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">{t.keyCompressHowTitle}</h3>
        <KeyCompressionVisual lang={lang} />

        <div className="mt-4">
          <InfoBox variant="note">{t.keyCompressNote}</InfoBox>
        </div>

        <div className="mt-6">
          <h3 className="mb-1 text-sm font-bold">{t.keyCompressAdvancedTitle}</h3>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{t.keyCompressAdvancedDesc}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <SqlBlock
              badge={lang === 'ko' ? 'Prefix Compression' : 'Prefix Compression'}
              badgeColor="violet"
              desc={lang === 'ko'
                ? '앞에서 몇 번째 컬럼까지 압축 키로 쓸지 직접 지정해요. COMPRESS만 쓰면 기본값(비고유 컬럼 전체)이 적용돼요.'
                : 'Specify N leading columns as the prefix key. COMPRESS alone uses the default (all non-unique columns).'}
              sql={`-- 기본값: 모든 선두 컬럼 압축\nCREATE INDEX ord_mode_stat_ix\n  ON orders(order_mode, order_status)\n  COMPRESS;\n\n-- 첫 번째 컬럼만 압축\nCREATE INDEX ord_mode_stat_ix\n  ON orders(order_mode, order_status)\n  COMPRESS 1;`}
            />
            <SqlBlock
              badge={lang === 'ko' ? 'Advanced Compression' : 'Advanced Compression'}
              badgeColor="blue"
              desc={lang === 'ko'
                ? '오라클이 블록마다 가장 좋은 압축 방식을 알아서 골라줘요. Unique 인덱스에도 쓸 수 있어요.'
                : 'Oracle selects optimal compression per block automatically. Works on unique indexes too.'}
              sql={`-- Advanced High (Oracle 12.2+, 기본값)\nCREATE INDEX hr_emp_mgr_dept_ix\n  ON hr.employees(manager_id, department_id)\n  COMPRESS ADVANCED;\n\n-- 압축 상태 확인\nSELECT compression\nFROM   dba_indexes\nWHERE  index_name = 'HR_EMP_MGR_DEPT_IX';\n-- Result: ADVANCED HIGH`}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Key Compression Visual ────────────────────────────────────────────────────

function KeyCompressionVisual({ lang }: { lang: 'ko' | 'en' }) {
  // Uncompressed leaf block entries: (order_mode, order_status, rowid)
  const uncompressed = [
    { mode: 'online', status: '0', rowid: 'AAAPvCAAFAAAAFaAAa' },
    { mode: 'online', status: '0', rowid: 'AAAPvCAAFAAAAFaAAg' },
    { mode: 'online', status: '0', rowid: 'AAAPvCAAFAAAAFaAAl' },
    { mode: 'online', status: '2', rowid: 'AAAPvCAAFAAAAFaAAm' },
    { mode: 'online', status: '2', rowid: 'AAAPvCAAFAAAAFaAAr' },
    { mode: 'direct', status: '0', rowid: 'AAAPvCAAFAAAAFaAAs' },
    { mode: 'direct', status: '1', rowid: 'AAAPvCAAFAAAAFaAAv' },
  ]

  // Groups for compressed view
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
    'bg-blue-50',   // online,0
    'bg-blue-50',
    'bg-blue-50',
    'bg-violet-50', // online,2
    'bg-violet-50',
    'bg-orange-50', // direct,0
    'bg-rose-50',   // direct,1
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left: Uncompressed */}
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-muted/40 border-b px-4 py-2 flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {lang === 'ko' ? '압축 전 (Leaf Block)' : 'Before Compression (Leaf Block)'}
          </span>
          <span className="ml-auto rounded bg-rose-100 px-2 py-0.5 font-mono text-[9px] font-bold text-rose-700">
            7 × (mode + status + rowid)
          </span>
        </div>
        {/* header row */}
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
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-muted/40 border-b px-4 py-2 flex items-center gap-2">
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
                {/* Prefix row */}
                <div className={cn('mb-1.5 flex items-center gap-2 rounded px-2 py-1 border', c.border)}>
                  <span className={cn('font-mono text-[9px] font-bold uppercase tracking-wider', c.text)}>
                    {lang === 'ko' ? '공통 접두사' : 'prefix'}
                  </span>
                  <span className={cn('rounded px-1.5 py-0.5 font-mono text-[10px] font-bold', c.badge)}>
                    {grp.prefix}
                  </span>
                </div>
                {/* ROWID entries */}
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
    { id: 20, name: 'Marketing',   mgr: 201, loc: 1800, block: 1, color: 'bg-blue-50' },
    { id: 50, name: 'Shipping',    mgr: 121, loc: 1500, block: 1, color: 'bg-blue-50' },
    { id: 30, name: 'Purchasing',  mgr: 114, loc: 1700, block: 2, color: 'bg-violet-50' },
    { id: 60, name: 'IT',          mgr: 103, loc: 1400, block: 2, color: 'bg-violet-50' },
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

// ── Composite Index Visual ─────────────────────────────────────────────────────

function CompositeIndexVisual() {
  const lang = useSimulationStore((s) => s.lang)
  const entries = [
    { dept: 10, job: 'AD_ASST', rowid: 'AAA001' },
    { dept: 20, job: 'MK_MAN',  rowid: 'AAA002' },
    { dept: 50, job: 'ST_MAN',  rowid: 'AAA003' },
    { dept: 50, job: 'ST_CLERK',rowid: 'AAA004' },
    { dept: 60, job: 'IT_PROG', rowid: 'AAA005' },
    { dept: 60, job: 'IT_PROG', rowid: 'AAA006' },
    { dept: 80, job: 'SA_MAN',  rowid: 'AAA007' },
    { dept: 90, job: 'AD_PRES', rowid: 'AAA008' },
  ]

  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="rounded-xl border bg-muted/20 p-5">
      <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        IDX_EMP_DEPT_JOB — (DEPARTMENT_ID, JOB_ID)
      </div>
      <div className="mb-2 grid grid-cols-[80px_100px_80px] gap-2 font-mono text-[10px] font-semibold text-muted-foreground border-b pb-2">
        <span>DEPT_ID</span>
        <span>JOB_ID</span>
        <span>ROWID</span>
      </div>
      <div className="space-y-1">
        {entries.map((e, i) => {
          const leading = hovered !== null && entries[hovered].dept === e.dept
          const full    = hovered !== null && entries[hovered].dept === e.dept && entries[hovered].job === e.job
          return (
            <motion.div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              animate={{
                backgroundColor: full ? '#bbf7d0' : leading ? '#dbeafe' : 'transparent',
              }}
              className="grid cursor-pointer grid-cols-[80px_100px_80px] gap-2 rounded-lg px-2 py-1"
            >
              <span className="font-mono text-[11px] font-bold">{e.dept}</span>
              <span className="font-mono text-[11px]">{e.job}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{e.rowid}</span>
            </motion.div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        {lang === 'ko'
          ? '파란색 = DEPT_ID만 일치 (Range Scan으로 검색 가능) · 초록색 = (DEPT_ID, JOB_ID) 둘 다 일치'
          : 'Blue = DEPT_ID match only (Range Scan) · Green = full (DEPT_ID, JOB_ID) match'}
      </p>
    </div>
  )
}

