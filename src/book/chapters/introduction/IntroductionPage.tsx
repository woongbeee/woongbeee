import type { ReactNode } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { PageContainer } from '../shared'
import { cn } from '@/lib/utils'
import {
  IconBolt, IconLock, IconTrendingUp, IconPuzzle, IconShield, IconCloud,
  IconBriefcase, IconCoin, IconBrain, IconCertificate,
} from '@tabler/icons-react'

/* ── language-independent visual meta ─────────────────────────────────────────
   색은 tokens.css §2c 콘텐츠 색만 쓴다 (아이콘 = currentColor). teal·파스텔 없음. */
const TONE: Record<string, string> = {
  blue: 'text-blue',
  green: 'text-green',
  amber: 'text-amber',
  purple: 'text-purple',
  red: 'text-red',
  slate: 'text-slate',
}

const STRENGTH_META: { icon: ReactNode; tone: keyof typeof TONE }[] = [
  { icon: <IconBolt size={18} stroke={1.75} />, tone: 'amber' },
  { icon: <IconLock size={18} stroke={1.75} />, tone: 'blue' },
  { icon: <IconTrendingUp size={18} stroke={1.75} />, tone: 'green' },
  { icon: <IconPuzzle size={18} stroke={1.75} />, tone: 'purple' },
  { icon: <IconShield size={18} stroke={1.75} />, tone: 'red' },
  { icon: <IconCloud size={18} stroke={1.75} />, tone: 'slate' },
]

const WHY_META: { icon: ReactNode; tone: keyof typeof TONE }[] = [
  { icon: <IconBriefcase size={18} stroke={1.75} />, tone: 'blue' },
  { icon: <IconCoin size={18} stroke={1.75} />, tone: 'amber' },
  { icon: <IconBrain size={18} stroke={1.75} />, tone: 'purple' },
  { icon: <IconCertificate size={18} stroke={1.75} />, tone: 'green' },
]

const USER_TONES: (keyof typeof TONE)[] = ['blue', 'green', 'amber', 'purple']

const T = {
  ko: {
    hero: '오라클이란?',
    heroSub: '세계에서 가장 널리 쓰이는 관계형 데이터베이스, Oracle을 소개합니다.',

    whatIsDbTitle: '데이터베이스란 무엇인가?',
    whatIsDb:
      '데이터베이스(Database)는 정보를 체계적으로 저장하고 빠르게 찾아볼 수 있게 해주는 소프트웨어예요.\n\n' +
      '쇼핑몰 상품 목록, 은행 계좌 잔액, 병원 환자 기록 — 이런 정보들이 모두 데이터베이스에 들어있거든요. 그냥 파일에 저장하는 것과는 달리, 데이터베이스는 수백만 건의 정보를 수천 명이 동시에 안전하게 읽고 쓸 수 있도록 만들어져 있어요.\n\n' +
      '관계형 데이터베이스(RDBMS, Relational Database Management System)는 그 중에서도 데이터를 표(Table) 형태로 저장하고, SQL(Structured Query Language)이라는 표준 언어로 다루는 방식이에요. Oracle, MySQL, PostgreSQL, SQL Server가 모두 RDBMS랍니다.',
    whatIsDbNote: 'RDBMS(Relational Database Management System)는 데이터를 행(Row)과 열(Column)로 이루어진 표(Table) 형태로 저장하고, 테이블 사이의 관계(Relation)를 정의해서 데이터를 서로 연결하고 관리하는 시스템이에요. 흔히 "DB"라고 부르는 것들의 대부분이 사실 RDBMS랍니다. 이 교재에서 "데이터베이스"라고 하면 관계형 데이터베이스(RDBMS)를 가리키는 거예요.',

    nameTitle: '"오라클"이라는 이름의 뜻',
    nameSub: '신탁(神託) — 신이 내리는 답',
    nameBody:
      '1977년, 래리 앨리슨(Larry Ellison), 밥 마이너(Bob Miner), 에드 오츠(Ed Oates) 세 명이 회사를 창업했을 때 첫 번째 고객이 CIA였어요. 그때 맡은 프로젝트의 코드명이 바로 "Oracle"이었답니다.\n\n' +
      '"Oracle"은 고대 그리스·로마에서 신의 뜻을 전달하는 신탁(oracle)에서 따온 말이에요. 어떤 질문이든 정확한 답을 내려주는 존재라는 뜻이죠. "당신이 어떤 데이터를 물어봐도 Oracle이 딱 맞는 답을 알려준다"는 의미를 담고 있는 거예요.\n\n' +
      '그 이름처럼, Oracle은 수십 년 동안 기업들이 가진 가장 어렵고 복잡한 질문들에 답해왔어요.',

    historyTitle: '오라클의 역사',
    historyItems: [
      { year: '1977', text: '래리 앨리슨이 IBM의 에드거 코드(Edgar Codd) 관계형 DB 논문을 읽고 창업. CIA 프로젝트 "Oracle" 수주' },
      { year: '1979', text: 'Oracle Version 2 출시 — 세계 최초의 상용 SQL 관계형 데이터베이스' },
      { year: '1992', text: 'Oracle 7 출시. 저장 프로시저(Stored Procedure), 트리거(Trigger) 등 기업용 기능 완성' },
      { year: '2001', text: 'Oracle 9i — 인터넷(Internet) 시대에 맞춰 XML, Java 통합' },
      { year: '2013', text: 'Oracle 12c — 멀티테넌트(Multitenant, 클라우드) 아키텍처 도입' },
      { year: '2018', text: 'Oracle 18c부터 연 1회 정기 릴리즈(Release) 정책으로 전환' },
      { year: '2023', text: 'Oracle 23ai — AI 벡터 검색(AI Vector Search) 등 AI 기능 전면 통합. 46년의 역사' },
      { year: '2025', text: 'Oracle 26ai — AI 에이전트(Agent) 워크플로우, 통합 하이브리드 벡터 검색(Unified Hybrid Vector Search), JSON·그래프·관계형 데이터 통합 모델 등 AI 네이티브(AI-Native) 기능 전면 강화. 장기 지원(LTS) 릴리즈' },
    ],

    strengthTitle: '다른 DB와 무엇이 다른가?',
    strengthSub: '왜 수많은 대기업은 Oracle을 선택했을까요?',
    strengths: [
      {
        title: '압도적인 성능',
        desc: '수억 건의 데이터를 실시간으로 처리하는 비용 기반 옵티마이저(CBO, Cost-Based Optimizer)가 복잡한 쿼리를 자동으로 최적화해줘요.',
      },
      {
        title: '기업급 신뢰성',
        desc: 'MVCC(Multi-Version Concurrency Control) 읽기 일관성, Undo 로그 기반 ROLLBACK, RAC(Real Application Clusters) 클러스터. 은행과 거래소가 믿고 쓰는 수준이에요.',
      },
      {
        title: '무한 확장성',
        desc: 'RAC(Real Application Clusters)로 서버 수십 대를 하나처럼 운영할 수 있어요. 파티셔닝(Partitioning)으로 테라바이트급 데이터도 분산 관리할 수 있답니다.',
      },
      {
        title: '풍부한 내장 기능',
        desc: '윈도우 함수·분석 함수·PIVOT·MERGE·계층 쿼리(CONNECT BY) 등 Oracle만의 강력한 SQL 확장 기능들이 가득해요.',
      },
      {
        title: '보안·감사',
        desc: '세밀한 접근 권한 제어, VPD(Virtual Private Database), 감사 로그(Audit Log)로 금융·의료·공공기관의 컴플라이언스(Compliance) 요건을 충족해요.',
      },
      {
        title: '클라우드 통합',
        desc: 'OCI(Oracle Cloud Infrastructure) + Autonomous Database — 자동 튜닝·자동 보안·자동 패치까지 완전히 자동화되어 있어요.',
      },
    ],

    whyLearnTitle: '왜 Oracle을 배워야 할까?',
    whyLearnItems: [
      { text: '국내 대기업·금융사·공공기관의 핵심 시스템 대부분이 Oracle 기반이에요.' },
      { text: 'Oracle DBA(Database Administrator)·개발자는 높은 연봉과 꾸준한 수요를 자랑해요.' },
      { text: 'Oracle 내부 원리(옵티마이저, 인덱스, 트랜잭션)를 이해하면 다른 DB도 훨씬 쉽게 배울 수 있어요.' },
      { text: 'OCA(Oracle Certified Associate)·OCP(Oracle Certified Professional) 자격증은 취업과 커리어 전환에 실질적인 도움이 돼요.' },
    ],

    usersTitle: '어떤 회사들이 Oracle을 쓰고 있을까?',
    usersSub: '글로벌 Fortune 500 기업의 98%가 Oracle 제품을 사용합니다.',
    userCards: [
      {
        org: '삼성·현대·LG',
        category: '제조·대기업',
        reason: 'ERP(Enterprise Resource Planning) 시스템(SAP, Oracle E-Business Suite)의 백엔드로 Oracle DB를 써요. 수천만 건의 거래·재고·인사 데이터를 실시간으로 처리하거든요.',
      },
      {
        org: '국민은행·우리은행·하나은행',
        category: '금융·은행',
        reason: '계좌이체·결제·대출 같은 금융 트랜잭션(Transaction)의 무결성과 24시간 무중단 운영을 위해 Oracle RAC(Real Application Clusters) 클러스터를 운영해요.',
      },
      {
        org: 'Amazon',
        category: '글로벌 IT',
        reason: '지금은 자체 DB로 대규모 마이그레이션(Migration)을 진행 중이지만, 수년간 Oracle을 핵심 DB로 운영했던 대표적인 사례예요.',
      },
      {
        org: '건강보험심사평가원·국세청',
        category: '공공·의료',
        reason: '국민 전체의 의료 기록과 세금 데이터를 안전하게 보관하고 정확하게 처리하려면 기업급 신뢰성이 꼭 필요하거든요.',
      },
    ],

    closingLabel: '정리',
    closingTitle: '이 책으로 무엇을 배우게 될까?',
    closing:
      '이 교재는 Oracle의 겉모습(SQL 문법)에서 시작해서, 내부 구조(인스턴스·SGA·PGA)와 성능 최적화(옵티마이저·인덱스·파티셔닝)까지 차근차근 안내해줄 거예요.\n\n' +
      '그냥 SQL을 외우는 게 목표가 아니에요. Oracle이 쿼리를 어떻게 처리하는지, 그 원리를 이해하는 게 진짜 목표예요. 원리를 알면 쿼리가 느린 이유를 찾을 수 있고, 더 좋은 설계를 할 수 있거든요.\n\n' +
      '자, 이제 시작해봐요!',
  },

  en: {
    hero: 'What is Oracle?',
    heroSub: 'Introducing Oracle — the world\'s most widely used relational database.',

    whatIsDbTitle: 'What is a Database?',
    whatIsDb:
      'A database is software that stores information in an organized way and lets you retrieve it quickly.\n\n' +
      "Product catalogs, bank account balances, hospital patient records — all of it lives in a database. Unlike a simple file, a database is designed so that millions of records can be read and written safely by thousands of users at the same time.\n\n" +
      'A relational database (RDBMS) stores data in tables and uses a standard language called SQL to work with it. Oracle, MySQL, PostgreSQL, and SQL Server are all RDBMS.',
    whatIsDbNote: 'RDBMS (Relational Database Management System) stores data in tables made of rows and columns, and manages relationships between those tables to connect and organize data. Most things people simply call a "DB" are in fact an RDBMS — and throughout this book, "database" means a relational database (RDBMS).',

    nameTitle: 'What does "Oracle" mean?',
    nameSub: 'An oracle — a divine answer to any question',
    nameBody:
      'In 1977, Larry Ellison, Bob Miner, and Ed Oates founded the company and landed their first client: the CIA. The project\'s codename was "Oracle."\n\n' +
      '"Oracle" comes from ancient Greek and Roman tradition — an oracle was a source of divine wisdom that could answer any question. The name carries the promise: "Whatever data you ask for, Oracle will give you the exact answer."\n\n' +
      'True to its name, Oracle has been answering the most complex questions businesses can throw at a database for nearly 50 years.',

    historyTitle: 'A Brief History of Oracle',
    historyItems: [
      { year: '1977', text: 'Larry Ellison reads IBM\'s Edgar Codd relational DB paper and founds the company. Wins CIA project "Oracle"' },
      { year: '1979', text: 'Oracle Version 2 ships — the world\'s first commercially available SQL relational database' },
      { year: '1992', text: 'Oracle 7: stored procedures, triggers, and full enterprise feature set' },
      { year: '2001', text: 'Oracle 9i — XML and Java integration for the internet age' },
      { year: '2013', text: 'Oracle 12c — multitenant (cloud) architecture introduced' },
      { year: '2018', text: 'Oracle 18c begins annual release cadence' },
      { year: '2023', text: 'Oracle 23ai — AI Vector Search and deep AI integration across the platform' },
      { year: '2025', text: 'Oracle 26ai — AI-native LTS release: agentic AI workflows, Unified Hybrid Vector Search, unified relational/JSON/graph data model, and SQL Firewall built-in' },
    ],

    strengthTitle: 'How is Oracle different?',
    strengthSub: 'Why do so many enterprises choose Oracle?',
    strengths: [
      {
        title: 'Unmatched Performance',
        desc: 'The Cost-Based Optimizer (CBO) automatically rewrites and optimizes complex queries, handling hundreds of millions of records in real time.',
      },
      {
        title: 'Enterprise-Grade Reliability',
        desc: 'MVCC read consistency, Undo-log-based ROLLBACK, and RAC clustering deliver the data safety that banks and stock exchanges depend on.',
      },
      {
        title: 'Limitless Scalability',
        desc: 'Real Application Clusters (RAC) lets dozens of servers act as one. Partitioning distributes terabyte-scale data across nodes seamlessly.',
      },
      {
        title: 'Rich Built-in Features',
        desc: 'Window functions, analytic functions, PIVOT, MERGE, hierarchical queries (CONNECT BY) — powerful SQL extensions found nowhere else.',
      },
      {
        title: 'Security & Auditing',
        desc: 'Granular access control, Virtual Private Database (VPD), and audit logs satisfy finance, healthcare, and government compliance requirements.',
      },
      {
        title: 'Cloud Integration',
        desc: 'Oracle Cloud + Autonomous Database — self-tuning, self-securing, and self-patching, fully automated.',
      },
    ],

    whyLearnTitle: 'Why learn Oracle?',
    whyLearnItems: [
      { text: 'Core systems at most major Korean corporations, financial institutions, and government agencies run on Oracle.' },
      { text: 'Oracle DBAs and developers command strong salaries and enjoy sustained market demand.' },
      { text: 'Once you understand Oracle internals — optimizer, indexes, transactions — applying that knowledge to other databases becomes straightforward.' },
      { text: 'OCA / OCP certifications provide real career leverage for job seekers and career changers.' },
    ],

    usersTitle: 'Who uses Oracle?',
    usersSub: '98% of Fortune 500 companies use Oracle products.',
    userCards: [
      {
        org: 'Samsung · Hyundai · LG',
        category: 'Manufacturing',
        reason: 'Oracle DB powers the ERP backend (SAP, Oracle E-Business Suite), processing tens of millions of transactions, inventory, and HR records in real time.',
      },
      {
        org: 'KB · Woori · Hana Bank',
        category: 'Banking & Finance',
        reason: 'Oracle RAC clusters ensure 24/7 uptime and transaction integrity for transfers, payments, and loans.',
      },
      {
        org: 'Amazon',
        category: 'Global Tech',
        reason: 'A landmark example: Amazon ran Oracle as its core DB for years before launching a large-scale migration to its own database services.',
      },
      {
        org: 'HIRA · NTS (Korea)',
        category: 'Public & Healthcare',
        reason: 'National health records and tax data for the entire population require the enterprise reliability and precision that Oracle delivers.',
      },
    ],

    closingLabel: 'Summary',
    closingTitle: 'What will you learn in this book?',
    closing:
      'This book starts at the surface — SQL syntax — and walks step-by-step into Oracle internals: the instance, SGA, PGA, and then performance optimization with the optimizer, indexes, and partitioning.\n\n' +
      "The goal isn't to memorize SQL. It's to understand why Oracle works the way it does. Once you understand the principles, you can diagnose slow queries, design better schemas, and write SQL that the optimizer loves.\n\n" +
      "Let's get started.",
  },
}

const h2 = 'font-sans text-[1.375rem] font-semibold leading-[1.3] tracking-[-0.01em] text-ink'
const prose = 'whitespace-pre-line font-read text-[15px] leading-[1.75] text-ink-2'
const card = 'rounded-card border border-line bg-paper'

export function IntroductionPage() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer className="max-w-3xl pt-10">

      {/* ── Header ── */}
      <header className="border-b border-line pb-8">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
          Chapter 00 · Introduction
        </div>
        <h1 className="mt-3 text-balance font-sans text-[2rem] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
          {t.hero}
        </h1>
        <p className="mt-4 font-read text-[1.0625rem] leading-[1.8] text-ink-2">{t.heroSub}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {['RDBMS', 'SQL', 'Enterprise', 'OCI', '23ai'].map((tag) => (
            <span
              key={tag}
              className="rounded-chip border border-line bg-rail px-2 py-0.5 font-mono text-[11px] text-ink-2"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* ── What is a DB ── */}
      <section className="mt-14">
        <h2 className={h2}>{t.whatIsDbTitle}</h2>
        <p className={cn('mt-3', prose)}>{t.whatIsDb}</p>
        <div className={cn(card, 'mt-5 border-l-[3px] border-l-blue bg-paper-sunk px-4 py-3.5')}>
          <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-blue">
            {lang === 'ko' ? '참고' : 'Note'}
          </div>
          <p className="font-read text-[13.5px] leading-[1.65] text-ink">{t.whatIsDbNote}</p>
        </div>
      </section>

      {/* ── Name origin ── */}
      <section className="mt-14">
        <h2 className={h2}>{t.nameTitle}</h2>
        <p className="mt-1.5 font-mono text-[13px] text-ink-3">{t.nameSub}</p>
        <div className={cn(card, 'mt-4 px-6 py-5')}>
          <p className={prose}>{t.nameBody}</p>
        </div>
      </section>

      {/* ── History timeline ── */}
      <section className="mt-14">
        <h2 className={h2}>{t.historyTitle}</h2>
        <ol className="mt-5 divide-y divide-line border-y border-line">
          {t.historyItems.map((item) => (
            <li key={item.year} className="flex items-start gap-4 py-3">
              <span className="w-12 shrink-0 font-mono text-[12px] font-medium tabular-nums text-ink-3">
                {item.year}
              </span>
              <span className="font-read text-[14px] leading-[1.6] text-ink-2">{item.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Strengths ── */}
      <section className="mt-14">
        <h2 className={h2}>{t.strengthTitle}</h2>
        <p className="mt-1.5 font-read text-[14px] leading-[1.6] text-ink-2">{t.strengthSub}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {t.strengths.map((s, i) => (
            <div key={s.title} className={cn(card, 'p-4')}>
              <div className="mb-2 flex items-center gap-2.5">
                <span className={cn('shrink-0', TONE[STRENGTH_META[i].tone])}>{STRENGTH_META[i].icon}</span>
                <span className="font-sans text-[14px] font-semibold text-ink">{s.title}</span>
              </div>
              <p className="font-read text-[13px] leading-[1.6] text-ink-2">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why learn ── */}
      <section className="mt-14">
        <h2 className={h2}>{t.whyLearnTitle}</h2>
        <div className="mt-5 flex flex-col gap-2.5">
          {t.whyLearnItems.map((item, i) => (
            <div key={i} className={cn(card, 'flex items-start gap-3 px-4 py-3')}>
              <span className={cn('mt-0.5 shrink-0', TONE[WHY_META[i].tone])}>{WHY_META[i].icon}</span>
              <span className="font-read text-[14px] leading-[1.6] text-ink-2">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who uses Oracle ── */}
      <section className="mt-14">
        <h2 className={h2}>{t.usersTitle}</h2>
        <p className="mt-1.5 font-read text-[14px] leading-[1.6] text-ink-2">{t.usersSub}</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {t.userCards.map((c, i) => (
            <div key={c.org} className={cn(card, 'p-4')}>
              <div
                className={cn(
                  'mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]',
                  TONE[USER_TONES[i]],
                )}
              >
                {c.category}
              </div>
              <div className="mb-1 font-sans text-[14px] font-semibold text-ink">{c.org}</div>
              <p className="font-read text-[13px] leading-[1.6] text-ink-2">{c.reason}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing ── */}
      <hr className="mt-14 border-line" />
      <section className={cn(card, 'mt-10 border-l-[3px] border-l-slate bg-paper-sunk px-6 py-6')}>
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">
          {t.closingLabel}
        </div>
        <h2 className="font-sans text-[1.125rem] font-semibold tracking-[-0.01em] text-ink">{t.closingTitle}</h2>
        <p className={cn('mt-3', prose)}>{t.closing}</p>
      </section>

    </PageContainer>
  )
}
