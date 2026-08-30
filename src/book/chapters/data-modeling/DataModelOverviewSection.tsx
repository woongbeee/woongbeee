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
  StepList,
  Table,
} from '../shared'

const T = {
  ko: {
    title: '데이터 모델의 이해',
    subtitle:
      '데이터 모델링이 무엇인지, 왜 필요한지, 그리고 어떤 종류가 있는지 알아봐요.',

    whatTitle: '데이터 모델링이란?',
    whatDesc:
      '데이터 모델링은 현실 세계의 정보를 데이터베이스에 표현하는 방법을 설계하는 과정이에요.\n\n예를 들어, 학교 성적 관리 시스템을 만든다고 하면 — 학생, 수업, 선생님, 성적 같은 정보들이 어떻게 서로 연결되는지 그림으로 그리고 정의하는 과정이에요. 이 설계도가 바로 데이터 모델이에요.',

    whyTitle: '왜 데이터 모델링이 필요할까요?',
    whyDesc:
      '데이터 모델링 없이 바로 데이터베이스를 만들면 나중에 큰 문제가 생길 수 있어요. 미리 설계도를 그리면 이런 문제들을 예방할 수 있어요.',
    whyConcepts: [
      {
        icon: '🗺️',
        title: '공통 이해',
        desc: '개발자, 기획자, 사용자 모두가 같은 설계도를 보고 소통할 수 있어요.',
        color: 'blue',
      },
      {
        icon: '🔍',
        title: '오류 조기 발견',
        desc: '실제로 데이터를 쌓기 전에 설계 오류를 미리 발견하고 고칠 수 있어요.',
        color: 'emerald',
      },
      {
        icon: '⚡',
        title: '성능 최적화',
        desc: '데이터 구조를 잘 설계하면 조회 속도가 빠르고 저장 공간도 절약돼요.',
        color: 'orange',
      },
      {
        icon: '🔄',
        title: '유지보수 용이',
        desc: '나중에 기능이 추가되거나 바뀌어도 구조적으로 대응하기 쉬워요.',
        color: 'violet',
      },
    ],

    stagesTitle: '데이터 모델링의 3단계',
    stagesDesc:
      '데이터 모델링은 보통 세 단계를 거쳐요. 큰 그림에서 점점 구체적인 설계로 좁혀지는 과정이에요.',
    stages: [
      {
        title: '① 개념적 데이터 모델링',
        desc: '비즈니스 관점에서 중요한 데이터(Entity)와 그 관계를 추상적으로 정의해요. 기술적인 세부 사항 없이 핵심 개념만 정리해요. 주로 ERD(개체-관계 다이어그램)로 표현해요.',
      },
      {
        title: '② 논리적 데이터 모델링',
        desc: '개념 모델을 더 구체적으로 발전시켜요. 각 데이터의 속성(Attribute), 식별자(Primary Key), 관계(Relationship)를 정확하게 정의해요. 특정 DBMS에 종속되지 않아요.',
      },
      {
        title: '③ 물리적 데이터 모델링',
        desc: '논리 모델을 특정 DBMS(Oracle, MySQL 등)에 맞게 실제 테이블, 컬럼, 인덱스, 파티션 등으로 변환해요. 성능 최적화도 이 단계에서 고려해요.',
      },
    ],

    modelTypesTitle: '데이터 모델의 종류',
    modelTypesHeaders: ['모델 종류', '목적', '표현 방법', '특징'],
    modelTypesRows: [
      ['개념적 모델', '비즈니스 이해', 'ERD (Entity-Relationship Diagram)', 'DBMS 독립적, 고수준 설계'],
      ['논리적 모델', '세부 구조 정의', '관계형 스키마, 정규화된 ERD', '속성·키·관계 명확히 정의'],
      ['물리적 모델', '실제 DB 구현', 'DDL 스크립트, 테이블 정의서', 'DBMS 종속적, 성능 고려'],
    ],

    summary:
      '데이터 모델링은 현실 세계 → 개념 모델 → 논리 모델 → 물리 모델의 순서로 점점 구체화되는 과정이에요. 좋은 데이터 모델은 시스템 전체의 품질을 좌우하므로, 시작부터 꼼꼼하게 설계하는 게 중요해요.',
  },

  en: {
    title: 'Understanding Data Models',
    subtitle:
      'Learn what data modeling is, why it matters, and what types exist.',

    whatTitle: 'What is Data Modeling?',
    whatDesc:
      "Data modeling is the process of designing how real-world information will be represented in a database.\n\nFor example, if you're building a school grade management system — data modeling means drawing and defining how entities like Students, Classes, Teachers, and Grades connect to each other. That blueprint is the data model.",

    whyTitle: 'Why Do We Need Data Modeling?',
    whyDesc:
      'Building a database without modeling first can cause serious problems later. A solid design upfront prevents these common pitfalls.',
    whyConcepts: [
      {
        icon: '🗺️',
        title: 'Shared Understanding',
        desc: 'Developers, planners, and users can all communicate from the same blueprint.',
        color: 'blue',
      },
      {
        icon: '🔍',
        title: 'Early Error Detection',
        desc: 'Design flaws can be caught and fixed before any data is loaded.',
        color: 'emerald',
      },
      {
        icon: '⚡',
        title: 'Performance Optimization',
        desc: 'A well-designed structure means faster queries and less storage waste.',
        color: 'orange',
      },
      {
        icon: '🔄',
        title: 'Easy Maintenance',
        desc: 'When features change or grow, a solid model handles it structurally.',
        color: 'violet',
      },
    ],

    stagesTitle: 'The 3 Stages of Data Modeling',
    stagesDesc:
      'Data modeling typically passes through three stages — moving from a big-picture view down to concrete implementation.',
    stages: [
      {
        title: '① Conceptual Data Modeling',
        desc: 'Define important data (Entities) and their relationships from a business perspective — no technical details, just core concepts. Expressed as an ERD (Entity-Relationship Diagram).',
      },
      {
        title: '② Logical Data Modeling',
        desc: 'Refine the conceptual model with specifics: Attributes, Primary Keys, and Relationships are precisely defined. Still independent of any particular DBMS.',
      },
      {
        title: '③ Physical Data Modeling',
        desc: 'Transform the logical model into actual tables, columns, indexes, and partitions for a specific DBMS (Oracle, MySQL, etc.). Performance tuning is also addressed here.',
      },
    ],

    modelTypesTitle: 'Types of Data Models',
    modelTypesHeaders: ['Model Type', 'Purpose', 'Representation', 'Characteristics'],
    modelTypesRows: [
      ['Conceptual Model', 'Business understanding', 'ERD (Entity-Relationship Diagram)', 'DBMS-independent, high-level design'],
      ['Logical Model', 'Detailed structure', 'Normalized ERD, relational schema', 'Attributes, keys, relationships clearly defined'],
      ['Physical Model', 'Actual DB implementation', 'DDL scripts, table definitions', 'DBMS-specific, performance-aware'],
    ],

    summary:
      'Data modeling is a progressive refinement: real world → conceptual → logical → physical. A good data model defines the quality of the entire system, so starting with a careful design pays off throughout the project.',
  },
}

export function DataModelOverviewSection() {
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

      <SectionTitle>{t.whyTitle}</SectionTitle>
      <Prose>{t.whyDesc}</Prose>
      <ConceptGrid items={t.whyConcepts} />

      <Divider />

      <SectionTitle>{t.stagesTitle}</SectionTitle>
      <Prose>{t.stagesDesc}</Prose>
      <StepList steps={t.stages} />

      <Divider />

      <SectionTitle>{t.modelTypesTitle}</SectionTitle>
      <Table headers={t.modelTypesHeaders} rows={t.modelTypesRows} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
