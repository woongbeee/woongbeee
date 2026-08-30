import { IconGitFork } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Table,
  SqlBlock,
  Divider,
  StepList,
} from '../shared'

const T = {
  ko: {
    title: 'Degree of Parallelism',
    subtitle:
      'DOP(병렬도)는 병렬 쿼리에서 사용할 PX 서버의 수예요. 잘못된 DOP 설정은 성능 저하와 리소스 낭비의 원인이 돼요.',

    dopTitle: 'DOP란?',
    dopDesc:
      'DOP(Degree of Parallelism, 병렬도)는 하나의 쿼리를 처리하는 데 사용하는 병렬 실행 서버(PX Server)의 수예요.\n\nDOP가 4라면 Producer PX 서버 4개 + Consumer PX 서버 4개로 최대 8개의 PX 서버가 동시에 동작할 수 있어요. 이 두 그룹은 Table Queue(TQ)를 통해 데이터를 주고받아요.',

    setTitle: 'DOP 설정 방법',
    setDesc: 'DOP는 여러 레벨에서 설정할 수 있고, 우선순위가 높은 설정이 적용돼요.',
    setTable: [
      ['1순위', 'SQL 힌트', '/*+ PARALLEL(t, 4) */', '가장 강력. 옵티마이저 결정을 오버라이드해요.'],
      [
        '2순위',
        '테이블 속성',
        'ALTER TABLE t PARALLEL 8',
        '테이블에 기본 DOP를 지정해요. 힌트가 없으면 이 값이 쓰여요.',
      ],
      [
        '3순위',
        '세션 수준',
        'ALTER SESSION ENABLE PARALLEL QUERY',
        '세션의 모든 쿼리에 자동 병렬을 적용해요. DOP는 옵티마이저가 결정해요.',
      ],
      [
        '4순위',
        '자동 DOP',
        'PARALLEL_DEGREE_POLICY = AUTO',
        'Oracle 12c+. 옵티마이저가 쿼리 비용 기반으로 DOP를 자동 결정해요.',
      ],
    ],

    hintTitle: 'SQL 힌트로 DOP 설정하기',
    hintDesc:
      '운영 환경에서는 SQL 힌트로 DOP를 명시하는 방식을 권장해요. 예측 가능하고 제어하기 쉬워요.',
    hintSql: `-- 단일 테이블에 DOP 4 지정
SELECT /*+ PARALLEL(e, 4) */ department_id, COUNT(*), AVG(salary)
FROM employees e
GROUP BY department_id;

-- 여러 테이블 각각 DOP 지정
SELECT /*+ PARALLEL(o, 8) PARALLEL(i, 8) */
       o.order_id, SUM(i.price * i.qty) AS total
FROM orders o
JOIN order_items i ON o.order_id = i.order_id
GROUP BY o.order_id;

-- 기본 병렬도(DEFAULT DOP) 사용 — 테이블 PARALLEL 속성 or CPU 기반 자동 계산
SELECT /*+ PARALLEL */ COUNT(*) FROM large_table;`,

    guidanceTitle: 'DOP 적정값 결정 가이드',
    guidanceDesc:
      'DOP가 높다고 무조건 빠른 게 아니에요. 리소스 한계와 동시 실행 쿼리를 고려해야 해요.',
    guidanceSteps: [
      {
        title: 'CPU 코어 수 파악',
        desc: 'DOP의 최대 기준은 서버의 CPU 코어 수예요. 단일 쿼리가 모든 코어를 독점하면 다른 쿼리가 대기해요.',
      },
      {
        title: '동시 실행 쿼리 수 고려',
        desc: '동시에 N개의 병렬 쿼리가 실행될 수 있다면, DOP × N ≤ CPU 코어 수가 되도록 설정해요.',
      },
      {
        title: '배치/리포트 쿼리는 높은 DOP',
        desc: '야간 배치나 리포트처럼 혼자 실행되는 쿼리는 DOP = CPU 코어 수 까지 올려도 돼요.',
      },
      {
        title: 'I/O 대역폭도 제한 요소',
        desc: 'DOP가 높아도 디스크 I/O 대역폭이 병목이 되면 추가 PX 서버가 서로 대기해요. 실제 실행 계획의 Wait Event를 확인하세요.',
      },
    ],

    limitTitle: 'PX 서버 풀 관리',
    limitDesc:
      'Oracle은 PARALLEL_MAX_SERVERS 파라미터로 인스턴스 전체의 최대 PX 서버 수를 제한해요.',
    limitTable: [
      ['PARALLEL_MAX_SERVERS', '인스턴스 전체 PX 서버 최대 수', '기본값: CPU×5 정도'],
      ['PARALLEL_MIN_SERVERS', '항상 유지하는 최소 PX 서버 수', '첫 병렬 쿼리의 시작 시간을 줄여줘요'],
      ['PARALLEL_SERVERS_TARGET', 'Auto DOP 모드에서의 목표 PX 서버 수', 'AUTO 정책 사용 시 참조'],
    ],
    limitWarning:
      '사용 가능한 PX 서버가 부족하면 Oracle은 요청한 DOP를 낮추거나, 심한 경우 병렬 실행을 직렬로 다운그레이드해요. V$PX_PROCESS_SYSSTAT 뷰로 현재 PX 서버 사용 현황을 확인할 수 있어요.',

    summary:
      'DOP는 SQL 힌트 > 테이블 속성 > 세션 설정 > 자동 DOP 순으로 결정돼요. 운영 환경에서는 SQL 힌트로 명시적으로 지정하는 것이 가장 예측 가능하고 안전해요. DOP 값은 CPU 코어 수와 동시 실행 쿼리 수를 함께 고려해서 설정하세요.',
  },

  en: {
    title: 'Degree of Parallelism',
    subtitle:
      'DOP determines how many PX Servers a parallel query uses. Incorrect DOP settings cause performance degradation and resource waste.',

    dopTitle: 'What is DOP?',
    dopDesc:
      'DOP (Degree of Parallelism) is the number of Parallel Execution Servers (PX Servers) used to process a single query.\n\nWith DOP = 4, up to 8 PX Servers can operate simultaneously: 4 Producer servers + 4 Consumer servers. These two groups exchange data through Table Queues (TQ).',

    setTitle: 'How to Set DOP',
    setDesc: 'DOP can be set at multiple levels; the highest-priority setting takes effect.',
    setTable: [
      ['Priority 1', 'SQL Hint', '/*+ PARALLEL(t, 4) */', 'Strongest — overrides the optimizer.'],
      [
        'Priority 2',
        'Table Attribute',
        'ALTER TABLE t PARALLEL 8',
        'Sets a default DOP on the table. Used when no hint is present.',
      ],
      [
        'Priority 3',
        'Session Level',
        'ALTER SESSION ENABLE PARALLEL QUERY',
        'Applies auto-parallelism to all session queries. DOP is chosen by the optimizer.',
      ],
      [
        'Priority 4',
        'Auto DOP',
        'PARALLEL_DEGREE_POLICY = AUTO',
        'Oracle 12c+. Optimizer automatically determines DOP based on query cost.',
      ],
    ],

    hintTitle: 'Setting DOP with SQL Hints',
    hintDesc:
      'In production, explicitly specifying DOP with SQL hints is recommended — it is predictable and easy to control.',
    hintSql: `-- Assign DOP 4 to a single table
SELECT /*+ PARALLEL(e, 4) */ department_id, COUNT(*), AVG(salary)
FROM employees e
GROUP BY department_id;

-- Assign DOP per table in a join
SELECT /*+ PARALLEL(o, 8) PARALLEL(i, 8) */
       o.order_id, SUM(i.price * i.qty) AS total
FROM orders o
JOIN order_items i ON o.order_id = i.order_id
GROUP BY o.order_id;

-- Use DEFAULT DOP (table PARALLEL attribute or CPU-based auto calculation)
SELECT /*+ PARALLEL */ COUNT(*) FROM large_table;`,

    guidanceTitle: 'DOP Sizing Guide',
    guidanceDesc:
      'Higher DOP is not always faster — you must account for resource limits and concurrent queries.',
    guidanceSteps: [
      {
        title: 'Know your CPU core count',
        desc: 'CPU cores are the upper bound for DOP. If a single query monopolizes all cores, other queries will wait.',
      },
      {
        title: 'Factor in concurrent queries',
        desc: 'If N parallel queries can run simultaneously, set DOP so that DOP × N ≤ CPU core count.',
      },
      {
        title: 'Higher DOP for batch/reports',
        desc: 'For overnight batch jobs or reports that run alone, DOP = CPU core count is acceptable.',
      },
      {
        title: 'I/O bandwidth is also a limit',
        desc: 'Even with high DOP, disk I/O bandwidth can be the bottleneck — extra PX Servers just wait. Check Wait Events in the actual execution plan.',
      },
    ],

    limitTitle: 'PX Server Pool Management',
    limitDesc:
      "Oracle caps the total PX Server count for an instance via the PARALLEL_MAX_SERVERS parameter.",
    limitTable: [
      ['PARALLEL_MAX_SERVERS', 'Max PX Servers instance-wide', 'Default: roughly CPU × 5'],
      [
        'PARALLEL_MIN_SERVERS',
        'Minimum PX Servers always maintained',
        'Reduces startup latency for first parallel query',
      ],
      ['PARALLEL_SERVERS_TARGET', 'Target PX Server count for Auto DOP', 'Referenced when AUTO policy is used'],
    ],
    limitWarning:
      'If available PX Servers are insufficient, Oracle reduces the requested DOP or, in severe cases, downgrades parallel execution to serial. Check V$PX_PROCESS_SYSSTAT for current PX Server utilization.',

    summary:
      'DOP priority order: SQL hint > Table attribute > Session setting > Auto DOP. In production, explicitly specifying DOP via SQL hints is the most predictable and safe approach. Always factor in both CPU core count and concurrent query load when choosing a DOP value.',
  },
}

export function ParallelDopSection() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconGitFork size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.dopTitle}</SectionTitle>
      <Prose>{t.dopDesc}</Prose>

      <Divider />

      <SectionTitle>{t.setTitle}</SectionTitle>
      <Prose>{t.setDesc}</Prose>
      <Table
        headers={
          isKo
            ? ['우선순위', '설정 방법', '구문 예시', '특징']
            : ['Priority', 'Method', 'Example Syntax', 'Notes']
        }
        rows={t.setTable}
      />

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <Prose>{t.hintDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>

      <Divider />

      <SectionTitle>{t.guidanceTitle}</SectionTitle>
      <Prose>{t.guidanceDesc}</Prose>
      <StepList steps={t.guidanceSteps} />

      <Divider />

      <SectionTitle>{t.limitTitle}</SectionTitle>
      <Prose>{t.limitDesc}</Prose>
      <Table
        headers={
          isKo ? ['파라미터', '설명', '비고'] : ['Parameter', 'Description', 'Notes']
        }
        rows={t.limitTable}
      />
      <InfoBox variant="warning">{t.limitWarning}</InfoBox>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
