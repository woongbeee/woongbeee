import { IconSitemap } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  StepList,
} from '../../shared'

const T = {
  ko: {
    title: '정규화',
    subtitle:
      '정규화는 데이터 중복을 없애고 이상 현상을 방지하기 위해 테이블을 올바른 형태로 분리하는 과정이에요.',

    whatTitle: '정규화란?',
    whatDesc:
      '정규화(Normalization)는 데이터베이스 설계에서 중복 데이터를 줄이고, 데이터 일관성을 유지하기 위해 테이블을 체계적으로 분리하는 과정이에요.\n\n정규화를 하지 않으면 같은 데이터를 여러 곳에 저장하게 되고, 한 곳을 수정할 때 다른 곳을 빠뜨리면 데이터가 엉켜버려요. 이런 문제를 이상 현상(Anomaly)이라고 해요.',

    anomalyTitle: '이상 현상의 종류',
    anomalyDesc:
      '정규화가 안 된 테이블에서 발생할 수 있는 세 가지 문제예요.',
    anomalyHeaders: ['종류', '발생 상황', '예시'],
    anomalyRows: [
      ['삽입 이상', '불필요한 데이터를 함께 입력해야 함', '수강 신청 전에는 학생 정보를 저장할 수 없음'],
      ['삭제 이상', '원하지 않는 데이터까지 함께 삭제됨', '마지막 수강 기록을 지우면 학생 정보도 사라짐'],
      ['갱신 이상', '중복된 데이터 중 일부만 수정되어 불일치 발생', '부서명 변경 시 일부 행만 반영되어 데이터 충돌'],
    ],

    nfTitle: '정규형(Normal Form)의 단계',
    nfDesc:
      '정규화는 단계적으로 진행돼요. 각 단계를 "정규형(NF, Normal Form)"이라고 해요.',
    nfSteps: [
      {
        title: '제1정규형 (1NF) — 원자값',
        desc: '모든 속성 값이 더 이상 나눌 수 없는 원자값(Atomic Value)이어야 해요. 한 칼럼에 여러 값이 들어가면 안 돼요.\n예: 전화번호 칼럼에 "010-1234, 02-5678"처럼 쉼표로 구분된 값은 안 돼요.',
      },
      {
        title: '제2정규형 (2NF) — 부분 함수 종속 제거',
        desc: '1NF를 만족하고, 기본 키가 복합 키일 때 일부 키에만 종속된 속성을 분리해요.\n예: (주문ID, 상품ID)가 PK인데 "상품명"은 상품ID에만 종속 → 상품 테이블로 분리.',
      },
      {
        title: '제3정규형 (3NF) — 이행 함수 종속 제거',
        desc: '2NF를 만족하고, PK가 아닌 일반 속성이 다른 일반 속성을 결정하는 관계를 제거해요.\n예: 직원ID → 부서ID → 부서명 처럼 부서명이 부서ID에 종속되면 부서 테이블로 분리.',
      },
      {
        title: 'BCNF (Boyce-Codd NF)',
        desc: '3NF를 강화한 형태예요. 모든 결정자(Determinant)가 후보 키여야 해요. 실무에서는 3NF까지 적용하는 경우가 많아요.',
      },
    ],

    denormTitle: '반정규화(De-normalization)',
    denormDesc:
      '정규화를 하면 테이블이 많아지고 조인이 늘어나 성능이 떨어질 수 있어요. 이럴 때 의도적으로 정규화를 되돌리는 것을 반정규화라고 해요.',
    denormHeaders: ['반정규화 기법', '설명', '주의사항'],
    denormRows: [
      ['테이블 병합', '자주 함께 조회되는 테이블을 하나로 합침', '데이터 중복 증가'],
      ['컬럼 중복', '자주 쓰는 값을 다른 테이블에도 저장', '갱신 시 동기화 필수'],
      ['파생 컬럼 추가', '계산 결과를 미리 저장 (예: 합계금액)', '원본 값 변경 시 재계산 필요'],
    ],

    summary:
      '정규화는 데이터 중복과 이상 현상을 방지하는 핵심 설계 기법이에요. 1NF → 2NF → 3NF 순서로 진행하며, 실무에서는 성능을 위해 반정규화를 적절히 병행해요. 정규화는 "왜 이 테이블이 이렇게 나뉘었는지"를 이해하는 열쇠예요.',
  },

  en: {
    title: 'Normalization',
    subtitle:
      'Normalization is the process of structuring tables to eliminate data redundancy and prevent anomalies.',

    whatTitle: 'What is Normalization?',
    whatDesc:
      "Normalization is the systematic process of splitting tables to reduce redundant data and maintain consistency.\n\nWithout normalization, the same data ends up stored in multiple places. If you update one copy but miss another, the data becomes inconsistent. These problems are called anomalies.",

    anomalyTitle: 'Types of Anomalies',
    anomalyDesc:
      'Three problems that can occur in an un-normalized table.',
    anomalyHeaders: ['Type', 'When it occurs', 'Example'],
    anomalyRows: [
      ['Insertion anomaly', 'Must insert unnecessary data along with desired data', "Can't store a student's info until they enroll in a class"],
      ['Deletion anomaly', 'Deleting one record unintentionally removes other data', "Deleting the last enrollment also wipes the student's info"],
      ['Update anomaly', 'Only some copies of duplicate data get updated', 'Renaming a department only updates some rows, causing inconsistency'],
    ],

    nfTitle: 'Stages of Normal Forms',
    nfDesc:
      'Normalization progresses through levels called Normal Forms (NF).',
    nfSteps: [
      {
        title: 'First Normal Form (1NF) — Atomic values',
        desc: 'Every attribute value must be atomic (indivisible). No column can hold multiple values.\nExample: a phone column with "010-1234, 02-5678" (comma-separated) violates 1NF.',
      },
      {
        title: 'Second Normal Form (2NF) — Remove partial dependencies',
        desc: 'Satisfies 1NF and removes attributes that depend on only part of a composite primary key.\nExample: if (OrderID, ProductID) is the PK but "ProductName" depends only on ProductID → move it to a Product table.',
      },
      {
        title: 'Third Normal Form (3NF) — Remove transitive dependencies',
        desc: 'Satisfies 2NF and removes cases where a non-key attribute determines another non-key attribute.\nExample: EmployeeID → DeptID → DeptName — since DeptName depends on DeptID, move it to a Department table.',
      },
      {
        title: 'BCNF (Boyce-Codd Normal Form)',
        desc: 'A stricter version of 3NF: every determinant must be a candidate key. In practice, most designs stop at 3NF.',
      },
    ],

    denormTitle: 'De-normalization',
    denormDesc:
      'Normalization creates more tables and more joins, which can hurt performance. Intentionally reversing normalization for performance is called de-normalization.',
    denormHeaders: ['Technique', 'Description', 'Caution'],
    denormRows: [
      ['Table merging', 'Combine frequently joined tables into one', 'Increases data redundancy'],
      ['Column duplication', 'Store a frequently-read value in an additional table', 'Must sync on every update'],
      ['Derived column', 'Pre-store a computed result (e.g., total amount)', 'Must recalculate when source data changes'],
    ],

    summary:
      'Normalization is the key design technique for eliminating redundancy and anomalies. It progresses 1NF → 2NF → 3NF, and in practice is balanced with strategic de-normalization for performance. Understanding normalization explains why tables are split the way they are.',
  },
}

export function NormalizationSection() {
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

      <SectionTitle>{t.anomalyTitle}</SectionTitle>
      <Prose>{t.anomalyDesc}</Prose>
      <Table headers={t.anomalyHeaders} rows={t.anomalyRows} />

      <Divider />

      <SectionTitle>{t.nfTitle}</SectionTitle>
      <Prose>{t.nfDesc}</Prose>
      <StepList steps={t.nfSteps} />

      <Divider />

      <SectionTitle>{t.denormTitle}</SectionTitle>
      <Prose>{t.denormDesc}</Prose>
      <Table headers={t.denormHeaders} rows={t.denormRows} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
