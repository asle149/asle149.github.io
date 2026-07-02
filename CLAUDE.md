# quartz-blog (asle149.github.io) 작업 지침

김민솔의 Quartz v5 블로그 저장소. 라이브: https://asle149.github.io · 배포: `main`에 push → GitHub Actions 자동 빌드(2~3분) + CDN 반영(1~2분) = 총 3~5분.
글 발행은 보통 **옵시디언 볼트의 Quartz Publish 플러그인**으로 한다(볼트 CLAUDE.md와 `blog-publish` 스킬 참조). 이 레포를 직접 만지는 경우 = 디자인·설정·컴포넌트 수정.

## 구조 (⚠️ v5 신형 — 옛 `quartz.layout.ts` 없음)

- 설정·플러그인·레이아웃 전부 **`quartz.config.yaml` 한 파일** (색 `theme.colors`, 플러그인 on/off + position).
- 커뮤니티 플러그인은 `github:quartz-community/*`로 받아 `.quartz/plugins/`(gitignore)에 빌드됨.
- CI(`.github/workflows/deploy.yml`): `npm ci → npx quartz plugin install → npx quartz build`. 연속 push 시 run이 순차 대기열(concurrency: pages)로 처리되고 중간 run은 cancelled로 건너뜀(정상 — 마지막 run이 전체를 빌드). 확인: `gh run list -R asle149/asle149.github.io`.
- **폴더 = 카테고리**: `content/` 아래 `분산시스템/ 아키텍처/ JVM/ 동시성/ 알고리즘/ 카프카/ CS 스터디(큰돌)/` (각 폴더 `index.md`에 title). 위키링크는 `markdownLinkResolution: shortest`라 폴더를 옮겨도 안 깨짐.
- `content/index.md`(대문 최신 글)·`archive.md`·`categories.md`는 **수동 목록이지만 Quartz Publish 플러그인이 발행 시 자동 갱신**(날짜 내림차순 삽입, slug 중복 제거, 카테고리 카운트 재계산). 수동 편집 시 기존 형식 유지할 것.

## 커스텀 내역 (⚠️ 코어 파일 수정 포함 — Quartz 업스트림 업데이트 시 충돌 주의)

- **상단 네비바**(김민솔 브랜드 + 카테고리·아카이브·About): 코어 `quartz/components/renderPage.tsx`의 `<body>` 첫 자식으로 `<header class="top-nav">` 직접 주입 (별도 플러그인 X). 코어는 빌드가 컴파일하므로 CI 안전. page-title 플러그인은 중복이라 `enabled:false`.
- **스타일** `quartz/styles/custom.scss`: `.top-nav*`, libdoc 사이드바 `#f4f5f7`, 대문 카드 stretched-link(`li a.internal::after{position:absolute;inset:0}` — raw HTML 없이 카드 전체 클릭), 카드 제목 볼드 해제(`a.internal font-weight:400` + `li strong{font-weight:inherit}`).
- **색**: 포인트 진한 초록 `#163319`(상단바), 링크·강조 light `#1f6e3a`/`#2e8b57`, dark `#6dc48a` (`theme.colors`의 secondary/tertiary/highlight). 폰트 IBM Plex Sans KR + Overpass Mono. 그래프뷰·백링크·읽기시간 off.
- **explorer 보조페이지 숨김**: `categories`·`archive`·`about`은 상단바에 있으니 좌측 explorer에서 제외 — explorer 옵션 `filterFn`을 YAML에 **문자열**로 전달(inline `new Function` 실행)해 `slugSegment`로 거름.
- **본문 raw HTML은 sanitize로 막힘** → 본문 안에서는 위키링크·CSS로 해결할 것.

## 작업 루프

1. `cd ~/quartz-blog && npx quartz build --serve` → `localhost:8080` 확인 (scss는 자동 리빌드, **config.yaml 플러그인 on/off는 서버 재시작 필요**)
2. 좋으면 `git add -A && git commit && git pull --rebase && git push` → 3~5분 후 라이브
