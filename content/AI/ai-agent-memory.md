---
created: 2026-07-05 13:36
tags:
  - AI에이전트
  - LLM
  - 바이트바이트고
modified: 2026-07-05 15:49
title: AI 에이전트 메모리 관리 (Hierarchy, Types)
category: AI
slug: ai-agent-memory
date: 2026-07-04
published: 2026-07-04
draft: false
description: 컨텍스트 윈도우~콜드 아카이브 계층(promote/demote)과 working·episodic·semantic·procedural 네 종류 — 장소 축과 내용 축으로 나눠 보는 에이전트 기억.
---

원문: https://blog.bytebytego.com/p/how-ai-agents-manage-memory-and-avoid (How AI Agents Manage Memory and Avoid Forgetfulness)


## 1. Hierarchy: 기억을 어디에 두는가

![[bbg-agent-memory-04-hierarchy.png]]

**위로 갈수록 빠르고 작고 비쌈.**

- ① **컨텍스트 윈도우** — 모델이 지금 이 호출에서 보는 것. 제일 빠름, 제일 좁음, 토큰당 제일 비쌈
- ② **세션(단기) 메모리** — 이번 대화의 최근 활동. 아직 요약/퇴출 안 된 것들 대기소
- ③ **장기 저장소** — 세션 넘어서 사는 것. 사실·임베딩·구조화된 요약. DB/벡터스토어
- ④ **콜드 아카이브** — 거의 안 꺼냄. 감사(audit)·원본 보관용. 제일 느리고 크고 쌈

움직임은 두 방향 
- **promote(승격) = retrieve** — 관련해지는 순간 검색해서 위로 끌어올림
- **demote(강등) = summarize** — 세션 끝나면 쓸만한 부분만 요약해서 아래로 내림

시나리오로 기억하기: 3세션 전에 "우리 CI는 GitHub Actions" 말함 → 세션 끝나며 요약돼서 장기로 내려감(demote) → 오늘 "배포 자동화 어떻게?" 물음 → 시스템이 그 사실 검색해서 컨텍스트로 올림(promote) → 모델은 쭉 기억하고 있었던 척 답함. 

### 1) OS랑 똑같음 
- RAM(빠르고 작음) ↔ 디스크(느리고 큼) 사이 **페이징**이랑 같은 구조. 
- 대응: 레지스터/캐시 ~ 컨텍스트 윈도우, RAM ~ 세션 메모리, 디스크 ~ 장기 저장소, 테이프/백업 ~ 콜드
- 페이지 인/아웃 = promote/demote. "곧 쓸 걸 위층에" = 지역성(locality) ↔ 관련성(relevance)

### 2) ChatGPT 메모리
- 저장해둔 사용자 사실 + 최근 대화 요약을 **매 프롬프트 앞에 그냥 붙임(prepend)**. 현재 세션이 작업 계층
- 실제 제품은 두 갈래임: "저장된 메모리"(내가 말한 사실을 명시적으로 저장) + "대화 기록 참조"(과거 채팅을 알아서 참고)
- 정교함은 화려한 검색(읽기)이 아니라 **쓰기 쪽**: "뭘 장기 기억으로 승격할 가치가 있냐" 판단.

### 3) MemGPT / Letta
- [MemGPT 논문](https://arxiv.org/abs/2310.08560)(2023) = 제목부터 "Towards LLMs as **Operating Systems**". 컨텍스트 윈도우를 RAM, 바깥 저장소를 디스크로 보고, **모델이 스스로 함수 호출로 자기 기억을 페이지 인/아웃**하게 함
- 구조: main context(시스템 지시 + 최근 대화 FIFO 큐 + 수정 가능한 작업 메모) / external context(윈도우 밖 저장소)
- 이걸 제품화한 게 [Letta](https://www.letta.com/blog/agent-memory/): **core memory**(항상 컨텍스트 안에 사는 "메모리 블록", 에이전트가 도구로 직접 수정) / **recall memory**(과거 대화 검색용 로그) / **archival memory**(장기 벡터 저장소)
- **에이전트가 자기 기억을 자기가 편집함**(self-editing memory). 글의 promote/demote를 시스템이 아니라 모델 본인이 하는 셈
- Anthropic 블로그([context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents))도 같은 결: 컨텍스트 = 유한한 "attention budget"(주의력 예산). 넘치면 **compaction**(요약해서 새 컨텍스트로 갈아타기 = demote) + **structured note-taking**(파일에 메모 남겨두고 필요할 때 다시 읽기) — Claude Code의 CLAUDE.md가 딱 이 패턴


## 2. Types: 기억의 종류

![[bbg-agent-memory-05-types.png]]

인지과학(사람 기억 연구)에서 빌려온 분류:
- **Working** — 지금 태스크의 라이브 컨텍스트. 디버깅 중인 함수 + 최근 메시지. **태스크 끝나면 소멸**
- **Episodic** — 시간 박힌 과거 상호작용 기록. "3일 전 이 사람이 온보딩 물어봤고 체크리스트 논의했다"
- **Semantic** — 사건과 무관하게 성립하는 사실. 팀 CI는 GitHub Actions"
- **Procedural** — 학습된 "일하는 방식". "이 사람 상태보고는 3섹션 형식 선호" → 다음부터 자동 적용

**working= 세션 한정(Session-only)**, 나머지 셋 = 세션 넘어 지속(Persists). 

[LangChain 문서](https://docs.langchain.com/oss/python/concepts/memory)

| 타입         | 저장하는 것 | 사람으로 치면    | 에이전트에선        |
| ---------- | ------ | ---------- | ------------- |
| Semantic   | 사실     | 학교에서 배운 것들 | 사용자에 대한 사실    |
| Episodic   | 경험     | 내가 했던 일들   | 과거 에이전트 행동/대화 |
| Procedural | 지침     | 본능, 운동신경   | 시스템 프롬프트 + 코드 |

### Hierarchy, Types의 관계
- **Hierarchy = 어디 사냐(장소 축) / Types = 무슨 종류냐(내용 축)**
- 예: "파이썬 선호"(semantic)는 평소엔 장기 저장소에 살다가, 관련 질문 오는 순간 컨텍스트 윈도우로 승격됨. **종류는 그대로, 사는 곳만 바뀜**

| 종류↓ \ 장소→  | 컨텍스트 윈도우                    | 장기 저장소             |
| ---------- | --------------------------- | ------------------ |
| Episodic   | "3일 전 온보딩 논의" (지금 관련돼서 승격됨) | 타임스탬프 달린 과거 세션 요약들 |
| Semantic   | "파이썬 선호" (관련 질문 순간 승격됨)     | 사용자 프로필 사실들        |
| Procedural | 시스템 프롬프트에 주입된 형식 규칙         | 축적된 행동 규칙들         |

### 배합은 설계 선택
- 프로덕션 에이전트 대부분 = 4개 중 **3개 이상** 구현. 배합은 용도 따라 다름
- 고객지원 에이전트 → episodic + semantic 헤비 (이 고객과 무슨 일 있었나 + 이 고객 환경은 뭔가)
- 코딩 에이전트 → procedural 헤비 (이 팀은 어떻게 짜고 리뷰하나)
- ChatGPT 메모리 = semantic 위주 / 대화 이어가기 요약 = episodic / CLAUDE.md 같은 규칙 파일 = procedural / 지금 열린 파일·대화 = working

