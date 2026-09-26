import { IconArrowsSort } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Table,
  SqlBlock,
  Divider,
} from '../../shared'

const T = {
  ko: {
    title: '소트 회피 전략',
    subtitle:
      '가장 빠른 소트는 아예 일어나지 않는 소트예요. 정렬을 없애거나 메모리 안에서 끝내는 실전 전략들을 알아봐요.',

    idxTitle: '전략 1 — 인덱스로 정렬을 대신하기',
    idxDesc:
      'ORDER BY 컬럼에 인덱스가 있고, 그 인덱스의 리프 블록을 순서대로 읽는 것만으로 원하는 순서가 나온다면 SORT ORDER BY 오퍼레이션 자체가 사라져요. 실행 계획에 INDEX (RANGE SCAN) 다음에 SORT가 없다면 이미 회피된 거예요.',
    idxSql: `-- ORDER BY hire_date에 맞는 인덱스가 있으면 정렬이 생략돼요
CREATE INDEX emp_hire_date_ix ON employees(hire_date);

SELECT employee_id, hire_date
FROM   employees
WHERE  hire_date >= DATE '2024-01-01'
ORDER  BY hire_date;              -- SORT ORDER BY 없이 INDEX RANGE SCAN만으로 순서 보장

-- 내림차순도 마찬가지로 DESC 인덱스로 회피 가능
CREATE INDEX emp_hire_date_desc_ix ON employees(hire_date DESC);`,
    idxNote:
      'WHERE 조건과 ORDER BY가 같은 인덱스를 함께 쓸 수 있어야 해요. 조건에는 안 쓰이고 ORDER BY에만 쓰이는 컬럼이면 인덱스 선두 컬럼 설계를 다시 검토하세요.',

    hashTitle: '전략 2 — GROUP BY를 Hash Aggregate로',
    hashDesc:
      'Oracle 11g 이후 GROUP BY는 기본적으로 Hash Aggregate(SORT 없는 그룹화)로 처리돼요. 다만 이미 정렬된 인덱스를 스캔 중이거나, 결과를 특정 순서로 반환해야 하는 경우엔 여전히 SORT GROUP BY가 나올 수 있어요.',
    hashSql: `-- 일반적으로 HASH GROUP BY로 처리됨 (소트 없음)
SELECT department_id, AVG(salary)
FROM   employees
GROUP  BY department_id;

-- GROUP BY 뒤에 ORDER BY가 없으면 결과 순서를 보장하지 않는다는 뜻 —
-- 순서가 필요하면 명시적으로 ORDER BY를 추가하세요 (그건 별도의 정렬)`,

    unionTitle: '전략 3 — UNION 대신 UNION ALL',
    unionDesc:
      'UNION은 중복 제거를 위해 SORT UNIQUE를 수행해요. 두 결과 집합에 중복이 없다는 걸 알고 있거나 중복이 있어도 괜찮다면 UNION ALL로 바꿔서 이 정렬을 완전히 없앨 수 있어요.',
    unionSql: `-- UNION: 중복 제거를 위한 SORT UNIQUE 발생
SELECT customer_id FROM orders_2024
UNION
SELECT customer_id FROM orders_2023;

-- 두 테이블의 customer_id가 겹치지 않는 걸 안다면 UNION ALL로 소트 제거
SELECT customer_id FROM orders_2024
UNION ALL
SELECT customer_id FROM orders_2023;`,

    winTitle: '전략 4 — 윈도우 함수의 정렬 재사용',
    winDesc:
      '여러 윈도우 함수가 같은 PARTITION BY / ORDER BY를 쓰면 Oracle이 정렬을 한 번만 수행하고 재사용해요. ORDER BY 방향이 인덱스와 일치하면 이 정렬조차 인덱스로 대체될 수 있어요.',
    winSql: `-- 두 윈도우 함수가 같은 정렬 기준(dept_id, salary DESC)을 공유 →
-- 옵티마이저가 정렬을 한 번만 수행
SELECT employee_id, department_id, salary,
       RANK()       OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk,
       SUM(salary)  OVER (PARTITION BY department_id ORDER BY salary DESC) AS running_total
FROM   employees;`,

    pgaTitle: '전략 5 — 완전히 없앨 수 없다면 메모리 안에서 끝내기',
    pgaDesc:
      '정렬 자체를 없앨 수 없는 경우도 많아요(대용량 ORDER BY, DISTINCT 등). 이때는 정렬이 Optimal 모드로 처리되도록 PGA_AGGREGATE_TARGET을 충분히 확보하는 게 다음 우선순위예요.',

    summaryTitle: '핵심 정리',
    summaryTable: [
      [
        '인덱스 활용',
        'ORDER BY 컬럼에 인덱스가 있으면 정렬 생략',
        '인덱스 스캔 순서가 ORDER BY와 일치해야 함',
      ],
      [
        'Hash GROUP BY',
        'GROUP BY를 Hash Aggregate로 처리',
        '11g 이후 기본 동작. 정렬된 인덱스 스캔 시엔 예외',
      ],
      [
        'UNION → UNION ALL',
        '중복이 없거나 허용될 때 사용',
        '중복 제거용 SORT UNIQUE 완전 제거',
      ],
      [
        '윈도우 함수 정렬 공유',
        '여러 윈도우 함수의 PARTITION/ORDER 기준을 통일',
        '정렬을 한 번만 수행하도록 재사용',
      ],
      [
        'PGA_AGGREGATE_TARGET 확보',
        '없앨 수 없는 정렬은 메모리 안에서 끝나게',
        'Optimal 실행 비율을 90% 이상으로 유지',
      ],
    ],

    summary:
      '소트 튜닝의 순서는 항상 같아요 — 먼저 정렬을 없앨 수 있는지(인덱스, Hash Aggregate, UNION ALL) 검토하고, 없앨 수 없다면 메모리 안에서 Optimal로 끝나게(PGA_AGGREGATE_TARGET) 만드세요. 이 두 단계만 챙기면 소트 관련 성능 문제의 대부분이 해결돼요.',
  },

  en: {
    title: 'Sort Avoidance Strategies',
    subtitle:
      'The fastest sort is the one that never happens. Here are practical strategies for eliminating sorts or keeping them in memory.',

    idxTitle: 'Strategy 1 — Let an Index Do the Sorting',
    idxDesc:
      'If an index exists on the ORDER BY column, and simply reading its leaf blocks in order produces the desired order, the SORT ORDER BY operation disappears entirely. If the execution plan shows INDEX (RANGE SCAN) with no SORT above it, the sort has already been avoided.',
    idxSql: `-- With an index matching ORDER BY hire_date, sorting is skipped
CREATE INDEX emp_hire_date_ix ON employees(hire_date);

SELECT employee_id, hire_date
FROM   employees
WHERE  hire_date >= DATE '2024-01-01'
ORDER  BY hire_date;              -- order guaranteed by INDEX RANGE SCAN alone, no SORT ORDER BY

-- Descending order can be avoided the same way with a DESC index
CREATE INDEX emp_hire_date_desc_ix ON employees(hire_date DESC);`,
    idxNote:
      'The WHERE predicate and ORDER BY must be able to share the same index. If a column is used only in ORDER BY and never in a predicate, revisit which column should lead the index.',

    hashTitle: 'Strategy 2 — Let GROUP BY Use Hash Aggregate',
    hashDesc:
      'Since Oracle 11g, GROUP BY defaults to Hash Aggregate (grouping with no sort). However, SORT GROUP BY can still appear when Oracle is already scanning a sorted index, or when the result must be returned in a specific order.',
    hashSql: `-- Typically processed with HASH GROUP BY (no sort)
SELECT department_id, AVG(salary)
FROM   employees
GROUP  BY department_id;

-- No ORDER BY after GROUP BY means the result order is not guaranteed —
-- add an explicit ORDER BY if order matters (that is a separate sort)`,

    unionTitle: 'Strategy 3 — UNION ALL Instead of UNION',
    unionDesc:
      'UNION performs a SORT UNIQUE to remove duplicates. If you know the two result sets contain no duplicates, or duplicates are acceptable, switching to UNION ALL removes this sort entirely.',
    unionSql: `-- UNION: triggers a SORT UNIQUE for deduplication
SELECT customer_id FROM orders_2024
UNION
SELECT customer_id FROM orders_2023;

-- If customer_id ranges don't overlap between the two tables, UNION ALL removes the sort
SELECT customer_id FROM orders_2024
UNION ALL
SELECT customer_id FROM orders_2023;`,

    winTitle: 'Strategy 4 — Reuse Sorts Across Window Functions',
    winDesc:
      'When multiple window functions share the same PARTITION BY / ORDER BY, Oracle performs the sort once and reuses it. If the ORDER BY direction matches an index, even this single sort can be replaced by the index.',
    winSql: `-- Both window functions share the same sort key (dept_id, salary DESC) →
-- the optimizer sorts only once
SELECT employee_id, department_id, salary,
       RANK()       OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk,
       SUM(salary)  OVER (PARTITION BY department_id ORDER BY salary DESC) AS running_total
FROM   employees;`,

    pgaTitle: "Strategy 5 — If You Can't Eliminate It, Keep It in Memory",
    pgaDesc:
      'Some sorts truly cannot be eliminated (large ORDER BY, DISTINCT, etc.). In that case, the next priority is ensuring enough PGA_AGGREGATE_TARGET so the sort runs in Optimal mode.',

    summaryTitle: 'Key Takeaways',
    summaryTable: [
      [
        'Use an index',
        'Index on the ORDER BY column eliminates sorting',
        'Index scan order must match ORDER BY',
      ],
      [
        'Hash GROUP BY',
        'Process GROUP BY via Hash Aggregate',
        'Default since 11g; exception when scanning an already-sorted index',
      ],
      [
        'UNION → UNION ALL',
        'Use when duplicates are absent or acceptable',
        'Fully removes the deduplication SORT UNIQUE',
      ],
      [
        'Share sorts across window functions',
        'Unify PARTITION/ORDER keys across window functions',
        'Lets the optimizer reuse a single sort',
      ],
      [
        'Provision PGA_AGGREGATE_TARGET',
        'Keep unavoidable sorts running in memory',
        'Aim for 90%+ Optimal executions',
      ],
    ],

    summary:
      "Sort tuning always follows the same order: first check whether the sort can be eliminated (index, Hash Aggregate, UNION ALL); if it can't, make sure it finishes Optimal in memory (PGA_AGGREGATE_TARGET). These two steps resolve the vast majority of sort-related performance problems.",
  },
}

export function SortAvoidSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowsSort size={36} stroke={1.5} className="text-rose" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.idxTitle}</SectionTitle>
      <Prose>{t.idxDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.idxSql} />
      </div>
      <InfoBox variant="note">{t.idxNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.hashTitle}</SectionTitle>
      <Prose>{t.hashDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.hashSql} />
      </div>

      <Divider />

      <SectionTitle>{t.unionTitle}</SectionTitle>
      <Prose>{t.unionDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.unionSql} />
      </div>

      <Divider />

      <SectionTitle>{t.winTitle}</SectionTitle>
      <Prose>{t.winDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.winSql} />
      </div>

      <Divider />

      <SectionTitle>{t.pgaTitle}</SectionTitle>
      <Prose>{t.pgaDesc}</Prose>

      <Divider />

      <SectionTitle>{t.summaryTitle}</SectionTitle>
      <Table
        headers={
          isKo ? ['전략', '방법', '주의사항'] : ['Strategy', 'How', 'Notes']
        }
        rows={t.summaryTable}
      />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
