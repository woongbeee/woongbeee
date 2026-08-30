import { IconBolt } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  SqlBlock,
} from '../../../shared'

const T = {
  ko: {
    title: 'Approximate Query Processing',
    subtitle:
      '데이터가 엄청나게 많을 때 정확한 집계를 뽑으려면 메모리도 많이 쓰고, 임시 공간까지 넘쳐흘러서 속도가 뚝 떨어질 수 있어요. Approximate Query Processing(근사 쿼리 처리)은 "딱 맞는 답 대신 거의 정확한 답을 훨씬 빠르게" 내줄 수 있는 기법이에요.',
    motivationTitle: '왜 필요할까요?',
    motivationDesc:
      'BI(비즈니스 인텔리전스) 쿼리는 COUNT DISTINCT, SUM, RANK, MEDIAN 같은 집계에 크게 의존해요. 데이터가 수백 테라바이트라면 이런 쿼리는 정확하게 계산하는 데만 엄청난 시간이 걸릴 수 있어요.',
    motivationItems: [
      '인기 웹사이트의 하루치 웹 로그만 해도 수십~수백 테라바이트에 달할 수 있어요',
      '신용카드 사기 감지처럼 거의 실시간으로 응답해야 하는 경우도 있어요',
      '데이터 탐색 단계에서는 완벽한 정확도보다 빠른 응답이 더 중요할 수 있어요',
    ],
    motivationNote:
      'Oracle의 근사 집계는 보통 97% 이상의 정확도(95% 신뢰 구간)를 보장하면서, 처리 시간은 수십 배 빠를 수 있어요. CPU도 덜 쓰고, 임시 파일에 쓰는 I/O 비용도 줄일 수 있어요.',
    paramsTitle: 'Approximate Query 초기화 파라미터',
    paramsDesc:
      '기존 코드를 건드리지 않고 APPROX_FOR_* 파라미터만 설정하면 자동으로 근사 쿼리가 적용돼요.',
    paramsRows: [
      ['APPROX_FOR_AGGREGATION', 'FALSE', '근사 쿼리 처리를 켜거나(TRUE) 끄는(FALSE) 우산 파라미터예요. 아래 두 파라미터도 같이 제어해요.'],
      ['APPROX_FOR_COUNT_DISTINCT', 'FALSE', 'COUNT(DISTINCT expr)을 자동으로 APPROX_COUNT_DISTINCT로 바꿔줘요.'],
      ['APPROX_FOR_PERCENTILE', 'none', '정확한 퍼센타일 함수를 해당 APPROX_PERCENTILE_* 버전으로 자동 변환해줘요.'],
    ],
    functionsTitle: 'Approximate Query SQL 함수들',
    functionsDesc:
      '직접 함수를 써서 근사값을 구할 수도 있어요. 정확한 답 대신 빠른 답이 필요한 탐색적 쿼리에 유용해요.',
    functionsRows: [
      ['APPROX_COUNT', 'APPROX_RANK와 함께 써서 가장 자주 나타나는 상위 n개 값의 개수를 구해요.'],
      ['APPROX_COUNT_DISTINCT', '특정 표현식의 고유 값이 몇 개인지 근사값으로 반환해요.'],
      ['APPROX_COUNT_DISTINCT_AGG', '미리 계산해둔 근사 COUNT DISTINCT 시놉시스를 더 높은 수준으로 집계해요.'],
      ['APPROX_COUNT_DISTINCT_DETAIL', 'APPROX_COUNT_DISTINCT의 시놉시스를 BLOB으로 반환해요. 나중에 더 집계할 때 씁니다.'],
      ['APPROX_MEDIAN', '숫자 또는 날짜-시간 값의 근사 중앙값을 반환해요. MEDIAN의 빠른 대안이에요.'],
      ['APPROX_PERCENTILE', '지정한 퍼센타일에 해당하는 근사 보간값을 반환해요. PERCENTILE_CONT의 빠른 대안이에요.'],
      ['APPROX_RANK', '값 그룹에서 근사 순위를 반환해요.'],
      ['APPROX_SUM', 'APPROX_RANK와 함께 써서 근사 상위 n개 항목의 누적 합계를 구해요.'],
    ],
    examplesTitle: '사용 예시',
    approxSql: `-- 각 부서 내에서 가장 일반적인 직업 상위 10개 반환
SELECT department_id, job_id, APPROX_COUNT(*)
FROM   employees
GROUP BY department_id, job_id
HAVING APPROX_RANK (
  PARTITION BY department_id
  ORDER BY APPROX_COUNT(*) DESC
) <= 10;

-- 각 부서 내에서 가장 높은 총급여를 가진 직업 유형 상위 10개 반환
SELECT department_id, job_id, APPROX_SUM(salary)
FROM   employees
GROUP BY department_id, job_id
HAVING APPROX_RANK (
  PARTITION BY department_id
  ORDER BY APPROX_SUM(salary) DESC
) <= 10;`,
  },
  en: {
    title: 'Approximate Query Processing',
    subtitle:
      'Approximate query processing is a set of optimization techniques that speed analytic queries by calculating results within an acceptable range of error.',
    motivationTitle: 'Background and Motivation',
    motivationDesc:
      'Business intelligence (BI) queries heavily rely on sorts that involve aggregate functions such as COUNT DISTINCT, SUM, RANK, and MEDIAN. For large data sets, exact aggregation queries consume extensive memory, often spilling to temp space, and can be unacceptably slow.',
    motivationItems: [
      'Queries must be able to process data sets that are orders of magnitude larger than in traditional data warehouses (for example, the daily volumes of web logs of a popular website can reach tens or hundreds of terabytes a day)',
      'Queries must provide near real-time response (for example, a company requires quick detection and response to credit card fraud)',
      'Explorative queries of large data sets must be fast',
    ],
    motivationNote:
      'Oracle Database implements its solution through approximate query processing. Typically, the accuracy of the approximate aggregation is over 97% (with 95% confidence), but the processing time is orders of magnitude faster. The database uses less CPU, and avoids the I/O cost of writing to temp files.',
    paramsTitle: 'Approximate Query Initialization Parameters',
    paramsDesc:
      'You can implement approximate query processing without changing existing code by using the APPROX_FOR_* initialization parameters. Set these parameters at the database or session level.',
    paramsRows: [
      ['APPROX_FOR_AGGREGATION', 'FALSE', 'Enables (TRUE) or disables (FALSE) approximate query processing. This parameter acts as an umbrella parameter for enabling the use of functions that return approximate results.'],
      ['APPROX_FOR_COUNT_DISTINCT', 'FALSE', 'Converts COUNT(DISTINCT) to APPROX_COUNT_DISTINCT.'],
      ['APPROX_FOR_PERCENTILE', 'none', 'Converts eligible exact percentile functions to their APPROX_PERCENTILE_* counterparts.'],
    ],
    functionsTitle: 'Approximate Query SQL Functions',
    functionsDesc:
      'Approximate query processing uses SQL functions to provide real-time responses to explorative queries where approximations are acceptable.',
    functionsRows: [
      ['APPROX_COUNT', 'Calculates the approximate top n most common values when used with the APPROX_RANK function.'],
      ['APPROX_COUNT_DISTINCT', 'Returns the approximate number of rows that contain distinct values of an expression.'],
      ['APPROX_COUNT_DISTINCT_AGG', 'Aggregates the precomputed approximate count distinct synopses to a higher level.'],
      ['APPROX_COUNT_DISTINCT_DETAIL', 'Returns the synopses of the APPROX_COUNT_DISTINCT function as a BLOB.'],
      ['APPROX_MEDIAN', 'Accepts a numeric or date-time value, and returns an approximate middle or approximate interpolated value. This function provides an alternative to the MEDIAN function.'],
      ['APPROX_PERCENTILE', 'Accepts a percentile value and a sort specification, and returns an approximate interpolated value that falls into that percentile value. This function provides an alternative to the PERCENTILE_CONT function.'],
      ['APPROX_RANK', 'Returns the approximate value in a group of values. Takes an optional PARTITION BY clause followed by a mandatory ORDER BY ... DESC clause.'],
      ['APPROX_SUM', 'Calculates the approximate top n accumulated values when used with the APPROX_RANK function.'],
    ],
    examplesTitle: 'Usage Examples',
    approxSql: `-- Return the 10 most common jobs within every department
SELECT department_id, job_id, APPROX_COUNT(*)
FROM   employees
GROUP BY department_id, job_id
HAVING APPROX_RANK (
  PARTITION BY department_id
  ORDER BY APPROX_COUNT(*) DESC
) <= 10;

-- Return the 10 job types within every department with highest aggregate salary
SELECT department_id, job_id, APPROX_SUM(salary)
FROM   employees
GROUP BY department_id, job_id
HAVING APPROX_RANK (
  PARTITION BY department_id
  ORDER BY APPROX_SUM(salary) DESC
) <= 10;`,
  },
}

export function ApproxSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconBolt size={36} stroke={1.5} className="text-amber" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.motivationTitle}</SectionTitle>
      <Prose>{t.motivationDesc}</Prose>
      <ul className="mt-2 mb-4 space-y-1.5 pl-4">
        {t.motivationItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-ink/80 before:mr-2 before:content-['•']">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <InfoBox variant="tip">{t.motivationNote}</InfoBox>
      </div>

      <Divider />

      <SectionTitle>{t.paramsTitle}</SectionTitle>
      <Prose>{t.paramsDesc}</Prose>
      <Table
        headers={isKo ? ['파라미터', '기본값', '설명'] : ['Parameter', 'Default', 'Description']}
        rows={t.paramsRows}
      />

      <Divider />

      <SectionTitle>{t.functionsTitle}</SectionTitle>
      <Prose>{t.functionsDesc}</Prose>
      <Table
        headers={isKo ? ['SQL 함수', '설명'] : ['SQL Function', 'Description']}
        rows={t.functionsRows}
      />

      <SectionTitle>{t.examplesTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.approxSql} />
      </div>
    </PageContainer>
  )
}
