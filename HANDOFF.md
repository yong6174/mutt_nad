## Goal
Build "Mutt" — an AI companion breeding platform on Monad testnet. Users mint companions (ERC-1155) with MBTI personalities derived from IDENTITY.md via LLM, breed them, rate them, and build a Harry Potter-style bloodline system (Mutt → Halfblood → Pureblood → Sacred 28).

## Current Status
**Phase 1: Project Setup — COMPLETE**

- Next.js 15.5.11 + TypeScript + Tailwind v4 + App Router
- RainbowKit + wagmi v2 + viem (Monad Testnet, chainId 10143)
- Vercel AI SDK (@ai-sdk/openai) + Supabase client installed
- Theme: dark (#0a0a0f) + gold (#c8a84e) — Harry Potter aesthetic
- All type definitions, chain config, wagmi config, personality data, bloodline logic ready
- Common layout with Header (nav + RainbowKit ConnectButton)
- Build passes cleanly

## What Was Tried
- Created project from scratch with `create-next-app@15.5.11`
- Set up Tailwind v4 `@theme inline` with custom color tokens (bg-primary, gold, text-secondary, etc.)
- RainbowKit configured with `darkTheme`, WalletConnect disabled (injected only)
- Placeholder landing page with hero section

## Next Steps
1. **Phase 2**: Smart contract — MuttNFT.sol (ERC-1155 + EIP-712 signatures + breeding + cooldown + platform fee). Foundry setup + tests.
2. **Phase 3**: API routes — /api/hatch, /api/breed, /api/rate, /api/mutt/[id]. Supabase DB schema.
3. **Phase 4**: Frontend pages — Landing, Hatch, Profile, Breed, Family Tree, Leaderboard, My Collection. Follow wireframes in dev package.
4. **Phase 5**: Polish — pureblood logic integration, Sacred 28 leaderboard, wagmi hooks for contract interaction.

## Context
- Dev package location: `../mutt-dev-package (1)/` — contains PLANNING.md, DEV_SPEC.md, wireframes (7 HTML files), reference contracts (ERC-8004)
- Dev package is NOT committed (per user request)
- MBTI 16 types mapped to personality indices 0-15
- On-chain: ownership, parents, breeder, breedCost, cooldown
- Off-chain (Supabase): identity text, personality description, traits, ratings, bloodline grade
- Bloodline: 3-generation route check, avg rating >= 4.7 AND total reviews >= 10 for pureblood
- Sacred 28: top 28 houses by route rating, max 140 members (28 × 5)
