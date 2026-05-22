import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import {
  ChapterTitle, SectionTitle, Prose, InfoBox, Divider, SubTitle, SqlBlock,
} from '../../../../shared'
import { cn } from '@/lib/utils'
import { SgaPositionDiagram } from '../shared/SgaPositionDiagram'
import {
  IconBolt,
  IconSearch,
  IconTable,
  IconBox,
} from '@tabler/icons-react'

// ── Translation strings ────────────────────────────────────────────────────

const T = {
  ko: {
    title: 'Shared Pool',
    subtitle: 'SQL 파싱 결과와 메타데이터를 모든 세션이 공유하는 SGA 구성 요소',

    // ── What is ──
    whatTitle: 'Shared Pool이란?',
    whatP1: 'Shared Pool은 SGA 안에서 Buffer Cache 다음으로 중요한 메모리 영역입니다. 핵심 역할은 딱 하나입니다 — "같은 SQL을 다시 파싱하지 않는다."',
    whatP2: 'Oracle이 SQL 문장을 처음 받으면 문법 검사 → 권한 확인 → 실행 계획 수립의 과정을 거쳐야 합니다. 이 과정을 Hard Parse라고 하며 CPU를 많이 씁니다. Shared Pool은 그 결과물(파싱된 커서·실행 계획)을 캐시해 두었다가, 동일한 SQL이 다시 오면 이 캐시를 재사용(Soft Parse)하게 합니다.',
    whatP3: '단순히 SQL만 캐시하는 게 아닙니다. 테이블·컬럼·권한 등 데이터 딕셔너리 메타데이터, 쿼리 결과, PL/SQL 코드까지 하나의 공유 메모리 풀 안에서 관리됩니다.',

    // ── Components ──
    componentsTitle: 'Shared Pool의 구성',

    libTitle: 'Library Cache',
    libDesc: '파싱된 SQL 커서와 실행 계획을 저장하는 핵심 영역. Shared SQL Area, PL/SQL 컴파일 코드, Java 클래스 등이 포함됩니다. 모든 세션이 동일한 커서를 공유하므로, 100개 세션이 같은 SQL을 실행해도 실행 계획은 하나만 메모리에 존재합니다.',

    dictTitle: 'Data Dictionary Cache (Row Cache)',
    dictDesc: '테이블 정의, 컬럼 목록, 권한, 인덱스 정보 등 데이터 딕셔너리를 행(Row) 단위로 캐시합니다. SQL 파싱 때 "이 테이블이 있는지, 이 컬럼이 맞는지" 확인할 때 반드시 필요합니다. Row Cache라고도 부릅니다.',

    resultTitle: 'Server Result Cache',
    resultDesc: '쿼리의 실행 결과 자체를 캐시합니다. 동일한 쿼리가 다시 오면 재실행 없이 저장된 결과를 바로 반환합니다. 참조 객체가 변경되면 자동으로 무효화됩니다.',

    reservedTitle: 'Reserved Pool',
    reservedDesc: '5 KB 이상의 큰 메모리 청크가 필요할 때(대형 PL/SQL 패키지, 복잡한 실행 계획 등)를 위해 예약해 둔 영역. 일반 Shared Pool 영역이 단편화되더라도 큰 할당이 실패하지 않도록 보호합니다.',

    // ── Parse lifecycle ──
    parseTitle: 'SQL은 어떻게 처리되나? — Hard Parse vs Soft Parse',
    parseDesc: 'SQL이 Oracle에 도착하면 Library Cache를 먼저 검색합니다. 결과에 따라 완전히 다른 경로를 밟습니다.',

    hardTitle: 'Hard Parse — 처음 보는 SQL',
    hardDesc: 'Library Cache에 일치하는 커서가 없을 때 수행하는 전체 파싱 과정입니다. CPU를 집중적으로 사용합니다.',
    hardSteps: [
      { n: '1', label: '문법 검사 (Syntax Check)', desc: 'SELECT, FROM, WHERE 등 SQL 문법이 올바른지 확인합니다.' },
      { n: '2', label: '의미 검사 (Semantic Check)', desc: '테이블·컬럼이 실제로 존재하는지, 접근 권한이 있는지 Data Dictionary Cache에서 확인합니다.' },
      { n: '3', label: '실행 계획 생성 (Optimization)', desc: 'CBO(Cost-Based Optimizer)가 통계 정보를 바탕으로 여러 실행 계획의 비용을 추정하고 최선을 선택합니다.' },
      { n: '4', label: 'Library Cache에 저장', desc: '완성된 커서(파싱 트리 + 실행 계획)를 Shared SQL Area에 저장합니다. 이후 동일 SQL 재실행 시 재사용됩니다.' },
    ],

    softTitle: 'Soft Parse — 이미 캐시된 SQL',
    softDesc: 'Library Cache에 동일한 SQL이 있으면 단계 1~3을 건너뛰고 저장된 커서를 바로 재사용합니다. CPU 비용이 거의 없습니다.',
    softNote: 'Soft Parse가 되려면 SQL 문자열이 대소문자·공백·줄바꿈까지 완전히 일치해야 합니다. "SELECT * FROM EMP"와 "select * from emp"는 서로 다른 SQL로 각각 Hard Parse됩니다.',

    // ── Shared vs Private ──
    sharedPrivateTitle: 'Shared SQL Area vs Private SQL Area',
    sharedPrivateDesc: '하나의 SQL은 두 가지 메모리 영역을 동시에 사용합니다. SGA의 Shared SQL Area는 모든 세션이 공유하고, PGA의 Private SQL Area는 세션마다 독립적으로 존재합니다.',
    sharedAreaLabel: 'Shared SQL Area',
    sharedAreaDesc: '파싱 트리, 실행 계획, 최적화 정보 — 모든 세션이 공유하는 읽기 전용 영역. Library Cache에 저장됩니다.',
    privateAreaLabel: 'Private SQL Area',
    privateAreaDesc: '바인드 변수 값, 쿼리 실행 상태(Persistent Area + Runtime Area) — 서버 프로세스의 PGA에 저장됩니다.',
    sharedPrivateNote: '100개 세션이 같은 SQL을 실행하면 Shared SQL Area는 1개, Private SQL Area는 세션마다 1개씩 100개가 생깁니다. Shared Pool 덕분에 SQL 실행에 필요한 메모리가 크게 절약됩니다.',

    // ── Child cursor ──
    childCursorTitle: 'Parent Cursor와 Child Cursor',
    childCursorDesc: 'Library Cache의 커서는 두 단계로 구성됩니다. Parent Cursor는 SQL 텍스트 자체를 키로 갖는 해시 버킷 항목입니다. 하지만 같은 SQL 텍스트라도 실행 환경이 다르면(다른 스키마, 다른 최적화 파라미터, 다른 바인드 타입 등) 실행 계획이 달라질 수 있습니다. 이 경우 Oracle은 동일한 Parent 아래에 별도의 Child Cursor를 추가합니다.',
    childCursorItems: [
      { label: 'Parent Cursor', desc: 'SQL 텍스트의 해시값으로 찾는 항목. 텍스트가 같으면 항상 동일한 Parent를 가리킵니다.' },
      { label: 'Child Cursor #0', desc: '첫 번째 Hard Parse로 생성된 실행 계획. 대부분의 경우 여기에서 끝납니다.' },
      { label: 'Child Cursor #N', desc: '스키마·파라미터·바인드 타입 등의 차이로 인해 실행 계획이 달라질 때 추가됩니다.' },
    ],
    childCursorNote: 'Child Cursor가 너무 많이 생기는 현상(Version Count 급증)은 Hard Parse 폭증의 신호입니다. V$SQL의 VERSION_COUNT 컬럼으로 확인할 수 있습니다.',

    // ── Bind variables ──
    bindTitle: '바인드 변수와 Shared Pool',
    bindDesc: 'Shared Pool을 효율적으로 쓰려면 바인드 변수(:v1, :p1 등)를 사용해야 합니다.',
    bindBadSql: `-- Hard Parse 3번 발생 (리터럴 값이 다름)
SELECT * FROM employees WHERE employee_id = 100;
SELECT * FROM employees WHERE employee_id = 101;
SELECT * FROM employees WHERE employee_id = 102;`,
    bindGoodSql: `-- Soft Parse 2번 재사용 (바인드 변수로 통일)
SELECT * FROM employees WHERE employee_id = :id;
-- :id = 100 → Soft Parse
-- :id = 101 → Soft Parse
-- :id = 102 → Soft Parse`,
    bindNote: '리터럴 값(100, 101, 102)이 SQL 안에 그대로 들어가면 Oracle은 각각을 다른 SQL로 취급해 매번 Hard Parse합니다. 바인드 변수로 바꾸면 SQL 텍스트가 동일해지므로 첫 번째만 Hard Parse하고 이후는 모두 Soft Parse로 재사용합니다.',

    // ── Result Cache ──
    resultCacheTitle: 'Server Result Cache — 쿼리 결과까지 캐시',
    resultCacheP1: 'Library Cache가 실행 계획을 캐시한다면, Result Cache는 쿼리의 최종 결과 데이터 자체를 캐시합니다. 동일한 쿼리가 다시 오면 SQL을 아예 실행하지 않고 캐시된 결과를 바로 반환합니다.',
    resultCacheP2: '참조하는 테이블이 변경되면 Oracle이 자동으로 해당 캐시를 무효화합니다. 자주 조회되지만 잘 바뀌지 않는 집계 쿼리, 코드 테이블 조회 등에 효과적입니다.',
    resultCacheSql: `-- RESULT_CACHE 힌트로 결과 캐시 요청
SELECT /*+ RESULT_CACHE */ dept_id, COUNT(*) AS cnt
FROM   employees
GROUP  BY dept_id;`,
    resultCacheNote: 'RESULT_CACHE_MODE = FORCE 설정 시 모든 쿼리에 자동 적용됩니다. V$RESULT_CACHE_OBJECTS 뷰에서 캐시 현황을 확인할 수 있습니다.',

    // ── Parameters ──
    paramsTitle: '주요 파라미터',
    params: [
      { name: 'SHARED_POOL_SIZE', desc: 'Shared Pool 전체 크기. ASMM(SGA_TARGET 설정) 시 자동 조정됩니다.' },
      { name: 'SHARED_POOL_RESERVED_SIZE', desc: '예약 풀 크기. 보통 SHARED_POOL_SIZE의 10~30%로 설정합니다.' },
      { name: 'RESULT_CACHE_MODE', desc: 'Result Cache 동작 방식. OFF(기본) / MANUAL(힌트 사용) / FORCE(항상 캐시).' },
    ],

    // ── Summary ──
    summaryTitle: 'Shared Pool 핵심 정리',
    summaryItems: [
      'Library Cache: 파싱된 SQL 커서와 실행 계획을 캐시 — Hard Parse를 Soft Parse로 전환',
      'Data Dictionary Cache: 테이블·컬럼·권한 메타데이터를 행 단위로 캐시',
      'Server Result Cache: 쿼리 결과 자체를 캐시 — 재실행 없이 즉시 반환',
      'Reserved Pool: 큰 메모리 할당을 위한 예약 공간 — 단편화 방지',
      '바인드 변수 사용이 Shared Pool 효율의 핵심 — 리터럴 SQL은 Hard Parse를 반복 유발',
    ],
  },

  en: {
    title: 'Shared Pool',
    subtitle: 'The SGA component that lets all sessions share parsed SQL and metadata',

    whatTitle: 'What is the Shared Pool?',
    whatP1: 'The Shared Pool is the second most important memory area in the SGA after the Buffer Cache. Its core job is simple: "never re-parse the same SQL."',
    whatP2: 'When Oracle first receives a SQL statement it must go through syntax checking, privilege verification, and execution plan generation — a process called Hard Parse that is CPU-intensive. The Shared Pool caches the result (the parsed cursor and execution plan) so that when the identical SQL arrives again, Oracle can skip all that work and reuse the cache (Soft Parse).',
    whatP3: "It's not just SQL that gets cached. Table and column definitions, privileges, data dictionary metadata, query results, and PL/SQL code are all managed within this single shared memory pool.",

    componentsTitle: 'Shared Pool Components',

    libTitle: 'Library Cache',
    libDesc: 'The core area storing parsed SQL cursors and execution plans. Contains Shared SQL Areas, compiled PL/SQL code, and Java classes. Because every session shares the same cursor, 100 sessions running the same SQL result in only one execution plan stored in memory.',

    dictTitle: 'Data Dictionary Cache (Row Cache)',
    dictDesc: 'Caches data dictionary information — table definitions, column lists, privileges, index metadata — at the row level. This is consulted every time SQL is parsed to answer "does this table exist? do I have permission?" Also known as the Row Cache.',

    resultTitle: 'Server Result Cache',
    resultDesc: 'Caches the actual result set of a query. When the same query arrives again, Oracle returns the stored result immediately without re-executing. Automatically invalidated when any referenced object changes.',

    reservedTitle: 'Reserved Pool',
    reservedDesc: 'Reserved space for allocations larger than 5 KB — large PL/SQL packages, complex execution plans, etc. Protects large allocations from failing due to fragmentation in the general Shared Pool area.',

    parseTitle: 'How is SQL processed? — Hard Parse vs Soft Parse',
    parseDesc: 'When a SQL statement arrives, Oracle searches the Library Cache first. The path that follows depends entirely on what it finds.',

    hardTitle: 'Hard Parse — a SQL seen for the first time',
    hardDesc: 'The full parsing cycle performed when no matching cursor exists in the Library Cache. CPU-intensive.',
    hardSteps: [
      { n: '1', label: 'Syntax Check', desc: 'Verifies that the SQL uses correct grammar: valid keywords, balanced parentheses, proper clause order.' },
      { n: '2', label: 'Semantic Check', desc: 'Confirms that referenced tables and columns actually exist and that the session has permission to access them — all looked up in the Data Dictionary Cache.' },
      { n: '3', label: 'Optimization', desc: 'The CBO estimates the cost of multiple execution plans using statistics and selects the cheapest.' },
      { n: '4', label: 'Store in Library Cache', desc: 'The finished cursor (parse tree + execution plan) is stored in the Shared SQL Area for reuse by any future matching SQL.' },
    ],

    softTitle: 'Soft Parse — SQL already in the cache',
    softDesc: 'When the Library Cache contains a matching SQL, Oracle skips steps 1–3 and reuses the stored cursor directly. CPU cost is negligible.',
    softNote: 'For a Soft Parse to occur, the SQL text must match exactly — including case, whitespace, and line breaks. "SELECT * FROM EMP" and "select * from emp" are treated as different statements, each triggering its own Hard Parse.',

    sharedPrivateTitle: 'Shared SQL Area vs Private SQL Area',
    sharedPrivateDesc: 'Every SQL execution uses two memory areas simultaneously. The Shared SQL Area in the SGA is shared by all sessions; the Private SQL Area in each PGA is independent per session.',
    sharedAreaLabel: 'Shared SQL Area',
    sharedAreaDesc: 'Parse tree, execution plan, optimization metadata — a read-only area shared by all sessions. Stored in the Library Cache.',
    privateAreaLabel: 'Private SQL Area',
    privateAreaDesc: 'Bind variable values and query execution state (Persistent Area + Runtime Area) — stored in each server process\'s PGA.',
    sharedPrivateNote: 'When 100 sessions run the same SQL, there is 1 Shared SQL Area and 100 Private SQL Areas (one per session). The Shared Pool makes SQL execution dramatically more memory-efficient.',

    // ── Child cursor ──
    childCursorTitle: 'Parent Cursor and Child Cursor',
    childCursorDesc: 'Cursors in the Library Cache are two-level structures. A Parent Cursor is the hash-bucket entry keyed on the SQL text. However, even if the SQL text is identical, the execution plan may differ based on execution environment — different schema, different optimizer parameters, different bind variable types. In those cases, Oracle adds a new Child Cursor under the same Parent.',
    childCursorItems: [
      { label: 'Parent Cursor', desc: 'The entry found by hashing the SQL text. Same text always maps to the same Parent.' },
      { label: 'Child Cursor #0', desc: 'The execution plan created by the first Hard Parse. In most cases this is the only child.' },
      { label: 'Child Cursor #N', desc: 'Added when schema, parameters, or bind types differ enough to require a separate execution plan.' },
    ],
    childCursorNote: 'A rapidly growing child cursor count (high Version Count) is a signal of Hard Parse storms. Check V$SQL.VERSION_COUNT to diagnose.',

    bindTitle: 'Bind Variables and the Shared Pool',
    bindDesc: 'To use the Shared Pool efficiently, use bind variables (:v1, :p1, etc.).',
    bindBadSql: `-- 3 Hard Parses (each literal value is a different SQL)
SELECT * FROM employees WHERE employee_id = 100;
SELECT * FROM employees WHERE employee_id = 101;
SELECT * FROM employees WHERE employee_id = 102;`,
    bindGoodSql: `-- 1 Hard Parse, then Soft Parse for every subsequent call
SELECT * FROM employees WHERE employee_id = :id;
-- :id = 100 → Soft Parse
-- :id = 101 → Soft Parse
-- :id = 102 → Soft Parse`,
    bindNote: 'Literal values embedded in SQL (100, 101, 102) cause Oracle to treat each as a distinct statement, triggering a Hard Parse every time. Switching to a bind variable makes the SQL text identical, so only the first execution Hard Parses — all subsequent calls are Soft Parses.',

    resultCacheTitle: 'Server Result Cache — caching the result itself',
    resultCacheP1: 'While the Library Cache stores execution plans, the Result Cache stores the actual result data from a query. When the same query arrives again, Oracle skips execution entirely and returns the cached result immediately.',
    resultCacheP2: 'If any table the query references is modified, Oracle automatically invalidates the relevant cache entry. Most effective for frequently read, rarely changed queries such as aggregate reports and lookup table scans.',
    resultCacheSql: `-- Request result caching with the RESULT_CACHE hint
SELECT /*+ RESULT_CACHE */ dept_id, COUNT(*) AS cnt
FROM   employees
GROUP  BY dept_id;`,
    resultCacheNote: 'Set RESULT_CACHE_MODE = FORCE to apply caching automatically to all queries. Check current cache entries in V$RESULT_CACHE_OBJECTS.',

    paramsTitle: 'Key Parameters',
    params: [
      { name: 'SHARED_POOL_SIZE', desc: 'Total Shared Pool size. Auto-tuned when ASMM is active (SGA_TARGET set).' },
      { name: 'SHARED_POOL_RESERVED_SIZE', desc: 'Reserved Pool size. Typically 10–30% of SHARED_POOL_SIZE.' },
      { name: 'RESULT_CACHE_MODE', desc: 'Result Cache behavior: OFF (default) / MANUAL (use hint) / FORCE (always cache).' },
    ],

    summaryTitle: 'Shared Pool — Key Takeaways',
    summaryItems: [
      'Library Cache: caches parsed cursors and execution plans — converts Hard Parses into Soft Parses',
      'Data Dictionary Cache: caches table/column/privilege metadata at row granularity',
      'Server Result Cache: caches the actual query result — returns it without re-executing',
      'Reserved Pool: reserved space for large allocations — prevents fragmentation failures',
      'Bind variables are the key to Shared Pool efficiency — literal SQL causes repeated Hard Parses',
    ],
  },
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ComponentCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  color: 'violet' | 'slate' | 'amber' | 'emerald'
}) {
  const cls = {
    violet: { bg: 'bg-violet-50/60', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
    slate:  { bg: 'bg-slate-50/60',  border: 'border-slate-200',  badge: 'bg-slate-100 text-slate-600' },
    amber:  { bg: 'bg-amber-50/60',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
    emerald:{ bg: 'bg-emerald-50/60',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700' },
  }[color]

  return (
    <div className={cn('rounded-xl border p-4', cls.bg, cls.border)}>
      <div className="mb-2 flex items-center gap-2">
        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', cls.badge)}>{icon}</span>
        <span className="text-sm font-bold">{title}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  )
}

type ParseMode = 'hard' | 'soft'

function ParseSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [mode, setMode] = useState<ParseMode>('hard')

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(['hard', 'soft'] as ParseMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-lg border px-4 py-2 text-xs font-bold transition-all',
              mode === m
                ? m === 'hard'
                  ? 'border-rose-400 bg-rose-500 text-white shadow-sm'
                  : 'border-emerald-400 bg-emerald-500 text-white shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'hard' ? t.hardTitle : t.softTitle}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden rounded-xl border bg-card"
        >
          {mode === 'hard' ? (
            <>
              <div className="flex items-center gap-2.5 border-b bg-rose-50/60 px-5 py-3">
                <span className="rounded bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">Hard Parse</span>
                <span className="text-sm font-bold text-foreground">{t.hardDesc}</span>
              </div>
              <div className="space-y-0 divide-y divide-border/50">
                {t.hardSteps.map((s) => (
                  <div key={s.n} className="flex items-start gap-4 px-5 py-3.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 font-mono text-[11px] font-bold text-white">
                      {s.n}
                    </span>
                    <div>
                      <div className="mb-0.5 text-sm font-semibold text-foreground">{s.label}</div>
                      <div className="text-xs leading-relaxed text-muted-foreground">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 border-b bg-emerald-50/60 px-5 py-3">
                <span className="rounded bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">Soft Parse</span>
                <span className="text-sm font-bold text-foreground">{t.softDesc}</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-mono text-[11px] font-bold text-white">✓</span>
                  <span className="text-sm text-muted-foreground">{lang === 'ko' ? 'Library Cache 검색 → 커서 발견 → 재사용' : 'Library Cache search → cursor found → reuse'}</span>
                </div>
                <div className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  💡 {t.softNote}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// SVG layout constants
const SP_W = 680
const SP_H = 420

// SGA box (left side)
const SGA_X = 24
const SGA_Y = 24
const SGA_W = 240
const SGA_H = 300

// Shared SQL Area inside SGA
const SHARED_X = SGA_X + 16
const SHARED_Y = SGA_Y + 44
const SHARED_W = SGA_W - 32
const SHARED_H = 220

// Parse tree + plan blocks inside Shared SQL Area
const BLOCK_Y1 = SHARED_Y + 44
const BLOCK_Y2 = SHARED_Y + 112
const BLOCK_Y3 = SHARED_Y + 168
const BLOCK_X = SHARED_X + 12
const BLOCK_W = SHARED_W - 24
const BLOCK_H = 36

// PGA boxes (right side) — 3 sessions
const PGA_X = 420
const PGA_W = 220
const PGA_H = 96
const PGA_GAP = 20
const PGA_SESSIONS = [
  { y: 24,                         label: 'Session 1' },
  { y: 24 + PGA_H + PGA_GAP,      label: 'Session 2' },
  { y: 24 + (PGA_H + PGA_GAP) * 2, label: 'Session 3' },
]

// Private SQL Area inside each PGA
const PRIV_X = PGA_X + 12
const PRIV_W = PGA_W - 24

// Arrow endpoints
const SHARED_RIGHT_X = SHARED_X + SHARED_W
const SHARED_MID_Y = SHARED_Y + SHARED_H / 2

function SharedPrivateSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <div className="space-y-4">
      {/* SVG Diagram */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <svg
          viewBox={`0 0 ${SP_W} ${SP_H}`}
          width="100%"
          style={{ maxWidth: SP_W, display: 'block', margin: '0 auto' }}
        >
          <defs>
            <marker id="spArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#7c3aed" />
            </marker>
          </defs>

          {/* ── SGA box ── */}
          <rect x={SGA_X} y={SGA_Y} width={SGA_W} height={SGA_H} rx={10}
            fill="#f5f3ff" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="6 3" />
          <text x={SGA_X + 12} y={SGA_Y + 22} fontFamily="monospace" fontSize={9}
            fontWeight="bold" fill="#7c3aed" letterSpacing={1}>SGA — Library Cache</text>

          {/* ── Shared SQL Area box ── */}
          <rect x={SHARED_X} y={SHARED_Y} width={SHARED_W} height={SHARED_H} rx={7}
            fill="#ede9fe" stroke="#7c3aed" strokeWidth={1.5} />
          <text x={SHARED_X + 10} y={SHARED_Y + 18} fontFamily="monospace" fontSize={8.5}
            fontWeight="bold" fill="#5b21b6">{t.sharedAreaLabel}</text>
          <text x={SHARED_X + 10} y={SHARED_Y + 30} fontFamily="monospace" fontSize={7.5}
            fill="#7c3aed" opacity={0.7}>{isKo ? '(모든 세션 공유 · 읽기 전용)' : '(shared · read-only)'}</text>

          {/* Parse tree block */}
          <rect x={BLOCK_X} y={BLOCK_Y1} width={BLOCK_W} height={BLOCK_H} rx={4}
            fill="#ddd6fe" stroke="#a78bfa" strokeWidth={1} />
          <text x={BLOCK_X + BLOCK_W / 2} y={BLOCK_Y1 + 17} fontFamily="monospace" fontSize={8}
            fontWeight="bold" fill="#4c1d95" textAnchor="middle">
            {isKo ? 'Parse Tree (파싱 트리)' : 'Parse Tree'}
          </text>

          {/* Execution plan block */}
          <rect x={BLOCK_X} y={BLOCK_Y2} width={BLOCK_W} height={BLOCK_H} rx={4}
            fill="#ddd6fe" stroke="#a78bfa" strokeWidth={1} />
          <text x={BLOCK_X + BLOCK_W / 2} y={BLOCK_Y2 + 17} fontFamily="monospace" fontSize={8}
            fontWeight="bold" fill="#4c1d95" textAnchor="middle">
            {isKo ? 'Execution Plan (실행 계획)' : 'Execution Plan'}
          </text>

          {/* Optimization metadata block */}
          <rect x={BLOCK_X} y={BLOCK_Y3} width={BLOCK_W} height={BLOCK_H} rx={4}
            fill="#ddd6fe" stroke="#a78bfa" strokeWidth={1} />
          <text x={BLOCK_X + BLOCK_W / 2} y={BLOCK_Y3 + 17} fontFamily="monospace" fontSize={8}
            fontWeight="bold" fill="#4c1d95" textAnchor="middle">
            {isKo ? 'Optimization Info' : 'Optimization Info'}
          </text>

          {/* ── PGA boxes + Private SQL Areas ── */}
          {PGA_SESSIONS.map((sess, i) => {
            const privY = sess.y + 32
            const privH = PGA_H - 40
            const privMidY = privY + privH / 2

            // Arrow: from left edge of private area → right edge of shared area
            const arrowStartX = PRIV_X
            const arrowStartY = privMidY
            const arrowEndX = SHARED_RIGHT_X + 2
            const arrowEndY = SHARED_MID_Y + (i - 1) * 28

            // Cubic bezier: control points curve through the middle
            const cp1x = arrowStartX - 60
            const cp1y = arrowStartY
            const cp2x = arrowEndX + 60
            const cp2y = arrowEndY

            return (
              <g key={sess.label}>
                {/* PGA outer box */}
                <rect x={PGA_X} y={sess.y} width={PGA_W} height={PGA_H} rx={8}
                  fill="#eff6ff" stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="5 3" />
                <text x={PGA_X + 12} y={sess.y + 18} fontFamily="monospace" fontSize={8.5}
                  fontWeight="bold" fill="#1d4ed8">PGA — {sess.label}</text>

                {/* Private SQL Area inner box */}
                <rect x={PRIV_X} y={privY} width={PRIV_W} height={privH} rx={5}
                  fill="#dbeafe" stroke="#60a5fa" strokeWidth={1} />
                <text x={PRIV_X + PRIV_W / 2} y={privY + 13} fontFamily="monospace" fontSize={7.5}
                  fontWeight="bold" fill="#1e40af" textAnchor="middle">{t.privateAreaLabel}</text>
                <text x={PRIV_X + PRIV_W / 2} y={privY + 25} fontFamily="monospace" fontSize={7}
                  fill="#3b82f6" textAnchor="middle">
                  {isKo ? 'bind vars · exec state' : 'bind vars · exec state'}
                </text>

                {/* Arrow from Private → Shared */}
                <path
                  d={`M ${arrowStartX},${arrowStartY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${arrowEndX},${arrowEndY}`}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  markerEnd="url(#spArrow)"
                />

                {/* Pointer label on arrow */}
                <text
                  x={(arrowStartX + arrowEndX) / 2}
                  y={(arrowStartY + arrowEndY) / 2 - 5}
                  fontFamily="monospace"
                  fontSize={7}
                  fill="#7c3aed"
                  textAnchor="middle"
                >
                  {isKo ? '포인터' : 'pointer'}
                </text>
              </g>
            )
          })}

          {/* ── Legend ── */}
          <rect x={SGA_X} y={376} width={14} height={8} rx={2}
            fill="#ddd6fe" stroke="#a78bfa" strokeWidth={1} />
          <text x={SGA_X + 18} y={384} fontFamily="monospace" fontSize={8}
            fill="#6b7280">{isKo ? 'Shared SQL Area (1개)' : 'Shared SQL Area (×1)'}</text>

          <rect x={PGA_X} y={376} width={14} height={8} rx={2}
            fill="#dbeafe" stroke="#60a5fa" strokeWidth={1} />
          <text x={PGA_X + 18} y={384} fontFamily="monospace" fontSize={8}
            fill="#6b7280">{isKo ? 'Private SQL Area (세션마다 1개)' : 'Private SQL Area (×1 per session)'}</text>
        </svg>
      </div>

      {/* Description cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border-2 border-violet-200 bg-violet-50/50 px-4 py-3">
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-violet-500">SGA · Library Cache</div>
          <div className="mb-1 text-sm font-bold text-violet-800">{t.sharedAreaLabel}</div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.sharedAreaDesc}</p>
        </div>
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 px-4 py-3">
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-blue-400">PGA · per session</div>
          <div className="mb-1 text-sm font-bold text-blue-700">{t.privateAreaLabel}</div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.privateAreaDesc}</p>
        </div>
      </div>

      <div className="rounded-lg bg-violet-50/40 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground border border-violet-100">
        💡 {t.sharedPrivateNote}
      </div>
    </div>
  )
}

function ChildCursorSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const isKo = lang === 'ko'

  // SVG layout
  const W = 640
  const H = 220

  // Parent cursor box
  const PAR_X = 40
  const PAR_Y = 40
  const PAR_W = 160
  const PAR_H = 48

  // Child cursor boxes
  const CHILD_Y = 140
  const CHILD_H = 48
  const CHILD_W = 140
  const children = [
    { x: 24,  label: 'Child #0', color: '#6d28d9', bg: '#ede9fe', border: '#a78bfa', desc: isKo ? '기본 실행 계획' : 'default plan' },
    { x: 200, label: 'Child #1', color: '#1d4ed8', bg: '#dbeafe', border: '#60a5fa', desc: isKo ? '다른 스키마' : 'diff schema' },
    { x: 376, label: 'Child #2', color: '#065f46', bg: '#d1fae5', border: '#34d399', desc: isKo ? '다른 파라미터' : 'diff params' },
    { x: 490, label: 'Child #N', color: '#9f1239', bg: '#ffe4e6', border: '#fca5a5', desc: isKo ? '…' : '…' },
  ]

  return (
    <div className="space-y-4">
      <Prose>{t.childCursorDesc}</Prose>

      {/* SVG */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
          <defs>
            <marker id="childArrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#7c3aed" opacity={0.7} />
            </marker>
          </defs>

          {/* SQL text hash label */}
          <text x={PAR_X} y={PAR_Y - 10} fontFamily="monospace" fontSize={8} fill="#9ca3af">
            hash({isKo ? 'SQL 텍스트' : 'SQL text'})
          </text>

          {/* Parent cursor box */}
          <rect x={PAR_X} y={PAR_Y} width={PAR_W} height={PAR_H} rx={7}
            fill="#ede9fe" stroke="#7c3aed" strokeWidth={2} />
          <text x={PAR_X + PAR_W / 2} y={PAR_Y + 18} fontFamily="monospace" fontSize={9}
            fontWeight="bold" fill="#4c1d95" textAnchor="middle">Parent Cursor</text>
          <text x={PAR_X + PAR_W / 2} y={PAR_Y + 32} fontFamily="monospace" fontSize={7.5}
            fill="#7c3aed" textAnchor="middle">
            {isKo ? '"SELECT * FROM emp WHERE …"' : '"SELECT * FROM emp WHERE …"'}
          </text>

          {/* Lines from parent to each child */}
          {children.map((c) => {
            const childMidX = c.x + CHILD_W / 2
            const parMidX = PAR_X + PAR_W / 2
            return (
              <line
                key={c.label}
                x1={parMidX} y1={PAR_Y + PAR_H}
                x2={childMidX} y2={CHILD_Y}
                stroke="#7c3aed" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.6}
                markerEnd="url(#childArrow)"
              />
            )
          })}

          {/* "Child Cursors" label */}
          <text x={PAR_X + PAR_W + 16} y={CHILD_Y + CHILD_H / 2 + 4} fontFamily="monospace"
            fontSize={8} fill="#9ca3af" transform={`rotate(-90, ${PAR_X + PAR_W + 16}, ${CHILD_Y + CHILD_H / 2 + 4})`}>
          </text>

          {/* Child cursor boxes */}
          {children.map((c) => (
            <g key={c.label}>
              <rect x={c.x} y={CHILD_Y} width={CHILD_W} height={CHILD_H} rx={6}
                fill={c.bg} stroke={c.border} strokeWidth={1.5} />
              <text x={c.x + CHILD_W / 2} y={CHILD_Y + 18} fontFamily="monospace" fontSize={8.5}
                fontWeight="bold" fill={c.color} textAnchor="middle">{c.label}</text>
              <text x={c.x + CHILD_W / 2} y={CHILD_Y + 32} fontFamily="monospace" fontSize={7.5}
                fill={c.color} textAnchor="middle" opacity={0.8}>{c.desc}</text>
            </g>
          ))}

          {/* VERSION_COUNT label */}
          <text x={W - 12} y={CHILD_Y + CHILD_H / 2 + 4} fontFamily="monospace" fontSize={7.5}
            fill="#6b7280" textAnchor="end">
            {isKo ? '→ VERSION_COUNT (V$SQL)' : '→ VERSION_COUNT (V$SQL)'}
          </text>
        </svg>
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {t.childCursorItems.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-lg border bg-card px-4 py-2.5">
            <code className="mt-0.5 shrink-0 rounded bg-violet-100 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-700">
              {item.label}
            </code>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <InfoBox variant="warning">{t.childCursorNote}</InfoBox>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function SharedPoolSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle title={t.title} subtitle={t.subtitle} />

      <SgaPositionDiagram activeId="shared-pool" />

      {/* ── What is Shared Pool ── */}
      <SectionTitle>{t.whatTitle}</SectionTitle>
      <div className="space-y-2 mb-6">
        <Prose>{t.whatP1}</Prose>
        <Prose>{t.whatP2}</Prose>
        <Prose>{t.whatP3}</Prose>
      </div>

      <Divider />

      {/* ── Components ── */}
      <SectionTitle>{t.componentsTitle}</SectionTitle>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ComponentCard
          icon={<IconSearch size={14} stroke={1.5} />}
          title={t.libTitle}
          desc={t.libDesc}
          color="violet"
        />
        <ComponentCard
          icon={<IconTable size={14} stroke={1.5} />}
          title={t.dictTitle}
          desc={t.dictDesc}
          color="slate"
        />
        <ComponentCard
          icon={<IconBolt size={14} stroke={1.5} />}
          title={t.resultTitle}
          desc={t.resultDesc}
          color="amber"
        />
        <ComponentCard
          icon={<IconBox size={14} stroke={1.5} />}
          title={t.reservedTitle}
          desc={t.reservedDesc}
          color="emerald"
        />
      </div>

      <Divider />

      {/* ── Parse lifecycle ── */}
      <SectionTitle>{t.parseTitle}</SectionTitle>
      <Prose className="mb-4">{t.parseDesc}</Prose>
      <ParseSection lang={lang} />

      <Divider />

      {/* ── Shared vs Private SQL Area ── */}
      <SectionTitle>{t.sharedPrivateTitle}</SectionTitle>
      <Prose className="mb-4">{t.sharedPrivateDesc}</Prose>
      <SharedPrivateSection lang={lang} />

      <Divider />

      {/* ── Child Cursor ── */}
      <SectionTitle>{t.childCursorTitle}</SectionTitle>
      <ChildCursorSection lang={lang} />

      <Divider />

      {/* ── Bind variables ── */}
      <SectionTitle>{t.bindTitle}</SectionTitle>
      <Prose className="mb-4">{t.bindDesc}</Prose>
      <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SqlBlock
          badge={lang === 'ko' ? '비권장' : 'Avoid'}
          badgeColor="rose"
          desc={lang === 'ko' ? '리터럴 값 → Hard Parse 반복' : 'Literal values → repeated Hard Parse'}
          sql={t.bindBadSql}
        />
        <SqlBlock
          badge={lang === 'ko' ? '권장' : 'Preferred'}
          badgeColor="emerald"
          desc={lang === 'ko' ? '바인드 변수 → Soft Parse 재사용' : 'Bind variables → Soft Parse reuse'}
          sql={t.bindGoodSql}
        />
      </div>
      <InfoBox variant="note">{t.bindNote}</InfoBox>

      <Divider />

      {/* ── Result Cache ── */}
      <SectionTitle>{t.resultCacheTitle}</SectionTitle>
      <Prose className="mb-2">{t.resultCacheP1}</Prose>
      <Prose className="mb-4">{t.resultCacheP2}</Prose>
      <SqlBlock sql={t.resultCacheSql} />
      <div className="mt-3">
        <InfoBox variant="tip">{t.resultCacheNote}</InfoBox>
      </div>

      <Divider />

      {/* ── Parameters ── */}
      <SectionTitle>{t.paramsTitle}</SectionTitle>
      <div className="mb-6 overflow-hidden rounded-xl border bg-card">
        {t.params.map((p, i) => (
          <div key={p.name} className={cn('flex items-start gap-4 px-5 py-3', i > 0 && 'border-t')}>
            <code className="mt-0.5 shrink-0 rounded bg-violet-100 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-700">
              {p.name}
            </code>
            <p className="text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Summary ── */}
      <div className="rounded-2xl border bg-gradient-to-br from-slate-50 to-violet-50/30 px-6 py-5">
        <div className="mb-3"><SubTitle>{t.summaryTitle}</SubTitle></div>
        <ul className="space-y-1.5">
          {t.summaryItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
