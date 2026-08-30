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
    title: 'Entity (엔터티)',
    subtitle:
      '데이터베이스에 저장할 가치가 있는 "것(사물·개념·사건)"을 엔터티라고 해요. 현실의 중요한 정보를 담는 그릇이에요.',

    whatTitle: '엔터티란?',
    whatDesc:
      '엔터티(Entity)는 업무에서 관리가 필요한 사람, 사물, 개념, 사건 등을 나타내요.\n\n예를 들면 학교 시스템에서 "학생", "수업", "성적" 같은 것들이 각각 엔터티예요. 엔터티는 두 개 이상의 인스턴스(실제 데이터)를 가져야 하고, 각 인스턴스를 구분할 수 있어야 해요.',

    instanceTitle: '엔터티와 인스턴스',
    instanceDesc:
      '엔터티는 틀(설계)이고, 인스턴스는 실제 데이터예요.\n\n예: "학생" 엔터티의 인스턴스 → 김철수(학번: 2024001), 이영희(학번: 2024002)',

    conditionsTitle: '엔터티가 되려면?',
    conditionsDesc:
      '아무 정보나 엔터티가 되는 건 아니에요. 다음 조건을 모두 만족해야 진짜 엔터티예요.',
    conditions: [
      {
        icon: '📋',
        title: '업무에서 관리 필요',
        desc: '비즈니스에서 실제로 관리·추적·조회할 필요가 있어야 해요.',
        color: 'blue',
      },
      {
        icon: '🔢',
        title: '2개 이상의 인스턴스',
        desc: '실제 데이터가 2개 이상 존재해야 해요. 데이터가 단 하나뿐이면 엔터티가 필요 없어요.',
        color: 'emerald',
      },
      {
        icon: '🏷️',
        title: '속성을 가짐',
        desc: '엔터티는 최소 1개 이상의 속성(Attribute)을 가져야 해요.',
        color: 'violet',
      },
      {
        icon: '🔑',
        title: '유일하게 식별 가능',
        desc: '각 인스턴스를 구별할 수 있는 식별자(Identifier)가 반드시 있어야 해요.',
        color: 'orange',
      },
    ],

    typesTitle: '엔터티의 종류',
    typesHeaders: ['분류 기준', '종류', '설명', '예시'],
    typesRows: [
      ['유형', '유형 엔터티', '물리적으로 존재하는 것', '사람, 물건, 건물'],
      ['유형', '개념 엔터티', '관리가 필요한 개념·정책', '부서, 계획, 규정'],
      ['유형', '사건 엔터티', '업무 수행 시 발생하는 사건', '주문, 결제, 로그인'],
      ['발생 시점', '기본(핵심) 엔터티', '처음부터 존재하는 독립 엔터티', '고객, 상품, 직원'],
      ['발생 시점', '중심 엔터티', '기본 엔터티 간 관계에서 파생', '주문, 계약, 수강'],
      ['발생 시점', '행위 엔터티', '두 엔터티 사이 행위 기록', '주문상세, 수강내역'],
    ],

    exampleTitle: '예시: 쇼핑몰 시스템의 엔터티',
    exampleDesc:
      '온라인 쇼핑몰을 설계한다면 어떤 엔터티들이 필요할까요? 핵심 엔터티를 뽑아봐요.',

    summary:
      '엔터티는 업무에서 관리가 필요한 "것"이에요. 유형·개념·사건으로 나뉘고, 발생 시점에 따라 기본·중심·행위 엔터티로도 구분해요. 좋은 엔터티 설계는 나중에 복잡한 쿼리를 훨씬 쉽게 만들어줘요.',
  },

  en: {
    title: 'Entity',
    subtitle:
      'An entity is a "thing" (object, concept, or event) worth storing in a database — a container for meaningful information.',

    whatTitle: 'What is an Entity?',
    whatDesc:
      'An entity represents a person, object, concept, or event that needs to be managed in your business.\n\nIn a school system, for example, "Student," "Class," and "Grade" are each entities. An entity must have two or more instances (actual data rows) and each instance must be uniquely identifiable.',

    instanceTitle: 'Entity vs. Instance',
    instanceDesc:
      'An entity is the template (design), while an instance is actual data.\n\nExample: instances of the "Student" entity → Kim Cheol-su (ID: 2024001), Lee Young-hee (ID: 2024002)',

    conditionsTitle: 'Requirements for an Entity',
    conditionsDesc:
      'Not every piece of information qualifies as an entity. All of the following conditions must be met.',
    conditions: [
      {
        icon: '📋',
        title: 'Managed by the business',
        desc: 'It must be something the business actually needs to manage, track, or query.',
        color: 'blue',
      },
      {
        icon: '🔢',
        title: 'Two or more instances',
        desc: 'At least two real data records must exist. A single data point doesn\'t need an entity.',
        color: 'emerald',
      },
      {
        icon: '🏷️',
        title: 'Has attributes',
        desc: 'An entity must have at least one attribute that describes it.',
        color: 'violet',
      },
      {
        icon: '🔑',
        title: 'Uniquely identifiable',
        desc: 'Each instance must be distinguishable by an identifier (Primary Key).',
        color: 'orange',
      },
    ],

    typesTitle: 'Types of Entities',
    typesHeaders: ['Classification', 'Type', 'Description', 'Examples'],
    typesRows: [
      ['By nature', 'Tangible entity', 'Physically exists', 'Person, product, building'],
      ['By nature', 'Conceptual entity', 'Managed concept or policy', 'Department, plan, policy'],
      ['By nature', 'Event entity', 'Events that occur during business processes', 'Order, payment, login'],
      ['By origin', 'Fundamental entity', 'Independent, exists from the start', 'Customer, product, employee'],
      ['By origin', 'Central entity', 'Derived from relationships between fundamental entities', 'Order, contract, enrollment'],
      ['By origin', 'Action entity', 'Records actions between two entities', 'Order detail, enrollment history'],
    ],

    exampleTitle: 'Example: Entities in an Online Store',
    exampleDesc:
      'What entities would you need when designing an online shopping mall? Let\'s identify the core ones.',

    summary:
      'An entity is a "thing" that needs to be managed by your business. Entities are classified by nature (tangible, conceptual, event) and by origin (fundamental, central, action). Good entity design makes complex queries much simpler down the road.',
  },
}

// 색은 tokens.css §2c 콘텐츠 색 (테마 스왑). teal 없음.
const E_BLUE = 'var(--color-blue)'
const E_GREEN = 'var(--color-green)'
const E_AMBER = 'var(--color-amber)'
const E_PURPLE = 'var(--color-purple)'

const SHOP_ENTITIES = {
  ko: [
    { name: '고객', attrs: ['고객ID (PK)', '이름', '이메일', '가입일'], color: E_BLUE },
    { name: '상품', attrs: ['상품ID (PK)', '상품명', '가격', '재고수량'], color: E_GREEN },
    { name: '주문', attrs: ['주문ID (PK)', '고객ID (FK)', '주문일시', '총금액'], color: E_AMBER },
    { name: '주문상세', attrs: ['주문상세ID (PK)', '주문ID (FK)', '상품ID (FK)', '수량'], color: E_PURPLE },
  ],
  en: [
    { name: 'Customer', attrs: ['CustomerID (PK)', 'Name', 'Email', 'JoinDate'], color: E_BLUE },
    { name: 'Product', attrs: ['ProductID (PK)', 'Name', 'Price', 'Stock'], color: E_GREEN },
    { name: 'Order', attrs: ['OrderID (PK)', 'CustomerID (FK)', 'OrderDate', 'TotalAmount'], color: E_AMBER },
    { name: 'OrderDetail', attrs: ['DetailID (PK)', 'OrderID (FK)', 'ProductID (FK)', 'Qty'], color: E_PURPLE },
  ],
}

function EntityDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const entities = SHOP_ENTITIES[lang]
  const W = 560
  const CARD_W = 124
  const CARD_GAP = 18
  const totalW = entities.length * CARD_W + (entities.length - 1) * CARD_GAP
  const startX = (W - totalW) / 2
  const HEADER_H = 26
  const ROW_H = 17
  const CARD_H = HEADER_H + entities[0].attrs.length * ROW_H + 12
  const Y = 12
  const R = 6

  return (
    <div className="mb-6 overflow-x-auto rounded-card border border-line bg-rail p-4">
      {/* 한글 엔터티명·속성명이 mono 로 깨지지 않도록 UI 폰트(언어별 스왑). */}
      <svg viewBox={`0 0 ${W} ${CARD_H + 24}`} className="w-full min-w-[440px]" style={{ fontFamily: 'var(--font-sans-active)' }}>
        {entities.map((e, i) => {
          const x = startX + i * (CARD_W + CARD_GAP)
          const hb = Y + HEADER_H
          // header tint with only the top corners rounded (matches the card radius)
          const headerPath =
            `M${x + R},${Y} H${x + CARD_W - R} A${R},${R} 0 0 1 ${x + CARD_W},${Y + R} ` +
            `V${hb} H${x} V${Y + R} A${R},${R} 0 0 1 ${x + R},${Y} Z`
          return (
            <g key={e.name}>
              {/* card — hairline, hue-tinted border (§6.8) */}
              <rect
                x={x} y={Y} width={CARD_W} height={CARD_H} rx={R}
                fill="var(--color-paper)" stroke={e.color} strokeOpacity={0.4} strokeWidth={1}
              />
              {/* header — subtle hue wash + hairline divider */}
              <path d={headerPath} fill={e.color} fillOpacity={0.09} />
              <line x1={x} y1={hb} x2={x + CARD_W} y2={hb} stroke={e.color} strokeOpacity={0.28} strokeWidth={1} />
              {/* entity name */}
              <text x={x + 10} y={Y + 16.5} fontSize={10.5} fontWeight={600} fill={e.color}>
                {e.name}
              </text>
              {/* attributes — PK in the entity hue, FK emphasised, rest muted */}
              {e.attrs.map((attr, ai) => {
                const isPk = attr.includes('(PK)')
                const isFk = attr.includes('(FK)')
                return (
                  <text
                    key={attr}
                    x={x + 10}
                    y={hb + 15 + ai * ROW_H}
                    fontSize={8}
                    fill={isPk ? e.color : isFk ? 'var(--color-ink)' : 'var(--color-ink-2)'}
                    fontWeight={isPk || isFk ? 600 : 400}
                  >
                    {attr}
                  </text>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function EntitySection() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconSitemap size={36} stroke={1.5} className="text-blue" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <div>
        <SectionTitle>{t.instanceTitle}</SectionTitle>
        <Prose>{t.instanceDesc}</Prose>
      </div>

      <Divider />

      <SectionTitle>{t.conditionsTitle}</SectionTitle>
      <Prose>{t.conditionsDesc}</Prose>
      <ConceptGrid items={t.conditions} />

      <Divider />

      <SectionTitle>{t.typesTitle}</SectionTitle>
      <Table headers={t.typesHeaders} rows={t.typesRows} />

      <Divider />

      <SectionTitle>{t.exampleTitle}</SectionTitle>
      <Prose>{t.exampleDesc}</Prose>
      <EntityDiagram lang={lang} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
