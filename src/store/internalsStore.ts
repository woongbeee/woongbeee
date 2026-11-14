import { create } from 'zustand'
import { createInstance, runCommand, runStatement } from '@/lib/simulator/engine'
import type { InstanceCommand, InstanceState, SessionStats, SimStep, Trace } from '@/lib/simulator/types'

// ── Internals Simulator 상태 ───────────────────────────────────────────────
// 엔진(src/lib/simulator)이 문장 하나를 "단계 목록(Trace)"으로 미리 다 계산해 주고,
// 스토어는 그 목록 위에서 재생 위치(cursor)만 움직인다.
//   instance : 마지막 문장까지 반영된 인스턴스 상태 (다음 문장의 출발점)
//   trace    : 지금 보고 있는 문장의 단계 목록 — 단계마다 상태 스냅숏이 들어 있다
//   cursor   : trace.steps 안에서 현재 보고 있는 단계

export type PlaybackSpeed = 1 | 2 | 4

const STEP_MS = 3200

// 다이어그램 각 영역의 설명 문구를 펼쳐 둘지 여부 — 끄면 마우스를 올렸을 때 말풍선으로만 보인다
const DESC_KEY = 'oracle-sim-show-desc'

function initialShowDesc(): boolean {
  try {
    return localStorage.getItem(DESC_KEY) !== 'off'
  } catch {
    return true
  }
}

interface InternalsState {
  instance: InstanceState
  baseStats: SessionStats        // 현재 trace 를 실행하기 직전의 통계 (문장별 증가분 계산용)
  trace: Trace | null
  cursor: number
  playing: boolean
  speed: PlaybackSpeed
  showDesc: boolean
}

interface InternalsActions {
  run: (sql: string) => void
  command: (command: InstanceCommand) => void
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  setSpeed: (speed: PlaybackSpeed) => void
  restart: () => void
  toggleDesc: () => void
}

let timer: ReturnType<typeof setTimeout> | undefined

export const useInternalsStore = create<InternalsState & InternalsActions>((set, get) => {
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const { playing, trace, cursor } = get()
      if (!playing || !trace) return
      if (cursor >= trace.steps.length - 1) {
        set({ playing: false })
        return
      }
      set({ cursor: cursor + 1 })
      schedule()
    }, STEP_MS / get().speed)
  }

  const start = (trace: Trace) => {
    const { instance } = get()
    const last = trace.steps[trace.steps.length - 1]
    set({ baseStats: instance.stats, instance: last?.state ?? instance, trace, cursor: 0, playing: trace.steps.length > 1 })
    schedule()
  }

  const initial = createInstance()

  return {
    instance: initial,
    baseStats: initial.stats,
    trace: null,
    cursor: 0,
    playing: false,
    speed: 1,
    showDesc: initialShowDesc(),

    run: (sql) => {
      if (sql.trim()) start(runStatement(get().instance, sql))
    },
    command: (command) => start(runCommand(get().instance, command)),

    play: () => {
      const { trace, cursor } = get()
      if (!trace) return
      // 끝까지 본 뒤에 다시 누르면 처음부터
      set({ playing: true, cursor: cursor >= trace.steps.length - 1 ? 0 : cursor })
      schedule()
    },
    pause: () => {
      clearTimeout(timer)
      set({ playing: false })
    },
    next: () => get().goTo(get().cursor + 1),
    prev: () => get().goTo(get().cursor - 1),
    goTo: (index) => {
      const { trace } = get()
      if (!trace) return
      clearTimeout(timer)
      set({ playing: false, cursor: Math.min(trace.steps.length - 1, Math.max(0, index)) })
    },
    setSpeed: (speed) => {
      set({ speed })
      if (get().playing) schedule()
    },
    toggleDesc: () => {
      const showDesc = !get().showDesc
      try {
        localStorage.setItem(DESC_KEY, showDesc ? 'on' : 'off')
      } catch {
        /* 저장하지 못해도 이번 화면에서는 그대로 동작한다 */
      }
      set({ showDesc })
    },
    restart: () => {
      clearTimeout(timer)
      const fresh = createInstance()
      set({ instance: fresh, baseStats: fresh.stats, trace: null, cursor: 0, playing: false })
    },
  }
})

// ── Selectors ─────────────────────────────────────────────────────────────

/** 지금 화면에 보여 줄 단계 (문장을 아직 실행하지 않았으면 null) */
export const selectStep = (s: InternalsState): SimStep | null => s.trace?.steps[s.cursor] ?? null

/** 지금 화면에 보여 줄 인스턴스 상태 — 재생 중이면 그 단계의 스냅숏 */
export const selectState = (s: InternalsState): InstanceState => s.trace?.steps[s.cursor]?.state ?? s.instance
