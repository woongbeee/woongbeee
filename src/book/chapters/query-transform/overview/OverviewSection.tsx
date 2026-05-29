import { IconTransform } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
} from '../../shared'
import { IconBolt } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: '쿼리 변환 개요',
    subtitle: 'Oracle CBO가 SQL을 실행하기 전 의미는 동일하지만 더 효율적인 형태로 변환하는 기법들을 알아봐요.',

    whatTitle: '쿼리 변환이 뭐예요?',
    whatDesc:
      'Oracle 옵티마이저의 Query Transformer는 원본 SQL을 의미가 같으면서도 더 효율적으로 실행할 수 있는 형태로 변환해요. 변환된 쿼리는 Estimator(비용 추정기)와 Plan Generator(실행 계획 생성기)로 전달돼요.\n\n대부분의 변환은 비용 기반(cost-based)으로 결정돼요 — 옵티마이저가 변환 전후 비용을 비교해서, 더 낮은 비용의 형태를 선택해요. 힌트로 변환을 유도하거나 방지할 수도 있어요.',
    howTitle: '옵티마이저가 변환을 결정하는 방법',
    howDesc:
      '쿼리 변환은 두 가지 방식으로 결정돼요. 첫째, 휴리스틱(heuristic) 변환: 항상 성능을 향상시키는 것이 보장되므로 비용 비교 없이 적용해요. 둘째, 비용 기반(cost-based) 변환: 변환 전과 후의 비용을 계산해서 더 낮은 쪽을 선택해요.',
    transformsTitle: '주요 쿼리 변환 종류',
    transforms: [
      {
        id: 'OR Expansion',
        color: 'border-blue-200 bg-blue-50/50',
        badge: 'bg-blue-100 text-blue-700',
        title: 'OR Expansion',
        desc: 'OR 조건이 있는 쿼리를 UNION ALL로 분리해서 각 브랜치마다 인덱스를 활용할 수 있게 해요.',
      },
      {
        id: 'View Merging',
        color: 'border-orange-200 bg-orange-50/50',
        badge: 'bg-orange-100 text-orange-700',
        title: 'View Merging',
        desc: '인라인 뷰나 저장 뷰를 바깥 쿼리 블록에 병합해서 더 넓은 범위의 최적화가 가능하게 해요.',
      },
      {
        id: 'Predicate Pushing',
        color: 'border-violet-200 bg-violet-50/50',
        badge: 'bg-violet-100 text-violet-700',
        title: 'Predicate Pushing',
        desc: '뷰를 Merge할 수 없을 때, 외부 WHERE 조건을 뷰 내부로 밀어 넣어 처리 행 수를 줄여요.',
      },
      {
        id: 'Subquery Unnesting',
        color: 'border-emerald-200 bg-emerald-50/50',
        badge: 'bg-emerald-100 text-emerald-700',
        title: 'Subquery Unnesting',
        desc: 'WHERE 절의 서브쿼리를 조인으로 변환해서 CBO가 조인 순서와 방법을 자유롭게 선택할 수 있게 해요.',
      },
      {
        id: 'Query Rewrite with MVs',
        color: 'border-amber-200 bg-amber-50/50',
        badge: 'bg-amber-100 text-amber-700',
        title: 'Query Rewrite with Materialized Views',
        desc: '미리 집계된 결과가 담긴 Materialized View를 활용하도록 쿼리를 자동으로 재작성해요.',
      },
      {
        id: 'Star Transformation',
        color: 'border-cyan-200 bg-cyan-50/50',
        badge: 'bg-cyan-100 text-cyan-700',
        title: 'Star Transformation',
        desc: 'Star 스키마 쿼리에서 팩트 테이블 Full Scan을 피하기 위해 Bitmap 세미조인 조건을 추가해요.',
      },
      {
        id: 'Join Factorization',
        color: 'border-rose-200 bg-rose-50/50',
        badge: 'bg-rose-100 text-rose-700',
        title: 'Join Factorization',
        desc: 'UNION ALL 브랜치에서 공통으로 참조되는 테이블을 인수분해해서 반복 스캔을 없애요.',
      },
    ],
    noteTitle: '변환은 투명하게 동작해요',
    noteDesc:
      '쿼리 변환은 사용자 개입 없이 자동으로 이루어져요. 원본 SQL을 그대로 작성해도 옵티마이저가 더 효율적인 형태로 바꿔 실행해요. 변환 여부는 실행 계획(EXPLAIN PLAN)의 Note 섹션이나 변환된 쿼리 블록 이름(예: VW_SQ_1, VW_JF_1)에서 확인할 수 있어요.',
  },
  en: {
    title: 'Query Transformation Overview',
    subtitle: "Learn the techniques Oracle's CBO applies to rewrite SQL into a semantically equivalent but more efficient form before execution.",

    whatTitle: 'What is Query Transformation?',
    whatDesc:
      "Oracle's Query Transformer rewrites the original SQL into a semantically equivalent form that can be executed more efficiently. The transformed query is then passed to the Estimator and Plan Generator.\n\nMost transformations are cost-based — the optimizer computes the cost of both the original and the transformed query, then chooses whichever is cheaper. Hints are available to encourage or suppress specific transformations.",
    howTitle: 'How the Optimizer Decides Whether to Transform',
    howDesc:
      'Query transformations fall into two categories. Heuristic transformations are always guaranteed to improve performance, so Oracle applies them without comparing costs. Cost-based transformations require the optimizer to compute the cost before and after, then select the cheaper version.',
    transformsTitle: 'Key Query Transformation Types',
    transforms: [
      {
        id: 'OR Expansion',
        color: 'border-blue-200 bg-blue-50/50',
        badge: 'bg-blue-100 text-blue-700',
        title: 'OR Expansion',
        desc: 'Splits a query with top-level OR conditions into UNION ALL branches so each branch can use its own index.',
      },
      {
        id: 'View Merging',
        color: 'border-orange-200 bg-orange-50/50',
        badge: 'bg-orange-100 text-orange-700',
        title: 'View Merging',
        desc: 'Merges inline or stored views into the outer query block, exposing a larger scope for join reordering and access path selection.',
      },
      {
        id: 'Predicate Pushing',
        color: 'border-violet-200 bg-violet-50/50',
        badge: 'bg-violet-100 text-violet-700',
        title: 'Predicate Pushing',
        desc: "When view merging is not possible, pushes the outer WHERE predicates inside the view to reduce the number of rows the view processes.",
      },
      {
        id: 'Subquery Unnesting',
        color: 'border-emerald-200 bg-emerald-50/50',
        badge: 'bg-emerald-100 text-emerald-700',
        title: 'Subquery Unnesting',
        desc: 'Converts WHERE subqueries into joins so the CBO can freely choose the join order and method.',
      },
      {
        id: 'Query Rewrite with MVs',
        color: 'border-amber-200 bg-amber-50/50',
        badge: 'bg-amber-100 text-amber-700',
        title: 'Query Rewrite with Materialized Views',
        desc: 'Automatically rewrites a query to use a materialized view that contains precomputed aggregate results.',
      },
      {
        id: 'Star Transformation',
        color: 'border-cyan-200 bg-cyan-50/50',
        badge: 'bg-cyan-100 text-cyan-700',
        title: 'Star Transformation',
        desc: 'Avoids full table scans of fact tables in star schema queries by adding bitmap semijoin predicates.',
      },
      {
        id: 'Join Factorization',
        color: 'border-rose-200 bg-rose-50/50',
        badge: 'bg-rose-100 text-rose-700',
        title: 'Join Factorization',
        desc: 'Factors out common table references from UNION ALL branches to eliminate repetitive large table scans.',
      },
    ],
    noteTitle: 'Transformations Are Transparent',
    noteDesc:
      "Query transformations happen automatically without user intervention. You write plain SQL and the optimizer rewrites it into a more efficient form. You can observe whether a transformation was applied by checking the Note section of EXPLAIN PLAN output, or by recognizing transformed query block names such as VW_SQ_1 or VW_JF_1.",
  },
}

export function QtOverviewSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconTransform size={36} stroke={1.5} className="text-cyan-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.howTitle}</SectionTitle>
      <Prose>{t.howDesc}</Prose>

      <Divider />

      <SectionTitle>{t.transformsTitle}</SectionTitle>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {t.transforms.map((item) => (
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

      <div className="mt-8">
        <InfoBox variant="note">
          <strong>{t.noteTitle}</strong>
          <br />
          {t.noteDesc}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
