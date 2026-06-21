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
  StepList,
} from '../shared'

const T = {
  ko: {
    title: '식별자 (Identifier)',
    subtitle:
      '식별자는 엔터티의 각 인스턴스를 유일하게 구별하는 속성이에요. 데이터베이스의 기본 키(Primary Key)에 해당해요.',

    whatTitle: '식별자란?',
    whatDesc:
      '식별자(Identifier)는 엔터티에서 각 인스턴스(행)를 구별할 수 있게 해주는 속성이에요.\n\n예를 들어, "학생" 엔터티에서 동명이인이 있을 수 있기 때문에 이름만으로는 구별이 안 돼요. 이럴 때 "학번" 같은 유일한 식별자가 필요해요. 데이터베이스에서는 기본 키(Primary Key, PK)로 구현돼요.',

    conditionsTitle: '좋은 식별자의 조건',
    conditionsDesc:
      '식별자는 아무거나 쓸 수 없어요. 다음 4가지 조건을 모두 갖춰야 해요.',
    conditions: [
      {
        icon: '🎯',
        title: '유일성',
        desc: '모든 인스턴스에서 식별자 값이 겹치지 않아야 해요.',
        color: 'blue',
      },
      {
        icon: '✅',
        title: '최소성',
        desc: '식별자를 구성하는 속성의 수가 최소여야 해요. 불필요한 속성은 빼야 해요.',
        color: 'emerald',
      },
      {
        icon: '🔒',
        title: '불변성',
        desc: '식별자 값은 한번 정해지면 바뀌지 않아야 해요. 이름이나 이메일보다 전용 번호 칼럼이 좋아요.',
        color: 'violet',
      },
      {
        icon: '📝',
        title: '존재성',
        desc: '식별자는 반드시 값이 있어야 해요. NULL을 허용하면 안 돼요 (NOT NULL).',
        color: 'orange',
      },
    ],

    typesTitle: '식별자의 종류',
    typesHeaders: ['분류 기준', '종류', '설명', '예시'],
    typesRows: [
      ['대표성', '주 식별자 (Primary Key)', '엔터티에서 대표로 사용하는 식별자', '직원번호, 주문ID'],
      ['대표성', '보조 식별자 (Unique Key)', '주 식별자 외에 유일성을 보장하는 속성', '주민등록번호, 이메일'],
      ['속성 수', '단일 식별자', '하나의 속성으로 식별', '직원번호'],
      ['속성 수', '복합 식별자', '두 개 이상의 속성 조합으로 식별', '(주문ID + 상품ID)'],
      ['출처', '내부 식별자', '엔터티 내부 속성으로 구성', '자동생성 일련번호'],
      ['출처', '외부 식별자', '다른 엔터티의 PK를 가져온 FK', '고객ID(고객 엔터티에서 가져옴)'],
      ['인조성', '본질 식별자', '업무에서 자연스럽게 발생', '주민등록번호, ISBN'],
      ['인조성', '인조 식별자', '식별 목적으로 인위적으로 생성', '자동증가 ID (SEQUENCE)'],
    ],

    artificialTitle: '인조 식별자를 사용하는 이유',
    artificialDesc:
      '실무에서는 업무적 속성보다 인조 식별자를 많이 써요. 왜 그럴까요?',
    artificialSteps: [
      {
        title: '본질 식별자의 문제',
        desc: '주민등록번호처럼 실제 의미가 있는 값은 변경될 수 있어요. 또한 보안 이슈(개인정보 노출)도 있어요.',
      },
      {
        title: '인조 식별자의 장점',
        desc: '숫자 하나로 간단하게 표현돼요. 변경될 일이 없고 보안 문제도 없어요. 조인 성능도 더 좋아요 (작은 숫자 타입).',
      },
      {
        title: 'Oracle에서 인조 식별자 구현',
        desc: 'SEQUENCE 객체를 만들거나 GENERATED AS IDENTITY 옵션을 사용해서 자동으로 증가하는 고유 번호를 생성해요.',
      },
    ],

    pkFkTitle: 'PK와 FK의 관계',
    pkFkDesc:
      '관계형 데이터베이스에서 엔터티 사이의 관계는 PK-FK로 연결돼요.',
    pkFkHeaders: ['구분', '기본 키 (PK)', '외래 키 (FK)'],
    pkFkRows: [
      ['역할', '인스턴스를 유일하게 식별', '다른 엔터티의 PK를 참조'],
      ['NULL 허용', '불허 (NOT NULL)', '허용 가능 (선택적 관계일 때)'],
      ['중복', '불허 (UNIQUE)', '허용 (N쪽 엔터티에서)'],
      ['위치', '부모 엔터티 (1쪽)', '자식 엔터티 (N쪽)'],
      ['예시', '고객ID (고객 테이블)', '고객ID (주문 테이블에서 참조)'],
    ],

    summary:
      '식별자는 엔터티의 각 인스턴스를 유일하게 구별하는 핵심 요소예요. 유일성·최소성·불변성·존재성 4가지 조건을 갖춰야 하고, 실무에서는 인조 식별자(자동증가 ID)를 많이 사용해요. PK와 FK의 관계가 테이블 사이의 연결을 담당해요.',
  },

  en: {
    title: 'Identifier',
    subtitle:
      'An identifier uniquely distinguishes each instance of an entity — it corresponds to a Primary Key in a database.',

    whatTitle: 'What is an Identifier?',
    whatDesc:
      "An identifier is an attribute (or set of attributes) that uniquely identifies each instance (row) of an entity.\n\nFor example, in a \"Student\" entity, names can collide — two students can share a name. That's why a unique identifier like \"StudentID\" is required. In a database, this becomes the Primary Key (PK).",

    conditionsTitle: 'Properties of a Good Identifier',
    conditionsDesc:
      'Not every attribute can serve as an identifier. It must satisfy all four of the following conditions.',
    conditions: [
      {
        icon: '🎯',
        title: 'Uniqueness',
        desc: 'The identifier value must not duplicate across any two instances.',
        color: 'blue',
      },
      {
        icon: '✅',
        title: 'Minimality',
        desc: 'The identifier should use the fewest attributes necessary. Remove any redundant ones.',
        color: 'emerald',
      },
      {
        icon: '🔒',
        title: 'Immutability',
        desc: 'Once assigned, an identifier value must never change. A dedicated ID column is safer than a name or email.',
        color: 'violet',
      },
      {
        icon: '📝',
        title: 'Existence',
        desc: "An identifier must always have a value — NULL is not allowed (NOT NULL).",
        color: 'orange',
      },
    ],

    typesTitle: 'Types of Identifiers',
    typesHeaders: ['Classification', 'Type', 'Description', 'Examples'],
    typesRows: [
      ['Representation', 'Primary Identifier (PK)', 'The main identifier for the entity', 'EmployeeID, OrderID'],
      ['Representation', 'Alternate Key (Unique Key)', 'Guarantees uniqueness but is not the PK', 'SSN, Email'],
      ['Attribute count', 'Simple identifier', 'Single attribute identifies each instance', 'EmployeeID'],
      ['Attribute count', 'Composite identifier', 'Combination of two or more attributes', '(OrderID + ProductID)'],
      ['Origin', 'Internal identifier', 'Composed of attributes within the entity', 'Auto-generated serial number'],
      ['Origin', 'External identifier (FK)', 'Imported PK from another entity', 'CustomerID (from Customer entity)'],
      ['Artificiality', 'Natural identifier', 'Arises naturally from the business', 'SSN, ISBN'],
      ['Artificiality', 'Surrogate identifier', 'Artificially created for identification', 'Auto-increment ID (SEQUENCE)'],
    ],

    artificialTitle: 'Why Use Surrogate Identifiers?',
    artificialDesc:
      'In practice, surrogate identifiers are preferred over natural business attributes. Here\'s why.',
    artificialSteps: [
      {
        title: 'Problems with natural identifiers',
        desc: 'Values like SSNs can change over time and raise security concerns (personal data exposure).',
      },
      {
        title: 'Advantages of surrogate identifiers',
        desc: 'A simple number — never changes, no security issues, and better join performance (compact numeric type).',
      },
      {
        title: 'Implementing surrogates in Oracle',
        desc: 'Use a SEQUENCE object or the GENERATED AS IDENTITY column option to produce automatically incrementing unique numbers.',
      },
    ],

    pkFkTitle: 'The PK–FK Relationship',
    pkFkDesc:
      'In a relational database, relationships between entities are enforced through PK–FK links.',
    pkFkHeaders: ['Aspect', 'Primary Key (PK)', 'Foreign Key (FK)'],
    pkFkRows: [
      ['Role', 'Uniquely identifies each instance', "References another entity's PK"],
      ['NULL allowed?', 'No (NOT NULL)', 'Yes (for optional relationships)'],
      ['Duplicates?', 'No (UNIQUE)', 'Yes (on the N-side entity)'],
      ['Location', 'Parent entity (1-side)', 'Child entity (N-side)'],
      ['Example', 'CustomerID (in Customer table)', 'CustomerID (referenced in Order table)'],
    ],

    summary:
      'An identifier uniquely distinguishes every instance of an entity. It must be unique, minimal, immutable, and always present. In practice, surrogate identifiers (auto-increment IDs) are widely used. PK–FK links are the mechanism that connects tables in a relational database.',
  },
}

export function IdentifierSection() {
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

      <SectionTitle>{t.artificialTitle}</SectionTitle>
      <Prose>{t.artificialDesc}</Prose>
      <StepList steps={t.artificialSteps} />

      <Divider />

      <SectionTitle>{t.pkFkTitle}</SectionTitle>
      <Prose>{t.pkFkDesc}</Prose>
      <Table headers={t.pkFkHeaders} rows={t.pkFkRows} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
