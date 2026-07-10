---
created: 2026-07-10 19:31
modified: 2026-07-10 20:21
title: 06-1. 카프카 컨슈머 애플리케이션 개발
tags:
- 컨슈머
category: ""
slug: kafka-06-1
date: 2026-07-10
draft: false
description: ""
---
# 1. 컨슈머 내부 구조
![[Pasted image 20260710193642.png]]

| 구성 요소               | 역할                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------- |
| **Fetcher**         | 리더 파티션으로부터 레코드들을 미리 가져와서 대기 (프로듀서도 리더와 통신했죠 — 컨슈머도 마찬가지!)                          |
| **poll()**          | Fetcher에 대기 중인 레코드들을 리턴하는 메서드                                                      |
| **ConsumerRecords** | 처리하고자 하는 레코드들의 모음. 오프셋이 포함되어 있음 (ProducerRecord에는 오프셋이 없었지만 이건 이미 브로커에 저장된 데이터니까!) |


# 2. 컨슈머 그룹
### 1) 컨슈머 할당
![[Pasted image 20260710193934.png]]
1. 1개의 파티션은 최대 1개의 컨슈머에만 할당된다. **(같은 컨슈머 그룹 내에서!)**
2. 1개의 컨슈머는 여러 개의 파티션을 할당받을 수 있다.
3. 따라서 컨슈머 개수 ≤ 파티션 개수여야 최대 효율. (파티션 3개에 컨슈머 4개면? → 1개는 파티션을 할당받지 못하고 유휴(idle), 스레드만 차지하고 일을 안 하는 불필요한 스레드가 됨)

### 2) 컨슈머 그룹
![[Pasted image 20260710194416.png|336]] ![[Pasted image 20260710194704.png|366]]
ex) 서버 CPU·메모리 지표를 수집해 엘라스틱서치(실시간 확인용)와 하둡(대용량 보관용)에 동시에 적재 하는 상황
- 카프카 없이 동기 적재: 에이전트가 두 저장소에 직접 적재 → 둘 중 하나만 장애 나도 더는 적재 불가
- 카프카 + 컨슈머 그룹 분리: "엘라스틱서치 적재용 그룹"과 "하둡 적재용 그룹"을 서로 다른 컨슈머 그룹으로 운영 → 서로 데이터 처리에 영향을 주지 않음. 엘라스틱서치가 장애 나도 하둡 적재는 계속되고, 장애가 해소되면 엘라스틱서치 그룹은 마지막 커밋 이후부터 다시 적재해 정상화. 각 그룹은 자기만의 오프셋(커밋)을 따로 갖기 때문!


# 3. 리밸런싱
![[Pasted image 20260710195100.png]]
컨슈머 그룹의 일부 컨슈머에 장애가 발생하면 그 컨슈머가 맡던 파티션의 소유권이 다른 컨슈머에게 넘어가는 과정.
1) 컨슈머가 추가되는 상황
2) 컨슈머가 제외되는 상황


# 4. 커밋
![[Pasted image 20260710195405.png]]

특정 토픽의 파티션을 어떤 컨슈머 그룹이 몇 번째까지 가져갔는가 가 브로커 내부 토픽 `__consumer_offsets`에 기록됨

컨슈머 이슈로 `__consumer_offsets`에 오프셋 커밋이 기록되지 못하면, 재시작한 컨슈머는 이미 처리한 데이터를 다시 가져옴 → 데이터 처리 중복 
	-> 컨슈머 애플리케이션은 오프셋 커밋이 정상 처리됐는지 검증해야만 함

| 방식               | 코드                                                   | 특징                                                                                      |
| ---------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **자동 커밋** (기본)   | `enable.auto.commit=true`                            | 5초마다 알아서 커밋. 편하지만 커밋 시점과 처리 시점이 어긋나 중복/유실 여지                                        |
| **동기 커밋**        | `consumer.commitSync()`                              | poll()로 받은 마지막 레코드 오프셋 기준 커밋. 모든 레코드 처리가 끝난 후 호출해야 함. 응답을 기다리는 동안 처리가 일시 중단 |
| **레코드 단위 동기 커밋** | `commitSync(Map<TopicPartition, OffsetAndMetadata>)` | 레코드 하나 처리할 때마다 `record.offset() + 1`을 커밋 (+1 주의: "다음에 읽을 위치"를 기록)                   |
| **비동기 커밋**       | `consumer.commitAsync()` (+ `OffsetCommitCallback`)  | 응답을 안 기다려 더 많은 데이터 처리 가능. 결과는 콜백 `onComplete`로 확인                                   |

```java
// 비동기 커밋 + 콜백
consumer.commitAsync(new OffsetCommitCallback() {
    public void onComplete(Map<TopicPartition, OffsetAndMetadata> offsets, Exception e) {
        if (e != null) logger.error("Commit failed for offsets {}", offsets, e);
        else           System.out.println("Commit succeeded");
    }
});
```


# 5. 어사이너(Assignor) 
특정 파티션만 콕 집어 읽기

```java
// subscribe() 대신: 토픽의 특정 파티션을 직접 할당
consumer.assign(Collections.singleton(new TopicPartition(TOPIC_NAME, PARTITION_NUMBER)));
```

`subscribe()` = 그룹에 맡김(어사이너가 분배·리밸런싱 있음) / `assign()` = **직접 지정**(세밀한 제어)

- 파티셔너(프로듀서): 레코드를 어느 파티션에 넣을지 결정.
- 어사이너(컨슈머): 그룹 내 컨슈머들에게 파티션을 어떻게 나눠줄지 결정

| 어사이너                             | 방식                                             |
| -------------------------------- | ---------------------------------------------- |
| **RangeAssignor** (2.5.0 **기본**) | 각 토픽에서 파티션을 숫자로 정렬, 컨슈머를 사전순으로 정렬하여 할당 |
| **RoundRobinAssignor**           | 모든 파티션을 컨슈머에서 번갈아가면서 할당                    |
| **StickyAssignor**               | 최대한 파티션을 균등하게 배분하면서 할당                     |


# 6. 컨슈머 주요 
### 1) 필수 옵션

| 옵션                   | 뜻                                                         |
| -------------------- | --------------------------------------------------------- |
| `bootstrap.servers`  | 대상 클러스터의 브로커 호스트:포트 1개 이상                                 |
| `key.deserializer`   | 메시지 키 **역직렬화** 클래스 (프로듀서가 직렬화한 걸 되돌림 — **양쪽 형식이 맞아야** 함!) |
| `value.deserializer` | 메시지 값 역직렬화 클래스                                            |

### 2) 선택 옵션

| 옵션                        | 기본값    | 뜻                                      |
| ------------------------- | ------ | -------------------------------------- |
| `group.id`                | null   | 컨슈머 그룹 아이디. subscribe()로 토픽을 구독할 때는 필수 |
| `auto.offset.reset`       | latest | 저장된 컨슈머 오프셋이 없을 때 어디부터 읽을지             |
| `enable.auto.commit`      | true   | 자동 커밋 / 수동 커밋 선택                       |
| `auto.commit.interval.ms` | 5000   | 자동 커밋일 경우 커밋 간격 (5초)                   |
| `max.poll.records`        | 500    | poll()로 한 번에 반환되는 최대 레코드 수             |
| `session.timeout.ms`      | 10000  | 컨슈머가 브로커와 연결이 끊기는 최대 시간 (10초)          |
| `heartbeat.interval.ms`   | 3000   | 하트비트 전송 간격 (3초)                        |
| `max.poll.interval.ms`    | 300000 | poll() 호출 간격의 최대 시간 (5분)               |
| `isolation.level`         | -      | 트랜잭션 프로듀서와 함께 쓸                        |

### 3) auto.offset.reset 
- latest(기본): 가장 최근(높은) 오프셋부터 읽기 시작. (지금부터 들어오는 것만)
- earliest: 가장 오래된(낮은) 오프셋부터. 
- none: 커밋 기록을 찾아보고 없으면 오류, 있으면 기록 이후부터.  
    이미 컨슈머 오프셋(커밋 기록)이 있다면 이 옵션값은 무시


# 7. 컨슈머 종료
정상적으로 종료되지 않은 컨슈머는 session.timeout.ms가 지날 때까지 그룹에 남아 있음
그동안 그 컨슈머 몫의 파티션은 처리가 멈춘 채 방치 → 랙 증가

```java
// ① 셧다운 훅 등록: 종료 시그널(kill) 받으면 wakeup() 호출
Runtime.getRuntime().addShutdownHook(new ShutdownThread());
static class ShutdownThread extends Thread {
    public void run() { consumer.wakeup(); }
}

// ② 메인 루프: wakeup() 후 poll()이 호출되면 WakeupException 발생
try {
    while (true) {
        ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(1));
        // ... 처리 ...
    }
} catch (WakeupException e) {
    logger.warn("Wakeup consumer");    // ③ 예외를 받으면
} finally {
    consumer.close();                  // ④ 자원 정리하고 그룹에서 즉시 탈퇴
}
```

- 흐름: wakeup() 호출 → 다음 poll()에서 WakeupException → 자원 해제 → close()
	 세션 타임아웃을 기다리지 않고 즉시 리밸런싱이 일어나게 함