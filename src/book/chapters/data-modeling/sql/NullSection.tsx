import { IconSitemap } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  ConceptGrid,
  Divider,
  Table,
  SqlBlock,
} from '../../shared'

const T = {
  ko: {
    title: 'Null 속성의 이해',
    subtitle:
      'NULL은 "값이 없음"을 나타내요. 0도 아니고 공백도 아닌 특별한 상태예요. NULL을 잘 이해해야 쿼리 버그를 막을 수 있어요.',

    whatTitle: 'NULL이란?',
    whatDesc:
      'NULL은 "해당 속성에 값이 존재하지 않는다"는 뜻이에요.\n\n예를 들어 직원 테이블에서 "팩스번호"가 NULL이면 팩스가 없다는 거예요. 빈 문자열(\'\')이나 숫자 0과는 완전히 달라요. NULL은 어떤 값과 비교해도 결과가 UNKNOWN(알 수 없음)이 돼요.',

    nullMathTitle: 'NULL과 연산',
    nullMathDesc:
      'NULL이 포함된 연산은 항상 NULL이 돼요. 이것을 모르면 예상치 못한 쿼리 결과가 나와요.',
    nullMathHeaders: ['연산', '결과', '설명'],
    nullMathRows: [
      ['NULL + 100', 'NULL', '숫자 연산 — NULL이 있으면 결과도 NULL'],
      ['NULL || \'텍스트\'', 'NULL', '문자열 연결 — NULL이 있으면 결과도 NULL'],
      ['NULL = NULL', 'UNKNOWN', '비교 연산 — NULL끼리 비교해도 TRUE가 아님'],
      ['NULL <> 1', 'UNKNOWN', 'NULL은 1이 아니다는 것도 확인 불가'],
      ['NULL IS NULL', 'TRUE', '유일하게 NULL 확인하는 올바른 방법'],
      ['NULL IS NOT NULL', 'FALSE', 'NULL이 아닌지 확인'],
    ],

    whereTitle: 'WHERE절에서 NULL 주의',
    whereDesc:
      'WHERE 조건에서 NULL은 = 연산자로 비교하면 아무것도 걸리지 않아요. 반드시 IS NULL / IS NOT NULL을 써야 해요.',
    wrongSql: `-- ❌ 잘못된 방법 — 결과 없음 (NULL = NULL은 UNKNOWN)
SELECT * FROM employees WHERE fax_number = NULL;

-- ✅ 올바른 방법
SELECT * FROM employees WHERE fax_number IS NULL;
SELECT * FROM employees WHERE fax_number IS NOT NULL;`,

    nvlTitle: 'NULL 처리 함수',
    nvlDesc:
      'NULL을 다른 값으로 대체하거나 처리하는 오라클 내장 함수들이에요.',
    nvlHeaders: ['함수', '문법', '설명', '예시'],
    nvlRows: [
      ['NVL', 'NVL(expr, replace)', 'NULL이면 replace 반환', 'NVL(fax, \'없음\') → \'없음\''],
      ['NVL2', 'NVL2(expr, val1, val2)', 'NULL이면 val2, 아니면 val1', 'NVL2(fax, \'있음\', \'없음\')'],
      ['COALESCE', 'COALESCE(e1, e2, ...)', '첫 번째 non-NULL 반환', 'COALESCE(mobile, office, \'없음\')'],
      ['NULLIF', 'NULLIF(e1, e2)', 'e1=e2이면 NULL, 아니면 e1', 'NULLIF(score, 0) — 0점은 NULL로'],
    ],
    nvlSql: `-- NVL: NULL을 기본값으로 대체
SELECT name,
       NVL(fax_number, '팩스 없음')  AS fax,
       NVL(commission_pct, 0) * salary AS commission
FROM   employees;

-- COALESCE: 여러 연락처 중 첫 번째 유효한 값
SELECT name,
       COALESCE(mobile, office_phone, home_phone, '연락처 없음') AS contact
FROM   employees;`,

    aggregTitle: 'NULL과 집계 함수',
    aggregDesc:
      'COUNT(*)를 제외한 집계 함수는 NULL을 무시해요. 이 때문에 예상과 다른 결과가 나올 수 있어요.',
    aggregSql: `-- 예: 10명 중 commission_pct가 NULL인 직원이 6명이면
SELECT COUNT(*)            AS 전체인원,      -- 10
       COUNT(commission_pct) AS 커미션있는직원, -- 4 (NULL 제외)
       AVG(commission_pct)   AS 평균커미션     -- 4명 평균 (NULL 제외)
FROM   employees;`,

    modelTitle: '데이터 모델에서 NULL 설계',
    modelDesc:
      '속성을 설계할 때 NULL 허용 여부를 명확하게 결정해야 해요.',
    modelConcepts: [
      {
        icon: '🔒',
        title: 'NOT NULL 강제',
        desc: '식별자(PK), 필수 업무 정보, 다른 값 계산의 기준이 되는 속성은 NOT NULL로 설정해요.',
        color: 'blue',
      },
      {
        icon: '❓',
        title: 'NULL 허용',
        desc: '선택적 정보(팩스, 중간이름 등)는 NULL을 허용해도 돼요. 단, 쿼리에서 반드시 처리 로직이 필요해요.',
        color: 'orange',
      },
      {
        icon: '⚠️',
        title: 'NULL 남용 주의',
        desc: 'NULL이 많으면 쿼리가 복잡해지고 실수하기 쉬워요. 꼭 필요한 곳에만 NULL을 허용하세요.',
        color: 'rose',
      },
    ],

    summary:
      'NULL은 "값 없음"을 나타내는 특별한 상태예요. NULL과의 비교는 항상 UNKNOWN이 되므로 IS NULL / IS NOT NULL을 사용해야 해요. 집계 함수는 NULL을 무시하며, NVL·COALESCE 등으로 NULL을 안전하게 처리할 수 있어요.',
  },

  en: {
    title: 'Understanding Null Attributes',
    subtitle:
      "NULL means \"no value exists\" — it's not 0, not an empty string, but a special unknown state. Mastering NULL prevents hard-to-find query bugs.",

    whatTitle: 'What is NULL?',
    whatDesc:
      "NULL means \"this attribute has no value.\"\n\nFor example, if an employee's fax_number is NULL, it means they don't have a fax — not that it's blank or zero. NULL is fundamentally different from '' or 0. Any comparison involving NULL produces UNKNOWN (not TRUE or FALSE).",

    nullMathTitle: 'NULL in Expressions',
    nullMathDesc:
      'Any expression involving NULL evaluates to NULL. Missing this leads to unexpected query results.',
    nullMathHeaders: ['Expression', 'Result', 'Explanation'],
    nullMathRows: [
      ['NULL + 100', 'NULL', 'Arithmetic — NULL in, NULL out'],
      ["NULL || 'text'", 'NULL', 'String concat — NULL in, NULL out'],
      ['NULL = NULL', 'UNKNOWN', 'Comparison — even NULL = NULL is not TRUE'],
      ['NULL <> 1', 'UNKNOWN', 'Cannot confirm NULL is not equal to 1'],
      ['NULL IS NULL', 'TRUE', 'The correct way to test for NULL'],
      ['NULL IS NOT NULL', 'FALSE', 'Test that a value is not NULL'],
    ],

    whereTitle: 'NULL Pitfalls in WHERE Clauses',
    whereDesc:
      'Using = NULL in a WHERE clause matches nothing. Always use IS NULL / IS NOT NULL.',
    wrongSql: `-- ❌ Wrong — returns no rows (NULL = NULL is UNKNOWN)
SELECT * FROM employees WHERE fax_number = NULL;

-- ✅ Correct
SELECT * FROM employees WHERE fax_number IS NULL;
SELECT * FROM employees WHERE fax_number IS NOT NULL;`,

    nvlTitle: 'NULL-Handling Functions',
    nvlDesc:
      "Oracle's built-in functions for substituting or handling NULL values.",
    nvlHeaders: ['Function', 'Syntax', 'Description', 'Example'],
    nvlRows: [
      ['NVL', 'NVL(expr, replace)', 'Returns replace if expr is NULL', "NVL(fax, 'N/A') → 'N/A'"],
      ['NVL2', 'NVL2(expr, val1, val2)', 'Returns val1 if not NULL, val2 if NULL', "NVL2(fax, 'has fax', 'no fax')"],
      ['COALESCE', 'COALESCE(e1, e2, ...)', 'Returns first non-NULL value', "COALESCE(mobile, office, 'none')"],
      ['NULLIF', 'NULLIF(e1, e2)', 'Returns NULL if e1 = e2, else e1', 'NULLIF(score, 0) — treat 0 as NULL'],
    ],
    nvlSql: `-- NVL: replace NULL with a default
SELECT name,
       NVL(fax_number, 'No fax')        AS fax,
       NVL(commission_pct, 0) * salary  AS commission
FROM   employees;

-- COALESCE: first valid contact from multiple columns
SELECT name,
       COALESCE(mobile, office_phone, home_phone, 'No contact') AS contact
FROM   employees;`,

    aggregTitle: 'NULL and Aggregate Functions',
    aggregDesc:
      'Aggregate functions (except COUNT(*)) ignore NULL values. This can produce surprising results.',
    aggregSql: `-- If 6 of 10 employees have NULL commission_pct:
SELECT COUNT(*)              AS total_employees,  -- 10
       COUNT(commission_pct) AS with_commission,  -- 4 (NULLs excluded)
       AVG(commission_pct)   AS avg_commission    -- average of 4 rows only
FROM   employees;`,

    modelTitle: 'Designing NULL in the Data Model',
    modelDesc:
      'Decide clearly whether each attribute allows NULL during the design phase.',
    modelConcepts: [
      {
        icon: '🔒',
        title: 'Enforce NOT NULL',
        desc: 'Primary keys, mandatory business data, and values used as a basis for other calculations should be NOT NULL.',
        color: 'blue',
      },
      {
        icon: '❓',
        title: 'Allow NULL selectively',
        desc: 'Optional information (fax number, middle name, etc.) may allow NULL — but queries must always handle it explicitly.',
        color: 'orange',
      },
      {
        icon: '⚠️',
        title: "Don't overuse NULL",
        desc: 'Excessive NULLs make queries complex and error-prone. Allow NULL only where genuinely necessary.',
        color: 'rose',
      },
    ],

    summary:
      "NULL is a special state meaning \"no value.\" Comparisons with NULL always return UNKNOWN, so always use IS NULL / IS NOT NULL. Aggregate functions ignore NULLs, and NVL / COALESCE let you handle NULLs safely in queries.",
  },
}

export function NullSection() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconSitemap size={36} stroke={1.5} className="text-indigo-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.nullMathTitle}</SectionTitle>
      <Prose>{t.nullMathDesc}</Prose>
      <Table headers={t.nullMathHeaders} rows={t.nullMathRows} />

      <Divider />

      <SectionTitle>{t.whereTitle}</SectionTitle>
      <Prose>{t.whereDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.wrongSql} />
      </div>

      <Divider />

      <SectionTitle>{t.nvlTitle}</SectionTitle>
      <Prose>{t.nvlDesc}</Prose>
      <Table headers={t.nvlHeaders} rows={t.nvlRows} />
      <div className="mt-4">
        <SqlBlock sql={t.nvlSql} badge="SELECT" badgeColor="blue" desc={lang === 'ko' ? 'NULL 처리 함수 활용 예시' : 'NULL-handling function examples'} />
      </div>

      <Divider />

      <SectionTitle>{t.aggregTitle}</SectionTitle>
      <Prose>{t.aggregDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.aggregSql} badge="SELECT" badgeColor="orange" desc={lang === 'ko' ? 'NULL과 집계 함수 동작 차이' : 'How aggregates handle NULL'} />
      </div>

      <Divider />

      <SectionTitle>{t.modelTitle}</SectionTitle>
      <Prose>{t.modelDesc}</Prose>
      <ConceptGrid items={t.modelConcepts} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
