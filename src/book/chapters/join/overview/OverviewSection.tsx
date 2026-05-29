import { IconArrowMerge, IconBolt } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  Divider,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: '조인 원리와 활용',
    subtitle: '두 개의 row source를 하나의 결과 집합으로 결합하는 세 가지 조인 알고리즘의 동작 원리를 알아봐요.',

    whatTitle: '조인이란?',
    whatDesc:
      '조인은 정확히 두 개의 row source(테이블 또는 뷰)의 출력을 하나의 결과 집합으로 결합해요. 두 개보다 많은 테이블을 포함하는 쿼리에서 Oracle은 한 번에 두 개씩 조인하며, 중간 결과가 다음 조인의 한쪽 입력이 돼요.\n\n조인 조건(join condition)은 두 row source를 비교하는 표현식이에요. 조인 조건이 없으면 카테시안 조인(Cartesian join)이 발생해요 — 한 테이블의 모든 행이 다른 테이블의 모든 행과 매칭돼요.',

    methodsTitle: '세 가지 조인 알고리즘',
    methods: [
      {
        id: 'Nested Loop Join',
        color: 'border-blue-200 bg-blue-50/50',
        badge: 'bg-blue-100 text-blue-700',
        title: 'Nested Loop Join',
        desc: 'Outer 테이블의 각 행마다 Inner 테이블을 반복 탐색해요. Inner 테이블에 선택도 높은 인덱스가 있을 때 가장 효율적이에요.',
      },
      {
        id: 'Hash Join',
        color: 'border-orange-200 bg-orange-50/50',
        badge: 'bg-orange-100 text-orange-700',
        title: 'Hash Join',
        desc: '작은 테이블(빌드 입력)을 해시 테이블로 PGA에 적재한 뒤, 큰 테이블(프로브 입력)을 스캔하면서 해시 키로 매칭해요. 등치(=) 조건에만 사용할 수 있어요.',
      },
      {
        id: 'Sort Merge Join',
        color: 'border-violet-200 bg-violet-50/50',
        badge: 'bg-violet-100 text-violet-700',
        title: 'Sort Merge Join',
        desc: '양쪽 데이터 집합을 조인 키로 정렬한 뒤 병합해요. 비등치(범위) 조인이나 이미 정렬된 데이터에서 특히 유리해요.',
      },
    ],
  },
  en: {
    title: 'Join Principles & Usage',
    subtitle: 'Learn the mechanics of the three join algorithms Oracle uses to combine two row sources into a single result set.',

    whatTitle: 'What Is a Join?',
    whatDesc:
      'A join combines the output of exactly two row sources — tables or views — into a single result set. For queries involving more than two tables, Oracle joins them two at a time, with each intermediate result becoming one input of the next join.\n\nA join condition is an expression that compares two row sources and defines the relationship between them. When no join condition exists, a Cartesian join occurs — every row in one table is matched with every row in the other.',

    methodsTitle: 'Three Join Algorithms',
    methods: [
      {
        id: 'Nested Loop Join',
        color: 'border-blue-200 bg-blue-50/50',
        badge: 'bg-blue-100 text-blue-700',
        title: 'Nested Loop Join',
        desc: 'For each row in the outer table, Oracle probes the inner table for matching rows. Most efficient when the inner table has a highly selective index.',
      },
      {
        id: 'Hash Join',
        color: 'border-orange-200 bg-orange-50/50',
        badge: 'bg-orange-100 text-orange-700',
        title: 'Hash Join',
        desc: 'Loads the smaller table (build input) into a hash table in PGA, then scans the larger table (probe input) matching by hash key. Requires an equality (=) join condition.',
      },
      {
        id: 'Sort Merge Join',
        color: 'border-violet-200 bg-violet-50/50',
        badge: 'bg-violet-100 text-violet-700',
        title: 'Sort Merge Join',
        desc: 'Sorts both datasets on the join key, then merges them sequentially. Especially efficient for non-equijoins (range conditions) or pre-sorted data.',
      },
    ],
  },
}

export function JoinOverviewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-emerald-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.methodsTitle}</SectionTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {t.methods.map((item) => (
          <div key={item.id} className={cn('rounded-xl border-2 p-4', item.color)}>
            <div className="mb-2 flex items-center gap-2">
              <IconBolt size={14} className="shrink-0 text-muted-foreground" />
              <span className={cn('rounded px-1.5 py-0.5 font-mono text-[10px] font-bold', item.badge)}>
                {item.id}
              </span>
            </div>
            <p className="mb-1 font-mono text-xs font-bold text-foreground/80">{item.title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
