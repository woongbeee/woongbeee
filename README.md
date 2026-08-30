# Inside Oracle — Interactive Learning Book

**https://woongbeee.github.io/woongbeee/**

문의: woongbeee@gmail.com

---

Oracle Database의 내부 동작 원리를 **개념 설명 + 인터랙티브 애니메이션 + 챕터별 시뮬레이터**로 배우는 학습서입니다.
데이터 모델링과 SQL 기초부터 내부 구조, 조인, 인덱스, 파티셔닝, 병렬 처리, 옵티마이저, SQL 튜닝까지 다룹니다.
한국어 / English 전환과 라이트 / 다크 테마를 지원합니다.

백엔드가 없는 **정적 SPA**입니다. 모든 "Oracle" 동작(SQL 파싱, CBO 실행 계획, 버퍼 캐시 Hit/Miss, 통계)은 브라우저 안 TypeScript 시뮬레이션입니다.

---

## 목차 (Chapters 0–9)

좌측 사이드바(TOC)에서 챕터·섹션을 탐색합니다. `bookStructure.tsx`가 목차의 단일 진실 공급원입니다.

| # | 챕터 | 주요 내용 |
|---|------|-----------|
| 0 | 오라클이란? | RDBMS 개념, Oracle의 위치와 역사 |
| 1 | 데이터 모델링의 이해 | 엔터티 · 속성 · 관계 · 식별자, 정규화, 관계와 조인, 트랜잭션, Null |
| 2 | SQL 문법 | DDL / DML / DCL / TCL, SELECT 구조와 절, JOIN, NULL·날짜·윈도우 함수, MERGE, ROLLUP / CUBE / PIVOT, 실행 순서 |
| 3 | 오라클 내부 구조와 프로세스 | 저장 구조(Block~Tablespace), SGA / PGA / UGA, Shared Pool, Buffer Cache, Redo Log, 백그라운드 프로세스, 트랜잭션·동시성(MVCC·Lock·Isolation), 인스턴스 시뮬레이터 |
| 4 | 조인 원리와 활용 | Nested Loops / Hash / Sort Merge / Semi Join, 조인 시뮬레이터 |
| 5 | 인덱스 원리와 활용 | B-Tree · Bitmap · 복합 인덱스, 스캔 방식(Range / Unique / Full / Fast Full / Skip), Table Access · ROWID, Unusable, 인덱스 시뮬레이터 |
| 6 | 파티셔닝 | Range / List / Hash / Composite, Partition Pruning, Partition-Wise Join, 파티션 인덱스 |
| 7 | 병렬 처리 | Parallel Query 아키텍처, PQ Coordinator / Slave, DOP |
| 8 | 옵티마이저 | CBO 개념, 통계, 액세스 패스, 실행 계획(EXPLAIN / DISPLAY / 읽는 법 / 비교), 조인 비용, Adaptive · SPM · Approx, 옵티마이저 시뮬레이터 |
| 9 | SQL 튜닝 | 쿼리 변환(View Merging · Predicate Pushing · Subquery Unnesting · OR-Expansion · Star Transformation · Join Factorization · MV Rewrite), 소트 튜닝 |

> TOC에서 클릭 가능한 범위는 `TableOfContents.tsx`의 `isReady = chapter.num <= 7`로 제어됩니다(현재 0–7 활성, 8–9는 표시만).

---

## 주요 기능

- **인터랙티브 북 레이아웃** — 좌측 TOC 트리(임의 깊이), 우측 Glossary 패널, 브레드크럼 · Prev/Next
- **라이트 / 다크 테마 토글** — 헤더 버튼. `<html data-theme>` 스왑, 선택은 `localStorage`(`oracle-book-theme`)에 저장
- **한국어 / English** — 언어별로 폰트가 다르게 적용됨(가독성 우선)
- **Oracle Instance 시뮬레이터** — SQL 입력 시 Soft/Hard Parse 분기, Library/Buffer Cache Hit/Miss, Disk I/O를 단계별 애니메이션으로 시각화
- **CBO Optimizer 패널** — Query Transformer → Estimator → Plan Generator 3단계 실행 계획
- **Schema ERD** — HR / CO 스키마 FK 관계도 (React Flow)
- 챕터별 전용 시뮬레이터(Join / Index / Optimizer / Query Transform)

---

## 실행 방법

Node.js 18 이상(CI는 Node 24)이 필요합니다.

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

**배포:** `main` push → GitHub Actions(`npm ci && npm run build`) → GitHub Pages. base path는 빌드 시 `/woongbeee/`.

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| UI 프레임워크 | React 19 + TypeScript 5.9 (strict, `any` 금지) |
| 번들러 | Vite 8 |
| 상태 관리 | Zustand 5 (`useLangStore` — lang·theme / `useInternalsStore` — 시뮬레이터) |
| 애니메이션 | Framer Motion |
| 스타일링 | Tailwind CSS v4 (CSS-first) + 커스텀 토큰 디자인 시스템 |
| 아이콘 | `@tabler/icons-react` |
| ERD | React Flow (`@xyflow/react`) |
| 폰트 | Noto Sans KR · Inter · Newsreader · JetBrains Mono (Google Fonts, 언어별 스왑) |

### 디자인 시스템

색·폰트 원본 값은 **`src/styles/tokens.css`** 한 곳, TypeScript 매핑은 **`src/lib/theme.tsx`** 한 곳에만 둡니다.
컴포넌트에는 hex·`font-family` 리터럴을 두지 않고 토큰 유틸(`bg-paper`, `text-ink`, `border-line`, `text-blue` …)만 사용합니다.
전체 스펙과 마이그레이션 현황은 리포 루트 **`DESIGN.md`**, 아키텍처 가이드는 **`CLAUDE.md`** 참고.
