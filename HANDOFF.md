## Goal
Build "Mutt" — an AI companion breeding platform on Monad testnet. Users mint companions (ERC-1155) with MBTI personalities derived from IDENTITY.md via LLM, breed them, rate them, and build a Harry Potter-style bloodline system (Mutt -> Halfblood -> Pureblood -> Sacred 28).

## Current Status
**Phase 2: Smart Contracts — COMPLETE**

- Monorepo: `frontend/` (Next.js) + `contract/` (Foundry)
- MuttNFT.sol: ERC-1155 + EIP-712 + genesis hatch + breeding + cooldown + fee split
- 17/17 tests pass (hatch, breed, cooldown, fees, admin)
- Deploy script ready

**Phase 1: Project Setup — COMPLETE**
- Next.js 15.5.11 + Tailwind v4 + RainbowKit + wagmi + Supabase + AI SDK
- Theme, types, personality data, bloodline logic all set

## What Was Tried
- Single contract approach (MuttNFT.sol handles both hatch and breed)
- Solidity 0.8.28 for OpenZeppelin 5.x compatibility
- EIP-712 typed signatures for server-verified minting
- Cooldown fix: test setUp needs `vm.warp(1_000_000)` for realistic timestamps

## Next Steps
1. **Phase 3**: API routes — /api/hatch, /api/breed, /api/rate, /api/mutt/[id]. Supabase DB schema.
2. **Phase 4**: Frontend pages — Landing, Hatch, Profile, Breed, Family Tree, Leaderboard, My Collection.
3. **Phase 5**: Polish — pureblood logic, Sacred 28, wagmi hooks, contract-frontend integration.

## Context
- Dev package: `mutt-dev-package (1)/` — NOT committed
- Git remote: https://github.com/yong6174/mutt_nad.git
- Global gitconfig has SSH insteadOf rule; local config uses embedded token in remote URL
- Credential file: `.git-credentials` (gitignored)
