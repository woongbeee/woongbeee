import { useState } from 'react'
import { motion } from 'framer-motion'
import { IconArrowMerge } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Divider,
  SqlBlock,
  StepList,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: 'Hash Join',
    subtitle: '작은 테이블(빌드 입력)을 해시 테이블로 PGA에 적재한 뒤, 큰 테이블(프로브 입력)을 스캔하면서 해시 키로 매칭하는 조인이에요.',

    whatTitle: 'Hash Join이란?',
    whatDesc:
      'Hash Join은 해시 함수를 조인 키에 적용해서 두 데이터 집합을 결합해요. Build Phase와 Probe Phase 두 단계로 동작해요.\n\n빌드 단계에서 Oracle은 더 작은 데이터 집합(빌드 입력)을 스캔하고, 조인 키에 해시 함수를 적용한 후 PGA에 해시 테이블을 구축해요. 프로브 단계에서는 더 큰 데이터 집합(프로브 입력)을 스캔하면서 동일한 해시 함수를 적용해 해시 테이블을 탐색하고 일치하는 행을 반환해요.\n\nHash Join은 반드시 등치(=) 조인 조건이 있어야 해요.',

    buildTitle: 'Build Phase — 해시 테이블 구축',
    buildSteps: [
      { title: '빌드 입력 전체 스캔', desc: '더 작은 테이블(빌드 입력)을 전체 스캔해요.' },
      { title: '해시 함수 적용', desc: '각 행의 조인 키에 해시 함수를 적용해요.' },
      { title: 'PGA 해시 테이블 저장', desc: '결과를 PGA의 해시 테이블에 저장해요. 해시 충돌은 연결 리스트로 처리해요.' },
      { title: '해시 테이블 완성', desc: '빌드 입력 전체를 읽고 나면 해시 테이블이 완성돼요.' },
    ],

    probeTitle: 'Probe Phase — 해시 테이블 탐색',
    probeSteps: [
      { title: '프로브 입력 전체 스캔', desc: '더 큰 테이블(프로브 입력)을 전체 스캔해요.' },
      { title: '동일한 해시 함수 적용', desc: '각 행의 조인 키에 동일한 해시 함수를 적용해요.' },
      { title: '버킷 탐색', desc: '해시 테이블의 해당 버킷을 탐색해서 일치하는 행을 찾아요.' },
      { title: '결과 집합에 추가', desc: '일치하는 행을 결과 집합에 추가해요.' },
    ],

    memoryTitle: 'PGA 메모리가 부족할 때',
    memoryDesc:
      '해시 테이블이 PGA에 들어가지 않으면 Oracle은 임시 테이블스페이스(temporary tablespace)를 사용해요.\n\n① 빌드 입력을 파티션으로 나눠 디스크에 기록해요.\n② 프로브 입력을 스캔할 때, 메모리에 있는 파티션과 매칭되는 행은 즉시 조인하고, 디스크에 있는 파티션과 매칭되는 행은 임시 공간에 기록해요.\n③ 디스크에 있는 각 파티션 쌍을 읽어서 조인해요.\n\n이 경우에도 각 데이터 집합은 최대 두 번(메모리 + 디스크 재읽기)만 읽어요.',

    hintTitle: '힌트로 제어하기',
    hintSql: `-- Hash Join 강제
SELECT /*+ USE_HASH(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Hash Join 방지
SELECT /*+ NO_USE_HASH(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,

    simTitle: 'Hash Join 시뮬레이션',
    simBuildPhase: '1. Build Phase',
    simProbePhase: '2. Probe Phase',
    simBuildTable: '빌드 테이블 (EMPLOYEES)',
    simHashTable: 'Hash Table (PGA)',
    simProbeTable: '프로브 테이블 (DEPARTMENTS)',
    simResult: '매칭 결과',
    simPrev: '이전',
    simNext: '다음',
    simMatch: '매칭',
    simNoMatch: '매칭 없음',

    summaryTitle: 'Hash Join 핵심 정리',
    summaryItems: [
      'Build Phase: 작은 테이블을 PGA 해시 테이블로 적재. Probe Phase: 큰 테이블을 스캔하며 해시 키로 매칭해요.',
      '등치(=) 조인 조건에서만 사용 가능해요.',
      '두 데이터 집합을 각각 한 번만 읽으므로 대용량 조인에 효율적이에요.',
      'PGA 메모리가 부족하면 임시 테이블스페이스를 사용하지만 각 집합을 최대 두 번만 읽어요.',
      '힌트: USE_HASH(테이블) (강제), NO_USE_HASH(테이블) (방지).',
    ],
  },
  en: {
    title: 'Hash Join',
    subtitle: 'Loads the smaller table (build input) into a hash table in PGA, then scans the larger table (probe input) matching by hash key.',

    whatTitle: 'What Is a Hash Join?',
    whatDesc:
      'A Hash Join applies a hash function to the join key to combine two datasets. It operates in two phases: Build Phase and Probe Phase.\n\nIn the build phase, Oracle scans the smaller dataset (build input), applies a hash function to the join key, and constructs a hash table in PGA. In the probe phase, Oracle scans the larger dataset (probe input), applies the same hash function, probes the hash table, and returns matching rows.\n\nHash Joins require an equality (=) join condition.',

    buildTitle: 'Build Phase — Constructing the Hash Table',
    buildSteps: [
      { title: 'Full scan of the build input', desc: 'Scan the smaller table (build input) in full.' },
      { title: 'Apply hash function', desc: "Apply a hash function to each row's join key." },
      { title: 'Store in PGA hash table', desc: 'Store the result in an in-memory hash table in PGA. Collisions are handled with linked lists at each hash bucket.' },
      { title: 'Hash table complete', desc: 'The hash table is complete once the entire build input has been read.' },
    ],

    probeTitle: 'Probe Phase — Probing the Hash Table',
    probeSteps: [
      { title: 'Full scan of the probe input', desc: 'Scan the larger table (probe input) in full.' },
      { title: 'Apply the same hash function', desc: "Apply the same hash function to each row's join key." },
      { title: 'Probe the bucket', desc: 'Probe the corresponding bucket in the hash table for a match.' },
      { title: 'Add to result set', desc: 'Add matching rows to the result set.' },
    ],

    memoryTitle: 'When PGA Memory Is Insufficient',
    memoryDesc:
      'If the hash table does not fit in PGA, Oracle spills to the temporary tablespace.\n\n① The build input is split into partitions and written to disk.\n② While scanning the probe input, rows matching in-memory partitions are joined immediately; rows matching on-disk partitions are written to temporary space.\n③ Each on-disk partition pair is read and joined.\n\nEven with spilling, each dataset is read at most twice — once for the initial scan and once from disk.',

    hintTitle: 'Controlling with Hints',
    hintSql: `-- Force Hash Join
SELECT /*+ USE_HASH(e d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;

-- Suppress Hash Join
SELECT /*+ NO_USE_HASH(d) */ e.last_name, d.department_name
FROM   employees e, departments d
WHERE  e.department_id = d.department_id;`,

    simTitle: 'Hash Join Simulation',
    simBuildPhase: '1. Build Phase',
    simProbePhase: '2. Probe Phase',
    simBuildTable: 'Build Table (EMPLOYEES)',
    simHashTable: 'Hash Table (PGA)',
    simProbeTable: 'Probe Table (DEPARTMENTS)',
    simResult: 'Match Result',
    simPrev: 'Prev',
    simNext: 'Next',
    simMatch: 'Match',
    simNoMatch: 'No match',

    summaryTitle: 'Hash Join Key Takeaways',
    summaryItems: [
      'Build Phase: loads the smaller table into a PGA hash table. Probe Phase: scans the larger table matching by hash key.',
      'Requires an equality (=) join condition.',
      'Reads each dataset only once — efficient for large joins.',
      'Spills to temporary tablespace when PGA is insufficient, but still reads each dataset at most twice.',
      'Hints: USE_HASH(table) (force), NO_USE_HASH(table) (suppress).',
    ],
  },
}

function HashJoinSim({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const buildRows = [
    { key: 10, val: 'Alice' },
    { key: 20, val: 'Bob' },
    { key: 30, val: 'Carol' },
  ]
  const probeRows = [
    { key: 20, val: 'Sales' },
    { key: 10, val: 'HR' },
    { key: 40, val: 'IT' },
  ]
  const [phase, setPhase] = useState<'build' | 'probe'>('build')
  const [probeStep, setProbeStep] = useState(0)
  const currentProbe = probeRows[probeStep]
  const match = buildRows.find((b) => b.key === currentProbe?.key)

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {t.simTitle}
      </p>
      <div className="mb-4 flex gap-2">
        {[
          { key: 'build' as const, label: t.simBuildPhase, active: 'border-blue-400 bg-blue-100 text-blue-700 font-bold' },
          { key: 'probe' as const, label: t.simProbePhase, active: 'border-orange-400 bg-orange-100 text-orange-700 font-bold' },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => { setPhase(btn.key); if (btn.key === 'build') setProbeStep(0) }}
            className={cn(
              'rounded-full border px-4 py-1.5 font-mono text-xs transition-all',
              phase === btn.key ? btn.active : 'border-slate-200 hover:bg-muted text-muted-foreground',
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {phase === 'build' && (
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="mb-2 font-mono text-[10px] text-muted-foreground">{t.simBuildTable}</p>
            {buildRows.map((r) => (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 font-mono text-xs"
              >
                key={r.key} → {r.val}
              </motion.div>
            ))}
          </div>
          <div className="flex items-center text-xl text-muted-foreground/30">→</div>
          <div>
            <p className="mb-2 font-mono text-[10px] text-muted-foreground">{t.simHashTable}</p>
            {buildRows.map((r) => (
              <motion.div
                key={r.key}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 }}
                className="mb-1.5 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 font-mono text-xs"
              >
                h({r.key}) → {r.val}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {phase === 'probe' && (
        <div className="flex flex-wrap gap-6 items-start">
          <div>
            <p className="mb-2 font-mono text-[10px] text-muted-foreground">{t.simProbeTable}</p>
            {probeRows.map((r, i) => (
              <div
                key={r.key}
                className={cn(
                  'mb-1.5 rounded-lg border px-4 py-2 font-mono text-xs transition-all',
                  i === probeStep
                    ? 'border-orange-400 bg-orange-100 font-bold text-orange-800'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                key={r.key} → {r.val}
              </div>
            ))}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setProbeStep((s) => Math.max(0, s - 1))}
                disabled={probeStep === 0}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-muted-foreground disabled:opacity-30 hover:bg-muted"
              >
                ← {t.simPrev}
              </button>
              <button
                onClick={() => setProbeStep((s) => Math.min(probeRows.length - 1, s + 1))}
                disabled={probeStep >= probeRows.length - 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-xs text-muted-foreground disabled:opacity-30 hover:bg-muted"
              >
                {t.simNext} →
              </button>
            </div>
          </div>
          <div className="flex items-center text-xl text-muted-foreground/30 mt-6">↔</div>
          <div>
            <p className="mb-2 font-mono text-[10px] text-muted-foreground">{t.simResult}</p>
            <div
              className={cn(
                'rounded-lg border px-4 py-2.5 font-mono text-xs min-w-[180px]',
                match
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-600',
              )}
            >
              {match
                ? `✓ ${t.simMatch}: ${currentProbe.val} ↔ ${match.val}`
                : `✗ ${t.simNoMatch} (key=${currentProbe.key})`}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function JoinHashSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowMerge size={36} stroke={1.5} className="text-orange-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>

      <Divider />

      <SectionTitle>{t.simTitle}</SectionTitle>
      <HashJoinSim lang={lang} />

      <Divider />

      <SectionTitle>{t.buildTitle}</SectionTitle>
      <StepList steps={t.buildSteps} />

      <Divider />

      <SectionTitle>{t.probeTitle}</SectionTitle>
      <StepList steps={t.probeSteps} />

      <Divider />

      <SectionTitle>{t.memoryTitle}</SectionTitle>
      <Prose>{t.memoryDesc}</Prose>
      <InfoBox variant="tip">
        {isKo
          ? 'PGA_AGGREGATE_TARGET을 충분히 설정하면 Hash Join이 디스크 사용 없이 메모리 내에서 처리돼요.'
          : 'Setting PGA_AGGREGATE_TARGET high enough allows Hash Join to process entirely in memory without disk spill.'}
      </InfoBox>

      <Divider />

      <SectionTitle>{t.hintTitle}</SectionTitle>
      <div className="mt-4">
        <SqlBlock sql={t.hintSql} />
      </div>

      <div className="mt-8">
        <InfoBox variant="summary">
          <ul className="list-none space-y-1">
            {t.summaryItems.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </InfoBox>
      </div>
    </PageContainer>
  )
}
