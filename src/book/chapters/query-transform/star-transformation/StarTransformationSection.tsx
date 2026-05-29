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
  Table,
} from '../../shared'

const T = {
  ko: {
    title: 'Star Transformation',
    subtitle: 'Star 스키마 쿼리에서 팩트 테이블 Full Scan을 피하기 위해 Bitmap 세미조인 조건을 추가하는 변환이에요.',

    whatTitle: 'Star Transformation이란?',
    whatDesc:
      'Star Transformation은 Star 스키마 쿼리에서 팩트 테이블의 Full Table Scan을 피하기 위해 설계된 변환이에요. 팩트 테이블의 조인 컬럼에 Bitmap 인덱스가 있을 때 적용할 수 있어요.\n\n변환 방식:\n① 제약 차원(constraining dimension)에 대한 Bitmap 세미조인 조건을 추가해요\n② Bitmap AND/OR 연산으로 팩트 테이블에서 관련 행만 추출해요\n③ 인덱스로 걸러진 행만 실제 차원 테이블과 조인해요',

    starSchemaTitle: 'Star 스키마란?',
    starSchemaDesc:
      'Star 스키마는 데이터 웨어하우스에서 가장 흔히 사용되는 구조예요. 중앙의 팩트 테이블(수천만~수십억 행)과 이를 둘러싼 차원 테이블(수백~수천 행)로 구성돼요.\n\n• 팩트 테이블: 측정값(매출액, 수량 등)과 차원 테이블의 외래키를 가진 큰 테이블\n• 차원 테이블: 시간, 고객, 제품, 지역 등 분석 기준이 되는 작은 테이블',

    exampleTitle: '변환 예시 (공식 문서)',
    exampleDesc: '공식 문서 예시예요. sales 팩트 테이블과 times, customers, channels 차원 테이블을 조인하는 Star 쿼리가 변환돼요.',
    beforeSql: `-- 변환 전: Star 쿼리 (sales 팩트 테이블 Full Scan 가능성)
SELECT c.cust_city, t.calendar_quarter_desc,
       SUM(s.amount_sold) sales_amount
FROM   sales s, times t, customers c, channels ch
WHERE  s.time_id     = t.time_id
AND    s.cust_id     = c.cust_id
AND    s.channel_id  = ch.channel_id
AND    c.cust_state_province = 'CA'
AND    ch.channel_desc       = 'Internet'
AND    t.calendar_quarter_desc IN ('1999-01','1999-02')
GROUP BY c.cust_city, t.calendar_quarter_desc;`,
    afterSql: `-- 변환 후: Bitmap 세미조인 조건 추가 (Star Transformation)
SELECT c.cust_city, t.calendar_quarter_desc,
       SUM(s.amount_sold) sales_amount
FROM   sales s, times t, customers c
WHERE  s.time_id = t.time_id
AND    s.cust_id = c.cust_id
AND    c.cust_state_province = 'CA'
AND    t.calendar_quarter_desc IN ('1999-01','1999-02')
AND    s.time_id IN (             -- ← Bitmap 세미조인 조건 추가
         SELECT time_id FROM times
         WHERE  calendar_quarter_desc IN ('1999-01','1999-02'))
AND    s.cust_id IN (             -- ← Bitmap 세미조인 조건 추가
         SELECT cust_id FROM customers
         WHERE  cust_state_province = 'CA')
AND    s.channel_id IN (          -- ← Bitmap 세미조인 조건 추가
         SELECT channel_id FROM channels
         WHERE  channel_desc = 'Internet')
GROUP BY c.cust_city, t.calendar_quarter_desc;`,
    exampleNote:
      '세미조인 조건으로 각 차원의 Bitmap 인덱스를 사용해 팩트 테이블의 해당 행을 식별해요.\nBitmap AND 연산으로 모든 차원 조건을 동시에 만족하는 팩트 행만 추출한 뒤 실제 조인을 수행해요.',

    prereqTitle: '적용 조건',
    prereqDesc: 'Star Transformation이 적용되려면 다음이 필요해요.',
    prereqTable: [
      ['Bitmap 인덱스', '팩트 테이블의 각 조인 컬럼(time_id, cust_id, channel_id 등)에 Bitmap 인덱스가 있어야 해요'],
      ['STAR_TRANSFORMATION_ENABLED', 'true 또는 TEMP_DISABLE로 설정해야 해요 (기본값: false)'],
      ['Star 스키마 구조', '팩트 테이블과 여러 차원 테이블의 조인 구조여야 해요'],
    ],

    paramTitle: 'STAR_TRANSFORMATION_ENABLED 파라미터',
    paramTable: [
      ['TRUE', 'Star Transformation 활성화. 옵티마이저가 팩트·차원 테이블을 자동 식별.'],
      ['FALSE', 'Star Transformation 비활성화 (기본값).'],
      ['TEMP_DISABLE', 'TRUE와 동일하지만 임시 테이블 변환(Cursor-Duration Temporary Table)은 제외.'],
    ],
    paramSql: `-- 세션 수준 활성화
ALTER SESSION SET star_transformation_enabled = TRUE;

-- 시스템 수준 활성화
ALTER SYSTEM SET star_transformation_enabled = TRUE;`,

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Star Transformation 강제
SELECT /*+ STAR_TRANSFORMATION */
       c.cust_city, t.calendar_quarter_desc,
       SUM(s.amount_sold) sales_amount
FROM   sales s, times t, customers c, channels ch
WHERE  s.time_id = t.time_id
AND    s.cust_id = c.cust_id
AND    s.channel_id = ch.channel_id
AND    c.cust_state_province = 'CA'
AND    ch.channel_desc = 'Internet'
AND    t.calendar_quarter_desc IN ('1999-01','1999-02')
GROUP BY c.cust_city, t.calendar_quarter_desc;

-- Star Transformation 방지
SELECT /*+ NO_STAR_TRANSFORMATION */
       c.cust_city, SUM(s.amount_sold)
FROM   sales s, customers c
WHERE  s.cust_id = c.cust_id
GROUP BY c.cust_city;`,

    summaryTitle: 'Star Transformation 핵심 정리',
    summaryItems: [
      'Star 스키마에서 팩트 테이블 Full Scan을 피하기 위해 Bitmap 세미조인 조건을 추가해요.',
      '팩트 테이블 조인 컬럼에 Bitmap 인덱스가 있어야 해요.',
      'STAR_TRANSFORMATION_ENABLED=TRUE 설정이 필요해요 (기본값: FALSE).',
      '힌트: STAR_TRANSFORMATION (강제), NO_STAR_TRANSFORMATION (방지).',
    ],
  },
  en: {
    title: 'Star Transformation',
    subtitle: 'Avoids full table scans of fact tables in star schema queries by adding bitmap semijoin predicates that use bitmap indexes.',

    whatTitle: 'What is Star Transformation?',
    whatDesc:
      'Star Transformation is designed to avoid full table scans of the fact table in a star schema query. It requires bitmap indexes on the fact table join columns.\n\nHow it works:\n① Adds bitmap semijoin predicates for each constraining dimension\n② Uses bitmap AND/OR operations to identify only the relevant fact rows\n③ Joins the filtered fact rows with the dimension tables',

    starSchemaTitle: 'What is a Star Schema?',
    starSchemaDesc:
      "A star schema is the most common structure in data warehouses. It consists of a central fact table (tens of millions to billions of rows) surrounded by smaller dimension tables (hundreds to thousands of rows).\n\n• Fact table: large table holding measurements (revenue, quantity, etc.) and foreign keys to dimension tables\n• Dimension tables: smaller lookup tables representing time, customers, products, regions, and other analysis axes",

    exampleTitle: 'Transformation Example (Oracle Docs)',
    exampleDesc: 'This Oracle documentation example shows a star query joining the sales fact table with three dimension tables being transformed.',
    beforeSql: `-- Before: star query (risk of full scan on sales fact table)
SELECT c.cust_city, t.calendar_quarter_desc,
       SUM(s.amount_sold) sales_amount
FROM   sales s, times t, customers c, channels ch
WHERE  s.time_id     = t.time_id
AND    s.cust_id     = c.cust_id
AND    s.channel_id  = ch.channel_id
AND    c.cust_state_province = 'CA'
AND    ch.channel_desc       = 'Internet'
AND    t.calendar_quarter_desc IN ('1999-01','1999-02')
GROUP BY c.cust_city, t.calendar_quarter_desc;`,
    afterSql: `-- After: bitmap semijoin predicates added (Star Transformation)
SELECT c.cust_city, t.calendar_quarter_desc,
       SUM(s.amount_sold) sales_amount
FROM   sales s, times t, customers c
WHERE  s.time_id = t.time_id
AND    s.cust_id = c.cust_id
AND    c.cust_state_province = 'CA'
AND    t.calendar_quarter_desc IN ('1999-01','1999-02')
AND    s.time_id IN (             -- ← bitmap semijoin predicate added
         SELECT time_id FROM times
         WHERE  calendar_quarter_desc IN ('1999-01','1999-02'))
AND    s.cust_id IN (             -- ← bitmap semijoin predicate added
         SELECT cust_id FROM customers
         WHERE  cust_state_province = 'CA')
AND    s.channel_id IN (          -- ← bitmap semijoin predicate added
         SELECT channel_id FROM channels
         WHERE  channel_desc = 'Internet')
GROUP BY c.cust_city, t.calendar_quarter_desc;`,
    exampleNote:
      "The semijoin predicates use each dimension's bitmap index to identify matching fact table rows.\nBitmap AND combines all dimension filters, isolating only the fact rows that satisfy every condition — before the actual join.",

    prereqTitle: 'Prerequisites',
    prereqDesc: 'Star Transformation requires all of the following.',
    prereqTable: [
      ['Bitmap indexes', 'Bitmap indexes must exist on each join column of the fact table (time_id, cust_id, channel_id, etc.)'],
      ['STAR_TRANSFORMATION_ENABLED', 'Must be set to TRUE or TEMP_DISABLE (default is FALSE)'],
      ['Star schema structure', 'The query must join a fact table with multiple dimension tables'],
    ],

    paramTitle: 'STAR_TRANSFORMATION_ENABLED Parameter',
    paramTable: [
      ['TRUE', 'Enables Star Transformation. The optimizer automatically identifies fact and dimension tables.'],
      ['FALSE', 'Disables Star Transformation (default).'],
      ['TEMP_DISABLE', 'Same as TRUE but excludes the cursor-duration temporary table transformation.'],
    ],
    paramSql: `-- Enable at session level
ALTER SESSION SET star_transformation_enabled = TRUE;

-- Enable at system level
ALTER SYSTEM SET star_transformation_enabled = TRUE;`,

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Star Transformation
SELECT /*+ STAR_TRANSFORMATION */
       c.cust_city, t.calendar_quarter_desc,
       SUM(s.amount_sold) sales_amount
FROM   sales s, times t, customers c, channels ch
WHERE  s.time_id = t.time_id
AND    s.cust_id = c.cust_id
AND    s.channel_id = ch.channel_id
AND    c.cust_state_province = 'CA'
AND    ch.channel_desc = 'Internet'
AND    t.calendar_quarter_desc IN ('1999-01','1999-02')
GROUP BY c.cust_city, t.calendar_quarter_desc;

-- Suppress Star Transformation
SELECT /*+ NO_STAR_TRANSFORMATION */
       c.cust_city, SUM(s.amount_sold)
FROM   sales s, customers c
WHERE  s.cust_id = c.cust_id
GROUP BY c.cust_city;`,

    summaryTitle: 'Star Transformation Key Takeaways',
    summaryItems: [
      'Avoids fact table full scans in star schema queries by adding bitmap semijoin predicates.',
      'Requires bitmap indexes on the fact table join columns.',
      'STAR_TRANSFORMATION_ENABLED must be set to TRUE (default: FALSE).',
      'Hints: STAR_TRANSFORMATION (force), NO_STAR_TRANSFORMATION (suppress).',
    ],
  },
}

export function QtStarTransformationSection() {
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

      <SectionTitle>{t.starSchemaTitle}</SectionTitle>
      <Prose>{t.starSchemaDesc}</Prose>

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

      <SectionTitle>{t.prereqTitle}</SectionTitle>
      <Prose>{t.prereqDesc}</Prose>
      <Table
        headers={[lang === 'ko' ? '조건' : 'Requirement', lang === 'ko' ? '설명' : 'Description']}
        rows={t.prereqTable}
      />

      <Divider />

      <SectionTitle>{t.paramTitle}</SectionTitle>
      <Table
        headers={[lang === 'ko' ? '값' : 'Value', lang === 'ko' ? '설명' : 'Description']}
        rows={t.paramTable}
      />
      <div className="mt-4">
        <SqlBlock sql={t.paramSql} />
      </div>

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
