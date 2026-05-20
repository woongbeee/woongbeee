import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, WipBanner } from '../../../../shared'

export function SharedPoolSection() {
  const lang = useSimulationStore((s) => s.lang)
  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle
        title={lang === 'ko' ? 'Shared Pool' : 'Shared Pool'}
        subtitle={lang === 'ko' ? 'SGA — Shared Pool 상세' : 'SGA — Shared Pool in depth'}
      />
      <WipBanner />
    </div>
  )
}
