import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, WipBanner } from '../../../../shared'

export function RedoLogBufferSection() {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle
        title={lang === 'ko' ? 'Redo Log Buffer' : 'Redo Log Buffer'}
        subtitle={lang === 'ko' ? 'SGA — Redo Log Buffer 상세' : 'SGA — Redo Log Buffer in depth'}
      />
      <WipBanner />
    </div>
  )
}
