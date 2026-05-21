import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/store/simulationStore'
import { ChapterTitle, SectionTitle, Prose, Divider } from '../../../../shared'
import { cn } from '@/lib/utils'
import { SgaPositionDiagram } from '../shared/SgaPositionDiagram'

type IoMode = 'random' | 'append'

const T = {
  ko: {
    title: 'Redo Log Buffer',

    walTitle: 'Write-Ahead Logging — 로그 먼저, 데이터 나중',
    walDesc: 'Buffer Cache가 데이터를 수정할 때 Oracle은 반드시 정해진 순서를 지킵니다.',
    walStep1: 'Redo Log Buffer에 먼저 기록',
    walStep1Desc: '"이 블록의 이 값을 저 값으로 바꾼다"는 변경 내역을 메모리의 로그 버퍼에 씁니다.',
    walStep2: '그 다음 Buffer Cache의 블록을 수정',
    walStep2Desc: '실제 데이터 블록을 변경합니다.',
    walConclusion: 'Redo Log File이 먼저, Data File은 그 다음입니다. 이 원칙을 Write-Ahead Logging(WAL)이라 합니다. 서버가 갑자기 꺼져도 Redo Log만 온전하면 데이터 파일을 복구할 수 있기 때문입니다.',
    walMemOrder: '메모리 쓰기 순서',
    walDiskOrder: '디스크 쓰기 순서 (COMMIT 시)',
    walLgwr: 'LGWR · COMMIT 즉시',
    walDbwn: 'DBWn · 나중에 일괄',

    ioTitle: '왜 Redo Log 쓰기가 Data File 쓰기보다 빠를까?',
    ioSubTitle: '두 가지 I/O 방식의 차이에 있습니다.',
    ioRandomLabel: 'Random I/O',
    ioAppendLabel: 'Append (Sequential) I/O',
    ioRandomBadge: 'Data File 쓰기',
    ioAppendBadge: 'Redo Log 쓰기',
    ioRandomTitle: 'Random I/O — 원하는 위치를 직접 찾아가는 방식',
    ioAppendTitle: 'Append I/O — 끝에 순서대로 이어 붙이는 방식',
    ioRandomDesc: '데이터 파일에 블록을 쓸 때 Oracle은 해당 블록이 디스크의 어느 위치에 있는지 계산한 뒤, 그 위치로 바로 이동해서 씁니다. HDD라면 ARM이 물리적으로 그 위치로 이동해야 하고, SSD라면 해당 셀 주소를 찾아야 합니다.\n\n문제는 UPDATE할 행이 테이블 전체에 흩어져 있을 때입니다. 블록 A → 블록 Z → 블록 C → 블록 M... 순서 없이 여기저기 이동하다 보면 이동 횟수가 늘고 느려집니다. 이것이 Random I/O입니다.\n\nRandom I/O는 앞으로 인덱스, 조인, 파티셔닝을 배울 때 계속 등장합니다. 여기서는 "디스크의 임의 위치에 쓰는 건 비싸다"는 개념만 기억해두세요.',
    ioAppendDesc: 'Redo Log File은 다릅니다. 어디서부터 어디까지 바꿨는지 추적할 필요가 없고, 그냥 파일 끝에 "다음으로 일어난 일"을 차례대로 이어 씁니다. ARM이 이동할 일이 없습니다. 디스크가 돌아가면서 자연스럽게 다음 위치가 헤드 아래로 옵니다.\n\n이 방식을 Sequential I/O 또는 Append Write라고 합니다. Random I/O에 비해 훨씬 빠르기 때문에, Oracle은 COMMIT 시 Redo Log를 디스크에 먼저 쓰더라도 빠르게 처리할 수 있습니다.\n\n정리하면: "느린 디스크에 써야 한다면, Append 방식으로 써라"가 Oracle의 전략입니다.',
    ioRandomVisualLabel: '순서 없이 블록 A → F → C 이동',
    ioAppendVisualLabel: '1 → 2 → 3 → 4 → 5 → 다음 칸에 이어 쓰기',
    ioFootnote: 'Random I/O는 인덱스·조인·파티셔닝 챕터에서 계속 등장합니다. 지금은 "임의 위치 쓰기는 비싸다"는 개념만 기억하세요.',
  },
  en: {
    title: 'Redo Log Buffer',

    walTitle: 'Write-Ahead Logging — Log first, data second',
    walDesc: 'When Oracle modifies data in the Buffer Cache, it always follows a strict order.',
    walStep1: 'Write to the Redo Log Buffer first',
    walStep1Desc: 'Record "change this value in this block to that value" in the in-memory log buffer.',
    walStep2: 'Then modify the block in the Buffer Cache',
    walStep2Desc: 'Apply the actual change to the data block.',
    walConclusion: 'Redo Log File first, Data File second. This principle is called Write-Ahead Logging (WAL). As long as the Redo Log survives, Oracle can always reconstruct the data files — even after a crash.',
    walMemOrder: 'In-memory write order',
    walDiskOrder: 'Disk write order (at COMMIT)',
    walLgwr: 'LGWR · at COMMIT',
    walDbwn: 'DBWn · batched later',

    ioTitle: 'Why is writing to the Redo Log faster than writing to the Data File?',
    ioSubTitle: 'The answer lies in the two different I/O patterns.',
    ioRandomLabel: 'Random I/O',
    ioAppendLabel: 'Append (Sequential) I/O',
    ioRandomBadge: 'Data File write',
    ioAppendBadge: 'Redo Log write',
    ioRandomTitle: 'Random I/O — Seeking the exact location each time',
    ioAppendTitle: 'Append I/O — Writing sequentially to the end',
    ioRandomDesc: "When Oracle writes a block to a data file, it calculates exactly where on disk that block lives, then seeks directly to that location. On an HDD, the ARM physically moves there. On an SSD, it resolves the target cell address.\n\nThe problem appears when rows being updated are scattered across the table. Block A → Block Z → Block C → Block M... hopping around in no particular order means more seeks, more latency. That is Random I/O.\n\nRandom I/O will come up again when we cover indexes, joins, and partitioning. For now, just remember: writing to arbitrary disk locations is expensive.",
    ioAppendDesc: "Redo Log Files work differently. Oracle doesn't need to find where a specific block lives — it just appends \"the next thing that happened\" to the end of the file in sequence. The ARM never needs to seek. As the disk spins, the next position naturally arrives under the head.\n\nThis is called Sequential I/O or Append Write. It is far faster than Random I/O, which is why Oracle can afford to flush the Redo Log to disk synchronously at COMMIT without making commits slow.\n\nThe takeaway: \"if you must write to slow disk, write sequentially\" is Oracle's core strategy.",
    ioRandomVisualLabel: 'Seeks A → F → C out of order',
    ioAppendVisualLabel: 'Written 1 → 2 → 3 → 4 → 5, next appended here',
    ioFootnote: 'Random I/O will reappear throughout the indexes, joins, and partitioning chapters. For now, just remember: writing to arbitrary locations is expensive.',
  },
}

function WalSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  return (
    <div className="rounded-xl border-2 border-orange-200 bg-orange-50/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">WAL</span>
        <span className="text-sm font-bold text-foreground/90">{t.walTitle}</span>
      </div>
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-muted-foreground">{t.walDesc}</p>
        <ol className="list-none space-y-1.5">
          <li className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              1
            </span>
            <span>
              <strong className="font-semibold text-foreground">{t.walStep1}</strong>{' '}
              — {t.walStep1Desc}
            </span>
          </li>
          <li className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              2
            </span>
            <span>
              <strong className="font-semibold text-foreground">{t.walStep2}</strong>{' '}
              — {t.walStep2Desc}
            </span>
          </li>
        </ol>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong className="font-semibold text-foreground">{t.walConclusion}</strong>
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {t.walMemOrder}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700">
            ① Redo Log Buffer
          </div>
          <span className="text-sm text-muted-foreground">→</span>
          <div className="flex-1 rounded-lg border-2 border-blue-300 bg-blue-50 px-3 py-2 text-center text-xs font-bold text-blue-700">
            ② Buffer Cache
          </div>
        </div>
        <p className="mb-1 mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {t.walDiskOrder}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-2 text-center text-xs font-bold text-orange-700">
            ① Redo Log File
            <div className="mt-0.5 text-[10px] font-normal opacity-70">{t.walLgwr}</div>
          </div>
          <span className="text-sm text-muted-foreground">→</span>
          <div className="flex-1 rounded-lg border-2 border-slate-300 bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-700">
            ② Data File
            <div className="mt-0.5 text-[10px] font-normal opacity-70">{t.walDbwn}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IoComparisonSection({ lang }: { lang: 'ko' | 'en' }) {
  const t = T[lang]
  const [activeIo, setActiveIo] = useState<IoMode>('random')

  const ioModes: { id: IoMode; label: string }[] = [
    { id: 'random', label: t.ioRandomLabel },
    { id: 'append', label: t.ioAppendLabel },
  ]

  const ioContent = {
    random: {
      badge: t.ioRandomBadge,
      title: t.ioRandomTitle,
      desc: t.ioRandomDesc,
      visual: (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <div className="absolute inset-0 flex items-center justify-center gap-0">
            {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const).map((label, i) => (
              <div
                key={label}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center border-r border-slate-200 font-mono text-xs font-bold',
                  ['A', 'C', 'F'].includes(label)
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-white text-slate-400',
                  i === 7 && 'border-r-0',
                )}
              >
                {label}
              </div>
            ))}
          </div>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 320 112">
            <defs>
              <marker id="arrowAmber" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
              </marker>
            </defs>
            <path d="M20 56 C 20 20, 200 20, 200 56" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="4 2" markerEnd="url(#arrowAmber)" />
            <path d="M200 56 C 200 90, 100 90, 100 56" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="4 2" markerEnd="url(#arrowAmber)" />
          </svg>
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-400">
            {t.ioRandomVisualLabel}
          </div>
        </div>
      ),
    },
    append: {
      badge: t.ioAppendBadge,
      title: t.ioAppendTitle,
      desc: t.ioAppendDesc,
      visual: (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-orange-200 bg-orange-50">
          <div className="absolute inset-0 flex items-center justify-center gap-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => (
              <div
                key={n}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center border-r border-orange-200 font-mono text-xs font-bold',
                  n <= 5 ? 'bg-orange-100 text-orange-700' : n === 6 ? 'bg-orange-300 text-white ring-2 ring-orange-400' : 'bg-white text-slate-300',
                  i === 7 && 'border-r-0',
                )}
              >
                {n <= 5 ? n : n === 6 ? '→' : ''}
              </div>
            ))}
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-orange-500">
            {t.ioAppendVisualLabel}
          </div>
        </div>
      ),
    },
  }

  const active = ioContent[activeIo]

  return (
    <div>
      <div className="mb-1 text-sm font-bold text-foreground/90">{t.ioTitle}</div>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{t.ioSubTitle}</p>
      <div className="mb-4 flex gap-2">
        {ioModes.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveIo(m.id)}
            className={cn(
              'rounded-lg border px-4 py-2 text-xs font-bold transition-all',
              activeIo === m.id
                ? m.id === 'random'
                  ? 'border-amber-400 bg-amber-500 text-white shadow-sm'
                  : 'border-orange-400 bg-orange-500 text-white shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-slate-400 hover:text-foreground',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIo}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className={cn('flex items-center gap-2.5 border-b border-border px-5 py-3', activeIo === 'random' ? 'bg-amber-50/60' : 'bg-orange-50/60')}>
            <span className={cn('rounded px-2.5 py-0.5 text-xs font-bold text-white', activeIo === 'random' ? 'bg-amber-500' : 'bg-orange-500')}>
              {active.badge}
            </span>
            <span className="text-sm font-bold text-foreground">{active.title}</span>
          </div>
          <div className="space-y-4 px-5 py-4">
            {active.visual}
            <Prose>{active.desc}</Prose>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        💡 {t.ioFootnote}
      </div>
    </div>
  )
}

export function RedoLogBufferSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <div className="mx-auto max-w-screen-2xl px-10 py-10">
      <ChapterTitle title={t.title} />

      <SgaPositionDiagram activeId="redo-log-buffer" />

      <SectionTitle>{t.walTitle}</SectionTitle>
      <WalSection lang={lang} />

      <Divider />

      <IoComparisonSection lang={lang} />
    </div>
  )
}
