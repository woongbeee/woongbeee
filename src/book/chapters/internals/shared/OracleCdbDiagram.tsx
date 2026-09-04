import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useSimulationStore } from '@/store/simulationStore'

// ─────────────────────────────────────────────────────────────────────────────
// Oracle Multitenant — CDB / PDB 구조 다이어그램 (공용).
//
// Oracle 공식 "Multitenant Container Database (CDB)" 그림을 옮겨 그린다:
//   Database Server ▸ CDB { Root(CDB$ROOT) · Seed(PDB$SEED) · User PDBs ·
//   Application Containers }  +  CDB 전체가 공유하는 System Files.
//
// 이름표만 그린다. 영역을 클릭하면 아래에 짧은 설명이 뜬다 (자체 상태).
// 폰트: 이름 = font-sans, 식별자(CDB$ROOT…) = font-mono. 색: --color-viz-*.
// ─────────────────────────────────────────────────────────────────────────────

type CdbRegionId = 'cdb' | 'root' | 'seed' | 'pdb' | 'app-container' | 'system-files'

type Hue = 'blue' | 'green' | 'amber' | 'purple' | 'slate'

const HUE: Record<Hue, { text: string; base: string; lit: string; hover: string; accent: string }> = {
  blue:   { text: 'text-viz-blue',   base: 'border-viz-blue/50',   lit: 'border-viz-blue bg-viz-blue/10 ring-1 ring-viz-blue/40',     hover: 'hover:bg-viz-blue/5',   accent: 'border-l-viz-blue' },
  green:  { text: 'text-viz-green',  base: 'border-viz-green/50',   lit: 'border-viz-green bg-viz-green/10 ring-1 ring-viz-green/40',   hover: 'hover:bg-viz-green/5',  accent: 'border-l-viz-green' },
  amber:  { text: 'text-viz-amber',  base: 'border-viz-amber/50',   lit: 'border-viz-amber bg-viz-amber/10 ring-1 ring-viz-amber/40',   hover: 'hover:bg-viz-amber/5',  accent: 'border-l-viz-amber' },
  purple: { text: 'text-viz-purple', base: 'border-viz-purple/50',  lit: 'border-viz-purple bg-viz-purple/10 ring-1 ring-viz-purple/40', hover: 'hover:bg-viz-purple/5', accent: 'border-l-viz-purple' },
  slate:  { text: 'text-ink-2',      base: 'border-line-2',         lit: 'border-ink-3 bg-rail ring-1 ring-line-2',                     hover: 'hover:bg-ink/[0.03]',   accent: 'border-l-line-2' },
}

const DETAIL: Record<CdbRegionId, { hue: Hue; ko: string; en: string; ko2: string; en2: string }> = {
  cdb: {
    hue: 'blue',
    ko: 'CDB — Multitenant Container Database',
    en: 'CDB — Multitenant Container Database',
    ko2: '여러 개의 PDB 를 담는 하나의 컨테이너 데이터베이스예요. 인스턴스(SGA·백그라운드 프로세스)와 컨트롤 파일·온라인 리두 로그를 CDB 전체가 하나만 두고 공유해요. Oracle 21c 부터는 CDB 만 만들 수 있고, 비-CDB(non-CDB)는 더 이상 지원되지 않아요.',
    en2: 'One container database that holds many PDBs. The instance (SGA + background processes), control files, and online redo log are single and shared by the whole CDB. Since Oracle 21c only CDBs can be created — the non-CDB architecture is deprecated.',
  },
  root: {
    hue: 'blue',
    ko: 'Root Container — CDB$ROOT',
    en: 'Root Container — CDB$ROOT',
    ko2: 'CDB 안의 관리용 최상위 컨테이너예요. Oracle 이 제공하는 메타데이터와 공통 사용자(C##), 모든 PDB 가 함께 쓰는 오브젝트가 여기 있어요. 여기에는 사용자 데이터를 넣지 않아요.',
    en2: 'The administrative top container of a CDB. It holds Oracle-supplied metadata, common users (C##), and objects shared by every PDB. You never put application data here.',
  },
  seed: {
    hue: 'green',
    ko: 'Seed PDB — PDB$SEED',
    en: 'Seed PDB — PDB$SEED',
    ko2: '새 PDB 를 만들 때 복사해서 쓰는 읽기 전용 템플릿이에요. 덕분에 빈 PDB 를 몇 초 만에 찍어낼 수 있어요.',
    en2: 'A read-only template that is copied whenever you create a new PDB — which is why an empty PDB can be provisioned in seconds.',
  },
  pdb: {
    hue: 'purple',
    ko: 'PDB — Pluggable Database',
    en: 'PDB — Pluggable Database',
    ko2: '애플리케이션 입장에서는 그냥 독립된 데이터베이스처럼 보여요. PDB 마다 자기만의 데이터 딕셔너리·스키마·테이블스페이스·데이터 파일을 가져요. 다른 CDB 로 뽑아서(unplug) 꽂을(plug) 수 있고, 복제도 빨라요.',
    en2: 'To an application a PDB looks like a standalone database. Each PDB has its own data dictionary, schemas, tablespaces, and data files. It can be unplugged from one CDB and plugged into another, and clones fast.',
  },
  'app-container': {
    hue: 'amber',
    ko: 'Application Container',
    en: 'Application Container',
    ko2: '여러 PDB 가 공유하는 애플리케이션 공통 데이터·메타데이터(예: 공통 코드 테이블)를 담는 특수 컨테이너예요. Application Root 하나 + 그 아래 Application PDB 들로 이루어져요.',
    en2: 'A special container holding application data and metadata (e.g. shared reference tables) common to a set of PDBs. It has one Application Root plus its Application PDBs.',
  },
  'system-files': {
    hue: 'slate',
    ko: 'System Files — CDB 전체 공유',
    en: 'System Files — shared by the whole CDB',
    ko2: '컨트롤 파일, 온라인 리두 로그, 파라미터 파일은 PDB 별로 따로 두지 않고 CDB 에 하나씩만 있어요. 그래서 백업·복구·리두 관리가 CDB 단위로 한 번에 이뤄져요. (데이터 파일과 임시 파일만 PDB 별로 분리돼요.)',
    en2: 'Control files, the online redo log, and the parameter file exist once per CDB, not per PDB. Backup, recovery, and redo management therefore happen once for the whole CDB. (Only data files and temp files are per-PDB.)',
  },
}

function Box({
  id, label, sub, hue, active, onClick, className,
}: {
  id: CdbRegionId
  label: string
  sub?: string
  hue: Hue
  active: boolean
  onClick: () => void
  className?: string
}) {
  const h = HUE[hue]
  return (
    <button
      type="button"
      data-cdb-id={id}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-card border border-l-[3px] px-2.5 py-2 text-center transition-all',
        active ? h.lit : cn('bg-paper', h.base, h.accent, h.hover),
        className,
      )}
    >
      <span className={cn('font-sans text-[11.5px] font-semibold leading-tight', h.text)}>{label}</span>
      {sub && <span className="font-mono text-[9px] leading-tight text-ink-3">{sub}</span>}
    </button>
  )
}

function Frame({ kicker, hue, children, className }: { kicker: string; hue: Hue; children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-panel border border-l-[3px] border-line bg-paper p-2.5', HUE[hue].accent, className)}>
      <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-ink-3">{kicker}</div>
      {children}
    </div>
  )
}

export function OracleCdbDiagram({ className }: { className?: string }) {
  const lang = useSimulationStore((s) => s.lang)
  const isKo = lang === 'ko'
  const [active, setActive] = useState<CdbRegionId | null>(null)
  const pick = (id: CdbRegionId) => setActive((p) => (p === id ? null : id))
  const d = active ? DETAIL[active] : null

  return (
    <figure className={cn('my-5 flex flex-col gap-3 overflow-x-auto', className)}>
      <div className="min-w-[520px] rounded-panel border border-line-2 bg-paper-sunk p-3">
        <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-ink-3">
          {isKo ? 'Database Server' : 'Database Server'}
        </div>

        {/* CDB */}
        <Frame kicker="CDB — Multitenant Container Database" hue="blue" className="mb-2">
          <button
            type="button"
            data-cdb-id="cdb"
            onClick={() => pick('cdb')}
            className={cn('mb-2 w-full rounded-chip px-2 py-1 text-left font-sans text-[10px] transition-all',
              active === 'cdb' ? 'bg-viz-blue/10 text-viz-blue ring-1 ring-viz-blue/40' : 'text-ink-3 hover:bg-ink/[0.03]')}
          >
            {isKo ? 'CDB 전체 설명 보기 →' : 'About the CDB as a whole →'}
          </button>

          {/* Root */}
          <Box
            id="root" label="Root Container" sub="CDB$ROOT" hue="blue"
            active={active === 'root'} onClick={() => pick('root')}
            className="mb-2 w-full flex-row justify-start gap-2 py-1.5"
          />

          {/* PDBs row */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Box id="seed" label={isKo ? 'Seed PDB' : 'Seed PDB'} sub="PDB$SEED" hue="green" active={active === 'seed'} onClick={() => pick('seed')} />
            <Box id="pdb" label={isKo ? '사용자 PDB 1' : 'User PDB 1'} hue="purple" active={active === 'pdb'} onClick={() => pick('pdb')} />
            <Box id="pdb" label={isKo ? '사용자 PDB 2' : 'User PDB 2'} hue="purple" active={active === 'pdb'} onClick={() => pick('pdb')} />
            <Box id="app-container" label={isKo ? 'App Container' : 'App Container'} hue="amber" active={active === 'app-container'} onClick={() => pick('app-container')} />
          </div>

          <p className="mt-1.5 font-sans text-[9px] leading-tight text-ink-3">
            {isKo
              ? 'PDB 마다 자기만의 데이터 딕셔너리 · 스키마 · 테이블스페이스 · 데이터 파일을 가져요.'
              : 'Each PDB has its own data dictionary, schemas, tablespaces, and data files.'}
          </p>
        </Frame>

        {/* System files (shared) */}
        <Box
          id="system-files"
          label={isKo ? 'System Files — CDB 전체 공유' : 'System Files — shared by the whole CDB'}
          sub={isKo ? 'Control File · Online Redo Log · Parameter File' : 'Control File · Online Redo Log · Parameter File'}
          hue="slate"
          active={active === 'system-files'}
          onClick={() => pick('system-files')}
          className="w-full flex-row justify-between gap-2 py-2"
        />
      </div>

      {/* 클릭 → 상세 */}
      {d ? (
        <div className={cn('rounded-card border border-l-[3px] bg-paper px-3.5 py-3', HUE[d.hue].accent, HUE[d.hue].base)}>
          <div className={cn('mb-1 font-sans text-[12px] font-semibold', HUE[d.hue].text)}>{isKo ? d.ko : d.en}</div>
          <p className="font-read text-[12px] leading-relaxed text-ink-2">{isKo ? d.ko2 : d.en2}</p>
        </div>
      ) : (
        <p className="font-sans text-[11px] text-ink-3">{isKo ? '↑ 각 영역을 클릭하면 설명이 나와요.' : '↑ Click a region for its explanation.'}</p>
      )}
    </figure>
  )
}
