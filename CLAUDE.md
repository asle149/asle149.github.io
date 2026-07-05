# quartz-blog (asle149.github.io) 작업 지침

김민솔의 Quartz v5 블로그 저장소. 라이브: https://asle149.github.io · 배포: `main`에 push → GitHub Actions 자동 빌드(2~3분) + CDN 반영(1~2분) = 총 3~5분.
글 발행은 보통 **옵시디언 볼트의 Quartz Publish 플러그인**으로 한다(볼트 CLAUDE.md와 `blog-publish` 스킬 참조). 이 레포를 직접 만지는 경우 = 디자인·설정·컴포넌트 수정.

## 구조 (⚠️ v5 신형 — 옛 `quartz.layout.ts` 없음)

- 설정·플러그인·레이아웃 전부 **`quartz.config.yaml` 한 파일** (색 `theme.colors`, 플러그인 on/off + position).
- 커뮤니티 플러그인은 `github:quartz-community/*`로 받아 `.quartz/plugins/`(gitignore)에 빌드됨.
- CI(`.github/workflows/deploy.yml`): `npm ci → npx quartz plugin install → npx quartz build`. 연속 push 시 run이 순차 대기열(concurrency: pages)로 처리되고 중간 run은 cancelled로 건너뜀(정상 — 마지막 run이 전체를 빌드). 확인: `gh run list -R asle149/asle149.github.io`.
- 커밋에 ❌(failure)가 떠도 대부분 **빌드가 아니라 Pages deploy 단계의 깃헙 쪽 일시 오류**("Deployment failed, try again later") — 빌드는 매번 전체 사이트를 만들므로 **그 뒤 run 하나만 success면 내용 손실 없음**. 2026-07-03부터 deploy 실패 시 **30초 후 1회 자동 재시도**가 워크플로우에 들어가 있어 대부분 자가 복구됨. 계속 실패하면 `gh run rerun <id> --failed`.
- **폴더 = 카테고리**: `content/` 아래 `분산시스템/ 아키텍처/ JVM/ 동시성/ 알고리즘/ 카프카/ CS 스터디(큰돌)/ 수수깡/ AI/` (각 폴더 `index.md` 필수 — title + 카테고리 칩 링크 대상). 위키링크는 `markdownLinkResolution: shortest`라 폴더를 옮겨도 안 깨짐. URL 슬러그 = 소문자화+공백→`-`, 한글 유지 (`/ai/`, `/수수깡/`, `/cs-스터디(큰돌)/`). ※ 2026-07-05: `사이드 프로젝트/` → `수수깡/`으로 rename — 옛 URL은 각 글 frontmatter `aliases`("사이드 프로젝트/susuggang-0X")로 리다이렉트됨. 수수깡 글은 태그도 `수수깡` 유지(카테고리 페이지 태그 칩이 이 태그 페이지를 가리킴 — 자기 카테고리 태그 금지 정책의 예외).
- `content/index.md`(대문 최신 글)·`archive.md`·`categories.md`는 **수동 목록이지만 Quartz Publish 플러그인(v1.5.0+)이 발행 시 자동 갱신**. 수동 편집 시 형식 유지 필수 (2026-07-05 개편):
  - 대문(미니멀 리스트): `` - `카테고리` · YYYY-MM-DD<br>썸네일<br>**[[slug|title]]**<br>설명<br>`#태그` `#태그` `` — 렌더는 hairline 구분 리스트(텍스트 좌, 소형 썸네일 168×112 우). 썸네일 = `thumbnail` 프론트매터 > 본문 첫 이미지(`![[파일]]`) > 카테고리 일러스트(`![](/static/thumbs/<키>.svg)`, 매핑은 플러그인 `CATEGORY_THUMBS`). 일러스트 원본 = `quartz/static/thumbs/*.svg` 10종
  - 아카이브(월별): `## YYYY년 M월 (N)` 아래 `` - `MM.DD` [[slug|title]] `카테고리` `` — 날짜 내림차순, 월 카운트 자동, 새 달은 맨 위 신설
  - 카테고리(칩 2종): 그룹 헤딩 `## 그룹 (합계)` 아래 **폴더 칩** `` [[폴더/index|이름]]`N` ``(pill 모양, N=폴더 md 수) + **태그 칩** `` [라벨](/tags/슬러그)`N` ``(#검색 칩 모양, N=전체에서 그 태그 글 수 — 소카테 역할). 그룹 합계 = 폴더 칩 합(태그 칩은 중복이라 제외), 폴더 칩이 없는 그룹은 태그 칩 합. 알고리즘 그룹처럼 태그 칩을 쓰는 그룹엔 발행 글의 새 태그 칩이 자동 추가됨. 새 카테고리는 '기타' 그룹 자동 추가(카테고리명이 태그 칩으로 이미 있으면 생략). 그룹 구성: CS 이론 / 백엔드·인프라 / AI / 알고리즘(전체+기법 태그 칩) / 사이드 프로젝트(#수수깡)
- **태그 정책(2026-07-05)**: 자기 카테고리와 같은 태그 금지, `CS`·`구현` 같은 무의미 태그 금지. 태그 = 기법/주제 + 시리즈(수수깡·바이트바이트고) + 목적(면접준비), 글당 1~4개.

## 커스텀 내역 (⚠️ 코어 파일 수정 포함 — Quartz 업스트림 업데이트 시 충돌 주의)

- **상단 네비바**(김민솔 브랜드 + 카테고리·아카이브·About + **검색·다크모드·리더모드 툴**): 코어 `quartz/components/renderPage.tsx`의 `<body>` 첫 자식으로 `<header class="top-nav">` 직접 주입. 4차(2026-07-05)에 왼쪽 사이드바를 없애면서 left 레이아웃 컴포넌트(검색 등)를 이 헤더 안 `.top-nav-tools`에 렌더하도록 옮김. page-title 플러그인은 중복이라 `enabled:false`.
- **왼쪽 사이드바 제거 + 2열 그리드** (4차): `quartz/components/frames/DefaultFrame.tsx`에서 `.left.sidebar` div 삭제(left는 renderPage가 상단바에 렌더), `custom.scss`에서 `.page > #quartz-body` 그리드를 `auto 320px` 2열로 오버라이드(태블릿·모바일은 1열). 본문 폭 `.center > *` 760→**860px** (양옆 여백 축소 피드백).
- **우측 프로필 카드** (4차): `DefaultFrame.tsx` right sidebar 최상단에 정적 JSX(`.profile-card` — 초록 이니셜 아바타 "솔"·이름·소개·GitHub/About 링크). 모바일·태블릿은 CSS로 숨김.
- **폰트 = Pretendard Variable** (2026-07-05): 코어 `quartz/components/Head.tsx`에 jsDelivr 동적 서브셋 `<link>` 추가 + `custom.scss`에서 `--bodyFont/--headerFont` 오버라이드. IBM Plex Sans KR는 폴백(설정엔 그대로). 이유 = 한글 볼드가 단정함(사용자가 IBM Plex 볼드를 싫어함).
- **스타일** `quartz/styles/custom.scss` (2026-07-05 3차 확정 — 디자인 원칙): **초록 = 포인트 한 색(--secondary)만, 나머지 장식은 전부 회색 중립톤**(--chip-bg/--chip-fg/--hairline 변수). 예외 = 헤더 글자색 단계. **헤더 = 블루토파즈식 글자색 단계**: 장식(바·밴드·그라데이션) 없이 h1 `#163319`(제일 진한) → h2 `#1f6e3a` → h3 `#2e8b57` 순으로 연해짐 (다크는 밝은 순 `#a8e2bc→#8ad4a3→#6dc48a`), `.article-title`도 h1 색. 굵기는 담백하게 title/h1=700, h2/h3=**600** (4차: 800 extrabold가 "못생김·가독성 나쁨" 피드백). tertiary=secondary로 통일(config). **대문 = 미니멀 리스트**: hairline 구분, 텍스트 좌 + 소형 썸네일(168×112) 우측 absolute, 초록은 카테고리 라벨만, 태그칩 회색, 행 전체 클릭(stretched-link), 호버 시 옅은 배경+제목 초록. **아카이브**(li 플렉스: 날짜 · 제목 · 회색 카테고리 칩) · **카테고리**(폴더 칩·태그 칩 **전부 같은 테두리 pill로 통일** — 4차 피드백 "다 카테처럼 보이도록"). 목록 페이지 h2는 중립색+밑줄. **index·categories·archive·about에선 .toc와 .content-meta 숨김**.
- **색**: 포인트 진한 초록 `#163319`(상단바), 링크·강조 light `#1f6e3a`/`#2e8b57`, dark `#6dc48a` (`theme.colors`의 secondary/tertiary/highlight). 폰트 IBM Plex Sans KR + Overpass Mono. 그래프뷰·백링크·읽기시간 off.
- **explorer(왼쪽 카테고리 트리) 완전 비활성화** (2026-07-05, `explorer enabled: false`) — 왼쪽엔 검색·다크모드·리더모드 툴바만 남고 사이드바 배경도 제거. 카테고리 탐색은 상단바의 카테고리 페이지가 대신함. (옛 filterFn 문자열 트릭은 explorer를 다시 켤 때만 의미 있음)
- **본문 raw HTML은 sanitize로 막힘** → 본문 안에서는 위키링크·CSS로 해결할 것.

## 작업 루프

1. `cd ~/quartz-blog && npx quartz build --serve` → `localhost:8080` 확인 (scss는 자동 리빌드, **config.yaml 플러그인 on/off는 서버 재시작 필요**)
2. 좋으면 `git add -A && git commit && git pull --rebase && git push` → 3~5분 후 라이브
