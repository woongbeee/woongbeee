import { IconLayoutList } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  InfoBox,
  Divider,
  Table,
  SqlBlock,
} from '../../../shared'

const T = {
  ko: {
    title: '실행 계획 확인하기',
    subtitle:
      'EXPLAIN PLAN으로 계획을 저장한 뒤 DBMS_XPLAN 함수나 V$ 뷰로 조회할 수 있어요. 어떤 함수를 쓰느냐에 따라 예상 계획 vs 실제 실행 계획을 선택해서 볼 수 있어요.',
    scriptsTitle: '기본 스크립트',
    scriptRows: [
      ['DBMS_XPLAN.DISPLAY', '계획 테이블 내용을 표시하는 테이블 함수. 계획 테이블 이름, STATEMENT_ID, 포맷 지정 가능.'],
      ['utlxpls.sql', '직렬 처리에 대한 계획 테이블 출력을 표시해요.'],
      ['utlxplp.sql', '병렬 실행 컬럼을 포함한 계획 테이블 출력을 표시해요.'],
    ],
    displayFuncsTitle: 'DBMS_XPLAN 함수 목록',
    displayFuncsRows: [
      ['DISPLAY', 'PLAN_TABLE에 저장된 예상 계획을 표시해요. SQL이 실제로 실행되지 않아도 돼요.', "format => 'TYPICAL'"],
      ['DISPLAY_AWR', 'AWR에 저장된 실행 계획을 조회해요. 과거 특정 시점의 계획을 확인할 때 사용해요.', "format => 'TYPICAL'"],
      ['DISPLAY_CURSOR', '실제로 실행된 SQL의 커서를 V$SQL_PLAN_STATISTICS_ALL에서 조회해요. E-Rows vs A-Rows 비교 가능.', "format => 'ALLSTATS LAST'"],
      ['DISPLAY_PLAN', 'PLAN_TABLE 내용을 CLOB으로 반환해요. 다양한 format 옵션을 지원해요.', "format => 'ALL'"],
      ['DISPLAY_SQL_PLAN_BASELINE', 'SQL Plan Management 베이스라인의 계획을 표시해요.', "format => 'TYPICAL'"],
      ['DISPLAY_SQLSET', 'SQL Tuning Set에 저장된 문장의 실행 계획을 표시해요.', "format => 'TYPICAL'"],
    ],
    displayFuncsSql: `-- DISPLAY: PLAN_TABLE의 최근 계획 표시
SELECT PLAN_TABLE_OUTPUT FROM TABLE(DBMS_XPLAN.DISPLAY());

-- 특정 STATEMENT_ID와 포맷 지정
SELECT PLAN_TABLE_OUTPUT
  FROM TABLE(DBMS_XPLAN.DISPLAY('MY_PLAN_TABLE', 'st1', 'TYPICAL'));

-- DISPLAY_CURSOR: 방금 실행한 SQL의 런타임 통계 포함 계획 조회
SET LINESIZE 165
SET PAGESIZE 0
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(FORMAT=>'+ALLSTATS'));

-- ADAPTIVE 포맷: 적응형 계획에서 비활성 서브플랜까지 모두 표시
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(FORMAT=>'+ADAPTIVE'));`,
    adaptiveNote:
      '+ADAPTIVE 포맷을 쓰면 옵티마이저가 고려했지만 최종 선택하지 않은 서브플랜(대시 - 표시)까지 볼 수 있어요. 적응형 쿼리 최적화의 작동 원리는 Query Optimizer Fundamentals → Adaptive Query Optimization 섹션에서 자세히 설명합니다.',
    viewsTitle: '실행 계획 관련 V$ 뷰',
    viewsRows: [
      ['V$SQL', 'SQL 커서 통계. 자식 커서마다 한 행. 19c부터 V$SQL.QUARANTINED로 Resource Manager 강제종료 여부 확인 가능.'],
      ['V$SQL_SHARED_CURSOR', '자식 커서가 공유되지 않는 이유 설명.'],
      ['V$SQL_PLAN', '공유 SQL 영역에 저장된 모든 실행 계획. 실행 환경을 알 필요 없는 EXPLAIN PLAN 대안.'],
      ['V$SQL_PLAN_STATISTICS', '계획의 각 오퍼레이션별 실제 실행 통계 (STATISTICS_LEVEL = ALL 설정 시).'],
      ['V$SQL_PLAN_STATISTICS_ALL', 'V$SQL_PLAN + V$SQL_PLAN_STATISTICS + V$SQL_WORKAREA 결합. E-Rows와 A-Rows를 나란히 비교 가능.'],
    ],
  },
  en: {
    title: 'Displaying Execution Plans',
    subtitle:
      'After saving a plan with EXPLAIN PLAN, use DBMS_XPLAN functions or V$ views to retrieve it. The function you choose determines whether you see the estimated plan or the actual runtime plan.',
    scriptsTitle: 'Basic Scripts',
    scriptRows: [
      ['DBMS_XPLAN.DISPLAY', 'Table function that displays plan table contents. Supports plan table name, statement ID, and format options.'],
      ['utlxpls.sql', 'Script that displays plan table output for serial processing.'],
      ['utlxplp.sql', 'Script that displays plan table output including parallel execution columns.'],
    ],
    displayFuncsTitle: 'DBMS_XPLAN Functions',
    displayFuncsRows: [
      ['DISPLAY', 'Displays the estimated plan saved in PLAN_TABLE. The SQL does not need to have been executed.', "format => 'TYPICAL'"],
      ['DISPLAY_AWR', 'Retrieves execution plans stored in AWR. Useful for looking up historical plans.', "format => 'TYPICAL'"],
      ['DISPLAY_CURSOR', 'Queries V$SQL_PLAN_STATISTICS_ALL for an already-executed cursor. Enables E-Rows vs A-Rows comparison.', "format => 'ALLSTATS LAST'"],
      ['DISPLAY_PLAN', 'Returns PLAN_TABLE contents as CLOB. Supports a variety of format options.', "format => 'ALL'"],
      ['DISPLAY_SQL_PLAN_BASELINE', 'Displays execution plans from a SQL Plan Management baseline.', "format => 'TYPICAL'"],
      ['DISPLAY_SQLSET', 'Displays the execution plan of a statement stored in a SQL Tuning Set.', "format => 'TYPICAL'"],
    ],
    displayFuncsSql: `-- DISPLAY: show the most recent EXPLAIN PLAN result
SELECT PLAN_TABLE_OUTPUT FROM TABLE(DBMS_XPLAN.DISPLAY());

-- With specific statement ID and format
SELECT PLAN_TABLE_OUTPUT
  FROM TABLE(DBMS_XPLAN.DISPLAY('MY_PLAN_TABLE', 'st1', 'TYPICAL'));

-- DISPLAY_CURSOR: actual runtime plan with statistics for the last executed SQL
SET LINESIZE 165
SET PAGESIZE 0
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(FORMAT=>'+ALLSTATS'));

-- ADAPTIVE format: show all subplans including inactive ones
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(FORMAT=>'+ADAPTIVE'));`,
    adaptiveNote:
      'The +ADAPTIVE format reveals subplans the optimizer considered but did not ultimately choose (marked with a dash -). For a full explanation of how adaptive plans work, see Query Optimizer Fundamentals → Adaptive Query Optimization.',
    viewsTitle: 'Plan-Related V$ Views',
    viewsRows: [
      ['V$SQL', 'Cursor statistics; one row per child cursor. From 19c, V$SQL.QUARANTINED shows whether Resource Manager terminated the statement.'],
      ['V$SQL_SHARED_CURSOR', 'Explains why a child cursor is not shared with existing cursors.'],
      ['V$SQL_PLAN', 'Contains the plan for every statement in the shared SQL area. No need to know the compilation environment — an advantage over EXPLAIN PLAN.'],
      ['V$SQL_PLAN_STATISTICS', 'Per-operation actual execution statistics (requires STATISTICS_LEVEL = ALL).'],
      ['V$SQL_PLAN_STATISTICS_ALL', 'Combines V$SQL_PLAN, V$SQL_PLAN_STATISTICS, and V$SQL_WORKAREA. Enables side-by-side E-Rows vs A-Rows comparisons.'],
    ],
  },
}

export function DisplaySection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLayoutList size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.scriptsTitle}</SectionTitle>
      <Table
        headers={isKo ? ['도구', '설명'] : ['Tool', 'Description']}
        rows={t.scriptRows}
      />

      <Divider />

      <SectionTitle>{t.displayFuncsTitle}</SectionTitle>
      <Table
        headers={isKo ? ['함수', '설명', '대표 format'] : ['Function', 'Description', 'Typical format']}
        rows={t.displayFuncsRows}
      />
      <div className="mt-4">
        <SqlBlock sql={t.displayFuncsSql} />
      </div>
      <div className="mt-4">
        <InfoBox variant="tip">{t.adaptiveNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.viewsTitle}</SectionTitle>
      <Table
        headers={isKo ? ['뷰', '설명'] : ['View', 'Description']}
        rows={t.viewsRows}
      />
    </PageContainer>
  )
}
