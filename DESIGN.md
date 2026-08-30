# DESIGN.md — Dynamic Oracle 교육서 디자인 시스템

> **방향: Notion 스타일** (샘플 승인 2026-08-30).
> 이 문서가 `src/styles/tokens.css` · `src/lib/theme.tsx` · 챕터 페이지 리팩터링의 단일 기준이다.
>
> **톤**: 차분한 디지털 교재. 셸(사이드바·헤더)은 웜 그레이 무채색, 색은 본문 콘텐츠에만.
> 각진 모서리, 헤어라인 경계, 그림자 없음. 읽기 가독성 최우선.
> (이전 "다크 우선 · teal · IBM Plex" 캔버스 방향에서 전환됨.)
>
> **상태 (2026-08-30)**: Frame + 전 챕터(0–9) 토큰 이관 완료, 다크/라이트 대응. 나머지는 챕터별 육안 QA와 Phase 3 정리(§6).

---

## 1. 원칙

1. **라이트 기본, 다크 완전 대응.** 두 테마가 같은 토큰 이름을 공유. `<html data-theme>` 스왑(헤더 토글 버튼). 초기값은 저장된 선택 → OS `prefers-color-scheme` → light. 콘텐츠 영역은 `BookContent.tsx`의 `DARK_READY`(현재 전 챕터 프리픽스)에 해당하면 테마를 따르고, 아니면 `data-theme="light"` 로 고정한다.
2. **셸은 무채색, 색은 콘텐츠에만.** 사이드바·헤더·검색창·탭은 웜 그레이 한 계열(`--color-rail` / `--color-ink`). 색(blue·green·red·amber·purple)은 본문 콜아웃·표 상태값·문법 강조·다이어그램·아이콘에서만.
3. **하나의 인터랙션 액센트.** blue `#2166d6` — 링크·1차 버튼·포커스·선택. 무지개색 금지.
4. **teal · 파스텔 금지.** green은 포레스트 그린(hue ~145), blue는 로열 블루 — cyan/teal 계열 아님. 콜아웃은 배경 채움 없이 **좌측 3px 색선 + 색 라벨**로만 (연한 틴트 = 파스텔로 읽힘).
5. **경계는 헤어라인.** 1px `--color-line`. 그림자는 팝오버에만. 카드는 `--color-paper` + `--color-line` 테두리 + `--radius-card`.
6. **읽기 가독성 최우선.** 본문 15px / line-height 1.75, 한 줄 ~64ch. 언어별로 가독성이 더 좋은 폰트를 쓴다(§3).
7. **각진 모서리.** 3 / 6 / 8px. pill은 토글·태그 정도에만.
8. **구조가 정보다.** 번호·타임라인·구분선은 실제 순서/관계가 있을 때만. 역사 섹션 = `<ol>` (시간순).

---

## 2. 색  (`src/styles/tokens.css` §2c + §3)

### 2.1 서피스 · 잉크 · 라인 — 테마 종속

| 토큰 | 용도 | Light | Dark |
|------|------|-------|------|
| `--color-paper` | 카드·패널 바탕 | `#ffffff` | `#1f1e1c` |
| `--color-paper-sunk` | 페이지 바탕 · 옅은 함몰면 | `#fbfbfa` | `#1a1917` |
| `--color-rail` | 사이드바 · 코드블록 · 표 헤더 = **무채색 셸 면** | `#f7f6f3` | `#262523` |
| `--color-ink` | 본문 · 제목 | `#2f2e2b` | `#ececea` |
| `--color-ink-2` | 보조 설명 · 캡션 | `#6f6e6a` | `#a5a49d` |
| `--color-ink-3` | 메타 · 라벨 · 비활성 | `#78776f` | `#8a887f` |
| `--color-line` | 헤어라인 (기본) | `#eae9e5` | `#34322e` |
| `--color-line-2` | 강한 구분 | `#dddcd6` | `#423f39` |

### 2.2 콘텐츠 색 — 테마 무관 (다크에서 밝게 조정, hue 유지)

채도 높은 확정색. **텍스트 · 3px 좌측선 · 솔리드 칩 · 문법 강조**에만. 파스텔 채움 금지.

| 토큰 | 의미 | Light | Dark |
|------|------|-------|------|
| `--color-blue` | 1차 인터랙션 · 링크 · info · `SELECT` 결과 | `#2166d6` | `#6ea3f0` |
| `--color-green` | 성공 · 양수 · `paid` · 문자열 (포레스트 그린) | `#1e7a43` | `#63b981` |
| `--color-red` | 오류 · 위험 · `canceled` · 음수 | `#c6362e` | `#e8837b` |
| `--color-amber` | 주의 · `pending` · 숫자 · 병목 | `#b26c0e` | `#d9a44f` |
| `--color-purple` | 용어(TERM) · 키워드 · 특수 | `#6b4cc4` | `#a98ee6` |
| `--color-slate` | 중립 데이터 · 구조 마커 | `#4b5563` | `#93a1b3` |
| `--color-accent` | = `--color-blue` | | |
| `--color-sel` | 텍스트/행 선택 | `rgba(33,102,214,.16)` | `rgba(110,163,240,.22)` |

### 2.3 코드 문법 강조 — 코드블록 배경은 `--color-code-bg` (라이트 웜 그레이 / 다크 rail)

| 토큰 | 대상 | Light | Dark |
|------|------|-------|------|
| `--color-code-bg` | 코드블록 바탕 | `#f7f6f3` | `#262523` |
| `--color-sy-kw` | keyword | `#6b4cc4` purple | `#a98ee6` |
| `--color-sy-fn` | function | `#2166d6` blue | `#6ea3f0` |
| `--color-sy-str` | string | `#1e7a43` green | `#63b981` |
| `--color-sy-num` | number | `#b26c0e` amber | `#d9a44f` |
| `--color-sy-com` | comment | `#83827a` grey | `#8f8b81` |

### 2.4 챕터 식별 & 진행 상태

셸이 무채색이므로 **챕터마다 고유 hue를 주지 않는다.** 사이드바 현재 챕터는 중립 강조(`bg-rail` + `text-ink`)뿐.
챕터/섹션 카드에는 **진행 상태 색**만:

| 상태 | 색 |
|------|-----|
| 완료 / `DONE` | `--color-green` |
| 진행중 (`82%`) | `--color-amber` |
| 현재 / `READING` | `--color-blue` |
| 잠김 / `LOCKED` | `--color-ink-3` + `opacity .55` |

> `src/lib/theme.tsx`의 `ACCENT_COLORS`(챕터별 Tailwind 클래스 세트)는 레거시 `ios-*`/`brand-*` 를 참조하지만 **값은 어디서도 소비되지 않는다** — `AccentColor` 타입만 `bookStructure.tsx` 가 쓴다. 챕터 파일의 `ios-*`/`brand-*` 는 전부 §2c 토큰으로 이관 완료. Phase 3에서 `ACCENT_COLORS` 자체 제거.

---

## 3. 타이포그래피  (`index.html` Google Fonts · `tokens.css` §1)

### 3.1 폰트 — 언어별로 가독성 최적화 (요구사항: KO/EN 다르게)

| 역할 | 한국어 | 영어 | Tailwind |
|------|--------|------|----------|
| UI · 제목 · 라벨 | **Noto Sans KR** (화면 가독성) | **Inter** | `font-sans` |
| 장문 본문 (prose) | **Noto Sans KR** | **Newsreader** 세리프 (장문 읽기) | `font-read` |
| 코드 · 수치 · 표 · 뱃지 · 브레드크럼 | JetBrains Mono | JetBrains Mono | `font-mono` |

- `tokens.css`: `--font-ui-ko|-en`, `--font-read-ko|-en`, `--font-sans-active` / `--font-read-active` (기본 KO), `:root:lang(en)` 에서 EN 으로 스왑. `@theme` 의 `--font-sans` / `--font-read` 가 각각을 가리켜 `font-sans` / `font-read` 유틸 생성.
- `App.tsx` 가 `<html lang>` 을 `useLangStore` 와 동기화 → 언어 토글 시 폰트 자동 스왑.
- 근거: 영어 장문은 세리프가 더 잘 읽히고, 한글은 화면에서 산세리프(Noto Sans KR)가 더 잘 읽힌다.

### 3.2 타입 스케일 (IntroductionPage 기준 실측)

| 역할 | size / line-height / weight / tracking | 폰트 |
|------|----------------------------------------|------|
| kicker (섹션 라벨) | 11px / 1.4 / 500 / `.14em` upper | mono, `text-ink-3` |
| h1 | 2rem / 1.2 / 600 / `-.02em` · `text-balance` | `font-sans` |
| h2 (섹션) | 1.375rem / 1.3 / 600 / `-.01em` | `font-sans` |
| h2 (요약/작은) | 1.125rem / 1.3 / 600 / `-.01em` | `font-sans` |
| lead 문단 | 1.0625rem / 1.8 / 400 | `font-read`, `text-ink-2` |
| 본문 문단 | 15px / 1.75 / 400 · `whitespace-pre-line` | `font-read`, `text-ink-2` |
| 카드 제목 | 14px / 1.4 / 600 | `font-sans`, `text-ink` |
| 카드 본문 | 13px / 1.6 / 400 | `font-read`, `text-ink-2` |
| 콜아웃 라벨 | 10px / 1 / 700 / `.1em` upper | mono, variant 색 |
| 콜아웃 본문 | 13.5–14px / 1.65 / 400 | `font-read`, `text-ink` |
| 타임라인 연도 | 12px / 1 / 500 · `tabular-nums` | mono, `text-ink-3` |
| 표 헤더 | 10–10.5px / 1.4 / 700 / `.04em` | mono, `text-ink-2` |
| 표 셀 | 12–12.5px / 1.5 / 400 · `tabular-nums` | mono, `text-ink` |
| 코드 | 13px / 1.75 / 400 | mono |

**두께**: 400(본문) · 500(라벨·강조) · 600(제목·카드 제목) · 700(mono 라벨·뱃지). serif(Newsreader)는 400만.

---

## 4. 모양 · 간격  (`tokens.css` §2c)

Tailwind 기본 `--radius-*` 를 덮지 않도록 전용 이름.

| 토큰 | 값 | 대상 |
|------|-----|------|
| `--radius-chip` | `3px` | 칩 · 뱃지 · 작은 요소 |
| `--radius-card` | `6px` | 카드 · 콜아웃 · 코드블록 · 표 |
| `--radius-panel` | `8px` | 큰 패널 · 스테이지 |

- 원형: 아바타 · 점 = `rounded-full`. 태그 = `rounded-chip` (거의 각짐).
- 그림자: 없음. (팝오버가 필요하면 `0 0 0 1px var(--color-line), 0 6px 16px rgba(15,15,15,.09)`.)
- 스페이싱: 섹션 사이 `mt-14`, 카드 안쪽 16–24px, 그리드 거터 `gap-3`. 읽기 컬럼 `max-w-3xl` (~768px), 본문 줄폭 ~64ch.

---

## 5. 컴포넌트 사양  (승인 샘플 기준)

색은 전부 `var(--color-*)` 토큰(= Tailwind `text-blue` / `border-l-blue` / `bg-rail` …). hex 리터럴 금지.

### 5.1 페이지 셸 (메인 페이지)
- **사이드바** `w-[244px]` · `bg-rail` · `border-r border-line` · sticky. 로고 타일 `bg-[--color-chip 상당]` → 여기선 `bg-ink text-paper` mono. 검색 `bg-paper border-line rounded-panel`, `⌘K` 키캡 `bg-rail`. 섹션 라벨 mono `.14em` upper `text-ink-3`. 현재 챕터 행 `bg-paper border-line`, 나머지 hover `bg-[ink/5%]`.
- **상단바** `h-11` · `bg-paper` · `border-b border-line`. 브레드크럼 mono `text-ink-3`, 마지막 크럼 `text-ink`, `/` 회색. 우측 칩은 회색 mono.
- **읽기 컬럼** `max-w-3xl mx-auto px-8 pt-10`. h1 → lead(`font-read`) → 태그(회색 mono 칩) → `border-b border-line` → 본문.
- 색은 본문에만: 용어 밑줄(`border-b-[1.5px] border-dotted border-purple`), 콜아웃, 진행바.

### 5.2 콜아웃 (InfoBox)
`rounded-card border border-line border-l-[3px] border-l-{hue} bg-paper-sunk px-4 py-3.5`.
- **키커 라벨**(variant): 아래 표의 고정 문구. 영문은 mono 10px `700` `.1em` upper eyebrow, **한글은 `font-sans` 10px `700` `.02em`** (JetBrains Mono 에 한글 글리프가 없어 mono 면 시스템 폰트로 폴백). 색은 `text-{hue}`.
- **제목**(`title` prop, 선택): `font-sans 13px 600 text-ink` — 키커와 별개. `variant` + `title` 둘 다 주면 키커 아래에 제목 줄이 붙는다. `icon`(이모지)은 제목 앞.
- **본문**(children): `font-read` 13.5px `text-ink`.
- **배경 채움 없음.**

표기는 `src/lib/theme.tsx` `INFOBOX_VARIANT` 가 단일 진실 공급원 (CLAUDE.md "InfoBox variant 선택 기준" 과 일치).

| variant | hue (좌측선·라벨) | 라벨 ko / en | 쓰임 |
|---------|------------------|--------------|------|
| `tip` | `blue` | 더 알아보기 / Advanced | 고급·심화 |
| `note` | `slate` | 참고 / Note | 보조 설명·조건 |
| `warning` | `amber` | 주의 / Caution | 흔한 실수·함정 |
| `usage` | `green` | 어디서 사용할까? / When to Use | 적용 사례 |
| `summary` | `slate` | 핵심 정리 / Summary | 페이지 말미 요약 |
| `danger` | `red` | 위험 / Danger | 데이터 손실·장애 |

구버전 `<InfoBox color=…>` 경로(`INFOBOX_LEGACY_COLOR`): `info`·`tip` → `blue`, `warning` → `amber`, `danger` → `red` (키커 없음, `title` prop 로 라벨 지정).

### 5.3 카드
`rounded-card border border-line bg-paper p-4`. 제목 `font-sans text-[14px] font-semibold text-ink` (+ 앞에 작은 색 아이콘, 아이콘이 hue를 나른다). 본문 `font-read text-[13px] leading-[1.6] text-ink-2`. **좌측 강조선·색 채움 없음** (아이콘/라벨 색으로만).
- 카테고리/분류 라벨: mono 10px `700` `.08em` upper, `text-{hue}`.

### 5.4 표 — 두 컴포넌트로 분리 (`shared.tsx`)

| 컴포넌트 | 용도 | API |
|----------|------|-----|
| **`<Table>`** | 개념·비교 설명표 (읽기) | `{ headers: string[], rows: string[][] }` — 기존 그대로 |
| **`<ResultTable>`** | 쿼리 결과 그리드 | `{ title?, meta?: string[], columns: ResultColumn[], rows: ResultCell[][], selectedRow?, footer?: string[], numbered? }` |

**`<Table>`** (개념표) — `overflow-x-auto rounded-card border border-line`. 헤더 `bg-rail border-b border-line` `font-sans 11px 600 text-ink-2`. **본문 셀 전부 `font-sans`** (한글 설명이 mono 로 깨지지 않도록): 첫 열 = 행 라벨 `12px 500 text-ink`, 나머지 `12.5px text-ink`. `✓/안전/가능` → `text-green`, `✕/불가/발생/손실` → `text-red`, `일부/부분/제한/조건부` → `text-amber` 자동. 모노스페이스 데이터가 필요하면 `<ResultTable>`.

**`<ResultTable>`** (결과 그리드) — `rounded-card border border-line-2 overflow-hidden`.
- 툴바(`title`·`meta` 있을 때) `bg-rail border-b border-line-2` mono 10.5px `text-ink-2`; 첫 세그먼트 `bg-paper border-r border-line-2 text-ink` + `1.5px 사각 dot`; 마지막 `meta` = `ml-auto`.
- `#` 거터 열(`numbered`, 기본 on) `w-9 text-right bg-rail text-ink-3` `border-r border-line-2`.
- 헤더 셀 mono 10.5px `700` `.04em` `text-ink-2` `bg-rail` `border-b/r border-line-2`. `column.type` 있으면 아래에 mono 9px `text-ink-3` 타입 힌트 서브행.
- 본문 셀 mono 12px `tabular-nums` `border-b/r border-line`. 정렬: `cell.align ?? column.align ?? (숫자꼴이면 right)`.
- `ResultCell` = `string | number | null | { v, tone?: 'green'|'amber'|'red'|'blue'|'purple', strong?, align? }`. `null` → `(null)` `text-ink-3 italic`.
- 행 hover `bg-[ink/3%]`; 선택 행(`selectedRow`) `bg-blue/[0.06]` + 거터 `border-l-2 border-l-blue bg-blue/15 font-medium text-blue` (Tailwind v4 가 `var()` 들어간 arbitrary `shadow-[…]` 를 생성하지 못해 좌측 보더로 대체).
- PK 뱃지 `bg-blue/15 text-blue` mono 8.5px `700`; FK 뱃지 `bg-purple/15 text-purple`.
- 푸터 스트립(`footer`) `border-t border-line-2 bg-rail` mono 10px `text-ink-2`, 세그먼트 `border-r border-line`, 마지막 `ml-auto`.

### 5.5 Query Block 컴포넌트
컨테이너 `rounded-card border border-line-2 overflow-hidden bg-[--color-code-bg]`.
- 헤더 바 `bg-rail border-b border-line` `px-3 py-2`: 언어 태그 mono 10px `700` `.08em` `bg-paper border-line text-ink-2 rounded-chip`; 엔진 라벨 mono 10.5px `text-ink-3`; 우측 COPY(`btn-mono` outline) + RUN(`btn-mono` solid = `bg-ink text-paper`).
- `<pre>` `bg-[--color-code-bg] text-ink` mono 13px / 1.75. 문법: keyword `text-[--color-sy-kw]` … (§2.3).
- 결과 토글 바 `bg-rail border-t border-line` mono 10.5px: caret `rotate-90` when open; 상태 `성공` `text-green` `700` / `오류` `text-red`; 시간 `text-ink-3`.
- 결과 미니 표: `border-t border-line bg-paper`, mono, `revenue` 컬럼 `text-green`.

### 5.6 Execution Plan 컴포넌트
컨테이너 `rounded-card border border-line-2 bg-paper`.
- 툴바 `bg-rail border-b border-line-2` mono 10.5px; 첫 세그먼트 `bg-paper border-r border-line-2 text-ink`.
- 표: `Id | Operation | Name | Rows | Cost | A-Time | Share`, mono `tabular-nums`. Operation 셀은 `white-space:pre` 트리 들여쓰기(`│  ` prefix, `text-ink-3`).
- Name 셀: 테이블 `text-blue`, 인덱스 `text-red`.
- **오퍼레이션별 색** (Share 막대 · 학습 트리 노드): Sort `blue` · GroupBy `green` · Join `amber` · TableScan `purple` · IndexScan `red` · 루트 `[ink/22%]`.
- Share 막대: `h-1.5 rounded-[2px] bg-[ink/9%]` 트랙 + fill = 오퍼레이션 색.
- **핫(병목) 행**: `bg-[amber/8%]`, 셀 `text-amber font-medium`, `Id` 셀 `bg-[amber/16%]`, `* 3` 표기.
- Predicate 블록: `border-t border-line-2 bg-rail p-3`; 라벨 mono 9.5px `700` `.08em` `text-ink-3`; `<pre>` mono 11.5px `text-ink`.
- **학습용 트리 뷰**(별도): `border border-line rounded-card bg-paper p-4`. 각 노드 `bg-paper-sunk rounded-chip` + 색 점 + mono 라벨(+ `<small text-ink-3>` 조건) + `w-[108px]` 미터(오퍼레이션 색) + `w-[52px]` 우측 ms. 병목 노드 `bg-[amber/8%]` + `ring-1 ring-[amber/30%]`. 아래 `콜아웃 warn`.

### 5.7 Concept-Explanation 컴포넌트
- **TERM 카드**: `rounded-card border border-line border-l-[3px] border-l-purple bg-paper-sunk px-5 py-4`. 라벨 mono 10px `700` `.12em` `text-purple` = `TERM`. 제목 `font-sans 15px 600 text-ink` + inline 영문 용어 mono 12px `text-ink-3`. 정의 `font-read 15px/1.7 text-ink-2`, inline `<code>` `text-purple`.
- **ACID 그리드**: `grid` `minmax(215px,1fr)` `gap-3`. 카드 `border border-line rounded-card bg-paper p-4`. letter 칩 `w-6 h-6 rounded-chip text-white` — A `bg-blue` · C `bg-green` · I `bg-amber` · D `bg-purple`. 제목 `font-sans 13.5px 600` (+ 영문 `text-ink-3`). 본문 `font-read 12.5px/1.6 text-ink-2`.
- **콜아웃 3종**: §5.2 (info/warn/danger).
- **비교 표**(격리 수준 등): `border border-line rounded-card overflow-hidden`. 헤더 `bg-rail border-b border-line font-sans 11px 600 text-ink-2` (값 컬럼 center). 셀 mono 11.5px center; `안전` `text-green` · `일부` `text-amber` · `✕` `text-red`.

### 5.8 버튼
| 종류 | 스펙 | hover |
|------|------|-------|
| primary | `h-9 px-4 rounded-card bg-blue text-white font-sans 13px 500` | `bg-[--color-accent-hover 없음 → blue 진하게]` — 라이트에선 `brightness-95` |
| secondary (mono) | `h-8 px-3 rounded-panel border border-line-2 bg-paper text-ink-2 font-mono 11px 500` | `bg-rail text-ink` |
| solid mono | `bg-ink text-paper border-ink` | `bg-[ink 82%]` |

> primary hover 색은 아직 토큰 미정 — 라이트에서 blue를 그대로 두고 `hover:brightness-95` 로 처리. Phase 2에서 `--color-blue-hover` 추가 검토.

---

## 6. 구현 상태 & 마이그레이션

- **완료 (2026-08-30)**
  - `index.html` — Google Fonts `<link>` → Inter + Newsreader + Noto Sans KR + JetBrains Mono.
  - `tokens.css` — §2c Notion 토큰. §3 테마 스왑 = 3상태(`@media prefers-color-scheme` + `[data-theme="dark"]` + `[data-theme="light"]`). `[data-theme]` 셀렉터는 :root 한정 아님 → 하위 트리에서 테마 재지정 가능(콘텐츠 라이트 고정에 사용). §1 레거시(shadcn HSL·`ios-*`·`brand-*`)는 값 불변.
  - `src/index.css` — `body` → `var(--color-paper-sunk)` / `var(--color-ink)` / `var(--font-sans-active)`. react-flow 오버라이드는 아직 shadcn 경유(Phase 3).
  - `src/lib/theme.tsx` — `DIAGRAM` / `DATA_PALETTE` / `CODE` 를 새 토큰 이름으로. (`ACCENT_COLORS` / `INFOBOX_VARIANT` 등은 유지 — `shared.tsx` 소비 중.)
  - `src/store/simulationStore.ts` — `theme: 'light'|'dark'` + `setTheme` / `toggleTheme` 추가. 초기값 = localStorage(`oracle-book-theme`) → `prefers-color-scheme` → light. `App.tsx` 가 `<html data-theme>` 에 반영.
  - **Frame 전면 Notion·무채색 전환** — `App.tsx` · `BookLayout`(헤더 44px, 신호등 제거, DB 아이콘 타일, **다크/라이트 토글 버튼**) · `TableOfContents`(사이드바 — `ios-orange*` 전부 무채색, 제목 `font-sans`, 아이콘 강제 그레이) · `BookContent`(브레드크럼·prev/next 무채색) · `GlossaryPanel` · `SchemaPanel`. 전부 `bg-paper`/`bg-rail`/`text-ink*`/`border-line`/`rounded-chip` 토큰만. hex·로컬 색맵 0.
  - **`shared.tsx` 프리미티브 전면 재작성** (2026-08-30) — `PageContainer` `ChapterTitle` `SectionTitle` `SubTitle` `Prose` `InfoBox`(§5.2 콜아웃) `Table`(§5.4) `ConceptGrid` `SqlBlock`(§5.5) `StepList` `AccordionSection` `WipBanner` `SimulatorPlaceholder` `TermPopup` `Divider` → 전부 §2c 토큰. `theme.tsx` `INFOBOX_VARIANT`/`INFOBOX_LEGACY_COLOR` → 좌측선+라벨 색 클래스만(아이콘·`ios-*` 제거, **hex 0**). `CONCEPT_TINT`/`SIMULATOR_TINT`/`STEP_COLORS` 삭제. `SqlHighlight.tsx` 문법 색 → §2 콘텐츠 색.
  - **Chapter 01 데이터 모델링** (10개 섹션) — `shared.tsx` 프리미티브 기반이라 자동 이관. `EntitySection` / `RelationshipSection` SVG 다이어그램 hex → `var(--color-*)`. **다크 대응 완료.**
  - **`IntroductionPage.tsx`** — Notion 전면 재작성(콘텐츠 파일럿).
  - **나머지 8개 챕터 전면 기계 이관 (2026-08-30)** — `sql-basics` · `internals` · `join` · `index-chapter` · `partition` · `parallel` · `optimizer` · `query-transform`(qt) + `sort`. 약 95개 파일. 스크립트(`scratchpad/migrate_tokens.py`)로:
    - shadcn 토큰(`bg-card`·`text-muted-foreground`·`border-border`…) → §2c 토큰
    - raw Tailwind 색 클래스 `{prefix}-{hue}-{shade}` → 11색 → 6색(blue/green/red/amber/purple/slate) 폴딩 + shade→투명도 매핑. **teal/cyan → green** (teal 금지). 중립(slate/gray/zinc) → `ink*`/`line*`/`rail`.
    - SVG·인라인 hex → HSL 분류로 `var(--color-*)` (절대 chroma<42 → 무채색 램프, 그 외 → 최근접 hue). 8자리 `#rrggbbaa` → `color-mix(… transparent)`.
    - `ios-*` / `brand-*` 레거시 토큰 → §2c 토큰.
    - `rounded-{sm..3xl}` → `rounded-chip/card/panel`, `shadow-*` 제거(Notion 플랫).
    - `index.css` — 색 없는 `border` 유틸 기본색 = `var(--color-line)` (v4 기본 currentColor 대체).
    - `DARK_READY` = 전 챕터 프리픽스. `data-theme="light"` 고정 사실상 해제(`sql-tuning-` 래퍼 포함).
    - **기계 이관이라 육안 QA 필요**: 파스텔 tint 배경이 무채색으로 접혔고(의도 — Notion), 7색 이상 쓰던 목록은 hue 충돌 가능. 다이어그램별 재검토 대상.

- **현재 앱 상태**: Frame + 전 챕터가 새 토큰 + 다크/라이트 대응. `BookContent.tsx` `DARK_READY` 에 전 프리픽스 등록. 남은 건 챕터별 육안 QA와 Phase 3(react-flow·`theme.tsx` 잔여·레거시 별칭 삭제).

- **Phase 2 (완료분 제외 잔여)** — 챕터별 다이어그램 육안 검토 후 hue 재배정 / tint 복원 판단. `@custom-variant dark` 를 `[data-theme="dark"]` 기준으로 변경. `ACCENT_COLORS`(레거시) 제거.

- **Phase 3** — SVG 다이어그램 하드코딩 hex ~40파일 → `DIAGRAM` / `DATA_PALETTE` / `CODE`. shadcn HSL 별칭 · `--sapphire-*` · `--gold*` · `--tangerine` 삭제.

- **Phase 4** — ESLint `no-restricted-syntax` — `src/**/*.{ts,tsx}` 내 `#[0-9a-f]{3,8}` 리터럴 차단(`tokens.css` 예외).

---

## 7. 제거 목록

- [x] `body` → `--color-*` 토큰 + `data-theme` 스왑 (2026-08-30)
- [x] 콘텐츠 스크롤 영역 `data-theme="light"` 고정 해제 — `DARK_READY` 에 전 챕터 등록 (2026-08-30)
- [x] `shared.tsx` · 챕터 파일의 `ios-*` / `brand-*` 클래스 → §2 토큰 (2026-08-30)
- [x] `shared.tsx` 의 `CONCEPT_TINT` / `SIMULATOR_TINT` / `STEP_COLORS` 삭제 (2026-08-30)
- [x] 챕터 파일 생 Tailwind 색 클래스(`bg-*-50` 등) → 시맨틱 유틸 — 기계 이관 (2026-08-30, 육안 QA 잔여)
- [x] 챕터 파일 SVG·인라인 hex → `var(--color-*)` — 기계 이관 (2026-08-30, 다이어그램별 QA 잔여)
- [ ] **Phase 3** — `src/index.css` react-flow `.react-flow__*` 오버라이드 shadcn HSL 경유 잔존
- [ ] **Phase 3** — shadcn HSL 별칭 · `--sapphire-*` · `--gold*` · `--tangerine` · `--active-*`/`--warn-*`/`--ok-*` · `--color-ios-*` / `--color-brand-*` · `ACCENT_COLORS` 삭제
- [ ] **Phase 3** — `@custom-variant dark (&:is(.dark *))` → `[data-theme="dark"]` 기준으로, 죽은 `dark:` 클래스 정리
- [ ] **Phase 4** — ESLint `no-restricted-syntax` 로 `src/**/*.{ts,tsx}` 의 `#[0-9a-f]{3,8}` 리터럴 차단 (`tokens.css` 예외)
- [ ] `bg-gradient-*` (히어로·클로징) — hue 는 폴딩됐으나 그라디언트 자체는 잔존, Notion 헤더 블록으로 교체 검토
