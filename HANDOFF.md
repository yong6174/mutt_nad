## Goal
Build "Mutt" — an AI companion breeding platform on Monad testnet. Users mint companions (ERC-1155) with MBTI personalities derived from IDENTITY.md via LLM, breed them, rate them, and build a Harry Potter-style bloodline system (Mutt -> Halfblood -> Pureblood -> Sacred 28).

## Current Status
**Phase 7 + Gap Patch — COMPLETE**

### Gap Patch (completed this session)
- **GAP-6: ERC-20 breed fee** — Contract migrated from native MON to MUTT ERC-20 token (transferFrom). Frontend has approve flow, balance check, allowance check.
- **GAP-1: Sacred 28 house ranking** — Leaderboard rewritten with house-based ranking. Houses = pureblood child token routes. Tabs: Sacred 28 / Purebloods / All Mutts. Expandable house cards.
- **GAP-2: Cooldown display** — useCooldown hook with real-time countdown. Breed page shows cooldown timer + disables breed button. My page shows Ready/countdown badge per card.
- **GAP-3: Already hatched screen** — /hatch shows mini profile card (personality, bloodline, traits) when already hatched + [Breed Now] + [View Collection] CTAs.
- **GAP-4: Breed cost setting in /my** — Each MuttCard in /my has inline pencil edit for breed cost (MUTT token units). useSetBreedCost hook.
- **GAP-5: Wallet guard modal** — WalletGuard component (dynamic import, ssr: false) auto-opens RainbowKit connect modal on /hatch and /breed when wallet not connected.

### Build fixes
- Supabase client: `persistSession: false` to avoid localStorage during SSR
- Providers: RainbowKitProvider wrapped with mounted check to avoid SSR localStorage access
- Custom not-found.tsx with force-dynamic to prevent prerender error
- Mutt detail page: "MON" labels updated to "MUTT"

### Previously done (Phase 7)
- MuttNFT.sol deployed: `0xA7aF45f22FfF2F0da23374c78f38f52EDC8f93BC` (Monad Testnet 10143)
- Supabase tables + RLS + indexes
- Wagmi hooks, ABI, chain config, API routes all wired
- All pages functional with contract integration
- 19/19 Foundry tests passing (with ERC-20 breed fee)

### TODO (remaining)
1. **E2E test** — hatch → breed → rate → leaderboard flow with real wallet
2. **Landing page real data** — replace MOCK_FEED with Supabase data
3. **Image generation** — Mutt profile image pipeline (currently placeholder '?')
4. **UI polish** — layout refactoring plan exists (fluffy-singing-planet.md)

## .env structure

### contract/.env
```
NETWORK=testnet
TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
TESTNET_PRIVATE_KEY=0x5737...
TESTNET_SERVER_SIGNER=0x7c0f...
TESTNET_PLATFORM_WALLET=0x7c0f...
TESTNET_MUTT_TOKEN=<MUTT ERC-20 address>
MAINNET_* (empty)
```

### frontend/.env.local
```
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_TESTNET_MUTT_NFT_ADDRESS=0xA7aF45f22FfF2F0da23374c78f38f52EDC8f93BC
NEXT_PUBLIC_TESTNET_MUTT_TOKEN_ADDRESS=<MUTT ERC-20 address>
Supabase keys configured
OPENAI_API_KEY= (empty, fallback used)
```

## Key Files
- Contract: `contract/src/MuttNFT.sol` (19 tests passing)
- Deploy: `contract/script/Deploy.s.sol` (takes MUTT_TOKEN env)
- ABI: `frontend/src/lib/contracts/abi.ts` (MUTT_NFT_ABI + ERC20_ABI)
- Chain: `frontend/src/lib/chain.ts` (MUTT_NFT_ADDRESS + MUTT_TOKEN_ADDRESS)
- Hooks: `frontend/src/hooks/use{GenesisHatch,Breed,SetBreedCost,GetMutt,HasGenesis,Cooldown,WalletGuard}.ts`
- Components: `frontend/src/components/{WalletGuard,WalletGuardInner}.tsx`
- DB: `frontend/src/lib/db.ts` (persistSession: false)
- Providers: `frontend/src/app/providers.tsx` (mounted guard for RainbowKit)

## Context
- Git remote: https://github.com/yong6174/mutt_nad.git
- Wallet: 0x7c0fC790D03DD82f54030420A109a2A8D53a5888 (~197k MON)
- TypeScript 0 errors, `npm run build` passing
