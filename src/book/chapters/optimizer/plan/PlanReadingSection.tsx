import { useState } from 'react'
import { IconPencil, IconChevronDown } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  Divider,
  SqlBlock,
  InfoBox,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: '실행 계획 읽는 연습하기',
    subtitle:
      '실제 DBMS_XPLAN 출력을 보고 스스로 해석해 본 뒤, 아코디언을 열어 정답과 비교해 보세요.',
    intro:
      '실행 계획을 잘 읽으려면 반복 연습이 중요해요. 아래 6개의 예제를 순서대로 풀어보세요. 각 예제마다 실행 계획 출력이 먼저 보이고, "해설 보기"를 누르면 정답을 확인할 수 있어요.',
    answerLabel: '해설 보기',
  },
  en: {
    title: 'Practice Reading Execution Plans',
    subtitle:
      'Study each DBMS_XPLAN output, try to interpret it on your own, then expand the accordion to check your answer.',
    intro:
      'Reading execution plans well takes practice. Work through the six examples below in order. Each one shows the plan output first — expand "Show Answer" when you are ready to check.',
    answerLabel: 'Show Answer',
  },
}

// ── 공통: 다크 터미널 출력 렌더러 ──────────────────────────────────────────────

interface OutputLine {
  text: string
  color?: string
}

function PlanOutput({ lines, caption }: { lines: OutputLine[]; caption?: string }) {
  return (
    <div className="my-4">
      {caption && (
        <p className="mb-1 text-xs font-semibold text-muted-foreground">{caption}</p>
      )}
      <pre className="overflow-x-auto rounded-xl bg-[#0f172a] px-5 py-4 font-mono text-xs leading-relaxed">
        {lines.map((l, i) => (
          <span key={i} className="block whitespace-pre" style={{ color: l.color ?? '#94a3b8' }}>
            {l.text || ' '}
          </span>
        ))}
      </pre>
    </div>
  )
}

const pip = '#475569'
const hdr = '#64748b'
const op  = '#3b82f6'
const idx = '#16a34a'
const fts = '#ea580c'
const joi = '#7c3aed'
const pre = '#fbbf24'
const yel = '#f59e0b'

// ── 연습 1: CR/PR로 Buffer Cache 히트율 읽기 ────────────────────────────────────
// 시나리오: 부서별 주문 집계(배치 리포트). 첫 실행과 두 번째 실행의 PR 차이 비교.
// 수정: GROUP BY가 있으므로 HASH GROUP BY 사용. A-Rows는 부서 수(12)로 수정.

const ex1Lines: OutputLine[] = [
  { text: '-- [첫 번째 실행 직후]', color: hdr },
  { text: '-----------------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                    | Name           | Starts | E-Rows | A-Rows |  CR |  PR |', color: hdr },
  { text: '-----------------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT             |                |      1 |     12 |     12 |1842 | 312 |', color: op  },
  { text: '|  1 |  HASH GROUP BY               |                |      1 |     12 |     12 |1842 | 312 |', color: joi },
  { text: '|* 2 |   HASH JOIN                  |                |      1 |  47000 |  52381 |1842 | 312 |', color: joi },
  { text: '|  3 |    TABLE ACCESS FULL         | DEPARTMENTS    |      1 |     27 |     27 |   7 |   7 |', color: fts },
  { text: '|* 4 |    TABLE ACCESS FULL         | ORDERS         |      1 |  47000 |  52381 | 835 | 305 |', color: fts },
  { text: '-----------------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: '-- [두 번째 실행 직후 (캐시 워밍 후)]', color: hdr },
  { text: '-----------------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                    | Name           | Starts | E-Rows | A-Rows |  CR |  PR |', color: hdr },
  { text: '-----------------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT             |                |      1 |     12 |     12 |1842 |   0 |', color: op  },
  { text: '|  1 |  HASH GROUP BY               |                |      1 |     12 |     12 |1842 |   0 |', color: joi },
  { text: '|* 2 |   HASH JOIN                  |                |      1 |  47000 |  52381 |1842 |   0 |', color: joi },
  { text: '|  3 |    TABLE ACCESS FULL         | DEPARTMENTS    |      1 |     27 |     27 |   7 |   0 |', color: fts },
  { text: '|* 4 |    TABLE ACCESS FULL         | ORDERS         |      1 |  47000 |  52381 | 835 |   0 |', color: fts },
  { text: '-----------------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information:', color: yel },
  { text: '   2 - access("O"."DEPT_ID"="D"."DEPARTMENT_ID")', color: pre },
  { text: '   4 - filter("O"."ORDER_DATE">=TRUNC(SYSDATE-30))', color: pre },
]

const ex1Sql = `-- 최근 30일 부서별 주문 합계 (배치 리포트)
SELECT /*+ gather_plan_statistics */
       d.department_name,
       COUNT(*)        AS order_cnt,
       SUM(o.amount)   AS total_amount
FROM   orders o
JOIN   departments d ON o.dept_id = d.department_id
WHERE  o.order_date >= TRUNC(SYSDATE - 30)
GROUP BY d.department_name;`

const ex1AnswerKo = `■ 핵심 포인트: PR(Physical Reads) — Buffer Cache 히트율

첫 번째 실행: CR=1842, PR=312
두 번째 실행: CR=1842, PR=0

CR(Consistent Reads)은 두 실행 모두 1842으로 동일해요.
논리적으로 읽어야 하는 블록 수는 쿼리 계획에 의해 결정되므로
실행 횟수와 무관하게 같아요.

PR은 첫 실행에서 312, 두 번째에서 0으로 줄었어요.
  ORDERS (PR=305): 첫 실행 시 Buffer Cache에 없어 디스크에서 읽음
  DEPARTMENTS (PR=7): 마찬가지로 첫 실행 시 디스크 읽기
두 번째 실행에서 PR=0인 것은 첫 실행이 해당 블록을
Buffer Cache에 이미 적재했기 때문이에요.
이것이 정상적인 "캐시 워밍(cache warming)" 현상이에요.

만약 두 번째 실행에서도 PR > 0이 지속된다면?
  → Buffer Cache가 작아 다른 쿼리가 블록을 계속 교체(eviction)하는 신호
  → DB_CACHE_SIZE 또는 SGA_TARGET 증설 검토

■ 오퍼레이션 해설

1번 HASH GROUP BY: GROUP BY department_name을 해시로 처리.
  A-Rows=12 → 27개 부서 중 30일 내 주문이 있는 12개 부서 집계 결과.

2번 HASH JOIN: E-Rows=47000, A-Rows=52381 → 약 11% 과소 추정.
  ORDER_DATE 조건 히스토그램이 없어 균등 분포로 추정한 결과.
  오차가 크지 않아 실행 계획에는 영향 없음.

4번 filter("O"."ORDER_DATE">=TRUNC(SYSDATE-30)):
  SYSDATE는 실행 시마다 달라지므로 access가 아닌 filter.
  30일치 ORDERS는 전체 중 상당 비중 → FTS가 인덱스보다 저렴한 선택.`

const ex1AnswerEn = `■ Key Point: PR (Physical Reads) — Buffer Cache hit rate

First execution:  CR=1842, PR=312
Second execution: CR=1842, PR=0

CR stays at 1842 in both runs — the number of logical blocks to
read is determined by the query plan, not by how many times it runs.

PR dropped from 312 to 0.
  ORDERS (PR=305): not in Buffer Cache on first run → disk read
  DEPARTMENTS (PR=7): same — cold cache on first run
On the second run PR=0 because the first run already loaded
those blocks into the cache. This is normal "cache warming."

If PR stays > 0 on repeated executions:
  → Other queries are evicting blocks faster than they can be reused
  → Consider increasing DB_CACHE_SIZE or SGA_TARGET

■ Operation notes

Op 1 HASH GROUP BY: groups by department_name using a hash aggregate.
  A-Rows=12 → orders existed in the last 30 days for 12 of the 27 departments.

Op 2 HASH JOIN: E-Rows=47000, A-Rows=52381 → ~11% underestimate.
  No histogram on ORDER_DATE, so CBO assumed uniform distribution.
  The gap is small enough that the plan choice is unaffected.

Op 4 filter("O"."ORDER_DATE">=TRUNC(SYSDATE-30)):
  SYSDATE changes each run, so it cannot be an access predicate.
  30 days of orders likely covers most of the table → FTS is cheaper than index access.`

// ── 연습 2: E-Rows vs A-Rows — 통계 오차가 조인 방식에 미치는 영향 ────────────
// 수정: Hash Join에서 작은 Build Input이 CUSTOMERS(추정 500행)고
//       큰 Probe Input이 ORDERS(89000행) — CBO 관점으로 순서 맞음.
//       해설에서 "ORDERS 전체를 Build" 오류 수정.

const ex2Lines: OutputLine[] = [
  { text: '----------------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                    | Name          | Starts | E-Rows | A-Rows |  CR |  PR |', color: hdr },
  { text: '----------------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT             |               |      1 |    500 |      3 |3241 | 128 |', color: op  },
  { text: '|* 1 |  HASH JOIN                   |               |      1 |    500 |      3 |3241 | 128 |', color: joi },
  { text: '|* 2 |   TABLE ACCESS FULL          | CUSTOMERS     |      1 |    500 |      3 | 412 |  98 |', color: fts },
  { text: '|  3 |   TABLE ACCESS FULL          | ORDERS        |      1 |  89000 |  89412 |2829 |  30 |', color: fts },
  { text: '----------------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information:', color: yel },
  { text: '   1 - access("O"."CUSTOMER_ID"="C"."CUSTOMER_ID")', color: pre },
  { text: '   2 - filter("C"."GRADE"=\'VIP\' AND "C"."REGION"=\'SEOUL\')', color: pre },
]

const ex2Sql = `-- VIP 고객(서울 지역)의 전체 주문 조회
SELECT /*+ gather_plan_statistics */
       c.customer_name, o.order_id, o.amount
FROM   customers c
JOIN   orders o ON o.customer_id = c.customer_id
WHERE  c.grade   = 'VIP'
AND    c.region  = 'SEOUL';`

const ex2AnswerKo = `■ 핵심 포인트: E-Rows vs A-Rows — 통계 오차가 조인 방식을 바꾼다

2번 오퍼레이션 (TABLE ACCESS FULL, CUSTOMERS):
  E-Rows=500, A-Rows=3
  CBO는 grade='VIP' AND region='SEOUL' 조건으로 500행이 반환될 것으로
  추정했지만 실제로는 단 3행만 반환되었어요.

왜 이렇게 큰 차이가 났을까요?
  두 컬럼의 결합 선택도를 CBO가 독립적으로 곱해서 계산했어요.
  히스토그램이나 컬럼 상관관계 정보가 없으면 이런 과대 추정이 발생해요.

Hash Join의 작동 방식을 되짚으면:
  CBO는 먼저 읽는 쪽(Build Input)으로 작은 테이블을 선택해요.
  CUSTOMERS(추정 500행)를 Build Input → 해시 테이블 구성
  ORDERS(89000행)를 Probe Input → 해시 테이블 탐색
  이 선택 자체는 CBO 관점에서 올바른 판단이에요.

문제는 CUSTOMERS가 실제로는 3행밖에 없다는 것:
  CUSTOMERS: CR=412, PR=98 → 3행을 찾기 위해 412블록을 읽음 (FTS)
  ORDERS: CR=2829, PR=30 → 89412행 전체를 읽어 3개의 해시 버킷 탐색

실제 3행이라면 Nested Loop가 훨씬 유리했을 거예요:
  CUSTOMERS에서 3행 추출 → ORDERS 인덱스를 3번만 탐색
  CR이 수십 수준에 그쳤을 거예요 (현재 CR=3241 대비).

■ 해결 방법
  1. 복합 인덱스: CREATE INDEX cust_grade_region_ix ON customers(grade, region)
     → CUSTOMERS FTS를 Index Range Scan으로 전환, CR=412 감소
  2. DBMS_STATS 재수집 + 두 컬럼 히스토그램 추가
     → CBO가 실제 3행 근방을 추정 → Nested Loop 선택 가능
  3. 힌트 임시 조치: /*+ USE_NL(c o) INDEX(c cust_grade_region_ix) */`

const ex2AnswerEn = `■ Key Point: E-Rows vs A-Rows — statistics error changes the join method

Operation 2 (TABLE ACCESS FULL, CUSTOMERS):
  E-Rows=500, A-Rows=3
  CBO estimated 500 rows from grade='VIP' AND region='SEOUL',
  but only 3 rows actually matched.

Why such a large gap?
  CBO multiplied the individual column selectivities independently.
  Without histograms or column correlation data, this overestimation is common.

Hash Join mechanics — worth revisiting:
  CBO picks the smaller table as the Build Input (first in the plan).
  CUSTOMERS (estimated 500 rows) → Build Input: hash table constructed
  ORDERS (89,000 rows) → Probe Input: scanned and probed against the hash table
  This choice is correct from CBO's perspective given its estimates.

The problem is that CUSTOMERS actually returns only 3 rows:
  CUSTOMERS: CR=412, PR=98 — 412 blocks read just to return 3 rows (FTS)
  ORDERS: CR=2829, PR=30 — all 89,412 rows scanned to probe 3 hash buckets

With the true 3 rows, Nested Loop would be far better:
  Extract 3 rows from CUSTOMERS → probe ORDERS index 3 times
  CR would be in the tens, not 3,241.

■ Fixes
  1. Composite index: CREATE INDEX cust_grade_region_ix ON customers(grade, region)
     Converts CUSTOMERS FTS to Index Range Scan, slashing CR=412
  2. Re-gather DBMS_STATS with histograms on both columns
     CBO estimates near 3 rows → likely switches to Nested Loop
  3. Hint as short-term workaround: /*+ USE_NL(c o) INDEX(c cust_grade_region_ix) */`

// ── 연습 3: access vs filter — Predicate Information으로 인덱스 효율 진단 ──────
// 수정: INDEX RANGE SCAN A-Rows=820이고 TABLE ACCESS A-Rows=2가 맞음.
//       E-Rows 수정: 인덱스 스캔 E-Rows를 820에 맞게 조정.

const ex3Lines: OutputLine[] = [
  { text: '---------------------------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                          | Name             | Starts | E-Rows | A-Rows |  CR |  PR |', color: hdr },
  { text: '---------------------------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT                   |                  |      1 |     50 |      2 | 984 |   0 |', color: op  },
  { text: '|* 1 |  TABLE ACCESS BY INDEX ROWID BATCHED| ORDERS           |      1 |     50 |      2 | 820 |   0 |', color: fts },
  { text: '|* 2 |   INDEX RANGE SCAN                 | ORD_CUST_DATE_IX |      1 |    820 |    820 | 164 |   0 |', color: idx },
  { text: '---------------------------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information:', color: yel },
  { text: '   1 - filter("O"."STATUS"=\'CANCELLED\')', color: pre },
  { text: '   2 - access("O"."CUSTOMER_ID"=10042)', color: pre },
  { text: '       filter("O"."ORDER_DATE">=DATE\'2024-01-01\')', color: pre },
]

const ex3Sql = `-- 특정 고객의 취소 주문 조회
SELECT /*+ gather_plan_statistics */
       order_id, order_date, amount, status
FROM   orders o
WHERE  o.customer_id = 10042
AND    o.order_date  >= DATE '2024-01-01'
AND    o.status      = 'CANCELLED';`

const ex3AnswerKo = `■ 핵심 포인트: access와 filter가 한 오퍼레이션에 함께 나타난 경우

Predicate Information 해석:
  2번 (INDEX RANGE SCAN, ORD_CUST_DATE_IX):
    access("O"."CUSTOMER_ID"=10042)          ← 인덱스 탐색 시작 범위 결정
    filter("O"."ORDER_DATE">=DATE'2024-01-01') ← 읽어온 뒤 버리는 조건

인덱스 구조를 역추론할 수 있어요:
  CUSTOMER_ID가 선두 컬럼 → access로 처리됨.
  ORDER_DATE는 인덱스에 없거나 선두가 아님 → filter로만 처리.
  인덱스 이름(ORD_CUST_DATE_IX)에 DATE가 포함되어 있지만
  실제로는 CUSTOMER_ID 단일 컬럼 인덱스이거나
  (DATE, CUSTOMER_ID) 순서로 만들어진 인덱스일 가능성이 큽니다.

수치 분석:
  2번 INDEX RANGE SCAN: A-Rows=820
    CUSTOMER_ID=10042인 모든 주문(820건)을 인덱스에서 읽음
    CR=164 (인덱스 블록 164개 읽기)

  1번 TABLE ACCESS: A-Rows=2, CR=820
    인덱스에서 나온 820개 ROWID 각각으로 테이블 접근 (820번)
    ORDER_DATE filter로 대부분 버리고 STATUS='CANCELLED'로 최종 2건만 남김
    CR=820은 테이블 블록 820번 읽기에서 발생

  전체 CR=984 = 인덱스 164 + 테이블 820
  820개 접근해서 2개 반환 → 접근 대비 선택율이 극히 낮음

1번 오퍼레이션 E-Rows=50인 이유:
  CBO는 820 × (STATUS='CANCELLED' 선택도) ≈ 50으로 추정했지만
  실제로는 2건이라 A-Rows=2. STATUS 히스토그램 부재.

■ 최적화 방향
  인덱스를 (CUSTOMER_ID, ORDER_DATE, STATUS)로 재구성하면:
  1. CUSTOMER_ID로 access → ORDER_DATE도 access 범위로 좁힘
     2024-01-01 이후 주문만 인덱스에서 바로 필터링
  2. STATUS까지 인덱스에 포함 → 테이블 접근 없이 Index-Only Scan 가능
  결과: A-Rows 2건만큼만 접근, CR이 984 → 수 건으로 급감`

const ex3AnswerEn = `■ Key Point: access and filter on the same operation

Predicate Information breakdown:
  Op 2 (INDEX RANGE SCAN, ORD_CUST_DATE_IX):
    access("O"."CUSTOMER_ID"=10042)            ← fixes the start of the index scan
    filter("O"."ORDER_DATE">=DATE'2024-01-01') ← applied after reading; rows discarded

We can reverse-engineer the index structure:
  CUSTOMER_ID is the leading column → access predicate.
  ORDER_DATE is not the leading column (or not in the index) → filter only.
  Despite the index name (ORD_CUST_DATE_IX), the ordering may be
  (CUSTOMER_ID) only, or (DATE, CUSTOMER_ID), making ORDER_DATE non-leading.

Reading the numbers:
  Op 2 INDEX RANGE SCAN: A-Rows=820
    All 820 orders for CUSTOMER_ID=10042 read from the index
    CR=164 (164 index blocks read)

  Op 1 TABLE ACCESS: A-Rows=2, CR=820
    Each of the 820 ROWIDs triggers one table block visit
    ORDER_DATE filter discards most; STATUS='CANCELLED' keeps 2
    CR=820 = 820 individual table block reads

  Total CR=984 = 164 (index) + 820 (table)
  820 table visits to return 2 rows — extremely low selectivity after index scan

Why E-Rows=50 on op 1?
  CBO estimated 820 × selectivity(STATUS='CANCELLED') ≈ 50.
  Actual A-Rows=2 because no histogram on STATUS.

■ Optimization
  Rebuild index as (CUSTOMER_ID, ORDER_DATE, STATUS):
  1. CUSTOMER_ID → access; ORDER_DATE also becomes access (range narrows)
     Only orders from 2024-01-01 onward are scanned in the index
  2. STATUS in the index → Index-Only Scan possible, no table visits
  Result: only 2 rows accessed, CR drops from 984 to single digits`

// ── 연습 4: SORT 오퍼레이션 + A-Time으로 병목 찾기 ─────────────────────────────
// 수정: Hash Join PW와 SORT PW를 분리. PW=214는 SORT만 가짐.
//       Hash Join PW는 0으로 수정해 SORT 스필에 집중.

const ex4Lines: OutputLine[] = [
  { text: '---------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation              | Name         | Starts | E-Rows | A-Rows |  CR |  PR |  PW | A-Time         |', color: hdr },
  { text: '---------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT       |              |      1 |   5000 |   5000 |4821 | 621 | 214 | 00:00:08.42    |', color: op  },
  { text: '|  1 |  SORT ORDER BY         |              |      1 |   5000 |   5000 |4821 | 621 | 214 | 00:00:08.42    |', color: joi },
  { text: '|* 2 |   HASH JOIN            |              |      1 |   5000 |   5000 |4607 | 407 |   0 | 00:00:07.91    |', color: joi },
  { text: '|  3 |    TABLE ACCESS FULL   | PRODUCTS     |      1 |   3200 |   3200 | 142 |  42 |   0 | 00:00:00.18    |', color: fts },
  { text: '|* 4 |    TABLE ACCESS FULL   | ORDER_ITEMS  |      1 |  82000 |  82000 |4465 | 365 |   0 | 00:00:02.34    |', color: fts },
  { text: '---------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information:', color: yel },
  { text: '   2 - access("OI"."PRODUCT_ID"="P"."PRODUCT_ID")', color: pre },
  { text: '   4 - filter("OI"."UNIT_PRICE">50)', color: pre },
  { text: '', color: '' },
  { text: 'Note', color: yel },
  { text: '-----', color: pip },
  { text: '   - sort in memory could not be done: 214 blocks written to temp', color: hdr },
]

const ex4Sql = `-- 단가 50 초과 상품별 주문 내역 (금액 내림차순)
SELECT /*+ gather_plan_statistics */
       p.product_name, oi.quantity, oi.unit_price
FROM   order_items oi
JOIN   products    p  ON oi.product_id = p.product_id
WHERE  oi.unit_price > 50
ORDER BY oi.unit_price DESC;`

const ex4AnswerKo = `■ 핵심 포인트 1: PW > 0 → 정렬이 디스크로 넘쳤다(Sort Spill)

오퍼레이션별 PW를 봅시다:
  1번 SORT ORDER BY:  PW=214  ← 여기서만 PW 발생
  2번 HASH JOIN:      PW=0    ← 해시 조인 자체는 메모리 내 처리
  3번, 4번 테이블 읽기: PW=0

Note 메시지: "sort in memory could not be done: 214 blocks written to temp"
5000행을 ORDER BY 정렬할 PGA 메모리가 부족해
214 블록을 TEMP 테이블스페이스에 기록했습니다.

A-Time으로 시간 분배를 읽으면:
  4번 ORDER_ITEMS 읽기: 00:00:02.34 (테이블 + 필터)
  2번 Hash Join 완료:  00:00:07.91 (조인 완료 시점 — 누적)
  1번 SORT 완료:       00:00:08.42 (TEMP I/O 포함 — 누적)
  ※ A-Time은 누적값이므로 SORT 단계 자체 시간 ≈ 8.42 - 7.91 = 0.51초
  TEMP 쓰기+읽기(I/O)가 0.51초를 대부분 차지합니다.

■ 핵심 포인트 2: PR=621 — 첫 실행 Cache Miss

PRODUCTS  (PR=42): 소규모 테이블, 첫 실행 시 디스크 읽기
ORDER_ITEMS (PR=365): 82000행 대규모 테이블, 첫 실행 시 디스크 읽기
Hash Join에 추가 PR=214: Hash 영역 구성 중 일부 디스크 접근

두 번째 실행에서 PR=0으로 내려가면 정상(Cache 워밍).
계속 높으면 Buffer Cache 크기 검토.

■ 해결 방법

정렬 스필 제거 (PW=214 → 0):
  ALTER SESSION SET sort_area_size = 104857600;  -- 100MB 세션 설정
  또는 PGA_AGGREGATE_TARGET 시스템 레벨 증설.
  SORT 전 행 수를 줄이는 것도 방법:
  WHERE 조건 강화 또는 쿼리 구조 변경.

ORDER_ITEMS FTS 개선:
  (product_id, unit_price) 복합 인덱스 추가 시
  filter → access로 바뀌어 CR 감소 가능.`

const ex4AnswerEn = `■ Key Point 1: PW > 0 → sort spilled to disk

Read PW by operation:
  Op 1 SORT ORDER BY:  PW=214  ← all disk writes come from here
  Op 2 HASH JOIN:      PW=0    ← hash join fit in memory
  Ops 3 & 4 table reads: PW=0

Note message: "sort in memory could not be done: 214 blocks written to temp"
Sorting 5,000 rows required more PGA than was available;
Oracle wrote 214 blocks to the TEMP tablespace.

Reading A-Time to see where time was spent (all values are cumulative):
  Op 4 ORDER_ITEMS read:  00:00:02.34
  Op 2 Hash Join done:    00:00:07.91 (cumulative to this point)
  Op 1 SORT done:         00:00:08.42 (final total)
  SORT step time alone ≈ 8.42 - 7.91 = 0.51 s, mostly TEMP read/write I/O.

■ Key Point 2: PR=621 — cold cache on first run

PRODUCTS  (PR=42):    small table, read from disk on first run
ORDER_ITEMS (PR=365): large table (82,000 rows), cold on first run
Hash Join area contributes PR=214: partial disk access during hash build

If PR drops to 0 on the second run, that is normal cache warming.
If it persists across runs, review Buffer Cache sizing.

■ Fixes

Eliminate sort spill (PW=214 → 0):
  ALTER SESSION SET sort_area_size = 104857600;  -- 100 MB session override
  Or increase PGA_AGGREGATE_TARGET system-wide.
  Reducing row count before the sort also helps:
  tighten WHERE predicates or restructure the query.

Improve ORDER_ITEMS FTS:
  A composite index on (product_id, unit_price) converts
  the filter predicate to access, reducing CR.`

// ── 연습 5: Starts 컬럼으로 Nested Loop 반복 횟수 읽기 ──────────────────────────
// 수정: TABLE ACCESS Starts=200, A-Rows(누적)=20 정합성 확인.
//       INDEX RANGE SCAN이 20회 × 각 10행 평균 반환 → A-Rows=200(누적). 맞음.
//       5번 Starts=200은 INDEX RANGE SCAN 총 A-Rows=200에서 비롯됨. 정합성 OK.

const ex5Lines: OutputLine[] = [
  { text: '---------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                    | Name             | Starts | E-Rows | A-Rows |   CR |  PR | A-Time        |', color: hdr },
  { text: '---------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT             |                  |      1 |     20 |     20 |84521 |   0 | 00:00:04.17   |', color: op  },
  { text: '|  1 |  NESTED LOOPS                |                  |      1 |     20 |     20 |84521 |   0 | 00:00:04.17   |', color: joi },
  { text: '|  2 |   NESTED LOOPS               |                  |      1 |     20 |     20 |84321 |   0 | 00:00:04.15   |', color: joi },
  { text: '|* 3 |    TABLE ACCESS FULL         | VIP_CUSTOMERS    |      1 |     20 |     20 |  421 |   0 | 00:00:00.03   |', color: fts },
  { text: '|* 4 |    INDEX RANGE SCAN          | ORD_CUST_DATE_IX |     20 |     10 |    200 |83900 |   0 | 00:00:04.10   |', color: idx },
  { text: '|* 5 |   TABLE ACCESS BY INDEX ROWID| ORDERS           |    200 |      1 |     20 |  200 |   0 | 00:00:00.02   |', color: fts },
  { text: '---------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information:', color: yel },
  { text: '   3 - filter("C"."GRADE"=\'VIP\')', color: pre },
  { text: '   4 - access("O"."CUSTOMER_ID"="C"."CUSTOMER_ID")', color: pre },
  { text: '       filter("O"."ORDER_DATE">=ADD_MONTHS(SYSDATE,-6))', color: pre },
  { text: '   5 - filter("O"."STATUS"=\'DELIVERED\')', color: pre },
]

const ex5Sql = `-- VIP 고객의 최근 6개월 배송완료 주문 조회
SELECT /*+ gather_plan_statistics */
       c.customer_name, o.order_id, o.amount, o.order_date
FROM   vip_customers c
JOIN   orders o
       ON  o.customer_id = c.customer_id
       AND o.order_date  >= ADD_MONTHS(SYSDATE, -6)
WHERE  o.status = 'DELIVERED'
ORDER BY o.order_date DESC;`

const ex5AnswerKo = `■ 핵심 포인트: Starts 컬럼 — Nested Loop의 반복 실행 횟수

Starts 컬럼이 Nested Loop의 핵심을 보여줍니다:

  3번 VIP_CUSTOMERS FTS: Starts=1, A-Rows=20
    → 한 번 전체 스캔, VIP 고객 20명 추출

  4번 INDEX RANGE SCAN: Starts=20, E-Rows=10, A-Rows=200(누적)
    → VIP 고객 1명당 1회 실행 (20명 × 1회 = 20 Starts)
    → 1명당 평균 10건의 인덱스 엔트리 반환 (20 × 10 = 200 A-Rows)
    → E-Rows=10이 실제와 일치 — 통계 정확

  5번 TABLE ACCESS BY INDEX ROWID: Starts=200, A-Rows=20(누적)
    → 인덱스에서 나온 200행 각각으로 테이블 접근 (200 Starts)
    → filter("STATUS"='DELIVERED')로 최종 20행만 선택
    → 200 접근 중 180번은 버려짐

CR=84521이 발생한 구조:
  4번 INDEX RANGE SCAN: CR=83900
    20회 × 약 4195 블록씩 = 83900 CR
    VIP 고객 1명당 인덱스를 4195 블록이나 읽고 있어요.
    이것이 전체 시간의 대부분(4.10초 / 4.17초)을 차지해요.
  5번 TABLE ACCESS: CR=200
    200 ROWID × 1블록씩 = 200 CR (비교적 작음)

ORDER_DATE가 filter인 이유:
  ADD_MONTHS(SYSDATE,-6)는 실행 시마다 달라지는 함수 결과예요.
  CBO는 이를 컴파일 시점에 고정할 수 없으므로 access 범위로 쓰지 못해요.
  실제로는 CUSTOMER_ID로 access 후 ORDER_DATE를 filter로 적용해요.
  이 때문에 인덱스 스캔 범위가 CUSTOMER_ID 전체가 되어 CR이 폭증해요.

■ 최적화 방향

INDEX RANGE SCAN CR=83900이 핵심 병목이에요.
인덱스를 (CUSTOMER_ID, ORDER_DATE, STATUS)로 재구성하면:

  1. CUSTOMER_ID → access (기존과 동일)
  2. ORDER_DATE → access 범위로 포함 가능
     (ADD_MONTHS는 filter지만 인덱스 구조상 leaf 탐색 범위가 줄어듦)
  3. STATUS → 인덱스에 포함 시 TABLE ACCESS 200회 제거 가능

예상 결과:
  Starts=200이었던 TABLE ACCESS가 사라지고
  CR이 84521 → 수백 수준으로 급감할 거예요.`

const ex5AnswerEn = `■ Key Point: Starts column — how many times each operation ran

The Starts column reveals the mechanics of Nested Loop:

  Op 3 VIP_CUSTOMERS FTS: Starts=1, A-Rows=20
    → Single full scan, extracts 20 VIP customers

  Op 4 INDEX RANGE SCAN: Starts=20, E-Rows=10, A-Rows=200 (cumulative)
    → Runs once per VIP customer (20 customers × 1 run = 20 Starts)
    → Returns ~10 index entries per customer on average (20 × 10 = 200 A-Rows)
    → E-Rows=10 matches actuals — statistics are accurate here

  Op 5 TABLE ACCESS BY INDEX ROWID: Starts=200, A-Rows=20 (cumulative)
    → One table visit per ROWID from the index (200 Starts)
    → filter("STATUS"='DELIVERED') keeps 20 of those 200 rows
    → 180 of the 200 table visits are wasted

How CR=84521 breaks down:
  Op 4 INDEX RANGE SCAN: CR=83900
    20 runs × ~4,195 blocks each = 83,900 CR
    Each VIP customer's index scan reads ~4,195 blocks — the primary bottleneck
    (4.10 s of the 4.17 s total elapsed time)
  Op 5 TABLE ACCESS: CR=200
    200 ROWID lookups × 1 block each = 200 CR (relatively small)

Why ORDER_DATE is a filter, not access:
  ADD_MONTHS(SYSDATE,-6) produces a different value each execution.
  Oracle cannot fix this as an index access range at compile time.
  So it remains a filter applied after reading all entries for each CUSTOMER_ID,
  meaning the index scan range equals all orders per customer — causing CR to explode.

■ Optimization

CR=83,900 from INDEX RANGE SCAN is the primary bottleneck.
Rebuild the index as (CUSTOMER_ID, ORDER_DATE, STATUS):

  1. CUSTOMER_ID → access (same as before)
  2. ORDER_DATE → now part of the index; even as a filter it narrows the leaf scan
  3. STATUS in the index → eliminates 200 TABLE ACCESS visits (Index-Only Scan)

Expected outcome:
  Starts=200 TABLE ACCESS disappears
  CR drops from 84,521 to the low hundreds`

// ── 연습 6: 긴 실행 계획 읽기 — 30줄 이상의 복합 쿼리 ───────────────────────────
// 시나리오: 영업 월별 실적 집계 + 목표 대비 달성률 + 지역 랭킹
//   ORDERS × CUSTOMERS × PRODUCTS × SALES_TARGETS × REGIONS
//   인라인 뷰, 윈도우 함수, 집계, 여러 조인이 혼합된 현업형 리포트 쿼리

const ex6Lines: OutputLine[] = [
  { text: '-- 영업 월별 실적 vs 목표 달성률 리포트 (gather_plan_statistics)', color: hdr },
  { text: '-----------------------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '| Id | Operation                        | Name               | Starts | E-Rows | A-Rows |    CR |  PR |  PW | A-Time        |', color: hdr },
  { text: '-----------------------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '|  0 | SELECT STATEMENT                 |                    |      1 |    120 |    120 | 52841 | 128 |  96 | 00:00:06.83   |', color: op  },
  { text: '|  1 |  WINDOW SORT                     |                    |      1 |    120 |    120 | 52841 | 128 |  96 | 00:00:06.83   |', color: joi },
  { text: '|* 2 |   HASH JOIN                      |                    |      1 |    120 |    120 | 52717 | 128 |  96 | 00:00:06.41   |', color: joi },
  { text: '|  3 |    TABLE ACCESS FULL             | SALES_TARGETS      |      1 |    120 |    120 |    48 |   0 |   0 | 00:00:00.01   |', color: fts },
  { text: '|* 4 |    VIEW                          |                    |      1 |    120 |    120 | 52669 | 128 |  96 | 00:00:06.38   |', color: joi },
  { text: '|* 5 |     HASH JOIN                    |                    |      1 |  38400 |  39821 | 52669 | 128 |  96 | 00:00:06.35   |', color: joi },
  { text: '|  6 |      TABLE ACCESS FULL           | REGIONS            |      1 |     24 |     24 |     9 |   0 |   0 | 00:00:00.01   |', color: fts },
  { text: '|* 7 |      HASH JOIN                   |                    |      1 |  38400 |  39821 | 52660 | 128 |  96 | 00:00:06.32   |', color: joi },
  { text: '|  8 |       VIEW                       | index$_join$_002   |      1 |   3800 |   3800 |  1240 |   0 |   0 | 00:00:00.08   |', color: joi },
  { text: '|* 9 |        HASH JOIN                 |                    |      1 |   3800 |   3800 |  1240 |   0 |   0 | 00:00:00.08   |', color: joi },
  { text: '| 10 |         INDEX FAST FULL SCAN      | PROD_CATEGORY_IX   |      1 |   3800 |   3800 |   620 |   0 |   0 | 00:00:00.04   |', color: idx },
  { text: '| 11 |         INDEX FAST FULL SCAN      | PRODUCTS_PK        |      1 |   3800 |   3800 |   620 |   0 |   0 | 00:00:00.04   |', color: idx },
  { text: '|* 12|       HASH JOIN                  |                    |      1 |  38400 |  39821 | 51420 | 128 |  96 | 00:00:06.20   |', color: joi },
  { text: '|* 13|        TABLE ACCESS FULL         | CUSTOMERS          |      1 |   8500 |   8712 |  3218 |  72 |   0 | 00:00:00.31   |', color: fts },
  { text: '|* 14|        HASH JOIN                 |                    |      1 |  38400 |  39821 | 48202 |  56 |  96 | 00:00:05.87   |', color: joi },
  { text: '|  15|         TABLE ACCESS FULL        | ORDER_ITEMS        |      1 |  95000 |  98341 | 18240 |  56 |   0 | 00:00:01.12   |', color: fts },
  { text: '|* 16|         TABLE ACCESS FULL        | ORDERS             |      1 | 120000 | 124892 | 29962 |   0 |   0 | 00:00:02.14   |', color: fts },
  { text: '-----------------------------------------------------------------------------------------------------------------------------', color: pip },
  { text: '', color: '' },
  { text: 'Predicate Information:', color: yel },
  { text: '   2  - access("M"."REGION_ID"="T"."REGION_ID" AND "M"."SALE_YM"="T"."SALE_YM")', color: pre },
  { text: '   4  - filter("M"."ACTUAL_AMT"/"T"."TARGET_AMT"*100>=80)', color: pre },
  { text: '   5  - access("M"."REGION_ID"="R"."REGION_ID")', color: pre },
  { text: '   7  - access("M"."PRODUCT_ID"="P"."PRODUCT_ID")', color: pre },
  { text: '   9  - access(ROWID=ROWID)', color: pre },
  { text: '   12 - access("OI"."ORDER_ID"="O"."ORDER_ID")', color: pre },
  { text: '   13 - filter("C"."CHANNEL"=\'ONLINE\' AND "C"."STATUS"=\'ACTIVE\')', color: pre },
  { text: '   14 - access("OI"."CUSTOMER_ID"="C"."CUSTOMER_ID")', color: pre },
  { text: '   16 - filter("O"."ORDER_DATE">=ADD_MONTHS(TRUNC(SYSDATE,\'MM\'),-11))', color: pre },
  { text: '', color: '' },
  { text: 'Note', color: yel },
  { text: '-----', color: pip },
  { text: '   - dynamic statistics used: dynamic sampling (level=2)', color: hdr },
  { text: '   - this is an adaptive plan', color: hdr },
]

const ex6Sql = `-- 온라인 채널 활성 고객 대상, 최근 12개월 월별 지역·상품군 실적 vs 목표 달성률
-- 달성률 80% 이상인 월만 출력, 지역 내 월별 달성률 순위 포함
SELECT /*+ gather_plan_statistics */
       m.sale_ym,
       r.region_name,
       p.category,
       m.actual_amt,
       t.target_amt,
       ROUND(m.actual_amt / t.target_amt * 100, 1) AS achieve_pct,
       RANK() OVER (
         PARTITION BY m.region_id, m.sale_ym
         ORDER BY m.actual_amt / t.target_amt DESC
       ) AS region_rank
FROM (
  -- 인라인 뷰: 월별 지역·상품군별 실매출 집계
  SELECT o.region_id,
         TO_CHAR(o.order_date, 'YYYY-MM') AS sale_ym,
         oi.product_id,
         p.product_id,
         SUM(oi.amount) AS actual_amt
  FROM   orders o
  JOIN   order_items  oi ON oi.order_id    = o.order_id
  JOIN   customers    c  ON oi.customer_id = c.customer_id
  JOIN   products     p  ON oi.product_id  = p.product_id
  JOIN   regions      r  ON o.region_id    = r.region_id
  WHERE  o.order_date  >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -11)
  AND    c.channel     = 'ONLINE'
  AND    c.status      = 'ACTIVE'
  GROUP BY o.region_id,
           TO_CHAR(o.order_date, 'YYYY-MM'),
           oi.product_id, p.product_id
) m
JOIN sales_targets t
  ON  t.region_id = m.region_id
  AND t.sale_ym   = m.sale_ym
WHERE  m.actual_amt / t.target_amt * 100 >= 80
ORDER BY m.sale_ym, r.region_name, achieve_pct DESC;`

const ex6AnswerKo = `이 실행 계획은 17개 오퍼레이션(Id 0~16)으로 구성된 복합 리포트 쿼리예요.
안쪽부터 바깥쪽으로, 같은 깊이에서는 위에서 아래 순서로 읽어요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 1: 실행 순서 파악
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

들여쓰기를 기준으로 가장 안쪽부터 읽으면:
  ⑯ → ⑮ → ⑭ → ⑬ → ⑫ → ⑪ → ⑩ → ⑨ → ⑧ → ⑦ → ⑥ → ⑤ → ④(VIEW) → ③ → ②(HASH JOIN) → ① → ⓪

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 2: 가장 안쪽 블록 — 인덱스 조인 (Id 8~11)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

8번 VIEW (index$_join$_002):
  9번~11번이 만들어내는 특수 뷰예요.
  Oracle이 PRODUCTS 테이블 없이 두 인덱스만으로 조인한 결과예요.

9번 HASH JOIN (access: ROWID=ROWID):
  10번 PROD_CATEGORY_IX (INDEX FAST FULL SCAN): 카테고리 정보 포함 인덱스
  11번 PRODUCTS_PK (INDEX FAST FULL SCAN): PK 인덱스
  두 인덱스를 ROWID로 연결해 PRODUCTS 테이블 접근 없이 product_id + category 추출.
  → PR=0, CR=1240 — 테이블을 읽지 않아 효율적 (Index Join 최적화)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 3: 메인 데이터 조인 흐름 (Id 12~16)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

16번 TABLE ACCESS FULL (ORDERS): PR=0, CR=29962
  filter("ORDER_DATE">=ADD_MONTHS(TRUNC(SYSDATE,'MM'),-11))
  E-Rows=120000, A-Rows=124892 — 약 4% 과소 추정. 큰 문제 없음.
  ORDER_DATE 조건이 filter인 이유: ADD_MONTHS(TRUNC(SYSDATE,'MM'),-11)은
  실행 시점 함수 → access 범위 고정 불가 → FTS.
  CR=29962 — ORDERS 테이블이 크고 전체를 읽어야 함.

15번 TABLE ACCESS FULL (ORDER_ITEMS): PR=56, CR=18240
  E-Rows=95000, A-Rows=98341 — 정합성 양호.
  PR=56은 첫 실행 시 일부 블록 Cache Miss.

14번 HASH JOIN: access("OI"."ORDER_ID"="O"."ORDER_ID")
  ORDERS(124892행)와 ORDER_ITEMS(98341행) 조인.
  PW=96 — 해시 영역이 PGA를 초과해 TEMP에 96블록 기록.
  두 대형 테이블을 조인하면서 메모리가 부족했어요.

13번 TABLE ACCESS FULL (CUSTOMERS): PR=72, CR=3218
  filter("CHANNEL"='ONLINE' AND "STATUS"='ACTIVE')
  E-Rows=8500, A-Rows=8712 — 통계 정확.
  두 조건 모두 filter → 인덱스 없거나 선택도가 낮은 상태.
  PR=72는 CUSTOMERS도 첫 실행 시 디스크 읽기.

12번 HASH JOIN: access("OI"."CUSTOMER_ID"="C"."CUSTOMER_ID")
  14번 결과(ORDERS+ORDER_ITEMS)와 13번(CUSTOMERS) 조인.
  A-Rows=39821 — ONLINE+ACTIVE 고객의 주문만 남김.
  여기서도 PW=96 (14번에서 올라온 PW가 누적됨).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 4: REGIONS, PRODUCTS 조인 (Id 5~8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7번 HASH JOIN: access("M"."PRODUCT_ID"="P"."PRODUCT_ID")
  12번 결과(39821행)와 8번 Index Join 결과(PRODUCTS 3800행) 조인.
  A-Rows=39821 — 상품 정보 추가.

6번 TABLE ACCESS FULL (REGIONS): PR=0, CR=9
  24개 소규모 테이블 — 전체 CR=9, 이미 캐시됨. 무시 가능한 비용.

5번 HASH JOIN: access("M"."REGION_ID"="R"."REGION_ID")
  39821행에 REGIONS 24행 조인 → 지역 정보 추가.

4번 VIEW filter: filter("M"."ACTUAL_AMT"/"T"."TARGET_AMT"*100>=80)
  인라인 뷰 결과에 달성률 80% 이상 필터 적용.
  E-Rows=120, A-Rows=120 — CBO 추정 정확.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 5: 목표 조인 + 윈도우 함수 (Id 1~3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3번 TABLE ACCESS FULL (SALES_TARGETS): PR=0, CR=48
  120개 소규모 목표 테이블. 완전 캐시됨.

2번 HASH JOIN: access("REGION_ID","SALE_YM")
  인라인 뷰 120행과 SALES_TARGETS 120행을 region_id + sale_ym으로 조인.
  A-Rows=120 — 정확히 매칭.

1번 WINDOW SORT (RANK() OVER ...): PW=96, A-Time=00:00:06.83
  RANK() 윈도우 함수를 위한 정렬. PW=96 — TEMP 스필 발생.
  120행이지만 이전 단계에서 이미 TEMP를 쓴 메모리 상태에서 추가 정렬.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 전체 진단 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

병목 1 — CR=29962 (ORDERS FTS):
  ORDER_DATE filter로 인해 ORDERS 전체를 읽어요.
  파티셔닝: ORDERS를 ORDER_DATE 기준으로 Range 파티셔닝하면
  12개월치 파티션만 접근 → CR 대폭 감소.

병목 2 — PW=96 (Hash Join + Window Sort 디스크 스필):
  ORDERS×ORDER_ITEMS 조인 시 PGA 부족으로 TEMP 기록.
  PGA_AGGREGATE_TARGET 증설 또는 Hash Join 순서 조정 검토.

긍정 신호:
  E-Rows ≈ A-Rows 전 구간 양호 — 통계 신뢰도 높음.
  PRODUCTS는 Index Join으로 테이블 접근 없이 처리 — 효율적.
  REGIONS, SALES_TARGETS은 소규모 + PR=0 — 문제 없음.
  Note의 "adaptive plan"은 Oracle이 실행 중 조인 방식을 조정했음을 의미.`

const ex6AnswerEn = `This plan has 17 operations (Id 0–16) for a complex report query.
Read from innermost (most indented) to outermost; siblings run top-to-bottom.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 1: Establish execution order
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reading by indentation depth (deepest first):
  ⑯ → ⑮ → ⑭ → ⑬ → ⑫ → ⑪ → ⑩ → ⑨ → ⑧ → ⑦ → ⑥ → ⑤ → ④(VIEW) → ③ → ②(HASH JOIN) → ① → ⓪

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 2: Innermost block — index join (Ids 8–11)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Op 8 VIEW (index$_join$_002):
  Oracle resolved PRODUCTS entirely from two indexes — no table access.

Op 9 HASH JOIN (access: ROWID=ROWID):
  Op 10 INDEX FAST FULL SCAN (PROD_CATEGORY_IX): index contains category data
  Op 11 INDEX FAST FULL SCAN (PRODUCTS_PK): PK index
  Both indexes are joined on ROWID to project product_id + category.
  PR=0, CR=1240 — highly efficient; no table blocks read (Index Join optimization).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 3: Main data join flow (Ids 12–16)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Op 16 TABLE ACCESS FULL (ORDERS): PR=0, CR=29962
  filter("ORDER_DATE">=ADD_MONTHS(TRUNC(SYSDATE,'MM'),-11))
  E-Rows=120000, A-Rows=124892 — ~4% underestimate. Not significant.
  ORDER_DATE is a filter (not access) because ADD_MONTHS(TRUNC(SYSDATE,'MM'),-11)
  changes each run → cannot be pinned as an access range → FTS.
  CR=29962 is the dominant cost — ORDERS is large and fully scanned.

Op 15 TABLE ACCESS FULL (ORDER_ITEMS): PR=56, CR=18240
  E-Rows=95000, A-Rows=98341 — good estimate accuracy.
  PR=56: partial cache miss on first run.

Op 14 HASH JOIN: access("OI"."ORDER_ID"="O"."ORDER_ID")
  Joins ORDERS (124892 rows) with ORDER_ITEMS (98341 rows).
  PW=96 — hash area exceeded PGA; 96 blocks written to TEMP.
  Two large tables joining when PGA is already under pressure.

Op 13 TABLE ACCESS FULL (CUSTOMERS): PR=72, CR=3218
  filter("CHANNEL"='ONLINE' AND "STATUS"='ACTIVE')
  E-Rows=8500, A-Rows=8712 — accurate.
  Both conditions are filters → no usable index covering both columns.
  PR=72: cold cache on first run.

Op 12 HASH JOIN: access("OI"."CUSTOMER_ID"="C"."CUSTOMER_ID")
  Joins op 14 result (ORDERS+ORDER_ITEMS) with op 13 (CUSTOMERS).
  A-Rows=39821 — only rows from ONLINE+ACTIVE customers remain.
  Cumulative PW=96 still visible here (carried from op 14).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 4: Join REGIONS and PRODUCTS (Ids 5–8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Op 7 HASH JOIN: access("M"."PRODUCT_ID"="P"."PRODUCT_ID")
  Joins op 12 result (39821 rows) with op 8 index join (PRODUCTS 3800 rows).
  A-Rows=39821 — product category info added.

Op 6 TABLE ACCESS FULL (REGIONS): PR=0, CR=9
  24-row lookup table — fully cached, negligible cost.

Op 5 HASH JOIN: access("M"."REGION_ID"="R"."REGION_ID")
  Adds region information. A-Rows=39821.

Op 4 VIEW filter: filter("M"."ACTUAL_AMT"/"T"."TARGET_AMT"*100>=80)
  Filters inline view results to rows where achievement >= 80%.
  E-Rows=120, A-Rows=120 — CBO estimate is exact.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ STEP 5: Target join + window function (Ids 1–3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Op 3 TABLE ACCESS FULL (SALES_TARGETS): PR=0, CR=48
  120-row target table, fully cached.

Op 2 HASH JOIN: access("REGION_ID","SALE_YM")
  Joins 120 inline-view rows with 120 SALES_TARGETS rows.
  A-Rows=120 — exact match.

Op 1 WINDOW SORT (RANK() OVER ...): PW=96, A-Time=00:00:06.83
  Sorts for the RANK() window function. PW=96 — TEMP spill again.
  Only 120 rows, but PGA is already pressured from op 14's spill.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ Overall diagnosis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bottleneck 1 — CR=29962 (ORDERS FTS):
  The ORDER_DATE filter forces a full scan of ORDERS.
  Fix: Range-partition ORDERS on ORDER_DATE.
  Only 12 partitions need to be accessed → CR drops dramatically.

Bottleneck 2 — PW=96 (Hash Join + Window Sort TEMP spill):
  PGA exhausted while joining two large tables.
  Fix: Increase PGA_AGGREGATE_TARGET, or review join order/method.

Good signs:
  E-Rows ≈ A-Rows throughout — statistics are reliable.
  PRODUCTS resolved via Index Join — no table blocks read.
  REGIONS and SALES_TARGETS are tiny + PR=0 — no issue.
  Note "adaptive plan": Oracle adjusted the join method mid-execution.`

// ── 렌더 ───────────────────────────────────────────────────────────────────────

interface Exercise {
  num: number
  titleKo: string
  titleEn: string
  focusKo: string
  focusEn: string
  sql: string
  captionKo: string
  captionEn: string
  lines: OutputLine[]
  answerKo: string
  answerEn: string
}

const EXERCISES: Exercise[] = [
  {
    num: 1,
    titleKo: '연습 1 — PR로 Buffer Cache 히트율 읽기',
    titleEn: 'Exercise 1 — Reading Buffer Cache Hit Rate from PR',
    focusKo: '관찰 포인트: CR vs PR (첫 실행 / 두 번째 실행)',
    focusEn: 'Focus: CR vs PR (first run vs second run)',
    sql: ex1Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) — 첫 실행과 두 번째 실행 비교',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) — first vs second run',
    lines: ex1Lines,
    answerKo: ex1AnswerKo,
    answerEn: ex1AnswerEn,
  },
  {
    num: 2,
    titleKo: '연습 2 — E-Rows vs A-Rows 오차가 조인 방식을 바꾼다',
    titleEn: 'Exercise 2 — E-Rows vs A-Rows mismatch changes the join method',
    focusKo: '관찰 포인트: E-Rows, A-Rows, CR — 통계 오차의 연쇄 영향',
    focusEn: 'Focus: E-Rows, A-Rows, CR — cascading impact of statistics errors',
    sql: ex2Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST)',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST)',
    lines: ex2Lines,
    answerKo: ex2AnswerKo,
    answerEn: ex2AnswerEn,
  },
  {
    num: 3,
    titleKo: '연습 3 — access vs filter: 인덱스가 있어도 느린 이유',
    titleEn: 'Exercise 3 — access vs filter: why indexes can still be slow',
    focusKo: '관찰 포인트: Predicate Information — access와 filter 구분',
    focusEn: 'Focus: Predicate Information — distinguishing access from filter',
    sql: ex3Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST)',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST)',
    lines: ex3Lines,
    answerKo: ex3AnswerKo,
    answerEn: ex3AnswerEn,
  },
  {
    num: 4,
    titleKo: '연습 4 — PW와 A-Time으로 정렬 병목 진단',
    titleEn: 'Exercise 4 — Diagnosing sort bottlenecks with PW and A-Time',
    focusKo: '관찰 포인트: PW, A-Time — 정렬 디스크 스필 (Hash Join PW vs Sort PW)',
    focusEn: 'Focus: PW, A-Time — sort spill to disk (Hash Join PW vs Sort PW)',
    sql: ex4Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST)',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST)',
    lines: ex4Lines,
    answerKo: ex4AnswerKo,
    answerEn: ex4AnswerEn,
  },
  {
    num: 5,
    titleKo: '연습 5 — Starts로 Nested Loop 반복 실행 횟수 읽기',
    titleEn: 'Exercise 5 — Reading Nested Loop repetition count from Starts',
    focusKo: '관찰 포인트: Starts, CR — 드라이빙 결과 수에 따른 내부 반복',
    focusEn: 'Focus: Starts, CR — inner loop repetitions driven by outer rows',
    sql: ex5Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST)',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST)',
    lines: ex5Lines,
    answerKo: ex5AnswerKo,
    answerEn: ex5AnswerEn,
  },
  {
    num: 6,
    titleKo: '연습 6 — 17개 오퍼레이션: 복합 리포트 쿼리 전체 읽기',
    titleEn: 'Exercise 6 — 17 Operations: Reading a Full Complex Report Plan',
    focusKo: '관찰 포인트: 실행 순서 파악 → 병목 오퍼레이션 탐색 → CR·PR·PW 종합 진단',
    focusEn: 'Focus: execution order → bottleneck identification → combined CR/PR/PW diagnosis',
    sql: ex6Sql,
    captionKo: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) — 17개 오퍼레이션 복합 쿼리',
    captionEn: 'DBMS_XPLAN.DISPLAY_CURSOR(ALLSTATS LAST) — 17-operation complex query',
    lines: ex6Lines,
    answerKo: ex6AnswerKo,
    answerEn: ex6AnswerEn,
  },
]

function AnswerToggle({ label, answer }: { label: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="font-mono text-sm font-bold text-foreground/80">{label}</span>
        <IconChevronDown
          size={16}
          className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="border-t border-border bg-muted/10 px-4 py-4">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80">
            {answer}
          </pre>
        </div>
      )}
    </div>
  )
}

export function PlanReadingSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconPencil size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <Prose>{t.intro}</Prose>

      {EXERCISES.map((ex, i) => (
        <div key={ex.num}>
          {i > 0 && <Divider />}
          <SectionTitle>{isKo ? ex.titleKo : ex.titleEn}</SectionTitle>
          <p className="mb-3 text-sm font-medium text-amber-600">
            {isKo ? ex.focusKo : ex.focusEn}
          </p>
          <div className="mt-4">
            <SqlBlock sql={ex.sql} />
          </div>
          <PlanOutput
            lines={ex.lines}
            caption={isKo ? ex.captionKo : ex.captionEn}
          />
          <AnswerToggle
            label={t.answerLabel}
            answer={isKo ? ex.answerKo : ex.answerEn}
          />
        </div>
      ))}

      <div className="mt-8">
        <InfoBox variant="summary">
          {isKo
            ? '실행 계획 읽기 핵심 순서: ① 가장 깊이 들여쓰인 오퍼레이션부터 실행 순서 파악 — ② E-Rows vs A-Rows로 통계 오차 확인 — ③ CR·PR로 논리/물리 읽기 비율 확인 — ④ PW > 0이면 정렬·해시 디스크 스필 — ⑤ Starts로 Nested Loop 반복 횟수 파악 — ⑥ Predicate Information으로 access vs filter 구분'
            : 'Execution plan reading checklist: ① determine execution order from most-indented operation — ② compare E-Rows vs A-Rows for statistics errors — ③ check CR and PR for logical vs physical I/O ratio — ④ PW > 0 signals a sort or hash spill to disk — ⑤ use Starts to count Nested Loop iterations — ⑥ read Predicate Information to distinguish access from filter'}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
