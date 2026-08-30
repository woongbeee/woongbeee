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
    title: '관계 (Relationship)',
    subtitle:
      '관계는 두 엔터티 사이의 연결이에요. 관계명, 관계 차수, 관계 선택사양 세 가지로 관계를 완전하게 정의할 수 있어요.',

    whatTitle: '관계란?',
    whatDesc:
      '관계(Relationship)는 두 엔터티가 어떻게 연결되어 있는지를 나타내요.\n\n예를 들어 "고객"과 "주문" 엔터티는 "고객은 주문을 한다"는 관계로 연결돼요. 데이터베이스에서는 외래 키(Foreign Key)로 구현돼요.',

    threeTitle: '관계를 정의하는 세 가지 요소',
    threeDesc: '하나의 관계를 완전하게 표현하려면 관계명, 관계 차수, 관계 선택사양을 모두 정의해야 해요.',
    three: [
      { icon: '🏷️', title: '관계명 (Relationship Name)', desc: '두 엔터티 사이의 관계가 어떤 행위·상태인지 이름을 붙여요.', color: 'blue' },
      { icon: '🔢', title: '관계 차수 (Cardinality)', desc: '두 엔터티 사이에 얼마나 많은 인스턴스가 연결되는지를 나타내요. 1:1, 1:N, M:N이에요.', color: 'emerald' },
      { icon: '❓', title: '관계 선택사양 (Optionality)', desc: '관계 참여가 필수인지 선택인지를 나타내요.', color: 'orange' },
    ],

    // 관계명
    nameTitle: '관계명 (Relationship Name)',
    nameDesc:
      '관계명은 두 엔터티 사이의 관계가 업무적으로 어떤 의미인지를 동사(구)로 표현해요.\n\n관계명은 방향이 있어요. "고객 → 주문" 방향에서는 "을 한다(places)", "주문 → 고객" 방향에서는 "에 의해 생성된다(is placed by)"처럼 양쪽 모두 이름을 붙일 수 있어요.',
    nameRules: [
      { title: '능동적 동사 사용', desc: '"포함한다", "소속된다", "생성한다"처럼 관계의 행위를 명확히 드러내는 동사를 써요.' },
      { title: '현재형으로 작성', desc: '과거형·미래형이 아닌 현재형으로 써요. "주문했다" ❌ → "주문한다" ✅' },
      { title: '두 방향 모두 읽힐 것', desc: '관계는 양방향이에요. "고객은 주문을 한다" / "주문은 고객에 의해 된다" 모두 자연스러워야 해요.' },
    ],
    nameNotationLabel: 'IE / 바커 표기법 — 관계명 표현 위치',
    nameNotationDesc: 'IE 표기법은 관계선 위에 관계명을 표기하고, 바커(Barker) 표기법은 관계선 양쪽에 동사구를 붙여요.',

    // 관계 차수
    cardTitle: '관계 차수 (Cardinality)',
    cardDesc:
      '관계 차수는 한 엔터티의 인스턴스가 반대편 엔터티의 인스턴스 몇 개와 연결되는지를 나타내요.',
    cardHeaders: ['차수', '의미', '예시'],
    cardRows: [
      ['1:1 (일대일)', '한 인스턴스 ↔ 정확히 한 인스턴스', '직원 ↔ 주차자리'],
      ['1:N (일대다)', '한 인스턴스 → 여러 인스턴스', '고객 → 여러 주문'],
      ['M:N (다대다)', '여러 인스턴스 ↔ 여러 인스턴스', '학생 ↔ 수업'],
    ],
    cardNotationLabel: 'IE / 바커 표기법 — 관계 차수 기호',
    cardNotationDesc:
      'IE 표기법은 "까마귀발(Crow\'s Foot)" 기호로 다(多) 쪽을 표현하고, 바커 표기법은 관계선 끝에 한 줄(1) 또는 두 줄 형태로 표기해요.',

    // 관계 선택사양
    optTitle: '관계 선택사양 (Optionality)',
    optDesc:
      '관계 선택사양은 관계에 참여하는 것이 필수인지(Mandatory), 선택인지(Optional)를 나타내요.\n\n예를 들어 "고객은 주문을 반드시 해야 하는가?" — 아니에요, 고객이 존재하더라도 주문은 없을 수 있어요. 이 경우 고객 입장에서 주문 참여는 선택이에요.',
    optHeaders: ['구분', '의미', 'IE 표기', '바커 표기'],
    optRows: [
      ['필수 (Mandatory)', '반드시 관계에 참여해야 함', '수직선(|)', '실선'],
      ['선택 (Optional)', '관계에 참여하지 않아도 됨', '원(○)', '점선'],
    ],
    optNotationLabel: 'IE / 바커 표기법 — 선택사양 기호 비교',
    optNotationDesc: 'IE 표기법과 바커 표기법의 선택사양 표현 방식을 나란히 비교해봐요.',

    // 두 표기법 종합 비교
    compareTitle: 'IE 표기법 vs 바커 표기법 종합 비교',
    compareHeaders: ['항목', 'IE 표기법', '바커 표기법'],
    compareRows: [
      ['개발 주체', 'Information Engineering', 'Richard Barker (Oracle CASE*Method)'],
      ['엔터티 모양', '사각형', '사각형 (모서리 둥글게)'],
      ['다(多) 기호', '까마귀발 (⁼<)', '관계선 끝 두 줄'],
      ['필수 기호', '수직선 |', '실선'],
      ['선택 기호', '원 ○', '점선'],
      ['관계명 위치', '관계선 위/아래', '관계선 양쪽 동사구'],
      ['국내 사용', 'ERwin, DA# 등에서 많이 사용', 'Oracle 방법론 기반 프로젝트'],
    ],

    // M:N
    mnTitle: 'M:N 관계 해결하기',
    mnDesc:
      'M:N 관계는 데이터베이스에서 직접 구현할 수 없어요. 교차 엔터티(Association Entity)를 추가해서 두 개의 1:N 관계로 바꿔야 해요.',
    mnSteps: [
      { title: '문제: 학생 ↔ 수업 (M:N)', desc: '한 학생은 여러 수업을 듣고, 한 수업에는 여러 학생이 있어요.' },
      { title: '해결: 교차 엔터티 "수강" 추가', desc: '"수강" 엔터티를 만들어 학생ID(FK)와 수업ID(FK)를 함께 저장해요. 학생↔수강(1:N)과 수업↔수강(1:N)으로 분리돼요.' },
    ],

    // 식별/비식별
    identifyTitle: '식별 관계 vs 비식별 관계',
    identifyDesc: '관계는 자식 엔터티의 PK 구성에 따라 두 가지로 나뉘어요.',
    identifyHeaders: ['구분', '식별 관계', '비식별 관계'],
    identifyRows: [
      ['부모 PK → 자식 PK 포함 여부', '포함 (자식 PK의 일부)', '포함 안 함 (자식 FK만)'],
      ['자식 독립 존재 여부', '부모 없이 존재 불가', '부모 없이 존재 가능'],
      ['IE 표기', '실선', '점선'],
      ['바커 표기', '관계선 위 UID bar(#)', '일반 관계선'],
      ['예시', '주문상세(주문ID+상세ID가 PK)', '직원(부서ID는 FK일 뿐)'],
    ],

    summary:
      '관계는 관계명(행위를 나타내는 동사), 관계 차수(1:1 / 1:N / M:N), 관계 선택사양(필수 / 선택) 세 가지로 완전하게 정의돼요. IE 표기법은 까마귀발·원·수직선으로, 바커 표기법은 실선·점선으로 이를 표현해요.',
  },

  en: {
    title: 'Relationship',
    subtitle:
      'A relationship is a connection between two entities. It is fully defined by three elements: relationship name, cardinality, and optionality.',

    whatTitle: 'What is a Relationship?',
    whatDesc:
      'A relationship describes how two entities are connected.\n\nFor example, "Customer" and "Order" are linked by the relationship "a customer places an order." In a database, relationships are implemented using foreign keys (FK).',

    threeTitle: 'Three Elements That Define a Relationship',
    threeDesc: 'To fully describe a relationship, you must define all three: name, cardinality, and optionality.',
    three: [
      { icon: '🏷️', title: 'Relationship Name', desc: 'A verb phrase describing what the two entities do with each other.', color: 'blue' },
      { icon: '🔢', title: 'Cardinality', desc: 'How many instances on each side participate: 1:1, 1:N, or M:N.', color: 'emerald' },
      { icon: '❓', title: 'Optionality', desc: 'Whether participation in the relationship is mandatory or optional.', color: 'orange' },
    ],

    nameTitle: 'Relationship Name',
    nameDesc:
      'A relationship name is a verb (phrase) expressing the business meaning of the connection.\n\nNames are directional. From Customer → Order: "places"; from Order → Customer: "is placed by." Both directions can have their own name.',
    nameRules: [
      { title: 'Use active verbs', desc: 'Use verbs that clearly express the action: "contains," "belongs to," "creates."' },
      { title: 'Write in present tense', desc: 'Use present tense, not past or future. "ordered" ❌ → "orders" ✅' },
      { title: 'Readable in both directions', desc: 'The relationship must read naturally both ways: "Customer places Order" / "Order is placed by Customer."' },
    ],
    nameNotationLabel: 'IE / Barker Notation — Where to Place the Relationship Name',
    nameNotationDesc: 'IE notation labels the relationship name above the line. Barker notation attaches verb phrases on both sides of the line.',

    cardTitle: 'Cardinality',
    cardDesc:
      'Cardinality defines how many instances of one entity can be associated with instances of the other.',
    cardHeaders: ['Cardinality', 'Meaning', 'Example'],
    cardRows: [
      ['1:1 (One-to-One)', 'One instance ↔ exactly one instance', 'Employee ↔ Parking spot'],
      ['1:N (One-to-Many)', 'One instance → many instances', 'Customer → many Orders'],
      ['M:N (Many-to-Many)', 'Many instances ↔ many instances', 'Student ↔ Class'],
    ],
    cardNotationLabel: 'IE / Barker Notation — Cardinality Symbols',
    cardNotationDesc:
      "IE notation uses the \"Crow's Foot\" symbol for the many side. Barker notation uses a single or double stroke at the end of the relationship line.",

    optTitle: 'Optionality',
    optDesc:
      'Optionality indicates whether participation in a relationship is mandatory or optional.\n\nFor example: "Must a customer always have an order?" — No. A customer can exist without any orders. So from the customer\'s side, participation in the order relationship is optional.',
    optHeaders: ['Type', 'Meaning', 'IE Notation', 'Barker Notation'],
    optRows: [
      ['Mandatory', 'Must participate in the relationship', 'Vertical bar ( | )', 'Solid line'],
      ['Optional', 'May exist without participating', 'Circle ( ○ )', 'Dashed line'],
    ],
    optNotationLabel: 'IE / Barker Notation — Optionality Symbol Comparison',
    optNotationDesc: "Compare how IE and Barker notation represent mandatory vs. optional participation side by side.",

    compareTitle: 'IE Notation vs. Barker Notation — Full Comparison',
    compareHeaders: ['Aspect', 'IE Notation', 'Barker Notation'],
    compareRows: [
      ['Origin', 'Information Engineering', 'Richard Barker (Oracle CASE*Method)'],
      ['Entity shape', 'Rectangle', 'Rounded rectangle'],
      ['Many symbol', "Crow's foot (⁼<)", 'Double stroke at line end'],
      ['Mandatory symbol', 'Vertical bar |', 'Solid line'],
      ['Optional symbol', 'Circle ○', 'Dashed line'],
      ['Name placement', 'Above / below the line', 'Verb phrases on both sides'],
      ['Common usage', 'ERwin, DA# and similar tools', 'Oracle CASE*Method projects'],
    ],

    mnTitle: 'Resolving M:N Relationships',
    mnDesc:
      'M:N relationships cannot be directly implemented in a database. A junction entity (Association Entity) must be added to split it into two 1:N relationships.',
    mnSteps: [
      { title: 'Problem: Student ↔ Class (M:N)', desc: 'A student takes many classes; a class has many students.' },
      { title: 'Solution: Add "Enrollment" junction entity', desc: 'An Enrollment entity stores StudentID (FK) and ClassID (FK), splitting the M:N into Student↔Enrollment (1:N) + Class↔Enrollment (1:N).' },
    ],

    identifyTitle: 'Identifying vs. Non-Identifying Relationships',
    identifyDesc: 'Relationships are classified based on whether the parent PK becomes part of the child PK.',
    identifyHeaders: ['Aspect', 'Identifying', 'Non-Identifying'],
    identifyRows: [
      ['Parent PK → part of child PK?', 'Yes', 'No (FK only)'],
      ['Child exists without parent?', 'No', 'Yes'],
      ['IE notation', 'Solid line', 'Dashed line'],
      ['Barker notation', 'UID bar (#) on line', 'Regular relationship line'],
      ['Example', 'OrderDetail (OrderID + DetailID = PK)', 'Employee (DeptID is just a FK)'],
    ],

    summary:
      'A relationship is fully defined by three elements: name (verb phrase), cardinality (1:1 / 1:N / M:N), and optionality (mandatory / optional). IE notation uses crow\'s foot, circle, and vertical bar symbols; Barker notation uses solid and dashed lines.',
  },
}

// ─── SVG 다이어그램 ─────────────────────────────────────────────────────────
//
// 레이아웃 원칙:
//   EW=100  엔터티 박스 너비
//   EH=34   엔터티 박스 높이
//   SYM=18  기호 영역(엔터티 경계 ↔ 선 끝 사이 여백)
//   E1x=60  왼쪽 엔터티 x (레이블 열 60px 이후)
//   E2x=W-EW-60  오른쪽 엔터티 x
//   lineL = E1x+EW+SYM  (왼쪽 기호 오른쪽 끝 = 선 왼쪽 시작)
//   lineR = E2x-SYM     (선 오른쪽 끝 = 오른쪽 기호 왼쪽 시작)
//
// 기호 좌표:
//   왼쪽 기호는 [E1x+EW .. E1x+EW+SYM] 구간 중앙에 그림
//   오른쪽 기호는 [E2x-SYM .. E2x] 구간 중앙에 그림
//
// ── 관계명 다이어그램 ─────────────────────────────────────────────────────

function RelationshipNameDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const W = 560; const EW = 100; const EH = 34; const IE_R = 2; const BK_R = 8
  const E1x = 56; const E2x = W - EW - 16
  const lineL = E1x + EW; const lineR = E2x
  const midX = (lineL + lineR) / 2

  // IE 행 y, 바커 행 y
  const ieY = 20; const barY = 100
  const ieLineY = ieY + EH / 2
  const barLineY = barY + EH / 2

  const C_IE = 'var(--color-blue)'; const C_BK = 'var(--color-purple)'
  const lA = isKo ? '고객' : 'Customer'
  const lB = isKo ? '주문' : 'Order'
  const nameForward  = isKo ? '주문을 한다' : 'places'
  const nameBackward = isKo ? '에 의해 됨' : 'is placed by'

  return (
    <svg viewBox={`0 0 ${W} 175`} className="w-full" style={{ fontFamily: 'var(--font-sans-active)' }}>
      {/* ── IE 행 ── */}
      <text x={4} y={ieLineY + 4} fontSize={9} fontWeight={600} fill={C_IE}>IE</text>
      {/* 왼쪽 엔터티 */}
      <rect x={E1x} y={ieY} width={EW} height={EH} rx={IE_R} fill={C_IE} fillOpacity={0.08} stroke={C_IE} strokeOpacity={0.5} strokeWidth={1} />
      <text x={E1x + EW/2} y={ieLineY + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={C_IE}>{lA}</text>
      {/* 관계선 */}
      <line x1={lineL} y1={ieLineY} x2={lineR} y2={ieLineY} stroke={C_IE} strokeWidth={1.5} />
      {/* 관계명 (선 위) */}
      <text x={midX} y={ieLineY - 7} textAnchor="middle" fontSize={10} fill={C_IE}>{nameForward}</text>
      {/* 오른쪽 엔터티 */}
      <rect x={E2x} y={ieY} width={EW} height={EH} rx={IE_R} fill={C_IE} fillOpacity={0.08} stroke={C_IE} strokeOpacity={0.5} strokeWidth={1} />
      <text x={E2x + EW/2} y={ieLineY + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={C_IE}>{lB}</text>

      {/* ── 바커 행 ── */}
      <text x={4} y={barLineY + 4} fontSize={9} fontWeight={600} fill={C_BK}>{isKo ? '바커' : 'Barker'}</text>
      {/* 왼쪽 엔터티 */}
      <rect x={E1x} y={barY} width={EW} height={EH} rx={BK_R} fill={C_BK} fillOpacity={0.08} stroke={C_BK} strokeOpacity={0.5} strokeWidth={1} />
      <text x={E1x + EW/2} y={barLineY + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={C_BK}>{lA}</text>
      {/* 관계선 */}
      <line x1={lineL} y1={barLineY} x2={lineR} y2={barLineY} stroke={C_BK} strokeWidth={1.5} />
      {/* 바커: 능동 동사(선 위 왼쪽), 수동 동사(선 아래 오른쪽) */}
      <text x={midX - 30} y={barLineY - 7} textAnchor="middle" fontSize={10} fill={C_BK}>{nameForward}</text>
      <text x={midX + 30} y={barLineY + 17} textAnchor="middle" fontSize={10} fill={C_BK}>{nameBackward}</text>
      {/* 오른쪽 엔터티 */}
      <rect x={E2x} y={barY} width={EW} height={EH} rx={BK_R} fill={C_BK} fillOpacity={0.08} stroke={C_BK} strokeOpacity={0.5} strokeWidth={1} />
      <text x={E2x + EW/2} y={barLineY + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={C_BK}>{lB}</text>

      {/* 범례 */}
      <rect x={E1x} y={155} width={lineR - E1x} height={14} rx={3} fill="var(--color-paper)" stroke="var(--color-line)" strokeWidth={1} />
      <text x={E1x + 8} y={165} fontSize={8} fill="var(--color-ink-2)">
        {isKo
          ? 'IE: 관계선 위에 관계명 표기  |  바커: 선 위(능동) · 선 아래(수동) 동사구 표기'
          : 'IE: name above the line  |  Barker: active verb above · passive verb below'}
      </text>
    </svg>
  )
}

// ── 관계 차수 다이어그램 ───────────────────────────────────────────────────
//
// 각 차수(1:1 / 1:N / M:N)마다 IE 행 + 바커 행을 세로로 나열
// ROW_H=100, IE행 offset=0, 바커행 offset=48
// 기호 공간 SYM=20 (엔터티 경계와 선 사이)
// 까마귀발: 선 끝(anchor)에서 엔터티 방향으로 fan. anchor는 lineL/lineR
// 바커 多기호: anchor에서 엔터티 방향으로 2줄

function CardinalityDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const W = 560; const EW = 96; const EH = 32; const IE_R = 2; const BK_R = 8; const SYM = 20
  const LABEL_W = 36 // 왼쪽 차수 레이블 공간
  const E1x = LABEL_W + 4
  const E2x = W - EW - 8
  // 기호 구간: [E1x+EW .. E1x+EW+SYM], [E2x-SYM .. E2x]
  const sym1R = E1x + EW + SYM  // 왼쪽 기호 오른쪽 끝 (= 선 시작)
  const sym2L = E2x - SYM       // 오른쪽 기호 왼쪽 끝 (= 선 끝)
  const midX = (sym1R + sym2L) / 2

  const C_IE = 'var(--color-blue)'; const C_BK = 'var(--color-purple)'
  const ROW_H = 108 // 각 차수 그룹 높이
  const IE_OFF = 8  // 그룹 내 IE행 y offset
  const BK_OFF = 58 // 그룹 내 바커행 y offset

  const groups = [
    { card: '1:1', lA: isKo ? '직원' : 'Employee',  lB: isKo ? '주차자리' : 'Parking', rightN: false },
    { card: '1:N', lA: isKo ? '고객' : 'Customer',  lB: isKo ? '주문'    : 'Order',   rightN: true  },
    { card: 'M:N', lA: isKo ? '학생' : 'Student',   lB: isKo ? '수업'    : 'Class',   rightN: true, leftN: true },
  ]
  const HEADER_H = 16
  const H = HEADER_H + groups.length * ROW_H + 4

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: 'var(--font-sans-active)' }}>
      {/* 헤더 */}
      <text x={midX} y={12} textAnchor="middle" fontSize={8} fill="var(--color-ink-3)">
        {isKo ? '위: IE 표기법  /  아래: 바커 표기법' : 'Top: IE Notation  /  Bottom: Barker Notation'}
      </text>

      {groups.map((g, gi) => {
        const baseY  = HEADER_H + gi * ROW_H
        const ieY    = baseY + IE_OFF
        const bkY    = baseY + BK_OFF
        const ieLY   = ieY + EH / 2
        const bkLY   = bkY + EH / 2
        const hasLN  = !!(g as { leftN?: boolean }).leftN

        // ── IE 까마귀발/수직선 렌더 (인라인) ──
        // 왼쪽 기호: sym1R 위치에서 왼쪽(엔터티 방향)으로 그림
        // 오른쪽 기호: sym2L 위치에서 오른쪽(엔터티 방향)으로 그림
        const IE_BAR_H = 9  // 수직선 반높이
        const CF_LEN   = 14 // 까마귀발 길이
        const CF_SPREAD = 8 // 까마귀발 퍼짐

        // IE 왼쪽 (항상 1)
        const ieL1 = (
          <line x1={sym1R} y1={ieLY - IE_BAR_H} x2={sym1R} y2={ieLY + IE_BAR_H} stroke={C_IE} strokeWidth={1.8} />
        )
        // IE 오른쪽 (N 또는 1)
        const ieR = hasLN || g.rightN ? (
          // 까마귀발: anchor=sym2L, 엔터티 방향=오른쪽(+)
          <g>
            {/* 위쪽 갈래 */}
            <line x1={sym2L} y1={bkLY} x2={sym2L + CF_LEN} y2={bkLY - CF_SPREAD} stroke={C_IE} strokeWidth={1.5} />
            {/* 가운데 갈래 */}
            <line x1={sym2L} y1={ieLY} x2={sym2L + CF_LEN} y2={ieLY} stroke={C_IE} strokeWidth={1.5} />
            {/* 아래쪽 갈래 */}
            <line x1={sym2L} y1={ieLY} x2={sym2L + CF_LEN} y2={ieLY + CF_SPREAD} stroke={C_IE} strokeWidth={1.5} />
            {/* 수직 bar */}
            <line x1={sym2L} y1={ieLY - IE_BAR_H} x2={sym2L} y2={ieLY + IE_BAR_H} stroke={C_IE} strokeWidth={1.5} />
          </g>
        ) : (
          <line x1={sym2L} y1={ieLY - IE_BAR_H} x2={sym2L} y2={ieLY + IE_BAR_H} stroke={C_IE} strokeWidth={1.8} />
        )
        const ieL = hasLN ? (
          // M:N 왼쪽도 까마귀발: anchor=sym1R, 엔터티 방향=왼쪽(-)
          <g>
            <line x1={sym1R} y1={ieLY} x2={sym1R - CF_LEN} y2={ieLY - CF_SPREAD} stroke={C_IE} strokeWidth={1.5} />
            <line x1={sym1R} y1={ieLY} x2={sym1R - CF_LEN} y2={ieLY} stroke={C_IE} strokeWidth={1.5} />
            <line x1={sym1R} y1={ieLY} x2={sym1R - CF_LEN} y2={ieLY + CF_SPREAD} stroke={C_IE} strokeWidth={1.5} />
            <line x1={sym1R} y1={ieLY - IE_BAR_H} x2={sym1R} y2={ieLY + IE_BAR_H} stroke={C_IE} strokeWidth={1.5} />
          </g>
        ) : ieL1

        // ── 바커 기호 렌더 (인라인) ──
        // 바커 1 기호: 수직선 하나
        // 바커 N 기호: 수직선 2개 (간격 6px)
        const BK_BAR_H = 9
        const BK_GAP   = 7 // 두 번째 선 간격

        const bkRightSym = g.rightN ? (
          // N쪽 오른쪽: 2줄, anchor=sym2L, 엔터티 방향=오른쪽
          <g>
            <line x1={sym2L}        y1={bkLY - BK_BAR_H} x2={sym2L}        y2={bkLY + BK_BAR_H} stroke={C_BK} strokeWidth={1.8} />
            <line x1={sym2L + BK_GAP} y1={bkLY - BK_BAR_H} x2={sym2L + BK_GAP} y2={bkLY + BK_BAR_H} stroke={C_BK} strokeWidth={1.8} />
          </g>
        ) : (
          <line x1={sym2L} y1={bkLY - BK_BAR_H} x2={sym2L} y2={bkLY + BK_BAR_H} stroke={C_BK} strokeWidth={1.8} />
        )
        const bkLeftSym = hasLN ? (
          // M:N 왼쪽도 N: 2줄, anchor=sym1R, 엔터티 방향=왼쪽
          <g>
            <line x1={sym1R}         y1={bkLY - BK_BAR_H} x2={sym1R}         y2={bkLY + BK_BAR_H} stroke={C_BK} strokeWidth={1.8} />
            <line x1={sym1R - BK_GAP} y1={bkLY - BK_BAR_H} x2={sym1R - BK_GAP} y2={bkLY + BK_BAR_H} stroke={C_BK} strokeWidth={1.8} />
          </g>
        ) : (
          <line x1={sym1R} y1={bkLY - BK_BAR_H} x2={sym1R} y2={bkLY + BK_BAR_H} stroke={C_BK} strokeWidth={1.8} />
        )

        return (
          <g key={g.card}>
            {/* 차수 레이블 */}
            <text x={2} y={baseY + ROW_H / 2} fontSize={11} fontWeight={600} fill="var(--color-ink)" dominantBaseline="middle">{g.card}</text>

            {/* ── IE 행 ── */}
            {/* 엔터티 */}
            <rect x={E1x} y={ieY} width={EW} height={EH} rx={IE_R} fill={C_IE} fillOpacity={0.08} stroke={C_IE} strokeOpacity={0.5} strokeWidth={1} />
            <text x={E1x + EW/2} y={ieLY + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={C_IE}>{g.lA}</text>
            <rect x={E2x} y={ieY} width={EW} height={EH} rx={IE_R} fill={C_IE} fillOpacity={0.08} stroke={C_IE} strokeOpacity={0.5} strokeWidth={1} />
            <text x={E2x + EW/2} y={ieLY + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={C_IE}>{g.lB}</text>
            {/* 관계선 */}
            <line x1={sym1R} y1={ieLY} x2={sym2L} y2={ieLY} stroke={C_IE} strokeWidth={1.5} />
            {/* 기호 */}
            {ieL}
            {ieR}
            {/* 레이블 */}
            <text x={midX} y={ieLY - 8} textAnchor="middle" fontSize={8} fill={C_IE}>IE</text>

            {/* ── 바커 행 ── */}
            <rect x={E1x} y={bkY} width={EW} height={EH} rx={BK_R} fill={C_BK} fillOpacity={0.08} stroke={C_BK} strokeOpacity={0.5} strokeWidth={1} />
            <text x={E1x + EW/2} y={bkLY + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={C_BK}>{g.lA}</text>
            <rect x={E2x} y={bkY} width={EW} height={EH} rx={BK_R} fill={C_BK} fillOpacity={0.08} stroke={C_BK} strokeOpacity={0.5} strokeWidth={1} />
            <text x={E2x + EW/2} y={bkLY + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={C_BK}>{g.lB}</text>
            {/* 관계선 */}
            <line x1={sym1R} y1={bkLY} x2={sym2L} y2={bkLY} stroke={C_BK} strokeWidth={1.5} />
            {/* 기호 */}
            {bkLeftSym}
            {bkRightSym}
            {/* 레이블 */}
            <text x={midX} y={bkLY - 8} textAnchor="middle" fontSize={8} fill={C_BK}>{isKo ? '바커' : 'Barker'}</text>

            {/* 구분선 */}
            {gi < groups.length - 1 && (
              <line x1={LABEL_W} y1={baseY + ROW_H - 2} x2={W - 4} y2={baseY + ROW_H - 2}
                stroke="var(--color-rail)" strokeWidth={1} strokeDasharray="4 3" />
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── 관계 선택사양 다이어그램 ──────────────────────────────────────────────
//
// 각 케이스마다 IE 행 + 바커 행
// IE: 왼쪽/오른쪽 각각 수직선(필수) 또는 원(선택) 기호
// 바커: 실선(필수) 또는 점선(선택) 구간으로 표현
// 설명 텍스트는 각 그룹 하단에 배치 (박스와 겹치지 않도록 ROW_H 충분히)

function OptionalityDiagram({ lang }: { lang: 'ko' | 'en' }) {
  const isKo = lang === 'ko'
  const W = 560; const EW = 90; const EH = 32; const IE_R = 2; const BK_R = 8; const SYM = 20
  const E1x = 8
  const E2x = W - EW - 8
  const sym1R = E1x + EW + SYM
  const sym2L = E2x - SYM
  const midX  = (sym1R + sym2L) / 2

  const C_IE = 'var(--color-blue)'; const C_BK = 'var(--color-purple)'
  const ROW_H = 110
  const IE_OFF = 6
  const BK_OFF = 50
  const DESC_OFF = 90

  const rows = [
    {
      lA: isKo ? '고객' : 'Customer', lB: isKo ? '주문' : 'Order',
      oL: 'M' as const, oR: 'O' as const,
      desc: isKo
        ? '필수(|) — 선택(○) : 주문 없는 고객 가능, 고객 없는 주문은 불가'
        : 'Mandatory(|) — Optional(○) : Customer can exist without an order',
    },
    {
      lA: isKo ? '주문' : 'Order', lB: isKo ? '주문상세' : 'OrderItem',
      oL: 'M' as const, oR: 'M' as const,
      desc: isKo
        ? '필수(|) — 필수(|) : 주문에는 반드시 상세가 있어야 하고, 상세는 주문에 속해야 해요'
        : 'Mandatory(|) — Mandatory(|) : Both sides must always exist',
    },
    {
      lA: isKo ? '직원' : 'Employee', lB: isKo ? '부서' : 'Department',
      oL: 'O' as const, oR: 'M' as const,
      desc: isKo
        ? '선택(○) — 필수(|) : 직원은 부서 없이 존재 가능, 직원은 반드시 어떤 부서에 속해야 해요'
        : 'Optional(○) — Mandatory(|) : Employee can be unassigned; but must belong to a dept',
    },
  ]
  const HEADER_H = 16
  const H = HEADER_H + rows.length * ROW_H + 4

  const BAR_H = 9; const CR = 6 // 원 반지름

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: 'var(--font-sans-active)' }}>
      <text x={midX} y={12} textAnchor="middle" fontSize={8} fill="var(--color-ink-3)">
        {isKo
          ? '위: IE 표기법 ( | 필수 · ○ 선택 )   /   아래: 바커 표기법 ( 실선 필수 · 점선 선택 )'
          : 'Top: IE ( | mandatory · ○ optional )   /   Bottom: Barker ( solid mandatory · dashed optional )'}
      </text>

      {rows.map((row, i) => {
        const baseY  = HEADER_H + i * ROW_H
        const ieY    = baseY + IE_OFF
        const bkY    = baseY + BK_OFF
        const ieLY   = ieY + EH / 2
        const bkLY   = bkY + EH / 2

        // IE 기호: 왼쪽
        const ieSymL = row.oL === 'M'
          ? <line x1={sym1R} y1={ieLY - BAR_H} x2={sym1R} y2={ieLY + BAR_H} stroke={C_IE} strokeWidth={1.8} />
          : <circle cx={sym1R} cy={ieLY} r={CR} fill="white" stroke={C_IE} strokeWidth={1.5} />
        // IE 기호: 오른쪽
        const ieSymR = row.oR === 'M'
          ? <line x1={sym2L} y1={ieLY - BAR_H} x2={sym2L} y2={ieLY + BAR_H} stroke={C_IE} strokeWidth={1.8} />
          : <circle cx={sym2L} cy={ieLY} r={CR} fill="white" stroke={C_IE} strokeWidth={1.5} />

        // 바커 선: oL(왼쪽 참여)과 oR(오른쪽 참여)로 왼·오른쪽 구간 결정
        // 왼쪽 구간 sym1R→midX: oL이 O면 점선
        // 오른쪽 구간 midX→sym2L: oR이 O면 점선
        const bkLineL = (
          <line x1={sym1R} y1={bkLY} x2={midX} y2={bkLY}
            stroke={C_BK} strokeWidth={1.5}
            strokeDasharray={row.oL === 'O' ? '5 3' : undefined} />
        )
        const bkLineR = (
          <line x1={midX} y1={bkLY} x2={sym2L} y2={bkLY}
            stroke={C_BK} strokeWidth={1.5}
            strokeDasharray={row.oR === 'O' ? '5 3' : undefined} />
        )

        return (
          <g key={i}>
            {/* ── IE 행 ── */}
            <rect x={E1x} y={ieY} width={EW} height={EH} rx={IE_R} fill={C_IE} fillOpacity={0.08} stroke={C_IE} strokeOpacity={0.5} strokeWidth={1} />
            <text x={E1x + EW/2} y={ieLY + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={C_IE}>{row.lA}</text>
            <line x1={sym1R + (row.oL === 'O' ? CR : 0)} y1={ieLY}
                  x2={sym2L - (row.oR === 'O' ? CR : 0)} y2={ieLY}
                  stroke={C_IE} strokeWidth={1.5} />
            {ieSymL}
            {ieSymR}
            <text x={midX} y={ieLY - 8} textAnchor="middle" fontSize={8} fill={C_IE}>IE</text>
            <rect x={E2x} y={ieY} width={EW} height={EH} rx={IE_R} fill={C_IE} fillOpacity={0.08} stroke={C_IE} strokeOpacity={0.5} strokeWidth={1} />
            <text x={E2x + EW/2} y={ieLY + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={C_IE}>{row.lB}</text>

            {/* ── 바커 행 ── */}
            <rect x={E1x} y={bkY} width={EW} height={EH} rx={BK_R} fill={C_BK} fillOpacity={0.08} stroke={C_BK} strokeOpacity={0.5} strokeWidth={1} />
            <text x={E1x + EW/2} y={bkLY + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={C_BK}>{row.lA}</text>
            {bkLineL}
            {bkLineR}
            <text x={midX} y={bkLY - 8} textAnchor="middle" fontSize={8} fill={C_BK}>{isKo ? '바커' : 'Barker'}</text>
            <rect x={E2x} y={bkY} width={EW} height={EH} rx={BK_R} fill={C_BK} fillOpacity={0.08} stroke={C_BK} strokeOpacity={0.5} strokeWidth={1} />
            <text x={E2x + EW/2} y={bkLY + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={C_BK}>{row.lB}</text>

            {/* 설명 텍스트 (그룹 하단) */}
            <text x={E1x} y={baseY + DESC_OFF} fontSize={8} fill="var(--color-ink-2)">{row.desc}</text>

            {/* 구분선 */}
            {i < rows.length - 1 && (
              <line x1={0} y1={baseY + ROW_H - 2} x2={W} y2={baseY + ROW_H - 2}
                stroke="var(--color-rail)" strokeWidth={1} strokeDasharray="4 3" />
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export function RelationshipSection() {
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

      <Divider />

      {/* 세 가지 요소 개요 */}
      <SectionTitle>{t.threeTitle}</SectionTitle>
      <Prose>{t.threeDesc}</Prose>
      <ConceptGrid items={t.three} />

      <Divider />

      {/* 관계명 */}
      <SectionTitle>{t.nameTitle}</SectionTitle>
      <Prose>{t.nameDesc}</Prose>
      <StepList steps={t.nameRules} />
      <p className="mb-2 mt-6 font-sans text-[11px] font-semibold text-ink-2">{t.nameNotationLabel}</p>
      <Prose>{t.nameNotationDesc}</Prose>
      <div className="mt-3 overflow-hidden rounded-panel border bg-rail p-4">
        <RelationshipNameDiagram lang={lang} />
      </div>

      <Divider />

      {/* 관계 차수 */}
      <SectionTitle>{t.cardTitle}</SectionTitle>
      <Prose>{t.cardDesc}</Prose>
      <Table headers={t.cardHeaders} rows={t.cardRows} />
      <p className="mb-2 mt-6 font-sans text-[11px] font-semibold text-ink-2">{t.cardNotationLabel}</p>
      <Prose>{t.cardNotationDesc}</Prose>
      <div className="mt-3 overflow-hidden rounded-panel border bg-rail p-4">
        <CardinalityDiagram lang={lang} />
      </div>

      <Divider />

      {/* 관계 선택사양 */}
      <SectionTitle>{t.optTitle}</SectionTitle>
      <Prose>{t.optDesc}</Prose>
      <Table headers={t.optHeaders} rows={t.optRows} />
      <p className="mb-2 mt-6 font-sans text-[11px] font-semibold text-ink-2">{t.optNotationLabel}</p>
      <Prose>{t.optNotationDesc}</Prose>
      <div className="mt-3 overflow-hidden rounded-panel border bg-rail p-4">
        <OptionalityDiagram lang={lang} />
      </div>

      <Divider />

      {/* 종합 비교표 */}
      <SectionTitle>{t.compareTitle}</SectionTitle>
      <Table headers={t.compareHeaders} rows={t.compareRows} />

      <Divider />

      {/* M:N */}
      <SectionTitle>{t.mnTitle}</SectionTitle>
      <Prose>{t.mnDesc}</Prose>
      <StepList steps={t.mnSteps} />

      <Divider />

      {/* 식별/비식별 */}
      <SectionTitle>{t.identifyTitle}</SectionTitle>
      <Prose>{t.identifyDesc}</Prose>
      <Table headers={t.identifyHeaders} rows={t.identifyRows} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
