// ─── Internals Simulator — 앱의 메인 화면 ─────────────────────────────────
//   Header        제목 · 탭 · 학습서 이동 · 언어/테마
//   PipelineBar   SQL 처리 단계 진행 표시
//   SimStage (왼쪽: InstanceDiagram ↔ 단계별 슬라이드)  +  DetailPanel (오른쪽: 재생 · 단계 해설 · Optimizer · 통계)
//   SqlConsole    SQL 입력 · 예제 · 인스턴스 명령

import { useState, type ReactNode } from 'react'
import { IconArrowRight, IconBook, IconDatabase, IconLanguage, IconMoon, IconSchema, IconSettings, IconSun } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import { AppFooter } from '@/components/AppFooter'
import { DetailPanel } from './DetailPanel'
import { ErdPanel } from './ErdPanel'
import { PipelineBar } from './PipelineBar'
import { SimStage } from './SlideStage'
import { SqlConsole } from './SqlConsole'

const T = {
  ko: {
    title: 'Oracle Internals Simulator',
    subtitle: 'SQL 한 문장이 Oracle 안에서 처리되는 과정을 단계별로 따라가 보세요',
    openBook: '학습서로 이동하기',
    langToggle: 'EN',
    themeLight: '라이트 모드',
    themeDark: '다크 모드',
  },
  en: {
    title: 'Oracle Internals Simulator',
    subtitle: 'Follow one SQL statement through Oracle, step by step',
    openBook: 'Go to the Learning Book',
    langToggle: '한국어',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
  },
}

type SimTab = 'simulator' | 'erd'

const SIM_TABS: { id: SimTab; label: string; icon: ReactNode }[] = [
  { id: 'simulator', label: 'Simulator', icon: <IconSettings size={16} stroke={1.5} /> },
  { id: 'erd', label: 'Schema / ERD', icon: <IconSchema size={16} stroke={1.5} /> },
]

const HEADER_BTN = 'flex shrink-0 items-center gap-1.5 rounded-chip border border-line bg-paper px-2.5 py-1 font-mono text-[10px] font-medium text-ink-2 transition-colors hover:bg-rail hover:text-ink'

interface Props {
  onOpenBook: () => void // 학습서(BookLayout)로 이동
}

export function SimulatorPage({ onOpenBook }: Props) {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const theme = useLangStore((s) => s.theme)
  const toggleTheme = useLangStore((s) => s.toggleTheme)
  const [activeTab, setActiveTab] = useState<SimTab>('simulator')
  const t = T[lang]

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-paper text-ink">
      {/* ── Header ── */}
      <header className="z-20 flex h-11 shrink-0 items-stretch gap-2.5 border-b border-line bg-paper pl-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-chip bg-ink text-paper">
            <IconDatabase size={13} stroke={2} />
          </span>
          <h1 className="whitespace-nowrap font-sans text-[13px] font-semibold tracking-tight text-ink">{t.title}</h1>
          <span className="hidden truncate font-sans text-[11.5px] text-ink-3 xl:inline">{t.subtitle}</span>
        </div>

        <div className="ml-auto flex shrink-0 items-stretch">
          {SIM_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 font-mono text-xs font-semibold transition-colors',
                activeTab === tab.id ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-l border-line px-3">
          <button onClick={onOpenBook} className={cn(HEADER_BTN, 'font-sans text-[11px]')}>
            <IconBook size={13} stroke={1.5} />
            {t.openBook}
            <IconArrowRight size={12} stroke={1.5} />
          </button>
          <button onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')} className={HEADER_BTN}>
            <IconLanguage size={12} />
            {t.langToggle}
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t.themeLight : t.themeDark}
            aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-chip border border-line bg-paper text-ink-2 transition-colors hover:bg-rail hover:text-ink"
          >
            {theme === 'dark' ? <IconSun size={13} /> : <IconMoon size={13} />}
          </button>
        </div>
      </header>

      {activeTab === 'simulator' ? (
        <>
          <PipelineBar />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {/* 평소엔 인스턴스 전체 그림, SQL 을 실행하는 동안엔 단계별 슬라이드 */}
              <div className="min-h-0 flex-1 overflow-hidden bg-paper-sunk">
                <SimStage />
              </div>
              <SqlConsole />
            </div>
            <aside className="w-[400px] shrink-0 border-l border-line-2 2xl:w-[460px]">
              <DetailPanel />
            </aside>
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">
          <ErdPanel />
        </div>
      )}
      <AppFooter />
    </div>
  )
}
