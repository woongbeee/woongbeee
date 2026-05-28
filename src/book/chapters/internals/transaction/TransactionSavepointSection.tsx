import { IconFlag } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SubTitle,
  Prose,
  InfoBox,
  Divider,
  Table,
  SqlBlock,
} from '../../shared'
import { cn } from '@/lib/utils'

const T = {
  ko: {
    title: 'SAVEPOINT — 중간 복원 지점',
    subtitle: 'SAVEPOINT를 사용하면 트랜잭션 전체를 롤백하지 않고 특정 지점까지만 되돌릴 수 있어요.',
    desc:
      'SAVEPOINT는 트랜잭션 중간에 이름 있는 복원 지점을 만들어요. ROLLBACK TO SAVEPOINT 명령을 쓰면 그 지점 이후의 변경만 취소되고, 트랜잭션은 계속 살아 있어요.\n\nSAVEPOINT 이전의 변경은 취소되지 않아요. 최종적으로 COMMIT 또는 ROLLBACK으로 트랜잭션을 끝내야 해요.',
    exampleTitle: 'SAVEPOINT 사용 예시',
    lockTitle: 'ROLLBACK TO SAVEPOINT 시 락(Lock) 동작',
    lockRows: [
      ['지정 SAVEPOINT 이후 문장 롤백', 'SAVEPOINT 이후의 변경만 취소돼요'],
      ['지정 SAVEPOINT 보존', 'ROLLBACK TO 한 SAVEPOINT는 계속 유효해요'],
      ['이후 SAVEPOINT 삭제', 'ROLLBACK TO 한 지점보다 나중의 SAVEPOINT는 모두 삭제돼요'],
      ['SAVEPOINT 이후에 획득한 락 해제', 'SAVEPOINT 이전에 획득한 락은 유지돼요'],
      ['트랜잭션 활성 유지', 'ROLLBACK TO SAVEPOINT는 트랜잭션을 종료하지 않아요'],
    ],
    lockNote:
      '다른 세션이 ROLLBACK TO SAVEPOINT로 해제된 행 락을 즉시 획득하는 건 아니에요. 차단된 세션은 메인 트랜잭션 전체가 COMMIT 또는 ROLLBACK될 때까지 기다려요.',
    note:
      'SAVEPOINT를 같은 이름으로 다시 만들면 이전 SAVEPOINT가 덮어씌워져요. RELEASE SAVEPOINT 명령으로 명시적으로 해제할 수도 있어요.',
    summary:
      'COMMIT은 변경을 영구적으로 확정하고, ROLLBACK은 Undo Segment로 이전 상태를 복원하며, SAVEPOINT는 부분 롤백을 가능하게 해줘요. ACID 속성은 트랜잭션이 데이터 무결성을 지키는 방식의 이론적 토대예요.',
    diagramSteps: [
      { label: 'INSERT A', state: 'normal' as const },
      { label: 'SAVEPOINT sp1', state: 'sp' as const, note: 'SP1' },
      { label: 'UPDATE B', state: 'normal' as const },
      { label: 'SAVEPOINT sp2', state: 'sp' as const, note: 'SP2' },
      { label: 'DELETE C', state: 'normal' as const },
      { label: 'ROLLBACK TO sp2', state: 'rollback' as const, note: 'DELETE C 취소' },
      { label: 'COMMIT', state: 'commit' as const, note: 'A 삽입 + B 수정 확정' },
    ],
  },
  en: {
    title: 'SAVEPOINT — Intermediate Restore Points',
    subtitle: 'SAVEPOINTs let you roll back to a specific point within a transaction without discarding all changes.',
    desc:
      'A SAVEPOINT creates a named restore point inside an active transaction. ROLLBACK TO SAVEPOINT undoes only the changes made after that point; the transaction itself stays active and the earlier changes are preserved.\n\nChanges made before the SAVEPOINT are not affected. The transaction must still be ended with a COMMIT or ROLLBACK.',
    exampleTitle: 'SAVEPOINT Example',
    lockTitle: 'Lock Behavior on ROLLBACK TO SAVEPOINT',
    lockRows: [
      ['Statements after the savepoint rolled back', 'Only changes after the savepoint are undone'],
      ['The specified savepoint preserved', 'The savepoint rolled back to remains valid'],
      ['Subsequent savepoints deleted', 'All savepoints created after the rollback point are erased'],
      ['Locks acquired after savepoint released', 'Locks acquired before the savepoint are retained'],
      ['Transaction remains active', 'ROLLBACK TO SAVEPOINT does not end the transaction'],
    ],
    lockNote:
      "Sessions blocked by a lock do not immediately proceed when ROLLBACK TO SAVEPOINT releases that specific lock. Blocked sessions wait for the entire blocking transaction (not just a lock) to COMMIT or ROLLBACK.",
    note:
      'Redefining a SAVEPOINT with the same name overwrites the previous one. You can also release a savepoint explicitly with RELEASE SAVEPOINT.',
    summary:
      'COMMIT makes changes permanent; ROLLBACK uses the Undo Segment to restore the previous state; SAVEPOINT enables partial rollback. The ACID properties are the theoretical foundation for how transactions guarantee data integrity.',
    diagramSteps: [
      { label: 'INSERT A', state: 'normal' as const },
      { label: 'SAVEPOINT sp1', state: 'sp' as const, note: 'SP1' },
      { label: 'UPDATE B', state: 'normal' as const },
      { label: 'SAVEPOINT sp2', state: 'sp' as const, note: 'SP2' },
      { label: 'DELETE C', state: 'normal' as const },
      { label: 'ROLLBACK TO sp2', state: 'rollback' as const, note: 'DELETE C undone' },
      { label: 'COMMIT', state: 'commit' as const, note: 'A inserted + B updated' },
    ],
  },
}

type StepState = 'commit' | 'rollback' | 'sp' | 'normal'

const stateStyle: Record<StepState, string> = {
  normal:   'border-slate-300 bg-white text-slate-600',
  sp:       'border-amber-400 bg-amber-50 text-amber-700 font-bold',
  rollback: 'border-rose-400 bg-rose-50 text-rose-700',
  commit:   'border-emerald-400 bg-emerald-50 text-emerald-700 font-bold',
}

function SavepointDiagram({ steps }: { steps: { label: string; state: StepState; note?: string }[] }) {
  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn('w-48 shrink-0 rounded-lg border px-3 py-2 font-mono text-[11px]', stateStyle[s.state])}>
              {s.label}
            </div>
            {s.note && (
              <span className="font-mono text-[10px] text-slate-400">{s.note}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TransactionSavepointSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]
  const isKo = lang === 'ko'

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconFlag size={36} stroke={1.5} className="text-amber-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <Prose>{t.desc}</Prose>

      <Divider />

      <SubTitle>{t.exampleTitle}</SubTitle>
      <SavepointDiagram steps={t.diagramSteps} />
      <SqlBlock
        sql={isKo
          ? `INSERT INTO orders VALUES (1, 'A');\nSAVEPOINT sp1;\n\nINSERT INTO orders VALUES (2, 'B');\nSAVEPOINT sp2;\n\nINSERT INTO orders VALUES (3, 'C'); -- 실수!\nROLLBACK TO sp2; -- 3번만 취소, 1·2번은 유지, sp2는 유지, sp2 이후 SP 삭제\n\nCOMMIT; -- 1번, 2번 확정`
          : `INSERT INTO orders VALUES (1, 'A');\nSAVEPOINT sp1;\n\nINSERT INTO orders VALUES (2, 'B');\nSAVEPOINT sp2;\n\nINSERT INTO orders VALUES (3, 'C'); -- mistake!\nROLLBACK TO sp2; -- only row 3 undone; rows 1 & 2 kept; sp2 preserved; later SPs erased\n\nCOMMIT; -- rows 1 and 2 made permanent`}
      />

      <Divider />

      <SubTitle>{t.lockTitle}</SubTitle>
      <Table
        headers={isKo ? ['동작', '설명'] : ['Action', 'Description']}
        rows={t.lockRows}
      />
      <InfoBox variant="warning">{t.lockNote}</InfoBox>

      <Divider />

      <InfoBox variant="note">{t.note}</InfoBox>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
