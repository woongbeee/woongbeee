import { PageContainer, ChapterTitle, SectionTitle } from '../../shared'
import { useSimulationStore } from '@/store/simulationStore'
import { cn } from '@/lib/utils'
import {
  IconCategory,
  IconTable,
  IconEdit,
  IconShieldLock,
  IconGitCommit,
} from '@tabler/icons-react'

const T = {
  ko: {
    chapterTitle: '오라클 명령어의 종류 알아보기',
    chapterSubtitle:
      'SQL은 관계형 데이터베이스를 다루는 표준 언어예요. SQL 명령어는 역할에 따라 DDL, DML, DCL, TCL 네 가지로 나뉘는데, 각 역할을 이해하면 Oracle이 데이터를 어떻게 다루는지 감이 잡혀요. ' +
      '각 명령어의 자세한 사용법은 앞으로 하나씩 배울 거니까, 여기서는 "이런 게 있구나" 정도로만 읽고 넘어가면 돼요.',

    overviewTitle: '명령어 종류 한눈에 보기',
    categories: [
      {
        abbr: 'DDL',
        full: 'Data Definition Language',
        color: 'violet',
        icon: <IconTable size={20} color="var(--color-purple)" stroke={1.5} />,
        title: '데이터 정의어',
        desc: '테이블·인덱스·뷰 등 데이터를 어떤 형태로 저장할지 정의하거나 변경해요.',
        cmds: ['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'],
      },
      {
        abbr: 'DML',
        full: 'Data Manipulation Language',
        color: 'blue',
        icon: <IconEdit size={20} color="var(--color-blue)" stroke={1.5} />,
        title: '데이터 조작어',
        desc: '테이블에 저장된 실제 데이터를 조회·삽입·수정·삭제해요.',
        cmds: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MERGE'],
      },
      {
        abbr: 'DCL',
        full: 'Data Control Language',
        color: 'emerald',
        icon: (
          <IconShieldLock size={20} color="var(--color-green)" stroke={1.5} />
        ),
        title: '데이터 제어어',
        desc: '사용자에게 권한을 부여하거나 회수해서 데이터 접근을 제어해요. 사용자마다 접근 권한을 다르게 설정할 수 있어요.',
        cmds: ['GRANT', 'REVOKE'],
      },
      {
        abbr: 'TCL',
        full: 'Transaction Control Language',
        color: 'orange',
        icon: (
          <IconGitCommit size={20} color="var(--color-amber)" stroke={1.5} />
        ),
        title: '트랜잭션 제어어',
        desc: 'DML로 변경한 데이터를 확정하거나 이전 상태로 되돌려요.',
        cmds: ['COMMIT', 'ROLLBACK', 'SAVEPOINT'],
      },
    ],
  },
  en: {
    chapterTitle: 'Types of Oracle SQL Commands',
    chapterSubtitle:
      'SQL commands are grouped into four categories — DDL, DML, DCL, and TCL — based on their role. Understanding each category shows you how Oracle handles data. ' +
      "We'll cover each command in detail later, so for now just get a feel for what they mean.",

    overviewTitle: 'Command Categories at a Glance',
    categories: [
      {
        abbr: 'DDL',
        full: 'Data Definition Language',
        color: 'violet',
        icon: <IconTable size={20} color="var(--color-purple)" stroke={1.5} />,
        title: 'Data Definition',
        desc: 'Defines or modifies the structure of database objects such as tables, indexes, and views.',
        cmds: ['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'],
      },
      {
        abbr: 'DML',
        full: 'Data Manipulation Language',
        color: 'blue',
        icon: <IconEdit size={20} color="var(--color-blue)" stroke={1.5} />,
        title: 'Data Manipulation',
        desc: 'Queries, inserts, updates, and deletes actual data stored in tables.',
        cmds: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MERGE'],
      },
      {
        abbr: 'DCL',
        full: 'Data Control Language',
        color: 'emerald',
        icon: (
          <IconShieldLock size={20} color="var(--color-green)" stroke={1.5} />
        ),
        title: 'Data Control',
        desc: 'Grants or revokes privileges on database objects to control data access.',
        cmds: ['GRANT', 'REVOKE'],
      },
      {
        abbr: 'TCL',
        full: 'Transaction Control Language',
        color: 'orange',
        icon: (
          <IconGitCommit size={20} color="var(--color-amber)" stroke={1.5} />
        ),
        title: 'Transaction Control',
        desc: 'Commits DML changes permanently or rolls them back to a previous state.',
        cmds: ['COMMIT', 'ROLLBACK', 'SAVEPOINT'],
      },
    ],
  },
}

const COLOR_MAP: Record<string, { card: string; badge: string; tag: string }> =
  {
    violet: {
      card: 'border-purple/30 bg-purple/5',
      badge: 'bg-purple/10 text-purple',
      tag: 'bg-purple/10 text-purple',
    },
    blue: {
      card: 'border-blue/30 bg-blue/5',
      badge: 'bg-blue/10 text-blue',
      tag: 'bg-blue/10 text-blue',
    },
    emerald: {
      card: 'border-green/30 bg-green/5',
      badge: 'bg-green/10 text-green',
      tag: 'bg-green/10 text-green',
    },
    orange: {
      card: 'border-amber/30 bg-amber/5',
      badge: 'bg-amber/10 text-amber',
      tag: 'bg-amber/10 text-amber',
    },
  }

export function DdlDmlDclSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer className="max-w-5xl">
      <ChapterTitle
        icon={<IconCategory size={36} color="var(--color-blue)" stroke={1.5} />}
        title={t.chapterTitle}
        subtitle={t.chapterSubtitle}
      />

      {/* ── Overview cards ── */}
      <SectionTitle>{t.overviewTitle}</SectionTitle>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {t.categories.map((cat) => {
          const c = COLOR_MAP[cat.color]
          return (
            <div
              key={cat.abbr}
              className={cn('rounded-panel border p-4', c.card)}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <span
                  className={cn(
                    'rounded-card px-2 py-0.5 font-mono text-sm font-bold',
                    c.badge
                  )}
                >
                  {cat.abbr}
                </span>
                <span className="text-ink-2 font-sans text-xs">{cat.full}</span>
              </div>
              <div className="mb-1 font-sans text-sm font-semibold">
                {cat.title}
              </div>
              <p className="font-read text-ink-2 mb-3 text-xs leading-relaxed">
                {cat.desc}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cat.cmds.map((cmd) => (
                  <span
                    key={cmd}
                    className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-[11px] font-medium',
                      c.tag
                    )}
                  >
                    {cmd}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </PageContainer>
  )
}
