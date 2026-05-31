import { IconShield } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
} from '../../../shared'

const T = {
  ko: {
    title: 'SQL Plan Management & SQL Quarantine',
    subtitle:
      '옵티마이저가 갑자기 다른 실행 계획을 선택해서 성능이 나빠지는 상황을 막고 싶을 때 쓰는 게 SQL Plan Management(SQL 계획 관리)예요. 검증된 계획만 쓰도록 잠가두는 거죠.',
    spmTitle: 'SQL Plan Management란?',
    spmDesc:
      'SQL 계획 기준선(SQL plan baseline)이라는 "승인된 계획 목록"을 만들어두고, 옵티마이저가 그 목록 안에 있는 계획만 쓰도록 해요. 새로운 계획이 더 좋더라도 먼저 검증을 거쳐야 목록에 들어올 수 있어요.',
    spmObjectivesLabel: '주요 목표는 이거예요:',
    spmObjectives: [
      '반복 실행되는 SQL 문장 추적하기',
      '계획 이력(plan history)과 SQL 계획 기준선 유지하기',
      '이력에 없는 새로운 계획 감지하기',
      '기준선에 없지만 더 나은 잠재적 계획 찾아내기',
    ],
    quarantineTitle: 'SQL Quarantine (쿼리 격리)',
    quarantineDesc:
      '자원을 너무 많이 쓰는 SQL을 강제로 종료할 수 있는데, 문제는 그 SQL이 계속 다시 실행되어 매번 자원을 낭비한다는 거예요. SQL Quarantine은 이런 "문제 계획"을 블랙리스트에 올려서 다시는 실행되지 않도록 막아줘요.',
    quarantineWorkTitle: '어떻게 작동하나요?',
    quarantineWorkDesc:
      'Resource Manager가 특정 SQL의 최대 실행 시간을 20분으로 설정했다고 해봐요. 20분을 초과하면 강제 종료하지만, 그 SQL이 매번 20분씩 실행됐다가 종료되는 일이 반복될 수 있어요.\n\nSQL Quarantine은 이 문제를 해결해요. 자원 제한을 초과한 계획을 "격리(quarantine)"해서 차단 목록(blocklist)에 넣어요. 이후 같은 SQL이 실행되면 그 계획은 아예 사용하지 않아요.',
    quarantineUITitle: 'SQL Quarantine 설정 방법',
    quarantineUIDesc:
      'DBMS_SQLQ 패키지로 직접 격리 구성을 만들 수 있고, OPTIMIZER_CAPTURE_SQL_QUARANTINE = TRUE로 설정하면 Resource Manager가 쿼리를 종료할 때 자동으로 격리 구성이 만들어져요.',
    quarantineSql: `-- SQL Quarantine 자동 생성 활성화
ALTER SYSTEM SET OPTIMIZER_CAPTURE_SQL_QUARANTINE = TRUE;

-- 기존 SQL Quarantine 구성 비활성화
ALTER SYSTEM SET OPTIMIZER_USE_SQL_QUARANTINE = FALSE;

-- 격리된 계획 확인
SELECT sql_id, sql_quarantine, avoided_executions
FROM   v$sql
WHERE  sql_quarantine IS NOT NULL;`,
    essTitle: 'Expression Statistics Store (ESS)',
    essDesc:
      'ESS는 옵티마이저가 표현식 평가에 대한 통계를 저장하는 공간이에요. 데이터베이스의 영구 구성 요소라 끌 수 없어요.',
    essDesc2:
      'Oracle이 ESS를 쓰는 이유 중 하나는 특정 표현식이 얼마나 자주 접근되는지(=핫한지) 파악해서 In-Memory Expression(IM 표현식) 후보로 올릴지 결정하기 위해서예요. 각 세그먼트에 대해 아래 통계를 유지해요.',
    essItems: [
      '실행 빈도 (Frequency of execution)',
      '평가 비용 (Cost of evaluation)',
      '마지막 평가 시각 (Timestamp evaluation)',
    ],
    essNote:
      'ESS는 SGA에 있으면서 디스크에도 저장돼요. 15분마다 자동으로 디스크에 저장되고, DBMS_STATS.FLUSH_DATABASE_MONITORING_INFO로 즉시 저장할 수도 있어요. DBA_EXPRESSION_STATISTICS 뷰에서 내용을 확인할 수 있어요.',
  },
  en: {
    title: 'SQL Plan Management & SQL Quarantine',
    subtitle:
      'SQL plan management enables the optimizer to automatically manage execution plans, ensuring that the database uses only known or verified plans.',
    spmTitle: 'About SQL Plan Management',
    spmDesc:
      'SQL plan management can build a SQL plan baseline, which contains one or more accepted plans for each SQL statement. The optimizer can access and manage the plan history and SQL plan baselines of SQL statements.',
    spmObjectivesLabel: 'The main objectives are as follows:',
    spmObjectives: [
      'Identify repeatable SQL statements',
      'Maintain plan history, and possibly SQL plan baselines, for a set of SQL statements',
      'Detect plans that are not in the plan history',
      'Detect potentially better plans that are not in the SQL plan baseline',
    ],
    quarantineTitle: 'About Quarantined SQL Plans',
    quarantineDesc:
      'You can configure Oracle Database to automatically quarantine the plans for SQL statements terminated by Oracle Database Resource Manager (the Resource Manager) for exceeding resource limits.',
    quarantineWorkTitle: 'How SQL Quarantine Works',
    quarantineWorkDesc:
      'The Resource Manager can set a maximum estimated execution time for a SQL statement, for example, 20 minutes. If a statement execution exceeds this limit, then the Resource Manager terminates the statement. However, the statement may run repeatedly before being terminated, wasting 20 minutes of resources each time it is executed.\n\nThe SQL Quarantine infrastructure solves the problem of repeatedly wasting resources. If a statement exceeds the specified resource limit, then the Resource Manager terminates the execution and "quarantines" the plan. To quarantine the plan means to put it on a blocklist of plans that the database will not execute for this statement.',
    quarantineUITitle: 'SQL Quarantine User Interface',
    quarantineUIDesc:
      'The DBMS_SQLQ PL/SQL package enables you to manually create quarantine configurations for execution plans by specifying thresholds for consuming system resources. To enable SQL Quarantine to create configurations automatically after the Resource Manager terminates a query, set the OPTIMIZER_CAPTURE_SQL_QUARANTINE initialization parameter to true (the default is false).',
    quarantineSql: `-- Enable automatic SQL Quarantine configuration creation
ALTER SYSTEM SET OPTIMIZER_CAPTURE_SQL_QUARANTINE = TRUE;

-- Disable use of existing SQL Quarantine configurations
ALTER SYSTEM SET OPTIMIZER_USE_SQL_QUARANTINE = FALSE;

-- Check quarantined plans
SELECT sql_id, sql_quarantine, avoided_executions
FROM   v$sql
WHERE  sql_quarantine IS NOT NULL;`,
    essTitle: 'About the Expression Statistics Store (ESS)',
    essDesc:
      'The Expression Statistics Store (ESS) is a repository maintained by the optimizer to store statistics about expression evaluation. The ESS is a permanent component of the database and cannot be disabled.',
    essDesc2:
      'The database uses the ESS to determine whether an expression is "hot" (frequently accessed), and thus a candidate for an IM expression. For each segment, the ESS maintains expression statistics such as the following:',
    essItems: [
      'Frequency of execution',
      'Cost of evaluation',
      'Timestamp evaluation',
    ],
    essNote:
      'The ESS resides in the SGA and also persists on disk. The database saves the statistics to disk every 15 minutes, or immediately using the DBMS_STATS.FLUSH_DATABASE_MONITORING_INFO procedure. The ESS statistics are visible in the DBA_EXPRESSION_STATISTICS view.',
  },
}

export function SpmSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconShield size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.spmTitle}</SectionTitle>
      <Prose>{t.spmDesc}</Prose>
      <Prose>{t.spmObjectivesLabel}</Prose>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.spmObjectives.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>

      <Divider />

      <SectionTitle>{t.quarantineTitle}</SectionTitle>
      <Prose>{t.quarantineDesc}</Prose>

      <SubTitle>{t.quarantineWorkTitle}</SubTitle>
      <Prose>{t.quarantineWorkDesc}</Prose>

      <SubTitle>{t.quarantineUITitle}</SubTitle>
      <Prose>{t.quarantineUIDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.quarantineSql} />
      </div>

      <Divider />

      <SectionTitle>{t.essTitle}</SectionTitle>
      <Prose>{t.essDesc}</Prose>
      <Prose>{t.essDesc2}</Prose>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.essItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <InfoBox variant="note">{t.essNote}</InfoBox>
      </div>
    </PageContainer>
  )
}
