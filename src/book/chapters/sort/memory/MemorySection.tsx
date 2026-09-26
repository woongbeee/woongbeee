import { IconArrowsSort } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  Table,
  SqlBlock,
  Divider,
} from '../../shared'

const T = {
  ko: {
    title: 'Sort Area와 Temp 세그먼트',
    subtitle:
      '소트가 메모리에서 끝나는지, 디스크로 넘치는지에 따라 성능이 10~100배 차이 날 수 있어요. Oracle이 이걸 어떻게 관리하는지 알아봐요.',

    areaTitle: 'PGA Work Area — 소트가 일어나는 곳',
    areaDesc:
      '소트, 해시 조인, 비트맵 연산처럼 메모리를 많이 쓰는 연산은 세션의 PGA(Program Global Area) 안에 있는 Work Area(작업 영역, 흔히 "Sort Area"라고도 불러요)에서 처리돼요.\n\nOracle은 이 작업이 실제로 필요한 메모리 크기에 따라 세 가지 실행 모드 중 하나로 처리해요.',
    modeTable: [
      [
        'Optimal (최적)',
        '입력 데이터와 보조 구조가 모두 메모리에 들어감',
        '디스크 접근 없음. 목표: 대부분 이 모드',
      ],
      [
        'One-Pass (원패스)',
        'Optimal보다 작은 영역. 디스크를 한 번 추가로 훑음',
        '응답 시간은 늘지만 수용 가능한 수준',
      ],
      [
        'Multi-Pass (멀티패스)',
        'One-Pass 기준보다도 훨씬 작은 영역. 디스크를 여러 번 훑음',
        '성능이 급격히 나빠짐 — 반드시 피해야 함',
      ],
    ],
    modeExample:
      '예: 10GB 데이터를 정렬할 때 — Optimal은 10GB 이상의 작업 영역이 필요하고, One-Pass는 최소 약 40MB로도 가능해요(디스크를 한 번 추가로 오가는 대신). 이렇게 One-Pass에 필요한 메모리는 Optimal보다 훨씬 작아서, 적은 메모리로도 "치명적으로 느린" 상태는 피할 수 있어요.',

    spillTitle: '메모리를 넘치면 어디로 가나요? — Temp 세그먼트',
    spillDesc:
      'Work Area가 부족해지면 Oracle은 중간 결과를 Temp 테이블스페이스의 Temp 세그먼트(디스크)에 써요. 이게 One-Pass·Multi-Pass 실행의 실체예요. 디스크 I/O가 추가되니 메모리 안에서 끝나는 것보다 항상 느려요.',
    spillSql: `-- 현재 세션이 사용 중인(과거에 사용했던) 작업 영역 확인
SELECT operation_type, policy,
       trunc(estimated_optimal_size/1024) optimal_kb,
       trunc(last_memory_used/1024)       last_mem_kb,
       optimal_executions, onepass_executions, multipasses_executions
FROM   v$sql_workarea
WHERE  address = (SELECT address FROM v$sql WHERE sql_id = '&sql_id');

-- 실시간으로 디스크에 스필 중인 작업 영역 확인
SELECT sid, operation_type, work_area_size, extents, temp_tablespace_name
FROM   v$workarea_active;`,
    spillNote:
      'ONEPASS_EXECUTIONS·MULTIPASSES_EXECUTIONS 값이 0이 아니면 그 SQL이 실제로 디스크를 사용했다는 뜻이에요. V$WORKAREA_ACTIVE는 지금 이 순간 디스크로 넘치고 있는 작업을 실시간으로 보여줘요.',

    policyTitle: 'WORK_AREA_SIZE_POLICY — 자동이 기본값',
    policyDesc:
      '작업 영역 크기는 두 가지 정책 중 하나로 결정돼요. 요즘은 AUTO가 기본값이고 권장되는 방식이에요.',
    policyTable: [
      [
        'AUTO (기본값, 권장)',
        'PGA_AGGREGATE_TARGET',
        'Oracle이 워크로드에 맞춰 작업 영역 크기를 동적으로 조정해요.',
      ],
      [
        'MANUAL (레거시)',
        'SORT_AREA_SIZE, HASH_AREA_SIZE 등',
        '연산별로 직접 크기를 지정. 워크로드 변화에 대응 못 하고 사이징이 어려워 더는 권장되지 않아요.',
      ],
    ],
    policySql: `-- 자동 PGA 관리 확인/설정 (기본값)
SHOW PARAMETER pga_aggregate_target;

ALTER SYSTEM SET pga_aggregate_target = 1G SCOPE=BOTH;

-- 전체 PGA 사용량의 절대 상한 (초과 시 세션 강제 종료 가능)
ALTER SYSTEM SET pga_aggregate_limit = 4G SCOPE=BOTH;`,

    advisorTitle: 'PGA_AGGREGATE_TARGET 튜닝하기',
    advisorDesc:
      'V$PGASTAT으로 현재 상태를 확인하고, V$PGA_TARGET_ADVICE로 값을 바꿨을 때 효과를 미리 예측해볼 수 있어요.',
    advisorSql: `-- 캐시 히트율 확인 (80% 이상이면 양호, over allocation count는 0이 이상적)
SELECT name, value
FROM   v$pgastat
WHERE  name IN ('aggregate PGA target parameter',
                'cache hit percentage',
                'over allocation count');

-- PGA_AGGREGATE_TARGET을 바꾸면 캐시 히트율이 어떻게 변할지 시뮬레이션
SELECT round(pga_target_for_estimate/1024/1024) target_mb,
       estd_pga_cache_hit_percentage cache_hit_pct,
       estd_overalloc_count
FROM   v$pga_target_advice
ORDER  BY target_mb;`,
    advisorNote:
      '목표치: Optimal 실행 90% 이상(OLTP는 100%에 가깝게), One-Pass 10% 이하, Multi-Pass는 0%. cache hit percentage가 60% 밑으로 떨어지면 필요한 바이트의 약 2배를 처리하고 있다는 뜻이에요 — PGA_AGGREGATE_TARGET을 올려야 해요.',

    summary:
      '소트 성능의 핵심은 "메모리 안에서 끝나는가"예요. Optimal 실행이면 빠르고, One-Pass는 느려지지만 버틸 만하고, Multi-Pass는 반드시 피해야 해요. WORK_AREA_SIZE_POLICY=AUTO(기본값)에서는 PGA_AGGREGATE_TARGET 하나만 적절히 조정하면 되고, V$PGASTAT·V$PGA_TARGET_ADVICE로 현재 상태와 개선 여지를 확인할 수 있어요.',
  },

  en: {
    title: 'Sort Area & Temp Segment',
    subtitle:
      'Whether a sort finishes in memory or spills to disk can mean a 10–100× difference in performance. Here is how Oracle manages this.',

    areaTitle: 'The PGA Work Area — Where Sorting Happens',
    areaDesc:
      'Memory-intensive operations like sorts, hash joins, and bitmap operations run inside a Work Area (often called the "Sort Area") within the session\'s PGA (Program Global Area).\n\nOracle processes this work in one of three execution modes, depending on how much memory the operation actually needs relative to what is available.',
    modeTable: [
      [
        'Optimal',
        'The work area is large enough for all input data plus auxiliary structures',
        'No disk access. This is the target mode for most executions.',
      ],
      [
        'One-Pass',
        'Below optimal size; one extra pass over the data on disk',
        'Response time increases but remains acceptable',
      ],
      [
        'Multi-Pass',
        'Far below one-pass size; multiple passes over the data on disk',
        'Performance degrades sharply — must be avoided',
      ],
    ],
    modeExample:
      'Example: sorting 10 GB of data — Optimal needs a work area over 10 GB, while One-Pass needs as little as ~40 MB (at the cost of one extra disk pass). Because the One-Pass memory requirement is far smaller than Optimal, even limited memory can avoid the "catastrophically slow" Multi-Pass state.',

    spillTitle: 'Where Does the Overflow Go? — The Temp Segment',
    spillDesc:
      'When the Work Area runs out of room, Oracle writes intermediate results to a Temp segment on disk (in the Temp tablespace). This is what One-Pass and Multi-Pass execution actually means in practice — the added disk I/O always makes it slower than finishing entirely in memory.',
    spillSql: `-- Check work areas used by the current (or past) session
SELECT operation_type, policy,
       trunc(estimated_optimal_size/1024) optimal_kb,
       trunc(last_memory_used/1024)       last_mem_kb,
       optimal_executions, onepass_executions, multipasses_executions
FROM   v$sql_workarea
WHERE  address = (SELECT address FROM v$sql WHERE sql_id = '&sql_id');

-- See work areas actively spilling to disk right now
SELECT sid, operation_type, work_area_size, extents, temp_tablespace_name
FROM   v$workarea_active;`,
    spillNote:
      'Non-zero ONEPASS_EXECUTIONS or MULTIPASSES_EXECUTIONS means that SQL actually used disk. V$WORKAREA_ACTIVE shows, in real time, which operations are spilling to disk right now.',

    policyTitle: 'WORK_AREA_SIZE_POLICY — AUTO Is the Default',
    policyDesc:
      'Work area sizing follows one of two policies. AUTO is the modern default and the recommended approach.',
    policyTable: [
      [
        'AUTO (default, recommended)',
        'PGA_AGGREGATE_TARGET',
        'Oracle dynamically adjusts work area sizes to match the workload.',
      ],
      [
        'MANUAL (legacy)',
        'SORT_AREA_SIZE, HASH_AREA_SIZE, etc.',
        "Sizes each operation type by hand. Doesn't adapt to workload changes and is hard to size correctly — no longer recommended.",
      ],
    ],
    policySql: `-- Check/set automatic PGA management (default)
SHOW PARAMETER pga_aggregate_target;

ALTER SYSTEM SET pga_aggregate_target = 1G SCOPE=BOTH;

-- Absolute cap on total PGA usage (can force sessions to terminate if exceeded)
ALTER SYSTEM SET pga_aggregate_limit = 4G SCOPE=BOTH;`,

    advisorTitle: 'Tuning PGA_AGGREGATE_TARGET',
    advisorDesc:
      'Check the current state with V$PGASTAT, and preview the effect of a different target value with V$PGA_TARGET_ADVICE before changing it.',
    advisorSql: `-- Check cache hit percentage (>= 80% is healthy; over allocation count of 0 is ideal)
SELECT name, value
FROM   v$pgastat
WHERE  name IN ('aggregate PGA target parameter',
                'cache hit percentage',
                'over allocation count');

-- Simulate how cache hit percentage would change with a different PGA_AGGREGATE_TARGET
SELECT round(pga_target_for_estimate/1024/1024) target_mb,
       estd_pga_cache_hit_percentage cache_hit_pct,
       estd_overalloc_count
FROM   v$pga_target_advice
ORDER  BY target_mb;`,
    advisorNote:
      'Targets: 90%+ optimal executions (close to 100% for OLTP), 10% or less one-pass, and 0% multi-pass. If cache hit percentage drops below 60%, the system is processing roughly 2× the necessary bytes — raise PGA_AGGREGATE_TARGET.',

    summary:
      'Sort performance comes down to one question: does it finish in memory? Optimal execution is fast, One-Pass is slower but tolerable, and Multi-Pass must be avoided. With WORK_AREA_SIZE_POLICY=AUTO (the default), tuning PGA_AGGREGATE_TARGET alone is usually enough — use V$PGASTAT and V$PGA_TARGET_ADVICE to check current health and headroom.',
  },
}

export function SortMemorySection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconArrowsSort size={36} stroke={1.5} className="text-rose" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.areaTitle}</SectionTitle>
      <Prose>{t.areaDesc}</Prose>
      <Table
        headers={
          isKo
            ? ['실행 모드', '조건', '결과']
            : ['Execution Mode', 'Condition', 'Result']
        }
        rows={t.modeTable}
      />
      <InfoBox variant="note">{t.modeExample}</InfoBox>

      <Divider />

      <SectionTitle>{t.spillTitle}</SectionTitle>
      <Prose>{t.spillDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.spillSql} />
      </div>
      <InfoBox variant="warning">{t.spillNote}</InfoBox>

      <Divider />

      <SectionTitle>{t.policyTitle}</SectionTitle>
      <Prose>{t.policyDesc}</Prose>
      <Table
        headers={
          isKo
            ? ['정책', '관련 파라미터', '설명']
            : ['Policy', 'Related Parameter', 'Description']
        }
        rows={t.policyTable}
      />
      <div className="mt-4">
        <SqlBlock sql={t.policySql} />
      </div>

      <Divider />

      <SectionTitle>{t.advisorTitle}</SectionTitle>
      <Prose>{t.advisorDesc}</Prose>
      <div className="mt-4">
        <SqlBlock sql={t.advisorSql} />
      </div>
      <InfoBox variant="tip">{t.advisorNote}</InfoBox>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
