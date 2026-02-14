# HANDOFF.md - Mutt

## Current State: MVP Live (Monad Testnet) — Sacred 28 Redesign Complete

## Last Updated: 2026-02-14

---

## Deployment Info

| Item | Value |
|------|-------|
| **Live URL** | https://mutt-nad.vercel.app |
| **Chain** | Monad Testnet (ID: 10143) |
| **MuttNFT** | `0x43a83D0aCc51bA88bdF2eC8e1d3A40123ef15c41` |
| **MUTT Token** | `0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777` |
| **On-chain Mutts** | #1 ~ #7 (7 total) |
| **Wallets** | 4+1 (4 test + 1 platform) |

---

## Completed

### Contract
- [x] MuttNFT.sol — ERC-1155 + EIP-712, MuttData struct with mint support (mintCost/maxSupply/totalSupply)
- [x] genesisHatch, breed, mint, setBreedCost, setMintConfig
- [x] MUTT ERC-20 fee distribution (90% breeder / 10% platform)
- [x] Foundry tests 30/30 pass
- [x] Deployed to Monad Testnet

### API (7 routes)
- [x] `POST /api/hatch` — LLM identity analysis → EIP-712 sign → pending_actions
- [x] `POST /api/breed` — Parent identity combo → LLM → sign → pending_actions
- [x] `POST /api/sync` — On-chain verify → pending → mutts + holdings
- [x] `POST /api/rate` — Star rating + pureblood retroactive check
- [x] `GET /api/mutt/[id]` — Full mutt data (off-chain + on-chain)
- [x] `GET /api/my` — Holdings-based collection (bypasses RLS via supabaseAdmin)
- [x] `POST /api/pending/cancel` — Cleanup stale pending actions

### DB (Supabase, 5 tables)
- [x] mutts, ratings, activities, holdings, pending_actions
- [x] schema-v2 applied (mint columns, FK drop on activities)

### Frontend (8 pages)
- [x] Landing, Hatch, Breed, Mutt Profile, Family Tree, Leaderboard, My Collection, Explore
- [x] Sacred 28 CSS gothic frames redesign
- [x] RLS workaround: /api/my server route
- [x] Hatch: spinner animation (egg image removed)
- [x] Breed: API-driven + MBTI group images
- [x] Mutt detail: "Origin"/"Genesis" for parentless, Sacred 28 labels
- [x] Family tree: Sacred 28 label distinction
- [x] Activity feed: emoji removed
- [x] Vercel deployment complete

---

## Known Issues

### RLS — holdings table
- `holdings` table has no anon SELECT policy
- Client Supabase queries fail → workaround via `/api/my` using supabaseAdmin
- Fix: add RLS policy in Supabase SQL Editor

### Other
- Addresses must be `.toLowerCase()` for DB comparisons
- `signer.ts`: lazy key loading, throws if env var missing
- `personality.ts`: 16 MBTI → 4 group images (not individual)
- Mock mode: auto-activates when Supabase URL missing

---

## Design Decisions

- ERC-1155 (same token holdable by multiple addresses)
- Genesis: 1 per wallet, no total supply cap
- Injected wallets only (no WalletConnect)
- Breed cost in MUTT ERC-20 (not native MON)
- Network toggle via `NEXT_PUBLIC_NETWORK` env var

---

## TODO

- [ ] Pureblood achievement test (need more ratings across 3 generations)
- [ ] Sacred 28 leaderboard with real data
- [ ] Chat (persona-based AI conversation)
- [ ] Chrome extension
- [ ] Mainnet deployment
