# quartz-blog (asle149.github.io) 작업 지침

김민솔의 Quartz v5 블로그 저장소. 라이브: https://asle149.github.io · 배포: `main`에 push → GitHub Actions 자동 빌드(2~3분) + CDN 반영(1~2분) = 총 3~5분.
글 발행은 보통 **옵시디언 볼트의 Quartz Publish 플러그인**으로 한다(볼트 CLAUDE.md와 `blog-publish` 스킬 참조). 이 레포를 직접 만지는 경우 = 디자인·설정·컴포넌트 수정.

## 구조 (⚠️ v5 신형 — 옛 `quartz.layout.ts` 없음)

- 설정·플러그인·레이아웃 전부 **`quartz.config.yaml` 한 파일** (색 `theme.colors`, 플러그인 on/off + position).
- 커뮤니티 플러그인은 `github:quartz-community/*`로 받아 `.quartz/plugins/`(gitignore)에 빌드됨.
- CI(`.github/workflows/deploy.yml`): `npm ci → npx quartz plugin install → npx quartz build`. 연속 push 시 run이 순차 대기열(concurrency: pages)로 처리되고 중간 run은 cancelled로 건너뜀(정상 — 마지막 run이 전체를 빌드). 확인: `gh run list -R asle149/asle149.github.io`.
- 커밋에 ❌(failure)가 떠도 대부분 **빌드가 아니라 Pages deploy 단계의 깃헙 쪽 일시 오류**("Deployment failed, try again later") — 빌드는 매번 전체 사이트를 만들므로 **그 뒤 run 하나만 success면 내용 손실 없음**. 2026-07-03부터 deploy 실패 시 **30초 후 1회 자동 재시도**가 워크플로우에 들어가 있어 대부분 자가 복구됨. 계속 실패하면 `gh run rerun <id> --failed`.
- **폴더 = 카테고리**: `content/` 아래 `분산시스템/ 아키텍처/ JVM/ 동시성/ 알고리즘/ 카프카/ CS 스터디(큰돌)/ 사이드 프로젝트/ AI/` (각 폴더 `index.md` 필수 — title + 카테고리 칩 링크 대상). 위키링크는 `markdownLinkResolution: shortest`라 폴더를 옮겨도 안 깨짐. URL 슬러그 = 소문자화+공백→`-`, 한글 유지 (`/ai/`, `/사이드-프로젝트/`, `/cs-스터디(큰돌)/`).
- `content/index.md`(대문 최신 글)·`archive.md`·`categories.md`는 **수동 목록이지만 Quartz Publish 플러그인(v1.4.0+)이 발행 시 자동 갱신**. 수동 편집 시 형식 유지 필수 (2026-07-05 개편):
  - 대문(올리브영테크식 카드): `` - `카테고리` · YYYY-MM-DD<br>썸네일<br>**[[slug|title]]**<br>설명<br>`#태그` `#태그` `` — 썸네일 = `thumbnail` 프론트매터 > 본문 첫 이미지(`![[파일]]`) > 카테고리 일러스트(`![](/static/thumbs/<키>.svg)`, 매핑은 플러그인 `CATEGORY_THUMBS`). 일러스트 원본 = `quartz/static/thumbs/*.svg` 10종
  - 아카이브: `## 연도 (N)` 아래 `` - `MM.DD` [[slug|title]] `카테고리` `` — 날짜 내림차순, 연도 카운트 자동
  - 카테고리: 그룹 헤딩 `## 그룹 (합계)` 아래 칩 `` [[폴더/index|이름]]`N` ``(공백 없이!) — N은 폴더 실제 md 수(index 제외)로 재계산, 새 카테고리는 '기타' 그룹 자동 추가. 그룹 구성: CS 이론 / 백엔드·인프라 / AI / 알고리즘 / 사이드 프로젝트(칩 라벨=수수깡)
- **태그 정책(2026-07-05)**: 자기 카테고리와 같은 태그 금지, `CS`·`구현` 같은 무의미 태그 금지. 태그 = 기법/주제 + 시리즈(수수깡·바이트바이트고) + 목적(면접준비), 글당 1~4개.

## 커스텀 내역 (⚠️ 코어 파일 수정 포함 — Quartz 업스트림 업데이트 시 충돌 주의)

- **상단 네비바**(김민솔 브랜드 + 카테고리·아카이브·About): 코어 `quartz/components/renderPage.tsx`의 `<body>` 첫 자식으로 `<header class="top-nav">` 직접 주입 (별도 플러그인 X). 코어는 빌드가 컴파일하므로 CI 안전. page-title 플러그인은 중복이라 `enabled:false`.
- **폰트 = Pretendard Variable** (2026-07-05): 코어 `quartz/components/Head.tsx`에 jsDelivr 동적 서브셋 `<link>` 추가 + `custom.scss`에서 `--bodyFont/--headerFont` 오버라이드. IBM Plex Sans KR는 폴백(설정엔 그대로). 이유 = 한글 볼드가 단정함(사용자가 IBM Plex 볼드를 싫어함 — 카드 제목도 다시 볼드 700).
- **스타일** `quartz/styles/custom.scss` (2026-07-05 전면 개편, 같은 날 2차 수정): **색은 헤더에만** — 본문 h1/h2/h3 = 초록 왼쪽 바 + 오른쪽·레벨별로 점점 연해지는 그라데이션 밴드(블루토파즈 느낌, 초록). 볼드·인라인코드·인용·표·hr은 **중립 회색톤**(볼드에 색 넣지 말 것 — 사용자 피드백). **대문 = 올리브영테크식 가로 카드**: 좌 200px 썸네일(absolute) + 우 텍스트, 카드 전체 클릭(stretched-link), 태그칩, 모바일에선 썸네일이 상단 배너(150px). **아카이브**(li 플렉스 행: 날짜 · 제목 · 오른쪽 카테고리 알약) · **카테고리**(`[이름|숫자]` 두 쪽 알약 칩, 인라인 배치) 페이지 전용 CSS. 이 두 페이지 h2는 밴드 해제(플레인 밑줄). **index·categories·archive·about에선 .toc(우측 목차)와 .content-meta 숨김**.
- **색**: 포인트 진한 초록 `#163319`(상단바), 링크·강조 light `#1f6e3a`/`#2e8b57`, dark `#6dc48a` (`theme.colors`의 secondary/tertiary/highlight). 폰트 IBM Plex Sans KR + Overpass Mono. 그래프뷰·백링크·읽기시간 off.
- **explorer(왼쪽 카테고리 트리) 완전 비활성화** (2026-07-05, `explorer enabled: false`) — 왼쪽엔 검색·다크모드·리더모드 툴바만 남고 사이드바 배경도 제거. 카테고리 탐색은 상단바의 카테고리 페이지가 대신함. (옛 filterFn 문자열 트릭은 explorer를 다시 켤 때만 의미 있음)
- **본문 raw HTML은 sanitize로 막힘** → 본문 안에서는 위키링크·CSS로 해결할 것.

## 작업 루프

1. `cd ~/quartz-blog && npx quartz build --serve` → `localhost:8080` 확인 (scss는 자동 리빌드, **config.yaml 플러그인 on/off는 서버 재시작 필요**)
2. 좋으면 `git add -A && git commit && git pull --rebase && git push` → 3~5분 후 라이브
