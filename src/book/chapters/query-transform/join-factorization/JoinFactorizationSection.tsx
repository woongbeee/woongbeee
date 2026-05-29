import { IconTransform } from '@tabler/icons-react'
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
import { ExplainPlanTable } from '../../optimizer/shared/diagrams'
import type { PlanRow } from '../../optimizer/shared/diagrams'

const T = {
  ko: {
    title: 'Join Factorization',
    subtitle:
      'UNION ALL 브랜치에서 공통으로 참조되는 테이블을 인수분해해서 반복적인 스캔과 조인을 없애는 변환이에요.',

    whatTitle: 'Join Factorization이란?',
    whatDesc:
      'Join Factorization은 UNION ALL 쿼리의 여러 브랜치에서 공통으로 계산되는 부분(데이터 접근과 조인 포함)을 인수분해해서 반복 처리를 피하는 비용 기반 변환이에요.\n\n예를 들어 UNION ALL의 두 브랜치에서 동일한 테이블 t1을 각각 읽는다면, 옵티마이저가 t1을 한 번만 읽고 결과를 공유하는 방식으로 쿼리를 재작성해요.',

    howTitle: '어떻게 동작할까요?',
    howDesc:
      '옵티마이저는 UNION ALL 브랜치들 사이에서 공통 테이블과 조인 조건을 찾아요. 공통 부분을 UNION ALL 바깥으로 꺼내서 한 번만 처리하고, 브랜치별로 다른 나머지 조인을 안쪽에 남겨요.\n\n변환 후 쿼리에서 인수분해된 UNION ALL 부분은 VW_JF_ 접두사가 붙은 인라인 뷰로 표현돼요.',

    exampleTitle: '변환 예시 (공식 문서)',
    exampleDesc:
      '공식 문서 예시예요. 두 브랜치에서 공통으로 사용되는 t1을 인수분해해서 한 번만 읽어요.',
    beforeSql: `-- 변환 전: t1이 두 브랜치에서 각각 읽힘
SELECT t1.c1, t2.c2
FROM   t1, t2, t3
WHERE  t1.c1 = t2.c1
AND    t1.c1 > 1
AND    t2.c2 = 2
AND    t2.c2 = t3.c2
UNION ALL
SELECT t1.c1, t2.c2
FROM   t1, t2, t4
WHERE  t1.c1 = t2.c1
AND    t1.c1 > 1
AND    t2.c3 = t4.c3;`,
    afterSql: `-- 변환 후: t1을 한 번만 읽고, UNION ALL은 안쪽으로
SELECT t1.c1, VW_JF_1.item_2
FROM   t1,
       (SELECT t2.c1 item_1, t2.c2 item_2
        FROM   t2, t3
        WHERE  t2.c2 = t3.c2
        AND    t2.c2 = 2
        UNION ALL
        SELECT t2.c1 item_1, t2.c2 item_2
        FROM   t2, t4
        WHERE  t2.c3 = t4.c3) VW_JF_1
WHERE  t1.c1 = VW_JF_1.item_1
AND    t1.c1 > 1;`,
    exampleNote:
      '변환 전: t1을 두 번(각 브랜치마다) 스캔하고 필터링해요.\n변환 후: t1.c1 > 1 필터와 t1 스캔이 한 번으로 줄어요.\nVW_JF_1은 옵티마이저가 만든 인라인 뷰 이름이에요.',

    planTitle: '실행 계획에서 확인하는 방법',
    planDesc:
      'Join Factorization이 적용되면 실행 계획에 VW_JF_ 접두사가 붙은 뷰 이름이 나타나요. 이 뷰가 UNION ALL 브랜치를 담고 있고, 바깥 쿼리가 이 뷰와 공통 테이블을 조인하는 구조예요.',
    planCaption: 'EXPLAIN PLAN — Join Factorization 적용 후 (t1 스캔 1회, VW_JF_1 안에 UNION ALL)',

    restrictTitle: '적용 제한 사항',
    restrictDesc:
      'Join Factorization은 다음 경우에는 적용되지 않아요.',
    restrictItems: [
      'UNION ALL 브랜치에 DISTINCT가 있는 경우 — 중복 제거가 있으면 인수분해 후 결과가 달라질 수 있어요.',
      '비용 비교 결과 변환이 더 비쌀 때 — 공통 테이블이 작거나 브랜치 수가 적으면 효과가 없을 수 있어요.',
    ],

    supportTitle: '지원 조인 유형',
    supportDesc:
      'Join Factorization은 일반 Inner Join 외에도 다음 조인 유형을 지원해요.',
    supportItems: [
      'Outer Join (외부 조인) — 오른쪽 테이블이 공통인 경우 인수분해 가능',
      'Antijoin (안티조인) — NOT EXISTS / NOT IN 변환에서 오른쪽 테이블이 공통인 경우',
      'Semijoin (세미조인) — EXISTS / IN 변환에서 오른쪽 테이블이 공통인 경우',
    ],

    summaryTitle: 'Join Factorization 핵심 정리',
    summaryItems: [
      'UNION ALL 브랜치에서 공통 테이블을 인수분해해서 반복 스캔을 없애요.',
      '비용 기반 결정 — 변환이 유리할 때만 적용해요.',
      'UNION ALL 브랜치에 DISTINCT가 있으면 적용되지 않아요.',
      '변환된 쿼리 블록 이름에 VW_JF_ 접두사가 붙어요.',
      'Outer Join, Antijoin, Semijoin의 오른쪽 테이블도 인수분해 대상이에요.',
    ],
  },
  en: {
    title: 'Join Factorization',
    subtitle:
      'Factors out common table references from UNION ALL branches to eliminate repetitive scans and joins.',

    whatTitle: 'What is Join Factorization?',
    whatDesc:
      'Join Factorization is a cost-based transformation that factors out common computations — including data access and joins — from the branches of a UNION ALL query to avoid repetitive processing.\n\nFor example, if two UNION ALL branches each read the same table t1, the optimizer rewrites the query so t1 is scanned only once and its result is shared across both branches.',

    howTitle: 'How Does It Work?',
    howDesc:
      "The optimizer identifies common tables and join conditions across UNION ALL branches. It factors those common parts out of the UNION ALL, processes them once, and leaves only the branch-specific joins inside.\n\nIn the rewritten query, the factorized UNION ALL is expressed as an inline view whose name begins with the VW_JF_ prefix.",

    exampleTitle: 'Transformation Example (Oracle Docs)',
    exampleDesc:
      'This Oracle documentation example shows t1 — referenced in both branches — being factorized so it is scanned only once.',
    beforeSql: `-- Before: t1 is scanned separately in each branch
SELECT t1.c1, t2.c2
FROM   t1, t2, t3
WHERE  t1.c1 = t2.c1
AND    t1.c1 > 1
AND    t2.c2 = 2
AND    t2.c2 = t3.c2
UNION ALL
SELECT t1.c1, t2.c2
FROM   t1, t2, t4
WHERE  t1.c1 = t2.c1
AND    t1.c1 > 1
AND    t2.c3 = t4.c3;`,
    afterSql: `-- After: t1 scanned once; UNION ALL moved inside
SELECT t1.c1, VW_JF_1.item_2
FROM   t1,
       (SELECT t2.c1 item_1, t2.c2 item_2
        FROM   t2, t3
        WHERE  t2.c2 = t3.c2
        AND    t2.c2 = 2
        UNION ALL
        SELECT t2.c1 item_1, t2.c2 item_2
        FROM   t2, t4
        WHERE  t2.c3 = t4.c3) VW_JF_1
WHERE  t1.c1 = VW_JF_1.item_1
AND    t1.c1 > 1;`,
    exampleNote:
      'Before: t1 is scanned and filtered twice — once per branch.\nAfter: the t1.c1 > 1 filter and t1 scan happen once.\nVW_JF_1 is the inline view name generated by the optimizer.',

    planTitle: 'Verifying in the Execution Plan',
    planDesc:
      'When Join Factorization is applied, the execution plan shows a view name prefixed with VW_JF_. This view contains the UNION ALL branches, while the outer query joins the common table with that view.',
    planCaption: 'EXPLAIN PLAN — after Join Factorization (t1 scanned once, UNION ALL inside VW_JF_1)',

    restrictTitle: 'Restrictions',
    restrictDesc:
      'Join Factorization is not applied in the following cases.',
    restrictItems: [
      'UNION ALL branches that use DISTINCT — deduplication makes factorization semantically unsafe.',
      'When the cost comparison shows the transformation is more expensive — if the common table is small or the branch count is low, factorization may not help.',
    ],

    supportTitle: 'Supported Join Types',
    supportDesc:
      'Join Factorization supports more than just inner joins.',
    supportItems: [
      'Outer joins — right-side tables that appear in all branches can be factorized',
      'Antijoins — right-side tables in NOT EXISTS / NOT IN rewrites',
      'Semijoins — right-side tables in EXISTS / IN rewrites',
    ],

    summaryTitle: 'Join Factorization Key Takeaways',
    summaryItems: [
      'Factors out common tables from UNION ALL branches, eliminating repetitive large table scans.',
      'Cost-based decision — applied only when it reduces the overall cost.',
      'Not applied when UNION ALL branches contain DISTINCT.',
      'Factorized query blocks are named with the VW_JF_ prefix.',
      'Supports outer joins, antijoins, and semijoins (right-side tables only).',
    ],
  },
}

const PLAN_ROWS_KO: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 10, cost: 8, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 10, cost: 8, time: '00:00:01',
    note: 't1(공통 테이블)이 한 번만 스캔돼요. VW_JF_1(UNION ALL)과 조인해요.' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'T1', rows: 50, cost: 3, time: '00:00:01',
    note: 't1이 단 한 번만 읽혀요. 변환 전에는 두 브랜치에서 각각 읽혔어요.' },
  { id: 3, depth: 2, operation: 'VIEW', name: 'VW_JF_1', rows: 10, cost: 5, time: '00:00:01',
    note: 'VW_JF_ 접두사: Join Factorization으로 생성된 인라인 뷰예요. 브랜치별 조인이 이 안에 있어요.' },
  { id: 4, depth: 3, operation: 'UNION-ALL', rows: undefined, cost: undefined, time: undefined },
  { id: 5, depth: 4, operation: 'HASH JOIN', rows: 5, cost: 3, time: '00:00:01',
    note: '첫 번째 브랜치: t2와 t3의 조인. t1 없이 브랜치만의 조인이에요.' },
  { id: 6, depth: 5, operation: 'TABLE ACCESS FULL', name: 'T2', rows: 10, cost: 2, time: '00:00:01' },
  { id: 7, depth: 5, operation: 'TABLE ACCESS FULL', name: 'T3', rows: 5, cost: 1, time: '00:00:01' },
  { id: 8, depth: 4, operation: 'HASH JOIN', rows: 5, cost: 2, time: '00:00:01',
    note: '두 번째 브랜치: t2와 t4의 조인.' },
  { id: 9, depth: 5, operation: 'TABLE ACCESS FULL', name: 'T2', rows: 10, cost: 2, time: '00:00:01' },
  { id: 10, depth: 5, operation: 'TABLE ACCESS FULL', name: 'T4', rows: 5, cost: 1, time: '00:00:01' },
]

const PLAN_ROWS_EN: PlanRow[] = [
  { id: 0, depth: 0, operation: 'SELECT STATEMENT', rows: 10, cost: 8, time: '00:00:01' },
  { id: 1, depth: 1, operation: 'HASH JOIN', rows: 10, cost: 8, time: '00:00:01',
    note: 'The common table t1 is scanned only once. It joins with VW_JF_1 (the UNION ALL view).' },
  { id: 2, depth: 2, operation: 'TABLE ACCESS FULL', name: 'T1', rows: 50, cost: 3, time: '00:00:01',
    note: 't1 is read just once. Before factorization it would have been scanned separately in each branch.' },
  { id: 3, depth: 2, operation: 'VIEW', name: 'VW_JF_1', rows: 10, cost: 5, time: '00:00:01',
    note: 'VW_JF_ prefix: an inline view generated by Join Factorization. The per-branch joins live inside.' },
  { id: 4, depth: 3, operation: 'UNION-ALL', rows: undefined, cost: undefined, time: undefined },
  { id: 5, depth: 4, operation: 'HASH JOIN', rows: 5, cost: 3, time: '00:00:01',
    note: 'First branch: join of t2 and t3 — no t1 here.' },
  { id: 6, depth: 5, operation: 'TABLE ACCESS FULL', name: 'T2', rows: 10, cost: 2, time: '00:00:01' },
  { id: 7, depth: 5, operation: 'TABLE ACCESS FULL', name: 'T3', rows: 5, cost: 1, time: '00:00:01' },
  { id: 8, depth: 4, operation: 'HASH JOIN', rows: 5, cost: 2, time: '00:00:01',
    note: 'Second branch: join of t2 and t4.' },
  { id: 9, depth: 5, operation: 'TABLE ACCESS FULL', name: 'T2', rows: 10, cost: 2, time: '00:00:01' },
  { id: 10, depth: 5, operation: 'TABLE ACCESS FULL', name: 'T4', rows: 5, cost: 1, time: '00:00:01' },
]

export function QtJoinFactorizationSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const planRows = lang === 'ko' ? PLAN_ROWS_KO : PLAN_ROWS_EN

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

      <SectionTitle>{t.exampleTitle}</SectionTitle>
      <Prose>{t.exampleDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.beforeSql} badge={lang === 'ko' ? '변환 전' : 'Before'} badgeColor="rose" />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.afterSql} badge={lang === 'ko' ? '변환 후' : 'After'} badgeColor="emerald" />
      </div>
      <InfoBox variant="note">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{t.exampleNote}</pre>
      </InfoBox>

      <Divider />

      <SectionTitle>{t.planTitle}</SectionTitle>
      <Prose>{t.planDesc}</Prose>
      <ExplainPlanTable rows={planRows} caption={t.planCaption} lang={lang} />

      <Divider />

      <SectionTitle>{t.restrictTitle}</SectionTitle>
      <Prose>{t.restrictDesc}</Prose>
      <div className="mt-4 space-y-2">
        {t.restrictItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 font-mono text-[10px] font-bold text-rose-600">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
          </div>
        ))}
      </div>

      <Divider />

      <SectionTitle>{t.supportTitle}</SectionTitle>
      <Prose>{t.supportDesc}</Prose>
      <div className="mt-4 space-y-2">
        {t.supportItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-mono text-[10px] font-bold text-emerald-600">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
          </div>
        ))}
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
