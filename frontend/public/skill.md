# Mutt — Skill Guide

> Quick reference for AI agents working on this project.

## What is Mutt?

On-chain AI companion breeding platform on Monad. Users hatch NFTs with LLM-generated MBTI personalities, breed them, earn community ratings, and climb bloodline ranks (Mutt → Halfblood → Pureblood → Sacred 28).

**Live:** https://mutt-nad.vercel.app
**Chain:** Monad Testnet (10143)

---

## Key Files

| File | Role |
|------|------|
| `contract/src/MuttNFT.sol` | ERC-1155 NFT + ERC-20 breed fees + EIP-712 signatures |
| `frontend/src/app/api/hatch/route.ts` | LLM personality analysis → EIP-712 signature |
| `frontend/src/app/api/breed/route.ts` | Genetic MBTI blending → EIP-712 signature |
| `frontend/src/app/api/sync/route.ts` | On-chain verification → DB sync (mutts + holdings + activities) |
| `frontend/src/app/api/rate/route.ts` | 1-5 star rating → pureblood evaluation |
| `frontend/src/app/api/my/route.ts` | Server-side holdings query (RLS bypass) |
| `frontend/src/app/api/mutt/[id]/route.ts` | Mutt profile data + on-chain state |
| `frontend/src/lib/personality.ts` | 16 MBTI → 4 group images (analyst/diplomat/sentinel/explorer) |
| `frontend/src/lib/server/signer.ts` | Lazy-init server wallet (EIP-712 signing) |
| `frontend/src/lib/server/llm.ts` | GPT-4o-mini personality + name generation |
| `frontend/src/lib/bloodline.ts` | Pureblood route evaluation (3-gen, avg≥4.7, reviews≥10) |
| `frontend/src/lib/chain.ts` | Chain config, contract addresses |
| `frontend/src/lib/db.ts` | Supabase client (anon) + admin (service_role) |

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/hatch` | `{ address, identity }` → personality + EIP-712 sig |
| POST | `/api/breed` | `{ address, parentA, parentB }` → child personality + sig |
| POST | `/api/sync` | `{ address, tokenId, action }` → verify on-chain + DB sync |
| POST | `/api/rate` | `{ tokenId, voter, score }` → rating + pureblood check |
| GET | `/api/mutt/:id` | Mutt profile (optional `?viewer=` for rating status) |
| GET | `/api/my?address=` | User's holdings + activities (server-side, bypasses RLS) |
| POST | `/api/pending/cancel` | `{ address, nonce }` → delete pending action |

---

## DB Tables (Supabase)

| Table | Key Columns |
|-------|-------------|
| `mutts` | token_id, personality, personality_desc, bloodline, avg_rating, image, parent_a, parent_b, breeder, pureblood_route |
| `holdings` | address, token_id, balance |
| `activities` | type (hatch/breed/rating), actor, token_id, detail |
| `ratings` | token_id, voter, score (unique per voter+token) |
| `pending_actions` | address, action, personality_type, traits, nonce |

---

## Contracts

| Contract | Address |
|----------|---------|
| MuttNFT (ERC-1155) | `0x43a83D0aCc51bA88bdF2eC8e1d3A40123ef15c41` |
| MUTT Token (ERC-20) | `0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777` |

---

## Business Rules

1. **Genesis Hatch**: 1 per wallet, free (gas only)
2. **Breed Cost**: Set by parent breeder in MUTT token, 90% breeder / 10% platform
3. **Cooldown**: 5 minutes between breeds per token
4. **Rating**: 1-5 stars, one per voter per token, breeder cannot self-rate
5. **Pureblood**: Route-based, 3 generations, avg rating ≥ 4.7 + total reviews ≥ 10
6. **Sacred 28**: Top 28 houses by route avg rating (computed client-side)
7. **Names**: LLM-generated fantasy names stored in personality_desc as `"Name — Description"`
8. **Images**: 4 groups (analyst, diplomat, sentinel, explorer) mapped from 16 MBTI types

---

## Common Pitfalls

- **RLS on holdings**: Supabase anon key cannot read holdings table → use `/api/my` (server-side supabaseAdmin)
- **Addresses must be lowercase**: DB stores lowercase, wagmi returns checksummed → always `.toLowerCase()`
- **Signer lazy init**: `privateKeyToAccount()` in `signer.ts` is called inside function, not at module level (prevents build crash)
- **Image paths**: Always use `getPersonalityByType(mbti).image` from `personality.ts`, never string interpolation
- **Mock mode**: `NEXT_PUBLIC_MOCK=true` bypasses all on-chain calls for local dev
- **Sacred 28 is client-computed**: Not stored in DB; family tree and mutt detail pages query all pureblood routes and compute top 28

---

## Local Setup

```bash
cd frontend
cp .env.example .env.local  # fill in env vars
npm install
npm run dev                  # http://localhost:3000
```

Required env vars:
- `NEXT_PUBLIC_MONAD_RPC_URL` — Monad testnet RPC
- `NEXT_PUBLIC_CHAIN_ID` — 10143
- `NEXT_PUBLIC_MUTT_NFT_ADDRESS` — MuttNFT contract
- `NEXT_PUBLIC_MUTT_TOKEN_ADDRESS` — MUTT ERC-20
- `SERVER_PRIVATE_KEY` — Server signer private key
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `OPENAI_API_KEY` — For LLM personality analysis (falls back to random without it)
