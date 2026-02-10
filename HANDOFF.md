## Goal
Build "Mutt" — an AI companion breeding platform on Monad testnet. Users mint companions (ERC-1155) with MBTI personalities derived from IDENTITY.md via LLM, breed them, rate them, and build a Harry Potter-style bloodline system (Mutt -> Halfblood -> Pureblood -> Sacred 28).

## Current Status
**Phase 3: API Routes — COMPLETE**

- POST /api/hatch — LLM identity analysis + EIP-712 signature
- POST /api/breed — parent mixing (LLM or genetic fallback) + signature
- POST /api/rate — 1-5 rating with pureblood retroactive check
- GET /api/mutt/:id — combined on-chain + off-chain data
- Server utils: EIP-712 signer, LLM wrapper (gpt-4o-mini), genetic fallback
- DB schema: mutts, ratings, activities tables

**Phase 2: Smart Contracts — COMPLETE**
- MuttNFT.sol: 17/17 tests pass

**Phase 1: Project Setup — COMPLETE**
- Next.js 15.5.11 + Tailwind v4 + RainbowKit monorepo

## What Was Tried
- Vercel AI SDK generateObject() with zod schema for structured LLM output
- Per-axis MBTI inheritance with 10% mutation for no-identity breeding
- Pureblood check triggered on every rating submission
- Token ID placeholder (Date.now) before on-chain confirmation

## Next Steps
1. **Phase 4**: Frontend pages — Landing, Hatch, Profile, Breed, Family Tree, Leaderboard, My Collection. Follow wireframes.
2. **Phase 5**: Polish — wagmi hooks, contract integration, pureblood system, Sacred 28.

## Context
- Dev package: `mutt-dev-package (1)/` — NOT committed
- Git remote: https://github.com/yong6174/mutt_nad.git
- Global gitconfig has SSH insteadOf; local uses embedded token in remote URL
- zod added as dependency for AI SDK structured output
