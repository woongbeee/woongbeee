import { IconLayersLinked, IconShieldCheck } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  InfoBox,
  Divider,
  ConceptGrid,
} from '../../shared'

const T = {
  ko: {
    title: '데이터 동시성과 정합성',
    subtitle:
      '여러 사용자가 동시에 같은 데이터를 읽고 쓸 때 Oracle이 어떻게 충돌을 막고 일관된 결과를 보장하는지 살펴봅니다.',
    concepts: '핵심 개념',
    conceptItems: [
      {
        title: 'Concurrency (동시성)',
        desc: '여러 사용자가 동시에 같은 데이터에 접근할 수 있어야 한다.',
      },
      {
        title: 'Consistency (정합성)',
        desc: '각 사용자는 커밋된 데이터만 보는 일관된 스냅샷을 보아야 한다.',
      },
      {
        title: 'MVCC (Multi Version Concurrency Control)',
        desc: '다중 버전 읽기 일관성 — 읽기와 쓰기가 서로를 차단하지 않는다.',
      },
      {
        title: 'SCN',
        desc: 'System Change Number — Oracle이 시간 순서를 추적하는 단조 증가 숫자.',
      },
    ],
    tradeoff: 'Oracle은 MVCC를 통해 읽기와 쓰기가 서로를 차단하지 않도록 설계되었습니다. 읽기(SELECT)는 절대 쓰기를 막지 않고, 쓰기도 읽기를 막지 않습니다. 이것이 Oracle이 높은 동시성을 유지하는 핵심 원리입니다.',
  },
  en: {
    title: 'Data Concurrency & Consistency',
    subtitle:
      'Explore how Oracle prevents conflicts and guarantees consistent results when multiple users read and write the same data simultaneously.',
    concepts: 'Key Concepts',
    conceptItems: [
      {
        title: 'Concurrency',
        desc: 'Multiple users must be able to access the same data at the same time.',
      },
      {
        title: 'Consistency',
        desc: 'Each user sees a consistent snapshot of only committed data.',
      },
      {
        title: 'MVCC',
        desc: 'Multiversion Read Consistency — readers and writers do not block each other.',
      },
      {
        title: 'SCN',
        desc: 'System Change Number — the monotonically increasing counter Oracle uses to track time order.',
      },
    ],
    tradeoff: "Oracle is designed via MVCC so that reads and writes never block each other. A SELECT never blocks a writer, and a writer never blocks a reader. This is the key principle behind Oracle's high concurrency.",
  },
}

export function ConcurrencySection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconLayersLinked size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.concepts}</SectionTitle>
      <ConceptGrid
        items={t.conceptItems.map((item) => ({
          icon: <IconShieldCheck size={20} stroke={1.5} className="text-blue-500" />,
          title: item.title,
          desc: item.desc,
        }))}
      />

      <Divider />
      <InfoBox variant="note">
        {t.tradeoff}
      </InfoBox>
    </PageContainer>
  )
}
