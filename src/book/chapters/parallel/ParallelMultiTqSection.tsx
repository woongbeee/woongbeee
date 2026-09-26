import { useState } from 'react'
import { IconGitFork } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useLangStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Table,
  SqlBlock,
  Divider,
} from '../shared'

const T = {
  ko: {
    title: '다단계 Table Queue 실전 예시',
    subtitle:
      '조인 하나 + 집계 하나만 있어도 Table Queue가 3~4개까지 늘어나요. 실제 DBMS_XPLAN 출력을 그대로 가져와서 TQ 번호를 하나씩 따라가 봐요.',

    introTitle: '왜 TQ가 여러 개 생길까?',
    introDesc:
      'Table Queue는 데이터를 재분배할 때마다 하나씩 생겨요. 재분배가 필요한 시점은 보통 세 가지예요:\n\n1. 조인 키로 맞춰서 보내야 할 때 (조인 전)\n2. 집계·정렬 키로 다시 맞춰서 보내야 할 때 (조인 후, GROUP BY/ORDER BY 전)\n3. 최종 결과를 QC로 모아야 할 때 (마지막)\n\n그래서 "조인 1번 + 집계 1번"짜리 쿼리도 최소 3개, 조인 대상 테이블이 늘어나면 그만큼 TQ도 늘어나요.',

    caseTitle: '실전 쿼리: 2-way 조인 + GROUP BY',
    caseDesc:
      'CUSTOMERS와 SALES를 조인해서 지역별 매출을 집계하는 쿼리예요. 두 테이블을 각각 병렬로 스캔하고, 조인하고, 다시 집계 키로 재분배해서 최종 합계를 내니까 TQ가 4개(TQ10000~TQ10003) 등장해요.',
    caseSql: `SELECT /*+ PARALLEL(c, 4) PARALLEL(s, 4) */
       c.region, SUM(s.amount) AS total_amount
FROM   sales s
JOIN   customers c ON s.customer_id = c.customer_id
GROUP BY c.region;`,

    planCaption: 'DBMS_XPLAN.DISPLAY 출력 (요약)',
    planNote:
      'TQ 번호를 클릭하면 그 단계에서 무슨 일이 일어나는지 아래에서 설명해줘요.',

    tqTitle: '단계 하나씩 뜯어보기',
    tqDesc:
      '아래 TQ 카드를 눌러보세요 — 실행 계획 어느 줄에 해당하는지, Producer/Consumer가 무슨 역할인지 확인할 수 있어요.',

    tqCards: [
      {
        id: 'TQ10000',
        label: ':TQ10000 — CUSTOMERS 스캔 결과 재분배',
        planLines: '8~10행',
        color: 'blue',
        detail:
          'Q1,00 그룹의 PX 서버들이 CUSTOMERS를 PX BLOCK ITERATOR로 나눠서 풀스캔해요. 조인 키(customer_id)를 해시해서 TQ10000으로 보내요 — 같은 customer_id는 항상 같은 Consumer로 가야, 다음 단계의 HASH JOIN에서 짝이 맞아떨어져요.',
      },
      {
        id: 'TQ10001',
        label: ':TQ10001 — SALES 스캔 결과 재분배',
        planLines: '11~13행',
        color: 'amber',
        detail:
          'Q1,01 그룹의 PX 서버들이 SALES를 스캔해요. 이쪽도 같은 조인 키(customer_id)로 해시해서 TQ10001로 보내요. TQ10000과 TQ10001은 서로 다른 테이블을 같은 해시 함수로 나눈 결과라서, 같은 customer_id를 가진 두 테이블의 행이 반드시 같은 Consumer PX에서 만나게 돼요.',
      },
      {
        id: 'TQ10002',
        label: ':TQ10002 — 조인 결과를 GROUP BY 키로 재분배',
        planLines: '6~7행',
        color: 'green',
        detail:
          'TQ10000·TQ10001에서 받은 CUSTOMERS 행과 SALES 행을 HASH JOIN BUFFERED 로 조인해요 (한쪽 입력을 버퍼에 담아두고 다른 쪽이 들어올 때 매칭). 조인된 행은 이번엔 GROUP BY 키(region)로 다시 해시해서 TQ10002로 보내요 — 조인 키와 집계 키가 다르기 때문에 재분배가 한 번 더 필요해요.',
      },
      {
        id: 'TQ10003',
        label: ':TQ10003 — 최종 집계 결과를 QC로 전송',
        planLines: '2~3행',
        color: 'purple',
        detail:
          '같은 region을 받은 Consumer PX가 HASH GROUP BY로 SUM(amount)을 계산해요. 각 PX가 자기 몫의 지역들에 대한 합계를 끝내면, QC (RANDOM) 방식으로 결과를 Query Coordinator에 모아요. 여기서 P→S(Parallel to Serial) 로 표시되는 이유는, 병렬 서버 여러 개의 결과가 QC 하나로 합쳐지기 때문이에요.',
      },
    ],

    countTitle: '테이블이 늘어나면 TQ도 늘어나요',
    countDesc:
      '조인 대상 테이블 수와 재분배 횟수가 그대로 TQ 개수로 이어져요. 대략적인 공식은 이래요.',
    countTable: [
      [
        '1개 테이블 + GROUP BY',
        'TQ 2개',
        '스캔 결과 재분배(집계 키) → 최종 결과 QC 전송',
      ],
      [
        '2개 테이블 조인 (GROUP BY 없음)',
        'TQ 3개',
        '테이블 A 재분배 + 테이블 B 재분배 + 조인 결과 QC 전송',
      ],
      [
        '2개 테이블 조인 + GROUP BY',
        'TQ 4개',
        '테이블 A·B 재분배(조인 키) → 조인 결과 재분배(집계 키) → QC 전송',
      ],
      [
        '3개 테이블 조인 + GROUP BY + ORDER BY',
        'TQ 6개 이상',
        '조인마다 재분배 + 집계 키 재분배 + 정렬 키 재분배 + QC 전송',
      ],
    ],

    readTitle: '실제 환경에서 확인하는 법',
    readDesc:
      '운영 중인 쿼리라면 DBMS_XPLAN.DISPLAY_CURSOR로 실제 실행 통계까지 함께 볼 수 있어요.',
    readSql: `SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id => NULL,               -- 가장 최근 실행된 SQL
    format => 'ALLSTATS LAST PARALLEL'
  )
);

-- TQ별 실제 전송량(행 수 · 바이트)으로 데이터 스큐 확인
SELECT dfo_number, tq_id, server_type,
       process, num_rows, bytes
FROM   v$pq_tqstat
ORDER BY dfo_number, tq_id, server_type DESC;`,
    readNote:
      'V$PQ_TQSTAT에서 같은 TQ인데 PX 서버별 num_rows가 크게 차이 나면 데이터 스큐(Skew)예요 — 특정 서버만 일이 몰려서 전체 쿼리가 그 서버를 기다리게 돼요.',

    summary:
      'Table Queue는 "재분배가 필요한 지점"마다 하나씩 생겨요. 조인 키로 맞추는 재분배, 집계·정렬 키로 맞추는 재분배, 그리고 QC로 모으는 마지막 전송 — 이 세 가지 패턴을 조합해서 세면 실행 계획에 TQ가 몇 개 나올지 미리 예상할 수 있어요.',
  },

  en: {
    title: 'Multi-Stage Table Queue Example',
    subtitle:
      'Even a single join plus a single aggregation can produce 3-4 Table Queues. Trace an actual DBMS_XPLAN output TQ by TQ.',

    introTitle: 'Why do multiple TQs appear?',
    introDesc:
      'A Table Queue appears every time data needs to be redistributed. Redistribution is typically needed in three situations:\n\n1. To align rows by join key (before a join)\n2. To re-align rows by aggregation/sort key (after a join, before GROUP BY/ORDER BY)\n3. To gather the final result to the QC (at the end)\n\nSo a query with "one join + one aggregation" produces at least 3 TQs, and every additional joined table adds more.',

    caseTitle: 'Real Query: A 2-Way Join + GROUP BY',
    caseDesc:
      'This query joins CUSTOMERS to SALES and totals revenue by region. Both tables are scanned in parallel, joined, then redistributed again by the aggregation key for the final total — producing 4 Table Queues (TQ10000–TQ10003).',
    caseSql: `SELECT /*+ PARALLEL(c, 4) PARALLEL(s, 4) */
       c.region, SUM(s.amount) AS total_amount
FROM   sales s
JOIN   customers c ON s.customer_id = c.customer_id
GROUP BY c.region;`,

    planCaption: 'DBMS_XPLAN.DISPLAY output (abridged)',
    planNote: 'Click a TQ number to see what happens at that stage, below.',

    tqTitle: 'Breaking Down Each Stage',
    tqDesc:
      'Click a TQ card below — see which plan lines it corresponds to and what role the Producers/Consumers play.',

    tqCards: [
      {
        id: 'TQ10000',
        label: ':TQ10000 — Redistribute the CUSTOMERS scan',
        planLines: 'lines 8–10',
        color: 'blue',
        detail:
          'PX Servers in group Q1,00 full-scan CUSTOMERS, split via PX BLOCK ITERATOR. They hash the join key (customer_id) and send rows into TQ10000 — the same customer_id must always land on the same Consumer for the later HASH JOIN to match correctly.',
      },
      {
        id: 'TQ10001',
        label: ':TQ10001 — Redistribute the SALES scan',
        planLines: 'lines 11–13',
        color: 'amber',
        detail:
          'PX Servers in group Q1,01 scan SALES. They also hash by the same join key (customer_id) into TQ10001. Because TQ10000 and TQ10001 split two different tables using the same hash function, rows sharing a customer_id are guaranteed to meet at the same Consumer PX.',
      },
      {
        id: 'TQ10002',
        label: ':TQ10002 — Redistribute the joined rows by GROUP BY key',
        planLines: 'lines 6–7',
        color: 'green',
        detail:
          'The rows received from TQ10000 and TQ10001 are joined with HASH JOIN BUFFERED (one input is buffered while the other streams in for matching). The joined rows are then re-hashed by the GROUP BY key (region) and sent into TQ10002 — because the join key and aggregation key differ, one more redistribution is required.',
      },
      {
        id: 'TQ10003',
        label: ':TQ10003 — Send the final aggregate to the QC',
        planLines: 'lines 2–3',
        color: 'purple',
        detail:
          "The Consumer PX that received a given region computes SUM(amount) via HASH GROUP BY. Once each PX finishes summing its share of regions, results are gathered to the Query Coordinator via QC (RANDOM). This is marked P->S (Parallel to Serial) because multiple parallel servers' results converge into the single QC.",
      },
    ],

    countTitle: 'More Tables Means More TQs',
    countDesc:
      'The number of joined tables and redistribution points directly determines the TQ count. Roughly:',
    countTable: [
      [
        '1 table + GROUP BY',
        '2 TQs',
        'Redistribute scan by aggregation key → send final result to QC',
      ],
      [
        '2-table join (no GROUP BY)',
        '3 TQs',
        'Redistribute table A + redistribute table B + send joined result to QC',
      ],
      [
        '2-table join + GROUP BY',
        '4 TQs',
        'Redistribute A & B by join key → redistribute joined rows by agg key → send to QC',
      ],
      [
        '3-table join + GROUP BY + ORDER BY',
        '6+ TQs',
        'Redistribution per join + agg-key redistribution + sort-key redistribution + send to QC',
      ],
    ],

    readTitle: 'Checking This on a Live System',
    readDesc:
      'For a query that already ran, DBMS_XPLAN.DISPLAY_CURSOR also shows actual runtime statistics.',
    readSql: `SELECT * FROM TABLE(
  DBMS_XPLAN.DISPLAY_CURSOR(
    sql_id => NULL,               -- most recently executed SQL
    format => 'ALLSTATS LAST PARALLEL'
  )
);

-- Check actual per-TQ traffic (rows / bytes) for data skew
SELECT dfo_number, tq_id, server_type,
       process, num_rows, bytes
FROM   v$pq_tqstat
ORDER BY dfo_number, tq_id, server_type DESC;`,
    readNote:
      'If num_rows varies wildly across PX Servers within the same TQ in V$PQ_TQSTAT, that is data skew — one server gets overloaded and the whole query waits on it.',

    summary:
      'A Table Queue appears at every point data needs redistributing: aligning by join key, re-aligning by aggregation/sort key, and the final send to the QC. Counting how many times these three patterns combine in a query lets you predict how many TQs its execution plan will show before you even run it.',
  },
}

const COLOR_CLASSES: Record<
  string,
  { border: string; text: string; bg: string }
> = {
  blue: { border: 'border-blue', text: 'text-blue', bg: 'bg-blue/[0.06]' },
  amber: { border: 'border-amber', text: 'text-amber', bg: 'bg-amber/[0.06]' },
  green: { border: 'border-green', text: 'text-green', bg: 'bg-green/[0.06]' },
  purple: {
    border: 'border-purple',
    text: 'text-purple',
    bg: 'bg-purple/[0.06]',
  },
}

const PLAN_TEXT = `--------------------------------------------------------------------------------------
| Id | Operation               | Name      | Rows | TQ    |IN-OUT| PQ Distrib |
--------------------------------------------------------------------------------------
|  0 | SELECT STATEMENT         |           |      |       |      |            |
|  1 |  PX COORDINATOR          |           |      |       |      |            |
|  2 |   PX SEND QC (RANDOM)    | :TQ10003  |  925 | Q1,03 | P->S | QC (RAND)  |
|  3 |    HASH GROUP BY         |           |  925 | Q1,03 | PCWP |            |
|  4 |     PX RECEIVE           |           |  925 | Q1,03 | PCWP |            |
|  5 |      PX SEND HASH        | :TQ10002  |  925 | Q1,02 | P->P | HASH       |
|  6 |       HASH JOIN BUFFERED |           |  925 | Q1,02 | PCWP |            |
|  7 |        PX RECEIVE        |           |  630 | Q1,02 | PCWP |            |
|  8 |         PX SEND HASH     | :TQ10000  |  630 | Q1,00 | P->P | HASH       |
|  9 |          PX BLOCK ITERATOR|          |  630 | Q1,00 | PCWC |            |
| 10 |           TABLE ACCESS FULL| CUSTOMERS| 630 | Q1,00 | PCWP |            |
| 11 |        PX RECEIVE        |           |  960 | Q1,02 | PCWP |            |
| 12 |         PX SEND HASH     | :TQ10001  |  960 | Q1,01 | P->P | HASH       |
| 13 |          PX BLOCK ITERATOR|          |  960 | Q1,01 | PCWC |            |
| 14 |           TABLE ACCESS FULL| SALES    | 960 | Q1,01 | PCWP |            |
--------------------------------------------------------------------------------------`

export function ParallelMultiTqSection() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconGitFork size={36} stroke={1.5} className="text-green" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.introTitle}</SectionTitle>
      <Prose>{t.introDesc}</Prose>

      <Divider />

      <SectionTitle>{t.caseTitle}</SectionTitle>
      <Prose>{t.caseDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.caseSql} />
      </div>

      <div className="mt-4">
        <p className="text-ink-2 mb-1.5 font-mono text-[10px] font-bold tracking-widest uppercase">
          {t.planCaption}
        </p>
        <div className="rounded-panel border-line bg-paper overflow-x-auto border px-4 py-3">
          <pre className="text-ink-2 font-mono text-[10.5px] leading-relaxed">
            {PLAN_TEXT.split('\n').map((line, i) => {
              const hit = t.tqCards.find((c) => line.includes(c.id))
              if (!hit)
                return (
                  <span key={i} className="block">
                    {line}
                  </span>
                )
              const cc = COLOR_CLASSES[hit.color]
              return (
                <span
                  key={i}
                  className={cn(
                    'block cursor-pointer rounded-sm transition-colors',
                    selected === hit.id
                      ? cn(cc.bg, cc.text, 'font-bold')
                      : 'hover:bg-rail'
                  )}
                  onClick={() => setSelected(hit.id)}
                >
                  {line}
                </span>
              )
            })}
          </pre>
        </div>
        <p className="text-ink-3 mt-1.5 font-mono text-[10px]">{t.planNote}</p>
      </div>

      <Divider />

      <SectionTitle>{t.tqTitle}</SectionTitle>
      <Prose>{t.tqDesc}</Prose>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {t.tqCards.map((card) => {
          const cc = COLOR_CLASSES[card.color]
          const isActive = selected === card.id
          return (
            <button
              key={card.id}
              onClick={() => setSelected(card.id)}
              className={cn(
                'rounded-card border px-3.5 py-2.5 text-left transition-all',
                isActive
                  ? cn(cc.border, cc.bg)
                  : 'border-line bg-paper hover:border-line-2'
              )}
            >
              <p
                className={cn(
                  'font-mono text-[11px] font-bold',
                  isActive ? cc.text : 'text-ink'
                )}
              >
                {card.label}
              </p>
              <p className="text-ink-3 mt-0.5 font-mono text-[9.5px]">
                {isKo ? '실행계획' : 'plan'} {card.planLines}
              </p>
            </button>
          )
        })}
      </div>

      {selected && (
        <div
          className={cn(
            'rounded-card mt-3 border px-4 py-3',
            COLOR_CLASSES[t.tqCards.find((c) => c.id === selected)!.color]
              .border,
            COLOR_CLASSES[t.tqCards.find((c) => c.id === selected)!.color].bg
          )}
        >
          <p className="font-read text-ink text-[12.5px] leading-relaxed">
            {t.tqCards.find((c) => c.id === selected)!.detail}
          </p>
        </div>
      )}

      <Divider />

      <SectionTitle>{t.countTitle}</SectionTitle>
      <Prose>{t.countDesc}</Prose>
      <Table
        headers={
          isKo
            ? ['쿼리 형태', 'TQ 개수', '재분배 지점']
            : ['Query Shape', 'TQ Count', 'Redistribution Points']
        }
        rows={t.countTable}
      />

      <Divider />

      <SectionTitle>{t.readTitle}</SectionTitle>
      <Prose>{t.readDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.readSql} />
      </div>
      <InfoBox variant="note">{t.readNote}</InfoBox>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
