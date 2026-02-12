# Mutt — Code Review

## 개요
72개 테스트 시나리오(TEST_FINAL.md) 기반 코드 리뷰.
PATCH_ALL 리팩토링(mint/adopt, pending_actions→sync, 3-step flow) 이후 상태.

## 테스트 결과 요약

| 결과 | 건수 |
|------|------|
| PASS | 55 |
| PARTIAL | 10 |
| FAIL | 7 |
| **총** | **72** |

---

## FAIL (7건)

| ID | 카테고리 | 설명 | 원인 |
|----|----------|------|------|
| TC-R2 | Rating | 페이지 로드 시 기존 평가 여부 미확인 | `/api/mutt/:id`에 `hasRated` 필드 없음 |
| TC-B11 | Breed | 궁합 미리보기에 MBTI 확률 미표시 | 고정 텍스트("AI Analyzed")만 표시 |
| TC-M4 | Mint | MUTT 잔액 체크 없이 tx 진행 | MintSection에 balanceOf 미호출 |
| TC-M8 | Mint | Breeder가 자기 mutt 민트 불가 | isOwner 조건으로 버튼 숨김 |
| TC-MY4 | My | mint/adopt한 토큰 미표시 | breeder 기준 쿼리만 사용 |
| TC-L4 | Landing | 피드 하드코딩 | MOCK_FEED 배열 고정 |
| TC-E2 | Edge | tx reject 시 pending_action 잔류 | cleanup 미구현 |

## PARTIAL (10건)

| ID | 카테고리 | 설명 | 상태 |
|----|----------|------|------|
| TC-H1 | Hatch | 결과 카드 이모지(🦊) 고정 | MBTI 이미지 에셋 필요 |
| TC-B7 | Breed | 같은 mutt 양쪽 선택 가능 | 필터링 미구현 |
| TC-HA1 | Hatch Anim | egg float 연출 없음 | 키프레임 미추가 |
| TC-H6 | Hatch | 결과 카드 이미지 고정 | 이미지 에셋 의존 |
| TC-B6 | Breed | 결과 카드 이미지 고정 | 이미지 에셋 의존 |
| TC-MY3 | My | MUTT Earned 통계 미표시 | 스키마 없음 |
| TC-P5 | Profile | 소유 지분(balance) 미표시 | holdings 미연동 |
| TC-W1 | Wallet | 커넥트 모달 타이밍 | UX 최적화 필요 |
| TC-S1 | Stats | totalMinted 미구분 | uniqueMutts vs totalMinted |
| TC-HA3 | Hatch Anim | 비디오 로딩 대기 UX | 프리로드 있으나 fallback 개선 필요 |

## PASS 주요 항목
- 지갑 연결 (WalletGuard, 자동 모달)
- Genesis Hatch 전체 플로우 (input → API → contract → sync → video → result)
- Breed 전체 플로우 (선택 → API → approve → contract → sync → result)
- ERC-20 Approve / Allowance / Balance 체크 (breed)
- Cooldown 5분 타이머 + 실시간 카운트다운
- Breed cost 설정 (setBreedCost)
- Mint config 설정 (setMintConfig)
- Pureblood 3세대 평가 (retroactive)
- Sacred 28 리더보드 (house ranking, tabs)
- Family tree 3세대 시각화
- Rate API (self-rate 방지, 중복 409, 평균 재계산)
- Sync API (멱등, 409 처리, holdings upsert)
- Edge cases (동시 hatch 방지, 잘못된 서명 reject)

## 아키텍처 평가

### 잘된 점
- **pending_actions → sync 패턴**: 온체인 ID 불일치 문제 해결
- **이벤트 파싱**: receipt에서 tokenId 정확히 추출
- **멱등 sync**: 409를 success로 처리, 중복 호출 안전
- **Pureblood retroactive**: rating 시 자동 bloodline 업그레이드

### 개선 필요
- `/my` 페이지: holdings 테이블 미활용
- Landing: 실제 데이터 미연결
- MintSection: 잔액/자기민트 정책 미완성
- pending_actions TTL/cleanup 없음

## 수정 계획
BUGFIX.md 기준 BUG-1~10 순서대로 수정 예정.
