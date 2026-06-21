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
} from '../shared'

const T = {
  ko: {
    title: '속성 (Attribute)',
    subtitle:
      '속성은 엔터티가 가지는 특성이나 성질이에요. 엔터티를 더 자세히 설명해주는 세부 정보들이에요.',

    whatTitle: '속성이란?',
    whatDesc:
      '속성(Attribute)은 엔터티의 특성을 나타내는 세부 정보예요.\n\n예를 들어 "직원" 엔터티라면 — 직원번호, 이름, 부서, 연봉, 입사일 — 이런 것들이 모두 속성이에요. 데이터베이스에서는 테이블의 컬럼(Column)이 속성에 해당해요.',

    conditionsTitle: '속성의 조건',
    conditionsDesc:
      '아무 정보나 속성이 되는 건 아니에요. 속성이 되려면 이런 조건을 갖춰야 해요.',
    conditions: [
      {
        icon: '📌',
        title: '업무와 관련된 정보',
        desc: '비즈니스에서 실제로 필요한 정보만 속성으로 정의해요.',
        color: 'blue',
      },
      {
        icon: '⚛️',
        title: '더 이상 분리되지 않는 단위',
        desc: '속성은 더 이상 나눌 수 없는 원자적인 값이어야 해요. "주소"를 "시/도", "구/군", "상세주소"로 나눌 수 있다면 각각 별도 속성이 되어야 해요.',
        color: 'emerald',
      },
      {
        icon: '1️⃣',
        title: '단일 값 원칙',
        desc: '하나의 인스턴스에 대해 속성은 하나의 값만 가져야 해요. 여러 값이 필요하다면 별도의 엔터티로 분리해야 해요.',
        color: 'orange',
      },
    ],

    typesTitle: '속성의 종류',
    typesHeaders: ['분류 기준', '종류', '설명', '예시'],
    typesRows: [
      ['특성', '기본 속성', '업무 분석으로 도출된 원래 속성', '이름, 생년월일, 가격'],
      ['특성', '설계 속성', '설계 시 업무 규칙·편의를 위해 추가한 속성', '코드, 일련번호, 플래그'],
      ['특성', '파생 속성', '다른 속성 값에서 계산·추출된 속성', '나이(생년월일 → 계산), 합계금액'],
      ['개수', '단일 값 속성', '하나의 값만 가짐', '주민등록번호, 직원번호'],
      ['개수', '다중 값 속성', '여러 값을 가질 수 있음 (별도 엔터티 분리 필요)', '전화번호(집·회사·휴대폰)'],
      ['분해', '단순 속성', '더 이상 분해할 수 없음', '나이, 가격'],
      ['분해', '복합 속성', '여러 속성으로 분해 가능', '주소(시/도+구/군+상세)'],
    ],

    nullTitle: 'NULL과 속성',
    nullDesc:
      'NULL은 "값이 없음"을 나타내요. 속성 설계 시 NULL 허용 여부를 신중하게 결정해야 해요.\n\n꼭 필요한 정보(예: 직원번호, 이름)는 NOT NULL로 설정해서 빈 값이 들어오는 걸 막아요. 선택적인 정보(예: 중간이름, 팩스번호)는 NULL을 허용할 수 있어요.',

    derivedTitle: '파생 속성 주의사항',
    derivedDesc:
      '파생 속성은 다른 속성에서 계산되는 값이에요. 저장할지 말지를 잘 결정해야 해요.',
    derivedConcepts: [
      {
        icon: '💾',
        title: '저장하는 경우',
        desc: '매번 계산하는 비용이 크거나 과거 시점 값을 보존해야 할 때. 예: 주문 당시 금액 스냅샷.',
        color: 'blue',
      },
      {
        icon: '🔄',
        title: '저장하지 않는 경우',
        desc: '계산이 단순하고 항상 최신 값이 필요할 때. 예: 나이(생년월일로 실시간 계산).',
        color: 'emerald',
      },
    ],

    summary:
      '속성은 엔터티를 설명하는 세부 정보예요. 기본·설계·파생 속성으로 나뉘고, 원자성(더 이상 나눌 수 없는 값)과 단일 값 원칙을 지켜야 해요. 속성 설계가 잘못되면 나중에 데이터 품질 문제가 생길 수 있어요.',
  },

  en: {
    title: 'Attribute',
    subtitle:
      'An attribute is a characteristic or property of an entity — the detailed information that describes it.',

    whatTitle: 'What is an Attribute?',
    whatDesc:
      'An attribute represents a specific characteristic of an entity.\n\nFor the "Employee" entity, for example — EmployeeID, Name, Department, Salary, HireDate — these are all attributes. In a database, attributes correspond to table columns.',

    conditionsTitle: 'Requirements for an Attribute',
    conditionsDesc:
      'Not every piece of information qualifies as an attribute. It must meet these criteria.',
    conditions: [
      {
        icon: '📌',
        title: 'Business-relevant information',
        desc: 'Only define information the business actually needs as an attribute.',
        color: 'blue',
      },
      {
        icon: '⚛️',
        title: 'Atomic unit',
        desc: 'An attribute must be an indivisible atomic value. If "Address" can be split into "City," "District," and "Street," each should be a separate attribute.',
        color: 'emerald',
      },
      {
        icon: '1️⃣',
        title: 'Single-value principle',
        desc: 'An attribute should hold only one value per instance. If multiple values are needed, create a separate entity.',
        color: 'orange',
      },
    ],

    typesTitle: 'Types of Attributes',
    typesHeaders: ['Classification', 'Type', 'Description', 'Examples'],
    typesRows: [
      ['By nature', 'Basic attribute', 'Original attributes derived from business analysis', 'Name, date of birth, price'],
      ['By nature', 'Designed attribute', 'Added during design for rules or convenience', 'Code, serial number, flag'],
      ['By nature', 'Derived attribute', 'Calculated or extracted from other attributes', 'Age (from birth date), total amount'],
      ['By count', 'Single-value attribute', 'Holds exactly one value', 'Social security number, employee ID'],
      ['By count', 'Multi-value attribute', 'Can hold multiple values (requires separate entity)', 'Phone numbers (home/work/mobile)'],
      ['By decomposition', 'Simple attribute', 'Cannot be decomposed further', 'Age, price'],
      ['By decomposition', 'Composite attribute', 'Can be decomposed into sub-attributes', 'Address (city + district + street)'],
    ],

    nullTitle: 'NULL and Attributes',
    nullDesc:
      'NULL means "no value." Deciding whether to allow NULL must be done carefully during attribute design.\n\nMandatory information (e.g., EmployeeID, Name) should be NOT NULL to prevent blank values. Optional information (e.g., middle name, fax number) may allow NULL.',

    derivedTitle: 'Watch Out for Derived Attributes',
    derivedDesc:
      'A derived attribute is computed from other attributes. Carefully decide whether to store it or compute it on the fly.',
    derivedConcepts: [
      {
        icon: '💾',
        title: 'Store it',
        desc: 'When recalculation is expensive or you need to preserve a historical snapshot. E.g., order amount at time of purchase.',
        color: 'blue',
      },
      {
        icon: '🔄',
        title: "Don't store it",
        desc: 'When the calculation is simple and you always need the current value. E.g., age (computed from birth date in real time).',
        color: 'emerald',
      },
    ],

    summary:
      "Attributes are the detailed information that describes an entity. They're classified as basic, designed, or derived — and must follow atomicity (indivisible values) and the single-value principle. Poor attribute design leads to data quality problems later.",
  },
}

export function AttributeSection() {
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

      <SectionTitle>{t.conditionsTitle}</SectionTitle>
      <Prose>{t.conditionsDesc}</Prose>
      <ConceptGrid items={t.conditions} />

      <Divider />

      <SectionTitle>{t.typesTitle}</SectionTitle>
      <Table headers={t.typesHeaders} rows={t.typesRows} />

      <Divider />

      <SectionTitle>{t.nullTitle}</SectionTitle>
      <Prose>{t.nullDesc}</Prose>

      <Divider />

      <SectionTitle>{t.derivedTitle}</SectionTitle>
      <Prose>{t.derivedDesc}</Prose>
      <ConceptGrid items={t.derivedConcepts} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
