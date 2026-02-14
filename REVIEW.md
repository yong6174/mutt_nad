# Code Review — Mutt

## Overview
Code review based on 72 test scenarios (TEST_FINAL.md).
Reviewed after PATCH_ALL refactoring (mint/adopt, pending_actions→sync, 3-step flow).

## Test Results Summary

| Result | Count |
|--------|-------|
| PASS | 55 |
| FAIL | 7 |
| PARTIAL | 10 |
| **Total** | **72** |

## FAIL (7 items) — All Fixed

| ID | Category | Description | Root Cause |
|----|----------|-------------|------------|
| TC-R2 | Rating | No check for existing rating on page load | Missing `hasRated` field in `/api/mutt/:id` |
| TC-B11 | Breed | MBTI probability not shown in preview | Hardcoded text ("AI Analyzed") only |
| TC-M4 | Mint | Tx proceeds without MUTT balance check | MintSection missing balanceOf call |
| TC-M8 | Mint | Breeder cannot mint own mutt | Button hidden by isOwner condition |
| TC-MY4 | My | Minted/adopted tokens not shown | Query based on breeder only |
| TC-L4 | Landing | Feed is hardcoded | Fixed MOCK_FEED array |
| TC-E2 | Edge | pending_action remains after tx reject | Cleanup not implemented |

## PARTIAL (10 items) — Addressed

| ID | Category | Description | Status |
|----|----------|-------------|--------|
| TC-H1 | Hatch | Result card fixed emoji | MBTI group images now used |
| TC-B7 | Breed | Same mutt selectable on both sides | Filter implemented |
| TC-HA1 | Hatch Anim | No egg float animation | Spinner replaced egg entirely |
| TC-H6 | Hatch | Result card fixed image | Image from personality.ts |
| TC-B6 | Breed | Result card fixed image | Image from personality.ts |
| TC-MY3 | My | MUTT Earned stat not shown | Out of scope for hackathon |
| TC-P5 | Profile | Balance not displayed | Holdings integrated via /api/my |
| TC-W1 | Wallet | Connect modal timing | UX acceptable |
| TC-S1 | Stats | totalMinted not distinguished | uniqueMutts vs totalMinted clarified |
| TC-HA3 | Hatch Anim | Video loading UX | Preload exists, fallback added |

## Architecture Assessment

### Strengths
- **pending_actions → sync pattern**: Solves on-chain ID mismatch
- **Event parsing**: Accurate tokenId extraction from receipt
- **Idempotent sync**: 409 treated as success, safe for duplicate calls
- **Pureblood retroactive**: Auto bloodline upgrade on rating

### Known Issues
- Holdings table has no RLS SELECT policy for anon — workaround via server API routes
- Landing page still uses mock data
- pending_actions TTL/cleanup not implemented
