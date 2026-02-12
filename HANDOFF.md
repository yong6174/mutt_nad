## Goal
Full refactoring based on PATCH_ALL: add mint(adopt) to contract, switch API to pending_actions->sync pattern, extend DB schema, apply 3-step flow to frontend.

## Current Status
**PATCH_ALL refactoring — COMPLETE (code changes done)**

### What was done
1. **Contract (MuttNFT.sol)** — MuttData struct extended (mintCost, maxSupply, totalSupply), `mint()` and `setMintConfig()` functions added, 2 new events. **30/30 tests passing.**
2. **ABI + Types** — Frontend ABI updated with new getMutt return fields, mint/setMintConfig functions, Minted/MintConfigSet events. MuttOnChain type extended.
3. **DB Schema** — `schema-v2.sql` created with pending_actions, holdings tables, ALTER mutts. **Needs to be run in Supabase.**
4. **API Refactoring**:
   - `/api/hatch` — now writes to `pending_actions` instead of `mutts`
   - `/api/breed` — same, writes to `pending_actions`
   - `/api/sync` — **NEW** — verifies on-chain ownership, transfers pending_action to mutts, upserts holdings
   - `/api/mutt/[id]` — returns mintCost, maxSupply, totalSupply in onChain
5. **Hooks**:
   - `useGenesisHatch` — extracts tokenId from GenesisHatch event
   - `useBreed` — extracts tokenId from Bred event
   - `useMint` — NEW, calls contract mint()
   - `useSetMintConfig` — NEW, calls contract setMintConfig()
   - `useSync` — NEW, calls /api/sync
6. **Pages**:
   - `hatch/page.tsx` — 3-step: API → contract → sync → video → result
   - `breed/page.tsx` — 3-step: API → contract → sync → result
   - `mutt/[id]/page.tsx` — Mint section (supply bar, approve + mint buttons)
   - `my/page.tsx` — Mint config editor per card
   - `page.tsx` — Real stats from DB

### Build status
- `forge test` — 30/30 pass
- `npx tsc --noEmit` — 0 errors
- `npm run build` — success

## What Was Tried
Implemented the full PATCH_ALL plan as designed. No deviations needed.

## Next Steps
1. **Run schema-v2.sql** in Supabase SQL Editor — `frontend/src/lib/schema-v2.sql` (유저 직접 실행 예정)
2. **E2E test** — hatch → breed → mint → sync flow with real wallet
3. **UI polish** — if needed

## Context
- Contract deployed: `0x43a83D0aCc51bA88bdF2eC8e1d3A40123ef15c41` (Monad Testnet 10143)
- `.env.local` 업데이트 완료
- Supabase DB 직접 연결 불가 (IPv6 only, 로컬 IPv6 미지원) → SQL Editor에서 수동 실행 필요
- The pending_actions table FK on activities.token_id is dropped in schema-v2.sql to allow sync to insert activities independently
- Mock mode still works (sync is skipped, no DB interaction)
