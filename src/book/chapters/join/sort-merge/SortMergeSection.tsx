import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
} from '../../shared'

const T = {
  ko: {
    title: 'Sort Merge Join',
    subtitle: '양쪽 데이터 집합을 조인 키로 정렬한 뒤 순차적으로 병합해요. 비등치(범위) 조인이나 이미 정렬된 데이터에서 특히 유리해요.',

    whatTitle: 'Sort Merge Join이란?',
    whatDesc:
      'Sort Merge Join은 두 데이터 집합을 조인 키로 정렬한 다음, 두 포인터를 앞으로 이동시키며 병합해요.\n\n첫 번째 집합에서 행을 하나 읽고, 두 번째 집합에서 키가 일치하는 시작 행을 찾아요. 키가 같은 행을 모두 반환한 뒤 불일치가 발생하면 첫 번째 집합의 다음 행으로 넘어가요 — Nested Loop처럼 처음부터 다시 스캔하지 않아요.',

    pseudoTitle: '동작 원리 (의사 코드)',
    pseudoDesc: '정렬 후 병합 단계는 다음과 같이 동작해요.',
    pseudoSql: `-- 1. 두 집합을 조인 키로 정렬
SORT dataset1 ON join_key
SORT dataset2 ON join_key

-- 2. 병합
read first row from dataset1 (key1)
read first row from dataset2 (key2)
WHILE NOT eof on both datasets LOOP
  IF key1 = key2 THEN
    output joined row, advance both pointers
  ELSIF key1 < key2 THEN
    read next row from dataset1
  ELSIF key1 > key2 THEN
    read next row from dataset2
  END IF
END LOOP`,

    advantageTitle: 'Nested Loop와의 차이',
    advantageDesc:
      'Nested Loop는 Outer 행마다 Inner를 처음부터 반복 탐색해요. Sort Merge는 병합 시 두 번째 집합에서 탐색을 처음부터 다시 시작하지 않아요 — 일치하지 않는 행을 만나면 그 위치에서 멈추고 첫 번째 집합의 다음 행으로만 이동해요.\n\n이미 정렬된 데이터(예: 인덱스 Range Scan 결과, ORDER BY가 이미 처리된 결과)에서는 정렬 비용 자체가 사라지므로 특히 효율적이에요.',

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Sort Merge Join 강제
SELECT /*+ USE_MERGE(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Sort Merge Join 방지
SELECT /*+ NO_USE_MERGE(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- 비등치 조건에서 Sort Merge 사용 예시
SELECT e.last_name, s.grade
FROM   employees e, salary_grades s
WHERE  e.salary BETWEEN s.low_sal AND s.high_sal;`,

    summaryTitle: 'Sort Merge Join 핵심 정리',
    summaryItems: [
      '두 집합을 조인 키로 정렬한 뒤 병합해요. 병합 시 처음부터 다시 스캔하지 않아요.',
      '비등치(범위) 조인에서 Hash Join을 대신해요 — <, <=, >, >=, BETWEEN 조건에서 사용 가능해요.',
      '이미 정렬된 데이터에서는 정렬 비용이 없어서 효율적이에요.',
      '힌트: USE_MERGE(테이블) (강제), NO_USE_MERGE(테이블) (방지).',
    ],
  },
  en: {
    title: 'Sort Merge Join',
    subtitle: 'Sorts both datasets on the join key and merges them sequentially — especially efficient for non-equijoins or pre-sorted data.',

    whatTitle: 'What Is a Sort Merge Join?',
    whatDesc:
      'A Sort Merge Join sorts both datasets on the join key, then merges them by advancing two pointers forward.\n\nFor each row from the first dataset, it finds the starting row in the second dataset where the key matches, outputs all matching rows, and when a mismatch occurs, advances to the next row in the first dataset — unlike Nested Loop, it does not restart from the beginning of the second dataset.',

    pseudoTitle: 'How It Works (Pseudocode)',
    pseudoDesc: 'The sort and merge steps operate as follows.',
    pseudoSql: `-- 1. Sort both datasets on the join key
SORT dataset1 ON join_key
SORT dataset2 ON join_key

-- 2. Merge
read first row from dataset1 (key1)
read first row from dataset2 (key2)
WHILE NOT eof on both datasets LOOP
  IF key1 = key2 THEN
    output joined row, advance both pointers
  ELSIF key1 < key2 THEN
    read next row from dataset1
  ELSIF key1 > key2 THEN
    read next row from dataset2
  END IF
END LOOP`,

    advantageTitle: 'Difference from Nested Loop',
    advantageDesc:
      "Nested Loop restarts scanning the inner table from scratch for every outer row. Sort Merge does not — when a mismatch occurs, it simply stops at the current position in the second dataset and advances to the next row in the first.\n\nWhen data is already sorted (for example, from an index range scan or a prior ORDER BY), the sort step is eliminated entirely, making Sort Merge highly efficient.",

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Sort Merge Join
SELECT /*+ USE_MERGE(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress Sort Merge Join
SELECT /*+ NO_USE_MERGE(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Non-equijoin example where Sort Merge is used
SELECT e.last_name, s.grade
FROM   employees e, salary_grades s
WHERE  e.salary BETWEEN s.low_sal AND s.high_sal;`,

    summaryTitle: 'Sort Merge Join Key Takeaways',
    summaryItems: [
      'Sorts both datasets on the join key, then merges — no restart from the beginning during merge.',
      'Handles non-equijoin conditions (<, <=, >, >=, BETWEEN) where Hash Join cannot be used.',
      'No sort cost when data is already sorted — highly efficient in those cases.',
      'Hints: USE_MERGE(table) (force), NO_USE_MERGE(table) (suppress).',
    ],
  },
}

export function JoinSortMergeSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-violet-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.pseudoTitle}</SectionTitle>
      <Prose>{t.pseudoDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.pseudoSql} />
      </div>

      <Divider />

      <SectionTitle>{t.advantageTitle}</SectionTitle>
      <Prose>{t.advantageDesc}</Prose>

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">
          <ul className="list-none space-y-1">
            {t.summaryItems.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
