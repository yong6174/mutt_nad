## Goal
Build "Mutt" — an AI companion breeding platform on Monad testnet. Users mint companions (ERC-1155) with MBTI personalities derived from IDENTITY.md via LLM, breed them, rate them, and build a Harry Potter-style bloodline system (Mutt -> Halfblood -> Pureblood -> Sacred 28).

## Current Status
**Phase 4: Frontend Pages — COMPLETE**

- 7 pages: Landing, Hatch, Profile, Breed, Family Tree, Leaderboard, My Collection
- 4 shared components: MuttCard, MuttMini, StarRating, RatingDisplay
- Dark + gold HP theme matching wireframes
- Build passes, all routes compiled

**Phase 3: API Routes — COMPLETE**
- 4 endpoints: hatch, breed, rate, mutt/:id

**Phase 2: Smart Contracts — COMPLETE**
- MuttNFT.sol: 17/17 tests

**Phase 1: Project Setup — COMPLETE**
- Next.js 15.5.11 + Tailwind v4 + RainbowKit monorepo

## What Was Tried
- Pokemon-card style profile with two-column layout
- Suspense boundary needed for useSearchParams in breed page (Next.js 15)
- tsconfig target ES2020 for BigInt support
- Mock data for leaderboard + my collection (Phase 5 will wire to Supabase)

## Next Steps
1. **Phase 5**: Polish & integration
   - Wire leaderboard + my collection to Supabase live data
   - Add wagmi hooks for contract interaction (useContract, useMutt, useBreed)
   - Connect hatch/breed pages to on-chain transactions
   - Add MBTI images (16 types)
   - Token ID sync (replace Date.now placeholder)
   - Sacred 28 ranking from DB view

## Context
- Dev package: `mutt-dev-package (1)/` — NOT committed
- Git remote: https://github.com/yong6174/mutt_nad.git
- Placeholder images (?) everywhere — waiting for actual MBTI artwork
