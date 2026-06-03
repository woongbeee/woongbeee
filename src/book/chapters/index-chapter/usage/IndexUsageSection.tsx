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
import { IconZoomCode } from '@tabler/icons-react'

// ── Text ──────────────────────────────────────────────────────────────────────

const T = {
  ko: {
    pageTitle: '인덱스를 사용하는 법',
    pageSubtitle:
      '스캔 방법별 힌트 문법, 힌트 작성 방법, 그리고 힌트가 무시되는 흔한 실수까지 알아봐요.',

    hintTitle: '스캔 방법별 힌트',
    hintDesc:
      '옵티마이저(Optimizer)가 실행 계획을 잘못 선택했을 때, SQL 힌트로 스캔 방식을 직접 지정할 수 있어요. ' +
      '힌트는 /*+ ... */ 형태로 SELECT 키워드 바로 뒤에 붙여요.',
    noFullScanHintNote: 'Index Full Scan을 강제하는 힌트는 없어요. Index Full Scan은 옵티마이저가 ORDER BY 제거나 MIN/MAX 처리 등 특정 조건을 판단했을 때 자동으로 선택해요. 직접 유도하고 싶다면 INDEX 힌트를 주되, WHERE 절을 Full Scan이 유리한 형태로 작성하거나 쿼리 구조를 조정해야 해요.',
    hintHeaders: ['힌트', '스캔 방식', '용도'],
    hintRows: [
      ['INDEX(table index)', 'Index Range Scan', '특정 인덱스로 Range Scan을 강제해요'],
      ['INDEX_RS_ASC(table index)', 'Index Range Scan (오름차순)', '오름차순 Range Scan을 명시적으로 지정해요'],
      ['INDEX_RS_DESC(table index)', 'Index Range Scan (내림차순)', '내림차순 Range Scan을 강제해요'],
      ['INDEX_SS(table index)', 'Index Skip Scan', 'Skip Scan을 강제해요'],
      ['INDEX_FFS(table index)', 'Index Fast Full Scan', 'Fast Full Scan을 강제해요'],
      ['INDEX_COMBINE(table index)', 'Bitmap Index Combine', '비트맵 인덱스 결합을 강제해요'],
      ['NO_INDEX(table index)', '인덱스 사용 금지', '특정 인덱스 사용을 막아요'],
      ['FULL(table)', 'Full Table Scan', 'Full Scan을 강제해요'],
    ],

    syntaxTitle: '힌트 작성 방법',
    syntaxDesc: '힌트는 /*+ 힌트1 힌트2 ... */ 형태로 SELECT 바로 뒤에 작성해요. 힌트 블록 하나에 여러 힌트를 함께 쓸 수 있어요.',
    syntaxExamples: [
      {
        badge: '기본 — 인덱스 지정',
        badgeColor: 'violet' as const,
        desc: '테이블명과 인덱스명을 직접 지정해서 Range Scan을 강제해요.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_SALARY) */
       employee_id, salary
FROM   employees e
WHERE  salary BETWEEN 5000 AND 8000;`,
      },
      {
        badge: '여러 힌트 함께 쓰기',
        badgeColor: 'violet' as const,
        desc: '힌트 블록 하나에 여러 힌트를 넣을 때는 공백으로 구분해요. 힌트 사이에 콤마를 쓰면 두 번째 힌트부터 무시돼요.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_DEPT) LEADING(e d) */
       e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
      },
      {
        badge: '인덱스 여러 개 지정',
        badgeColor: 'blue' as const,
        desc: '하나의 힌트 안에서 인자(테이블·인덱스 이름)를 나열할 때는 콤마(,)를 사용해도 돼요.',
        sql: `-- 힌트 인자 안: 콤마 사용 가능
SELECT /*+ INDEX_COMBINE(e IDX_EMP_DEPT, IDX_EMP_JOB) */
       employee_id, department_id, job_id
FROM   employees e
WHERE  department_id = 60
AND    job_id = 'IT_PROG';`,
      },
      {
        badge: 'NO_INDEX — 인덱스 제외',
        badgeColor: 'blue' as const,
        desc: '특정 인덱스를 사용하지 않도록 막을 때 써요. 옵티마이저가 다른 인덱스나 Full Scan을 선택하게 돼요.',
        sql: `SELECT /*+ NO_INDEX(e IDX_EMP_SALARY) */
       employee_id, salary
FROM   employees e
WHERE  salary > 10000;`,
      },
      {
        badge: 'INDEX — 인덱스 미지정',
        badgeColor: 'orange' as const,
        desc: 'INDEX 힌트에 인덱스명을 생략하면 옵티마이저가 해당 테이블의 인덱스 중에서 가장 비용이 낮은 것을 골라요. 어떤 인덱스를 쓸지는 통계 정보에 따라 달라져요.',
        sql: `-- 인덱스명 생략 → 옵티마이저가 최적 인덱스를 선택
SELECT /*+ INDEX(e) */
       employee_id, salary
FROM   employees e
WHERE  salary > 8000;`,
      },
    ],

    cautionTitle: '힌트 작성 시 유의사항',
    cautionDesc: '아래 규칙을 어기면 힌트가 조용히 무시돼요. 오류 메시지가 나지 않아서 발견하기가 어려우니 꼭 기억해두세요.',
    cautions: [
      {
        title: '힌트 사이에는 콤마를 쓰면 안돼요',
        ok: false,
        desc: '힌트와 힌트 사이에 콤마(,)를 넣으면 뒤에 오는 힌트가 전부 무시돼요. 힌트 내부 인자를 나열할 때만 콤마를 써야 해요.',
        badSql: `-- ❌ 잘못된 예 — 힌트 사이 콤마
SELECT /*+ INDEX(e IDX_EMP_DEPT), LEADING(e d) */
       e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;
-- LEADING 힌트가 무시됨`,
        goodSql: `-- ✅ 올바른 예 — 힌트 사이 공백만 사용
SELECT /*+ INDEX(e IDX_EMP_DEPT) LEADING(e d) */
       e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
      },
      {
        title: '테이블을 지정할 때 스키마명을 포함하면 안돼요',
        ok: false,
        desc: '힌트 안에 스키마명(예: HR.employees)을 붙이면 오라클이 테이블을 인식하지 못하고 힌트 전체를 무시해요.',
        badSql: `-- ❌ 잘못된 예 — 스키마명 포함
SELECT /*+ INDEX(HR.e IDX_EMP_SALARY) */
       employee_id, salary
FROM   HR.employees e
WHERE  salary > 8000;
-- 힌트 전체가 무시됨`,
        goodSql: `-- ✅ 올바른 예 — 테이블명(또는 alias)만 사용
SELECT /*+ INDEX(e IDX_EMP_SALARY) */
       employee_id, salary
FROM   HR.employees e
WHERE  salary > 8000;`,
      },
      {
        title: 'FROM 절에 ALIAS가 있으면 힌트에도 반드시 ALIAS를 써야 해요',
        ok: false,
        desc: 'FROM 절에서 테이블에 별칭(alias)을 지정했다면, 힌트 안에서도 반드시 그 alias를 써야 해요. 원래 테이블명을 쓰면 힌트가 무시돼요.',
        badSql: `-- ❌ 잘못된 예 — alias 대신 테이블명 사용
SELECT /*+ INDEX(employees IDX_EMP_SALARY) */
       employee_id, salary
FROM   employees e          -- 'e' alias 지정
WHERE  salary > 8000;
-- alias 'e' 대신 'employees'를 쓰면 힌트가 무시됨`,
        goodSql: `-- ✅ 올바른 예 — FROM 절 alias와 힌트 일치
SELECT /*+ INDEX(e IDX_EMP_SALARY) */
       employee_id, salary
FROM   employees e          -- 'e' alias 지정
WHERE  salary > 8000;`,
      },
    ],
  },
  en: {
    pageTitle: 'How to Use Indexes',
    pageSubtitle:
      'Hints per scan method, hint syntax, and common mistakes that silently cause hints to be ignored.',

    hintTitle: 'Hints by Scan Method',
    hintDesc:
      'When the optimizer picks the wrong execution plan, SQL hints let you specify the scan method directly. ' +
      'Hints are placed inside /*+ ... */ immediately after the SELECT keyword.',
    hintHeaders: ['Hint', 'Scan Method', 'Purpose'],
    hintRows: [
      ['INDEX(table index)', 'Index Range Scan', 'Force Range Scan on a specific index'],
      ['INDEX_RS_ASC(table index)', 'Index Range Scan (ascending)', 'Explicitly request ascending Range Scan'],
      ['INDEX_RS_DESC(table index)', 'Index Range Scan (descending)', 'Force descending Range Scan'],
      ['INDEX_SS(table index)', 'Index Skip Scan', 'Force Skip Scan'],
      ['INDEX_FFS(table index)', 'Index Fast Full Scan', 'Force Fast Full Scan'],
      ['INDEX_COMBINE(table index)', 'Bitmap Index Combine', 'Force bitmap index merge'],
      ['NO_INDEX(table index)', 'Exclude index', 'Prevent Oracle from using a specific index'],
      ['FULL(table)', 'Full Table Scan', 'Force a Full Table Scan'],
    ],
    noFullScanHintNote: 'There is no hint to force an Index Full Scan. Oracle chooses it automatically when beneficial — for example, to avoid a sort for ORDER BY or to resolve MIN/MAX without reading the whole table. To nudge the optimizer toward it, use the INDEX hint and structure the query so a full index traversal is the cheapest path.',

    syntaxTitle: 'Hint Syntax',
    syntaxDesc: 'Hints are written as /*+ hint1 hint2 ... */ immediately after SELECT. Multiple hints can share a single hint block.',
    syntaxExamples: [
      {
        badge: 'Basic — specify an index',
        badgeColor: 'violet' as const,
        desc: 'Name the table and index to force a Range Scan.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_SALARY) */
       employee_id, salary
FROM   employees e
WHERE  salary BETWEEN 5000 AND 8000;`,
      },
      {
        badge: 'Multiple hints together',
        badgeColor: 'violet' as const,
        desc: 'Separate hints with a space inside one hint block. A comma between hints causes all hints after the comma to be silently ignored.',
        sql: `SELECT /*+ INDEX(e IDX_EMP_DEPT) LEADING(e d) */
       e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
      },
      {
        badge: 'Multiple indexes in one hint',
        badgeColor: 'blue' as const,
        desc: 'Inside a single hint, commas are allowed to separate argument values (table names, index names).',
        sql: `-- Inside a hint: commas are OK between arguments
SELECT /*+ INDEX_COMBINE(e IDX_EMP_DEPT, IDX_EMP_JOB) */
       employee_id, department_id, job_id
FROM   employees e
WHERE  department_id = 60
AND    job_id = 'IT_PROG';`,
      },
      {
        badge: 'NO_INDEX — exclude an index',
        badgeColor: 'blue' as const,
        desc: 'Prevent the optimizer from using a specific index. It will choose another index or Full Scan instead.',
        sql: `SELECT /*+ NO_INDEX(e IDX_EMP_SALARY) */
       employee_id, salary
FROM   employees e
WHERE  salary > 10000;`,
      },
      {
        badge: 'INDEX — no index name',
        badgeColor: 'orange' as const,
        desc: 'Omitting the index name tells Oracle to use an index on that table, but leaves the choice of which one to the optimizer. The selected index depends on current statistics.',
        sql: `-- No index name → optimizer picks the cheapest index
SELECT /*+ INDEX(e) */
       employee_id, salary
FROM   employees e
WHERE  salary > 8000;`,
      },
    ],

    cautionTitle: 'Common Pitfalls',
    cautionDesc: 'Violating any of these rules causes the hint to be silently ignored — no error is raised, making them easy to miss.',
    cautions: [
      {
        title: 'No comma between hints',
        ok: false,
        desc: 'A comma between two hints causes every hint after it to be ignored. Commas are only allowed inside a hint to separate its arguments.',
        badSql: `-- ❌ Wrong — comma between hints
SELECT /*+ INDEX(e IDX_EMP_DEPT), LEADING(e d) */
       e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;
-- LEADING hint is silently ignored`,
        goodSql: `-- ✅ Correct — space only between hints
SELECT /*+ INDEX(e IDX_EMP_DEPT) LEADING(e d) */
       e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,
      },
      {
        title: 'Do not include the schema name',
        ok: false,
        desc: "Including a schema prefix (e.g. HR.employees) inside a hint causes Oracle to fail to match the table and the entire hint is ignored.",
        badSql: `-- ❌ Wrong — schema name included
SELECT /*+ INDEX(HR.e IDX_EMP_SALARY) */
       employee_id, salary
FROM   HR.employees e
WHERE  salary > 8000;
-- Entire hint is ignored`,
        goodSql: `-- ✅ Correct — table name or alias only
SELECT /*+ INDEX(e IDX_EMP_SALARY) */
       employee_id, salary
FROM   HR.employees e
WHERE  salary > 8000;`,
      },
      {
        title: 'Use the alias in hints if the table has one',
        ok: false,
        desc: 'If a table is aliased in the FROM clause, the hint must reference the alias — not the original table name. Using the table name when an alias exists causes the hint to be ignored.',
        badSql: `-- ❌ Wrong — table name used instead of alias
SELECT /*+ INDEX(employees IDX_EMP_SALARY) */
       employee_id, salary
FROM   employees e          -- alias 'e' defined
WHERE  salary > 8000;
-- Hint ignored because alias 'e' was not used`,
        goodSql: `-- ✅ Correct — alias matches FROM clause
SELECT /*+ INDEX(e IDX_EMP_SALARY) */
       employee_id, salary
FROM   employees e          -- alias 'e' defined
WHERE  salary > 8000;`,
      },
    ],
  },
}

// ── Caution Card ──────────────────────────────────────────────────────────────

function CautionCard({ caution, lang }: {
  caution: typeof T['ko']['cautions'][number]
  lang: 'ko' | 'en'
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50/40">
      {/* 제목 */}
      <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-3">
        <span className="font-mono text-xs font-bold text-rose-600">✗</span>
        <span className="text-xs font-bold text-rose-700">{caution.title}</span>
      </div>
      {/* 설명 */}
      <p className="px-4 pt-3 pb-1 text-xs leading-relaxed text-muted-foreground">{caution.desc}</p>
      {/* Bad / Good SQL 나란히 */}
      <div className="grid gap-3 p-4 md:grid-cols-2">
        <SqlBlock
          badge={lang === 'ko' ? '잘못된 예' : 'Wrong'}
          badgeColor="rose"
          sql={caution.badSql}
        />
        <SqlBlock
          badge={lang === 'ko' ? '올바른 예' : 'Correct'}
          badgeColor="emerald"
          sql={caution.goodSql}
        />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function IndexUsageSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconZoomCode size={36} stroke={1.5} className="text-violet-500" />}
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
      />

      {/* ── 스캔 방법별 힌트 ── */}
      <SectionTitle>{t.hintTitle}</SectionTitle>
      <Prose>{t.hintDesc}</Prose>
      <Table headers={t.hintHeaders} rows={t.hintRows} />
      <InfoBox variant="note">{t.noFullScanHintNote}</InfoBox>

      <Divider />

      {/* ── 힌트 작성 방법 ── */}
      <SectionTitle>{t.syntaxTitle}</SectionTitle>
      <Prose>{t.syntaxDesc}</Prose>
      <div className="grid gap-3 md:grid-cols-2">
        {t.syntaxExamples.map((ex, i) => (
          <SqlBlock
            key={i}
            badge={ex.badge}
            badgeColor={ex.badgeColor}
            desc={ex.desc}
            sql={ex.sql}
          />
        ))}
      </div>

      <Divider />

      {/* ── 힌트 작성 시 유의사항 ── */}
      <SectionTitle>{t.cautionTitle}</SectionTitle>
      <Prose>{t.cautionDesc}</Prose>
      <div className="space-y-4">
        {t.cautions.map((c, i) => (
          <CautionCard key={i} caution={c} lang={lang} />
        ))}
      </div>

      <div className="mt-8">
        <InfoBox variant="warning">
          {lang === 'ko'
            ? '힌트가 무시되어도 오라클은 오류를 내지 않아요. 실행 계획이 기대와 다르게 나온다면 DBMS_XPLAN.DISPLAY_CURSOR로 힌트가 적용됐는지 먼저 확인해 보세요.'
            : "When a hint is ignored, Oracle raises no error. If the execution plan doesn't match your expectation, check whether the hint was applied using DBMS_XPLAN.DISPLAY_CURSOR."}
        </InfoBox>
      </div>
    </PageContainer>
  )
}
