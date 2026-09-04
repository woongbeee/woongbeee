import { IconPlugConnected } from '@tabler/icons-react'
import { useSimulationStore } from '@/store/simulationStore'
import {
  PageContainer, ChapterTitle, SectionTitle, Prose, StepList, Table, InfoBox, Divider,
} from '../../../shared'
import { OracleCdbDiagram } from '../../shared/OracleCdbDiagram'

const T = {
  ko: {
    title: '오라클에 접속하는 방식',
    subtitle:
      'SGA·PGA 같은 메모리 구조를 보기 전에, 클라이언트가 오라클과 어떤 식으로 관계를 맺는지부터 정리해요. 접속 모드(Dedicated·Shared), 여러 대의 인스턴스를 묶는 RAC, 하나의 그릇에 여러 DB를 담는 멀티테넌트(CDB·PDB) — 이 세 축이 "오라클 한 대"의 모양을 결정해요.',

    flowTitle: '접속의 기본 흐름',
    flowDesc:
      '클라이언트(SQL*Plus, 애플리케이션, JDBC 등)는 데이터베이스 파일을 직접 만지지 않아요. 항상 리스너를 거쳐 서버 프로세스를 하나 배정받고, 그 프로세스가 나 대신 SQL을 실행해요.',
    flowSteps: [
      { title: '① 리스너(Listener) 접속', desc: '클라이언트가 host:port/service_name 으로 리스너에 연결 요청을 보내요. 리스너는 데이터베이스와 별개로 도는 네트워크 프로세스예요.' },
      { title: '② 인증 · 세션(Session) 생성', desc: '사용자/비밀번호를 확인하고 세션을 만들어요. 커넥션(Connection)은 물리적 통신 경로, 세션은 그 위에서 도는 로그인 단위예요. 커넥션 1개에 세션 여러 개도 가능해요.' },
      { title: '③ 서버 프로세스(Server Process) 배정', desc: '이 세션의 SQL을 대신 실행할 프로세스를 붙여줘요. 이때 Dedicated 인지 Shared 인지가 갈려요.' },
      { title: '④ SQL 처리', desc: '서버 프로세스가 파싱 → 최적화 → 실행 → 결과 반환을 담당하고, 그 과정에서 SGA(공유)와 자기 PGA(전용)를 사용해요.' },
    ],

    modeTitle: 'Dedicated Server vs Shared Server',
    modeDesc:
      '세션 하나에 서버 프로세스를 어떻게 붙이느냐의 차이예요. 대부분의 환경은 Dedicated 를 쓰고, 접속자는 아주 많은데 실제 동시 작업은 적은 환경에서 Shared 가 메모리를 아껴줘요.',
    modeHeaders: ['항목', 'Dedicated Server', 'Shared Server'],
    modeRows: [
      ['프로세스 배정', '세션 1개당 서버 프로세스 1개 (1:1, 세션 내내 전용)', '소수의 공유 서버 프로세스 풀을 세션들이 돌아가며 사용'],
      ['중간 단계', '없음 — 클라이언트가 서버 프로세스에 직접 연결', 'Dispatcher 가 요청을 받아 큐에 넣고, 빈 공유 서버가 꺼내 처리'],
      ['UGA 위치', 'PGA 안', 'SGA 안 (Large Pool, 없으면 Shared Pool)'],
      ['장점', '응답이 빠르고 예측 가능, 관리 단순', '수천 접속에서도 프로세스·메모리 사용량이 적음'],
      ['단점', '접속자가 많으면 프로세스·메모리가 그만큼 늘어남', '요청이 몰리면 큐 대기 발생, 장기 실행 쿼리에 불리'],
      ['설정', '기본값', 'SHARED_SERVERS · DISPATCHERS 파라미터로 활성화'],
    ],

    racTitle: '단일 인스턴스 vs Oracle RAC',
    racDesc:
      '보통은 데이터베이스 1개에 인스턴스(메모리+프로세스) 1개가 붙어요(1:1). RAC(Real Application Clusters)는 같은 데이터베이스 파일을 여러 노드의 인스턴스가 동시에 공유해서, 한 노드가 죽어도 서비스가 이어지고 부하도 나눠 가져요.',
    racHeaders: ['항목', '단일 인스턴스', 'Oracle RAC'],
    racRows: [
      ['인스턴스 : 데이터베이스', '1 : 1', 'N : 1 (여러 인스턴스가 하나의 DB 공유)'],
      ['스토리지', '해당 서버의 디스크', '공유 스토리지 (ASM · 클러스터 파일시스템)'],
      ['가용성', '노드 장애 = 서비스 중단', '한 노드 장애 시 다른 노드가 이어받음 (Failover)'],
      ['확장', '서버 스펙 업(Scale-up)', '노드 추가(Scale-out)로 처리량 확장'],
      ['조정 역할', '불필요', 'Cache Fusion — 인스턴스 간 블록을 인터커넥트로 주고받아 정합성 유지'],
    ],
    racDiagCaption: 'RAC — 여러 인스턴스가 하나의 데이터베이스를 공유',

    cdbTitle: '멀티테넌트 — CDB & PDB',
    cdbDesc:
      'Oracle 12c 부터 데이터베이스는 컨테이너 구조가 됐어요. CDB(Container Database) 하나가 인스턴스·컨트롤 파일·리두 로그를 통째로 들고, 그 안에 PDB(Pluggable Database) 여러 개를 꽂아 써요. 애플리케이션 입장에서 PDB 는 그냥 독립된 데이터베이스처럼 보이지만, 실제로는 CDB 자원을 공유해요. Oracle 21c 부터는 CDB 만 만들 수 있어요.',
    cdbShareHeaders: ['자원', 'CDB 전체가 공유', 'PDB 마다 따로'],
    cdbShareRows: [
      ['인스턴스 (SGA · 백그라운드 프로세스)', 'O — 하나', 'X'],
      ['컨트롤 파일 · 온라인 리두 로그 · 파라미터 파일', 'O — 하나', 'X'],
      ['데이터 딕셔너리 · 스키마 · 사용자', 'Root(CDB$ROOT)에 공통 메타데이터만', 'O — PDB 별 자체 딕셔너리'],
      ['테이블스페이스 · 데이터 파일 · 임시 파일', 'X', 'O — PDB 별 분리'],
      ['이식', '—', 'Unplug / Plug 로 다른 CDB 로 이동, 빠른 복제'],
    ],

    summary:
      '접속은 리스너 → 세션 → 서버 프로세스 순서로 이뤄져요. Dedicated 는 세션마다 전용 프로세스(1:1), Shared 는 공유 풀. RAC 는 여러 인스턴스가 하나의 DB 파일을 공유해 가용성·확장성을 얻는 구조. 멀티테넌트는 CDB 하나가 인스턴스·시스템 파일을 들고, 그 안의 PDB 들이 자기 데이터 파일·딕셔너리만 따로 가져요.',
  },
  en: {
    title: 'How Clients Connect to Oracle',
    subtitle:
      'Before the SGA and PGA memory structures, it helps to know how a client actually relates to Oracle. Three axes shape what "one Oracle database" looks like: the connection mode (Dedicated vs Shared), clustering multiple instances with RAC, and packing many databases into one container with multitenant (CDB / PDB).',

    flowTitle: 'The Basic Connection Flow',
    flowDesc:
      'A client (SQL*Plus, an application, JDBC…) never touches the database files directly. It always goes through the listener, is assigned a server process, and that process runs SQL on its behalf.',
    flowSteps: [
      { title: '1. Reach the Listener', desc: 'The client connects to the listener at host:port/service_name. The listener is a network process that runs separately from the database.' },
      { title: '2. Authenticate · create a Session', desc: 'Oracle checks the credentials and creates a session. A connection is the physical communication path; a session is a logged-in unit running over it. One connection can carry several sessions.' },
      { title: '3. Assign a Server Process', desc: 'A process is attached to run this session\'s SQL. This is where Dedicated vs Shared server is decided.' },
      { title: '4. Process SQL', desc: 'The server process parses, optimises, executes, and returns results — using the shared SGA and its own private PGA along the way.' },
    ],

    modeTitle: 'Dedicated Server vs Shared Server',
    modeDesc:
      'The difference is how a server process is attached to a session. Most environments use Dedicated; Shared saves memory when there are many connections but few concurrently active requests.',
    modeHeaders: ['Aspect', 'Dedicated Server', 'Shared Server'],
    modeRows: [
      ['Process assignment', 'One server process per session (1:1, dedicated for the whole session)', 'Sessions take turns using a small pool of shared server processes'],
      ['Middle layer', 'None — the client connects straight to its server process', 'A dispatcher queues the request; a free shared server picks it up'],
      ['UGA location', 'Inside the PGA', 'Inside the SGA (Large Pool, or Shared Pool if none)'],
      ['Pros', 'Fast and predictable response, simple to manage', 'Low process and memory footprint even with thousands of connections'],
      ['Cons', 'Process and memory grow with the number of connections', 'Requests queue under load; poor for long-running queries'],
      ['Configuration', 'Default', 'Enabled via SHARED_SERVERS / DISPATCHERS parameters'],
    ],

    racTitle: 'Single Instance vs Oracle RAC',
    racDesc:
      'Normally one database has one instance (memory + processes) — a 1:1 relationship. Oracle RAC (Real Application Clusters) lets instances on several nodes share the same database files at once, so service survives a node failure and load is spread.',
    racHeaders: ['Aspect', 'Single Instance', 'Oracle RAC'],
    racRows: [
      ['Instance : database', '1 : 1', 'N : 1 (many instances share one database)'],
      ['Storage', 'Local disk of that server', 'Shared storage (ASM / clustered file system)'],
      ['Availability', 'Node failure = outage', 'Another node takes over on failure (failover)'],
      ['Scaling', 'Scale up the server', 'Scale out by adding nodes'],
      ['Coordination', 'Not needed', 'Cache Fusion — instances ship blocks over the interconnect to stay consistent'],
    ],
    racDiagCaption: 'RAC — multiple instances sharing one database',

    cdbTitle: 'Multitenant — CDB & PDB',
    cdbDesc:
      'Since Oracle 12c the database is a container structure. One CDB (Container Database) owns the instance, control files, and redo log, and you plug several PDBs (Pluggable Databases) into it. To an application a PDB looks like a standalone database, but it shares the CDB\'s resources. Since Oracle 21c only CDBs can be created.',
    cdbShareHeaders: ['Resource', 'Shared by the whole CDB', 'Separate per PDB'],
    cdbShareRows: [
      ['Instance (SGA · background processes)', 'Yes — one', 'No'],
      ['Control files · online redo log · parameter file', 'Yes — one set', 'No'],
      ['Data dictionary · schemas · users', 'Only common metadata in CDB$ROOT', 'Yes — each PDB has its own dictionary'],
      ['Tablespaces · data files · temp files', 'No', 'Yes — separate per PDB'],
      ['Portability', '—', 'Unplug / plug into another CDB; fast cloning'],
    ],

    summary:
      'A connection goes listener → session → server process. Dedicated gives each session its own process (1:1); Shared uses a pool. RAC has multiple instances sharing one set of database files for availability and scale-out. Multitenant puts the instance and system files in one CDB, while each PDB keeps only its own data files and dictionary.',
  },
}

// ── RAC mini-diagram (인라인, 이름표만) ──────────────────────────────────────
function RacDiagram({ caption }: { caption: string }) {
  return (
    <figure className="my-4 flex flex-col items-center gap-2 rounded-panel border border-line bg-paper p-4">
      <div className="flex w-full max-w-[380px] items-stretch gap-3">
        {['Instance 1', 'Instance 2'].map((n) => (
          <div key={n} className="flex flex-1 flex-col items-center gap-0.5 rounded-card border border-l-[3px] border-viz-blue/50 border-l-viz-blue bg-paper px-2 py-2 text-center">
            <span className="font-sans text-[11.5px] font-semibold text-viz-blue">{n}</span>
            <span className="font-mono text-[9px] text-ink-3">SGA · processes</span>
          </div>
        ))}
      </div>
      <span className="font-mono text-[8.5px] leading-none text-ink-3">Cache Fusion ↕ · interconnect</span>
      <span className="font-mono text-[13px] leading-none text-ink-3">↓ ↓</span>
      <div className="w-full max-w-[380px] rounded-card border border-l-[3px] border-line-2 border-l-line-2 bg-rail px-2 py-2 text-center">
        <span className="font-sans text-[11.5px] font-semibold text-ink-2">{'Shared Storage — one database'}</span>
        <span className="ml-2 font-mono text-[9px] text-ink-3">data files · control files · redo</span>
      </div>
      <figcaption className="mt-1 font-sans text-[10px] text-ink-3">{caption}</figcaption>
    </figure>
  )
}

export function ConnectionSection() {
  const lang = useSimulationStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer className="max-w-4xl">
      <ChapterTitle
        icon={<IconPlugConnected size={36} stroke={1.5} className="text-blue-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.flowTitle}</SectionTitle>
      <Prose>{t.flowDesc}</Prose>
      <StepList steps={t.flowSteps} />

      <Divider />

      <SectionTitle>{t.modeTitle}</SectionTitle>
      <Prose>{t.modeDesc}</Prose>
      <Table headers={t.modeHeaders} rows={t.modeRows} />

      <Divider />

      <SectionTitle>{t.racTitle}</SectionTitle>
      <Prose>{t.racDesc}</Prose>
      <RacDiagram caption={t.racDiagCaption} />
      <Table headers={t.racHeaders} rows={t.racRows} />

      <Divider />

      <SectionTitle>{t.cdbTitle}</SectionTitle>
      <Prose>{t.cdbDesc}</Prose>
      <OracleCdbDiagram />
      <Table headers={t.cdbShareHeaders} rows={t.cdbShareRows} />

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
