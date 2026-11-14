// ─── SQL Console (아래) ───────────────────────────────────────────────────
// SQL 입력 + 예제 + 인스턴스 명령(Checkpoint · Flush · Restart) + SQL*Plus 식 결과 한 줄.

import { useRef, useState } from 'react'
import { useInternalsStore } from '@/store/internalsStore'
import { useLangStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'

// ── SQL syntax highlighter ────────────────────────────────────────────────

const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|AS|DISTINCT|ORDER|BY|GROUP|HAVING|FETCH|FIRST|ROWS|ONLY|ROWNUM|INSERT|INTO|VALUES|UPDATE|SET|DELETE|COMMIT|ROLLBACK|ASC|DESC|COUNT|SUM|AVG|MIN|MAX|NVL|UPPER|LOWER)\b/gi
const SQL_NUMBERS = /\b\d+(\.\d+)?\b/g
const SQL_BINDS = /:[A-Za-z_]\w*/g

function highlightSQL(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped
    .split(/('[^']*')/g)
    .map((part, i) => {
      if (i % 2 === 1) return `<span class="text-sy-str">${part}</span>`
      return part
        .replace(SQL_BINDS, (m) => `<span class="text-sy-fn">${m}</span>`)
        .replace(SQL_NUMBERS, (m) => `<span class="text-sy-num">${m}</span>`)
        .replace(SQL_KEYWORDS, (m) => `<span class="text-sy-kw font-bold">${m}</span>`)
    })
    .join('')
}

// ── Examples ──────────────────────────────────────────────────────────────

const EXAMPLES: { ko: string; en: string; sql: string }[] = [
  { ko: 'Full Scan', en: 'Full scan', sql: 'SELECT * FROM employees' },
  { ko: 'PK 조회', en: 'PK lookup', sql: 'SELECT first_name, salary FROM employees WHERE employee_id = 100' },
  { ko: '리터럴만 변경', en: 'Literal changed', sql: 'SELECT first_name, salary FROM employees WHERE employee_id = 101' },
  { ko: '바인드 변수', en: 'Bind variable', sql: 'SELECT first_name, salary FROM employees WHERE employee_id = :id' },
  { ko: '인덱스 범위', en: 'Index range', sql: 'SELECT last_name FROM employees WHERE department_id = 60' },
  { ko: '조인', en: 'Join', sql: 'SELECT e.last_name, d.department_name FROM employees e JOIN departments d ON e.department_id = d.department_id WHERE e.salary > 10000' },
  { ko: '집계 + 정렬', en: 'Group + sort', sql: 'SELECT department_id, COUNT(*) FROM employees GROUP BY department_id ORDER BY department_id' },
  { ko: 'COUNT(*)', en: 'COUNT(*)', sql: 'SELECT COUNT(*) FROM employees' },
  { ko: '서브쿼리', en: 'Subquery', sql: 'SELECT last_name FROM employees WHERE department_id IN (SELECT department_id FROM departments WHERE location_id = 1700)' },
  { ko: 'Top-N', en: 'Top-N', sql: 'SELECT last_name, salary FROM employees ORDER BY salary DESC FETCH FIRST 3 ROWS ONLY' },
  { ko: 'ROWNUM', en: 'ROWNUM', sql: 'SELECT * FROM employees WHERE ROWNUM <= 5' },
  { ko: 'UPDATE', en: 'UPDATE', sql: 'UPDATE employees SET salary = salary * 1.1 WHERE department_id = 60' },
  { ko: 'COMMIT', en: 'COMMIT', sql: 'COMMIT' },
  { ko: 'ROLLBACK', en: 'ROLLBACK', sql: 'ROLLBACK' },
  { ko: '문법 오류', en: 'Syntax error', sql: 'SELECT * FORM employees' },
  { ko: '없는 테이블', en: 'Missing table', sql: 'SELECT * FROM employee' },
]

const T = {
  ko: {
    run: '실행', examples: '예제',
    checkpoint: 'Checkpoint', flushBuffer: 'Buffer Cache 비우기', flushPool: 'Shared Pool 비우기', restart: '인스턴스 재시작',
    checkpointTip: 'ALTER SYSTEM CHECKPOINT — Dirty 버퍼를 Data File 에 써요',
    flushBufferTip: 'ALTER SYSTEM FLUSH BUFFER_CACHE — 다음 SQL 이 블록을 디스크에서 다시 읽어요',
    flushPoolTip: 'ALTER SYSTEM FLUSH SHARED_POOL — 다음 SQL 이 Hard Parse 부터 다시 해요',
    restartTip: '모든 캐시와 통계를 처음 상태로 되돌려요',
    hint: 'Ctrl + Enter 로 실행 · HR / CO 스키마의 테이블을 쓸 수 있어요 (Schema / ERD 탭 참고)',
    running: '처리 중…',
  },
  en: {
    run: 'Run', examples: 'Examples',
    checkpoint: 'Checkpoint', flushBuffer: 'Flush buffer cache', flushPool: 'Flush shared pool', restart: 'Restart instance',
    checkpointTip: 'ALTER SYSTEM CHECKPOINT — writes dirty buffers to the data files',
    flushBufferTip: 'ALTER SYSTEM FLUSH BUFFER_CACHE — the next SQL rereads its blocks from disk',
    flushPoolTip: 'ALTER SYSTEM FLUSH SHARED_POOL — the next SQL starts again from a hard parse',
    restartTip: 'Resets every cache and statistic to the initial state',
    hint: 'Ctrl + Enter to run · tables of the HR / CO schemas are available (see the Schema / ERD tab)',
    running: 'processing…',
  },
}

const BTN = 'shrink-0 rounded-card border px-2.5 py-1.5 font-mono text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const GHOST = 'border-line bg-paper text-ink-2 hover:bg-rail hover:text-ink'

export function SqlConsole() {
  const [input, setInput] = useState('')
  const trace = useInternalsStore((s) => s.trace)
  const atEnd = useInternalsStore((s) => s.trace !== null && s.cursor >= s.trace.steps.length - 1)
  const { run, command, restart } = useInternalsStore.getState()
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const handleRun = () => run(input)

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-line-2 bg-paper px-3 py-2.5">
      {/* 예제 */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <span className="shrink-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-2">{t.examples}</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.sql}
            onClick={() => { setInput(ex.sql); textareaRef.current?.focus() }}
            title={ex.sql}
            className="shrink-0 whitespace-nowrap rounded-chip border border-line bg-paper px-2 py-0.5 font-sans text-[11px] text-ink-2 transition-colors hover:border-line-2 hover:bg-rail hover:text-ink"
          >
            {ex[lang]}
          </button>
        ))}
      </div>

      {/* 입력 */}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span className="absolute left-3 top-2 z-10 font-mono text-sm font-bold text-amber">SQL&gt;</span>
          <div
            ref={highlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-card border border-transparent bg-code-bg py-2 pl-14 pr-3 font-mono text-[13px] leading-[1.45rem] text-ink"
            dangerouslySetInnerHTML={{ __html: highlightSQL(input) }}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun() }}
            onScroll={syncScroll}
            placeholder="SELECT * FROM employees"
            rows={2}
            spellCheck={false}
            className="relative block w-full resize-none rounded-card border border-code-border bg-transparent py-2 pl-14 pr-3 font-mono text-[13px] leading-[1.45rem] text-transparent caret-ink outline-none transition-all placeholder:text-ink-3 focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <button
          onClick={handleRun}
          disabled={!input.trim()}
          className={cn(BTN, 'self-stretch border-blue bg-blue px-4 font-sans text-xs font-semibold text-white hover:opacity-90')}
        >
          {t.run} ⏎
        </button>
      </div>

      {/* 결과 한 줄 + 인스턴스 명령 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="min-w-0 flex-1 truncate font-mono text-[11.5px]">
          {!trace && <span className="font-sans text-[11px] text-ink-3">{t.hint}</span>}
          {trace && !atEnd && <span className="text-ink-3">{t.running}</span>}
          {trace && atEnd && (
            <span className={trace.error ? 'text-red' : 'text-green'} title={trace.outcome[lang]}>
              {trace.outcome[lang]}
            </span>
          )}
        </div>
        <button onClick={() => command('checkpoint')} title={t.checkpointTip} className={cn(BTN, GHOST)}>{t.checkpoint}</button>
        <button onClick={() => command('flush-buffer-cache')} title={t.flushBufferTip} className={cn(BTN, GHOST)}>{t.flushBuffer}</button>
        <button onClick={() => command('flush-shared-pool')} title={t.flushPoolTip} className={cn(BTN, GHOST)}>{t.flushPool}</button>
        <button onClick={restart} title={t.restartTip} className={cn(BTN, 'border-transparent text-ink-3 hover:bg-rail hover:text-ink')}>{t.restart}</button>
      </div>
    </div>
  )
}
