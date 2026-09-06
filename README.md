# Inside Oracle — Interactive Learning Book

### ▶ 지금 바로 보기: **https://woongbeee.github.io/woongbeee/**

Oracle Database가 **내부에서 실제로 어떻게 동작하는지**를 개념 설명과 함께
움직이는 그림·직접 돌려보는 시뮬레이터로 배우는 학습서입니다.

문의: woongbeee@gmail.com

---

## 어떤 책인가요

SQL 한 줄을 넣으면 Oracle 안에서 무슨 일이 일어나는지 — 파싱, 실행 계획 선택,
버퍼 캐시 Hit/Miss, 디스크 I/O — 를 **단계별 애니메이션**으로 눈으로 따라갑니다.
읽기만 하는 문서가 아니라, 값을 바꿔가며 결과가 어떻게 달라지는지 실험하는 책입니다.

- **설치 불요.** 브라우저만 있으면 됩니다. 링크를 열면 바로 시작해요.
- **백엔드 없는 정적 SPA.** 모든 "Oracle" 동작은 실제 DB가 아니라 브라우저 안에서
  도는 TypeScript 시뮬레이션입니다. SQL 파서, 비용 기반 옵티마이저(CBO), 통계,
  캐시 모델을 직접 구현해 두었습니다.
- **한국어 / English** 전환, **라이트 / 다크 테마** 지원. 언어에 따라 폰트가 바뀝니다(가독성 우선).

---

## 어떻게 보나요

- **왼쪽 목차(TOC)** 에서 챕터와 섹션을 고릅니다. 트리는 임의 깊이까지 펼쳐집니다.
- 페이지 아래 **이전 / 다음** 버튼으로 순서대로 읽을 수 있고, 상단 브레드크럼으로 위치를 확인합니다.
- **오른쪽 Glossary 패널** — 현재 섹션에 나오는 용어의 뜻을 바로 찾아봅니다.
- 헤더의 **테마 버튼**으로 라이트/다크를 전환합니다(선택은 브라우저에 저장돼요).
- Internals 시뮬레이터는 **별도 창으로 띄우기**가 가능해, 본문과 나란히 놓고 볼 수 있습니다.

---

## 목차 (Chapters 0–9)

| # | 챕터 | 주요 내용 |
|---|------|-----------|
| 0 | 오라클이란? | RDBMS 개념, Oracle의 위치와 역사 |
| 1 | 데이터 모델링의 이해 | 엔터티 · 속성 · 관계 · 식별자, 정규화, 관계와 조인, 트랜잭션, Null |
| 2 | SQL 문법 | DDL / DML / DCL / TCL, SELECT 구조와 절, JOIN, NULL · 날짜 · 윈도우 함수, MERGE, ROLLUP / CUBE / PIVOT, 실행 순서 |
| 3 | 오라클 내부 구조와 프로세스 | 저장 구조(Block~Tablespace), SGA / PGA / UGA, Shared Pool, Buffer Cache, Redo Log, 백그라운드 프로세스, 트랜잭션 · 동시성(MVCC · Lock · Isolation), 인스턴스 시뮬레이터 |
| 4 | 조인 원리와 활용 | Nested Loops / Hash / Sort Merge / Semi Join, 조인 시뮬레이터 |
| 5 | 인덱스 원리와 활용 | B-Tree · Bitmap · 복합 인덱스, 스캔 방식(Range / Unique / Full / Fast Full / Skip), Table Access · ROWID, Unusable, 인덱스 시뮬레이터 |
| 6 | 파티셔닝 | Range / List / Hash / Composite, Partition Pruning, Partition-Wise Join, 파티션 인덱스 |
| 7 | 병렬 처리 | Parallel Query 아키텍처, PQ Coordinator / Slave, DOP |
| 8 | 옵티마이저 | CBO 개념, 통계, 액세스 패스, 실행 계획(EXPLAIN / DISPLAY / 읽는 법 / 비교), 조인 비용, Adaptive · SPM · Approx, 옵티마이저 시뮬레이터 |
| 9 | SQL 튜닝 | 쿼리 변환(View Merging · Predicate Pushing · Subquery Unnesting · OR-Expansion · Star Transformation · Join Factorization · MV Rewrite), 소트 튜닝 |

> 현재 **0–7장이 열려 있고**, 8–9장은 목차에 보이지만 아직 작성 중입니다.
> (`TableOfContents.tsx`의 `isReady = chapter.num <= 7`로 제어)

---

## 인터랙티브 요소

| 요소 | 하는 일 |
|------|---------|
| **Oracle Instance 시뮬레이터** (3장) | SQL을 입력하면 Soft/Hard Parse 분기, Library/Buffer Cache Hit/Miss, Disk I/O를 13단계 애니메이션으로 보여줍니다. 캐시를 비우고 다시 돌려 Miss를 강제할 수도 있어요. |
| **CBO Optimizer 패널** | Query Transformer → Estimator → Plan Generator 3단계를 거쳐 실행 계획을 만들고, 각 액세스 패스의 추정 비용을 보여줍니다. |
| **조인 시뮬레이터** (4장) | employees ⋈ departments가 Nested Loops / Hash / Sort Merge로 각각 어떻게 결합되는지 행 단위로 따라갑니다. |
| **인덱스 · 옵티마이저 · 쿼리 변환 시뮬레이터** | 각 챕터에서 스캔 방식·비용·변환 전후를 직접 비교합니다. |
| **Schema ERD** | HR / CO 샘플 스키마의 FK 관계도 (React Flow) |

---

## 로컬에서 실행하기

Node.js 18 이상이면 됩니다(CI는 Node 24).

```bash
git clone https://github.com/woongbeee/woongbeee.git
cd woongbeee
npm install
npm run dev          # http://localhost:5173
```

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | Vite 개발 서버 (HMR) |
| `npm run build` | `tsc -b` 타입 체크 후 Vite 번들 (`dist/`) — **유일한 정합성 게이트** |
| `npm run lint` | ESLint |
| `npm run preview` | 빌드 결과 미리보기 |
| `npx prettier --write .` | 포매팅 (`format` 스크립트 없음) |

테스트 프레임워크는 없습니다. 변경 후 `npm run build`로 타입 오류를 확인합니다.

**배포:** `main` push → GitHub Actions(`npm ci && npm run build`) → GitHub Pages.
base path는 빌드 시 `/woongbeee/`로 주입됩니다.

**숨은 진입점:**
`#simulator` 해시로 열면 Internals 시뮬레이터만 단독 창으로,
`?print=<sectionId>` 로 열면 해당 섹션만 인쇄용으로 렌더됩니다.

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| UI 프레임워크 | React 19 + TypeScript 5.9 (strict, `any` 금지) |
| 번들러 | Vite 8 |
| 상태 관리 | Zustand 5 (`useLangStore` — lang · theme / `useInternalsStore` — 시뮬레이터) |
| 애니메이션 | Framer Motion |
| 스타일링 | Tailwind CSS v4 (CSS-first) + 커스텀 토큰 디자인 시스템 |
| 아이콘 | `@tabler/icons-react` |
| ERD | React Flow (`@xyflow/react`) |
| 폰트 | Noto Sans KR · Inter · Newsreader · JetBrains Mono (Google Fonts, 언어별 스왑) |

### 디자인 시스템

색 · 폰트 원본 값은 **`src/styles/tokens.css`** 한 곳, TypeScript 매핑은 **`src/lib/theme.tsx`** 한 곳에만 둡니다.
컴포넌트에는 hex · `font-family` 리터럴을 두지 않고 토큰 유틸(`bg-paper`, `text-ink`, `border-line`, `text-blue` …)만 사용합니다.
전체 스펙과 마이그레이션 현황은 **`DESIGN.md`**, 아키텍처 가이드는 **`CLAUDE.md`** 를 참고하세요.
