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
  StepList,
} from '../../shared'

const T = {
  ko: {
    title: '관계와 조인의 이해',
    subtitle:
      '데이터 모델의 관계(Relationship)가 SQL에서 어떻게 조인(JOIN)으로 구현되는지 알아봐요.',

    whatTitle: '관계가 조인이 된다',
    whatDesc:
      '데이터 모델에서 두 엔터티를 연결하는 "관계"는 SQL에서 JOIN으로 표현돼요.\n\n예를 들어 "고객은 여러 주문을 한다(1:N 관계)"를 모델로 설계했다면, 실제 SQL에서는 고객 테이블과 주문 테이블을 고객ID로 JOIN해서 데이터를 합쳐요. 모델 설계가 잘 되어 있어야 JOIN이 명확하고 효율적이에요.',

    fkTitle: 'FK가 JOIN의 연결 고리',
    fkDesc:
      '데이터 모델에서 관계는 FK(외래 키)로 구현되고, 이 FK가 바로 JOIN 조건이 돼요.',
    fkSteps: [
      {
        title: '모델 설계: 관계 정의',
        desc: '"고객(1) ↔ 주문(N)" 관계를 설계하면 주문 테이블에 고객ID(FK)가 생겨요.',
      },
      {
        title: 'DDL: 테이블 생성 시 FK 선언',
        desc: 'CREATE TABLE 구문에서 REFERENCES 키워드로 부모 테이블을 참조해요.',
      },
      {
        title: 'DML: JOIN으로 데이터 결합',
        desc: 'SELECT 시 ON 절에 FK = PK 조건을 써서 두 테이블을 연결해요.',
      },
    ],

    ddlSql: `-- 부모 테이블 (1쪽)
CREATE TABLE customers (
  customer_id  NUMBER       PRIMARY KEY,
  name         VARCHAR2(50) NOT NULL
);

-- 자식 테이블 (N쪽) — FK로 관계 구현
CREATE TABLE orders (
  order_id     NUMBER   PRIMARY KEY,
  customer_id  NUMBER   NOT NULL,
  order_date   DATE     NOT NULL,
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);`,

    joinSql: `-- 1:N 관계를 JOIN으로 조회
SELECT c.name        AS 고객명,
       o.order_id    AS 주문번호,
       o.order_date  AS 주문일자
FROM   customers c
JOIN   orders    o ON o.customer_id = c.customer_id
WHERE  c.customer_id = 1001;`,

    joinTypesTitle: 'JOIN 종류와 관계의 연결',
    joinTypesDesc:
      '어떤 JOIN을 쓰느냐는 관계의 선택성(Optionality)에 따라 달라져요.',
    joinTypesHeaders: ['JOIN 종류', '사용 상황', '관계 모델과의 연결'],
    joinTypesRows: [
      ['INNER JOIN', '양쪽 모두 일치하는 행만 반환', '필수 관계 (양쪽 NOT NULL FK)'],
      ['LEFT OUTER JOIN', '왼쪽 행은 모두, 오른쪽은 일치할 때만', '선택 관계 (오른쪽 엔터티 없어도 됨)'],
      ['RIGHT OUTER JOIN', '오른쪽 행은 모두, 왼쪽은 일치할 때만', '선택 관계 (왼쪽 엔터티 없어도 됨)'],
      ['FULL OUTER JOIN', '양쪽 모두 반환, 없으면 NULL', '양쪽 선택 관계'],
    ],

    mnJoinTitle: 'M:N 관계의 JOIN',
    mnJoinDesc:
      'M:N 관계는 교차 엔터티를 통해 두 번 JOIN해야 해요.',
    mnJoinSql: `-- 학생 ↔ 수강(교차) ↔ 수업 (M:N → 1:N + 1:N)
SELECT s.name        AS 학생명,
       c.class_name  AS 수업명
FROM   students   s
JOIN   enrollments e ON e.student_id = s.student_id
JOIN   classes     c ON c.class_id   = e.class_id;`,

    concepts: [
      {
        icon: '🔗',
        title: 'FK = JOIN 조건',
        desc: '모델의 FK가 SQL JOIN의 ON 조건 그대로 사용돼요.',
        color: 'blue',
      },
      {
        icon: '📐',
        title: '1:N → JOIN 1회',
        desc: '1:N 관계는 두 테이블을 한 번 JOIN하면 돼요.',
        color: 'emerald',
      },
      {
        icon: '🔀',
        title: 'M:N → JOIN 2회',
        desc: 'M:N 관계는 교차 테이블을 통해 두 번 JOIN해야 해요.',
        color: 'orange',
      },
      {
        icon: '❓',
        title: '선택성 → JOIN 종류',
        desc: '관계의 선택/필수 여부가 INNER/OUTER JOIN 선택을 결정해요.',
        color: 'violet',
      },
    ],

    summary:
      '데이터 모델의 관계는 SQL JOIN으로 1:1 대응돼요. FK가 JOIN 조건이 되고, 관계의 선택성이 INNER/OUTER JOIN을 결정해요. 모델을 잘 이해하면 복잡한 JOIN 쿼리도 자연스럽게 작성할 수 있어요.',
  },

  en: {
    title: 'Relationships & Joins',
    subtitle:
      'Learn how relationships in a data model translate directly into SQL JOIN operations.',

    whatTitle: 'Relationships Become JOINs',
    whatDesc:
      'A "relationship" connecting two entities in a data model is expressed as a JOIN in SQL.\n\nFor example, if your model defines "a customer places many orders (1:N relationship)," the SQL query joins the customers and orders tables on CustomerID to combine the data. A well-designed model makes JOINs clear and efficient.',

    fkTitle: 'FK Is the JOIN Link',
    fkDesc:
      'A relationship in the data model is implemented as a foreign key (FK), and that FK becomes the JOIN condition.',
    fkSteps: [
      {
        title: 'Model design: define the relationship',
        desc: 'Designing a "Customer (1) ↔ Order (N)" relationship results in a CustomerID (FK) column in the orders table.',
      },
      {
        title: 'DDL: declare FK when creating the table',
        desc: 'Use the REFERENCES keyword in CREATE TABLE to point to the parent table.',
      },
      {
        title: 'DML: combine data with JOIN',
        desc: 'In SELECT, write FK = PK in the ON clause to link the two tables.',
      },
    ],

    ddlSql: `-- Parent table (1-side)
CREATE TABLE customers (
  customer_id  NUMBER       PRIMARY KEY,
  name         VARCHAR2(50) NOT NULL
);

-- Child table (N-side) — relationship implemented via FK
CREATE TABLE orders (
  order_id     NUMBER   PRIMARY KEY,
  customer_id  NUMBER   NOT NULL,
  order_date   DATE     NOT NULL,
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id)
);`,

    joinSql: `-- Query a 1:N relationship with JOIN
SELECT c.name        AS customer_name,
       o.order_id    AS order_number,
       o.order_date
FROM   customers c
JOIN   orders    o ON o.customer_id = c.customer_id
WHERE  c.customer_id = 1001;`,

    joinTypesTitle: 'JOIN Types and Relationship Optionality',
    joinTypesDesc:
      'The type of JOIN to use depends on the optionality of the relationship.',
    joinTypesHeaders: ['JOIN Type', 'Use Case', 'Connection to the Data Model'],
    joinTypesRows: [
      ['INNER JOIN', 'Returns only rows matching on both sides', 'Mandatory relationship (NOT NULL FK on both sides)'],
      ['LEFT OUTER JOIN', 'All rows from the left; right side only when matched', 'Optional on the right (right entity may not exist)'],
      ['RIGHT OUTER JOIN', 'All rows from the right; left side only when matched', 'Optional on the left (left entity may not exist)'],
      ['FULL OUTER JOIN', 'All rows from both sides; NULL where no match', 'Both sides optional'],
    ],

    mnJoinTitle: 'JOINing an M:N Relationship',
    mnJoinDesc:
      'An M:N relationship requires two JOINs through the junction entity.',
    mnJoinSql: `-- Student ↔ Enrollment (junction) ↔ Class (M:N → 1:N + 1:N)
SELECT s.name        AS student_name,
       c.class_name
FROM   students    s
JOIN   enrollments e ON e.student_id = s.student_id
JOIN   classes     c ON c.class_id   = e.class_id;`,

    concepts: [
      {
        icon: '🔗',
        title: 'FK = JOIN condition',
        desc: "The model's FK is used directly as the ON condition in SQL JOIN.",
        color: 'blue',
      },
      {
        icon: '📐',
        title: '1:N → one JOIN',
        desc: 'A 1:N relationship needs just one JOIN between two tables.',
        color: 'emerald',
      },
      {
        icon: '🔀',
        title: 'M:N → two JOINs',
        desc: 'An M:N relationship requires two JOINs through a junction table.',
        color: 'orange',
      },
      {
        icon: '❓',
        title: 'Optionality → JOIN type',
        desc: 'Whether a relationship is mandatory or optional determines INNER vs. OUTER JOIN.',
        color: 'violet',
      },
    ],

    summary:
      'A data model relationship maps 1:1 to a SQL JOIN. The FK becomes the JOIN condition, and relationship optionality determines whether to use INNER or OUTER JOIN. Understanding your data model makes even complex multi-table JOINs straightforward to write.',
  },
}

export function JoinSection() {
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
      <ConceptGrid items={t.concepts} />

      <Divider />

      <SectionTitle>{t.fkTitle}</SectionTitle>
      <Prose>{t.fkDesc}</Prose>
      <StepList steps={t.fkSteps} />
      <div className="mt-4">
        <SqlBlock sql={t.ddlSql} badge="DDL" badgeColor="blue" desc={lang === 'ko' ? 'FK로 관계 구현' : 'Implementing relationships with FK'} />
      </div>
      <div className="mt-4">
        <SqlBlock sql={t.joinSql} badge="SELECT" badgeColor="emerald" desc={lang === 'ko' ? '1:N 관계 JOIN 조회' : '1:N relationship JOIN query'} />
      </div>

      <Divider />

      <SectionTitle>{t.joinTypesTitle}</SectionTitle>
      <Prose>{t.joinTypesDesc}</Prose>
      <Table headers={t.joinTypesHeaders} rows={t.joinTypesRows} />

      <Divider />

      <SectionTitle>{t.mnJoinTitle}</SectionTitle>
      <Prose>{t.mnJoinDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.mnJoinSql} badge="SELECT" badgeColor="orange" desc={lang === 'ko' ? 'M:N 관계 JOIN 조회' : 'M:N relationship JOIN query'} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
