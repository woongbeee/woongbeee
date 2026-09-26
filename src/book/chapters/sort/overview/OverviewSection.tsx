import { IconArrowsSort } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  ConceptGrid,
  Table,
  Divider,
} from '../../shared'

const T = {
  ko: {
    title: '소트 튜닝',
    subtitle:
      'Oracle의 소트 연산이 언제 발생하고, 어디서(메모리 vs 디스크) 처리되는지 이해하면 SQL 튜닝의 큰 부분을 해결할 수 있어요.',

    overviewTitle: '소트 연산 개요',
    overviewDesc:
      'ORDER BY, GROUP BY, DISTINCT, UNION, 윈도우 함수, Sort-Merge Join 등 많은 SQL 연산이 내부적으로 소트를 수행해요. 실행 계획에는 SORT ORDER BY, SORT GROUP BY, SORT UNIQUE, SORT AGGREGATE 같은 오퍼레이션으로 나타나요.\n\n소트는 PGA(Program Global Area)의 Sort Area(작업 영역, Work Area)에서 처리돼요. 데이터가 이 메모리 영역을 초과하면 Temp 테이블스페이스의 Temp 세그먼트(디스크)로 결과를 흘려보내요 — 이걸 스필(Spill)이라고 해요.',
    overviewItems: [
      {
        icon: '↕',
        title: 'ORDER BY',
        desc: '결과를 정렬해서 반환해요. 인덱스로 이미 정렬 순서가 보장되면 소트 자체가 생략될 수 있어요.',
        color: 'blue',
      },
      {
        icon: '📊',
        title: 'GROUP BY',
        desc: '그룹화 연산이에요. Hash Aggregate로 처리하면 소트 없이도 그룹화할 수 있어요.',
        color: 'orange',
      },
      {
        icon: '🔀',
        title: 'UNION / DISTINCT',
        desc: '중복을 제거하려면 정렬이 필요해요. UNION ALL은 중복 제거가 없어서 소트도 없어요.',
        color: 'violet',
      },
      {
        icon: '🔗',
        title: 'Sort-Merge Join',
        desc: '조인 키로 양쪽 입력을 각각 정렬한 뒤 병합해요. 인덱스가 없는 대용량 비등치 조인에 쓰여요.',
        color: 'emerald',
      },
    ],

    opsTitle: '실행 계획에 나타나는 소트 오퍼레이션',
    opsDesc:
      'EXPLAIN PLAN이나 DBMS_XPLAN 출력에서 아래 이름들을 보면 그 지점에서 정렬(또는 정렬 기반 집계)이 일어나고 있다는 뜻이에요.',
    opsTable: [
      [
        'SORT ORDER BY',
        'ORDER BY 절 처리',
        '인덱스로 순서가 보장되지 않을 때만 나타남',
      ],
      [
        'SORT GROUP BY',
        'GROUP BY를 정렬 기반으로 처리',
        'Hash Aggregate를 못 쓸 때(정렬된 인덱스 등)',
      ],
      [
        'SORT UNIQUE',
        'DISTINCT, UNION의 중복 제거용 정렬',
        '중복 제거가 필요한 집합 연산',
      ],
      [
        'SORT AGGREGATE',
        '그룹 없는 집계 함수(SUM, COUNT 전체 등)',
        '정렬이 아니라 한 그룹으로만 집계 — 이름과 달리 실제 정렬은 없음',
      ],
      [
        'SORT JOIN',
        'Sort-Merge Join의 입력을 정렬',
        '조인 키 기준으로 두 입력을 각각 정렬',
      ],
    ],

    memNote:
      '어디서 정렬이 처리되는지(메모리 vs 디스크)는 "Sort Area와 Temp 세그먼트" 섹션에서, 정렬 자체를 피하는 방법은 "소트 회피 전략" 섹션에서 자세히 다뤄요.',

    summary:
      '소트는 눈에 잘 안 보이지만 CPU와 메모리를 많이 쓰는 연산이에요. 실행 계획에서 SORT 오퍼레이션을 발견하면 "이게 메모리에서 끝났는지, 디스크로 넘어갔는지, 아예 없앨 수 있는지"를 항상 점검해보세요.',
  },

  en: {
    title: 'Sort Tuning',
    subtitle:
      'Understanding when sort operations occur and where they run (memory vs. disk) resolves a large share of SQL tuning problems.',

    overviewTitle: 'Sort Operations Overview',
    overviewDesc:
      'Many SQL operations internally require sorting: ORDER BY, GROUP BY, DISTINCT, UNION, window functions, and Sort-Merge Join. In the execution plan, they appear as operations like SORT ORDER BY, SORT GROUP BY, SORT UNIQUE, and SORT AGGREGATE.\n\nSorting happens in a Work Area inside the PGA (Program Global Area), commonly called the Sort Area. If the data exceeds this memory area, Oracle spills the intermediate results to a Temp segment on disk (in the Temp tablespace) — this is called a spill.',
    overviewItems: [
      {
        icon: '↕',
        title: 'ORDER BY',
        desc: 'Sorts the result set. The sort itself can be eliminated if an index already guarantees the required order.',
        color: 'blue',
      },
      {
        icon: '📊',
        title: 'GROUP BY',
        desc: 'A grouping operation. Hash Aggregate processing can group rows without any sort at all.',
        color: 'orange',
      },
      {
        icon: '🔀',
        title: 'UNION / DISTINCT',
        desc: 'Removing duplicates requires sorting. UNION ALL performs no deduplication, so no sort is needed.',
        color: 'violet',
      },
      {
        icon: '🔗',
        title: 'Sort-Merge Join',
        desc: 'Sorts both inputs by the join key, then merges them. Used for large non-equality joins with no usable index.',
        color: 'emerald',
      },
    ],

    opsTitle: 'Sort Operations in the Execution Plan',
    opsDesc:
      'Seeing these names in EXPLAIN PLAN or DBMS_XPLAN output means sorting (or sort-based aggregation) is happening at that step.',
    opsTable: [
      [
        'SORT ORDER BY',
        'Processes the ORDER BY clause',
        'Appears only when no index already guarantees the order',
      ],
      [
        'SORT GROUP BY',
        'Processes GROUP BY via sorting',
        'Used when Hash Aggregate is not applicable (e.g. a sorted index is already available)',
      ],
      [
        'SORT UNIQUE',
        'Sort for deduplication (DISTINCT, UNION)',
        'Needed whenever a set operation must remove duplicates',
      ],
      [
        'SORT AGGREGATE',
        'Aggregate functions with no GROUP BY (SUM, COUNT over the whole set)',
        'Despite the name, no actual sort happens — all rows form a single group',
      ],
      [
        'SORT JOIN',
        'Sorts the inputs to a Sort-Merge Join',
        'Sorts both inputs by the join key before merging',
      ],
    ],

    memNote:
      'Where sorting is processed (memory vs. disk) is covered in "Sort Area & Temp Segment"; how to avoid sorting altogether is covered in "Sort Avoidance Strategies".',

    summary:
      'Sorting is easy to overlook but consumes significant CPU and memory. Whenever you spot a SORT operation in an execution plan, always check: did it finish in memory, did it spill to disk, or can it be eliminated entirely?',
  },
}

export function SortOverviewSection() {
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

      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <Prose>{t.overviewDesc}</Prose>
      <ConceptGrid items={t.overviewItems} />

      <Divider />

      <SectionTitle>{t.opsTitle}</SectionTitle>
      <Prose>{t.opsDesc}</Prose>
      <Table
        headers={
          isKo
            ? ['오퍼레이션', '의미', '나타나는 조건']
            : ['Operation', 'Meaning', 'When It Appears']
        }
        rows={t.opsTable}
      />

      <div className="mt-8">
        <InfoBox variant="note">{t.memNote}</InfoBox>
      </div>
      <div className="mt-4">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
