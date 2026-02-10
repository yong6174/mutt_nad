# Phase 3 Review: API Routes

## Summary
Built 4 API endpoints handling the full server-side lifecycle: hatch, breed, rate, and query. Includes LLM personality analysis, EIP-712 signature generation, and automatic pureblood checking.

## Endpoints

### POST /api/hatch
- Receives `address` + optional `identity` text
- If identity provided: LLM (gpt-4o-mini via Vercel AI SDK) analyzes MBTI, description, traits
- If empty: random MBTI assigned
- Generates EIP-712 signature for on-chain genesis hatch
- Saves off-chain data to Supabase
- Returns: personality index, type, description, traits, signature, nonce

### POST /api/breed
- Receives `address`, `parentA`, `parentB` (token IDs)
- Fetches both parents from DB
- If either parent has identity: LLM mixes personalities
- If both empty: genetic fallback algorithm (per-axis inheritance with 10% mutation)
- Generates EIP-712 breed signature
- Saves offspring to DB
- Returns: personality data + signature

### POST /api/rate
- Receives `tokenId`, `voter`, `score` (1-5)
- Validates: mutt exists, no self-rating, no duplicate votes
- Inserts rating, recalculates average
- Triggers pureblood check (retroactive application to 3-gen route)
- Returns: new average rating, total reviews

### GET /api/mutt/:id
- Returns combined off-chain + on-chain data
- Off-chain from Supabase (personality, traits, ratings, bloodline)
- On-chain from contract (parentA/B, breeder, breedCost, lastBreedTime)
- Gracefully handles contract not deployed yet

## Server Utilities

### `lib/server/signer.ts`
- EIP-712 typed data signing using viem's `privateKeyToAccount`
- Matches contract's HATCH_TYPEHASH and BREED_TYPEHASH exactly
- Domain: `{name: "MuttNFT", version: "1", chainId, verifyingContract}`

### `lib/server/llm.ts`
- `analyzeIdentity()` — single identity -> MBTI via structured output (zod schema)
- `analyzeBreeding()` — two parents -> offspring personality
- `mbtiGeneticFallback()` — no-LLM MBTI inheritance (per-axis 50/50, 10% mutation)
- `randomMbti()` — pure random for empty identity hatch

### `lib/schema.sql`
- 3 tables: `mutts`, `ratings`, `activities`
- Proper indexes for breeder, bloodline, rating lookups
- UNIQUE constraint on (token_id, voter) for ratings

## Key Decisions
- **Token ID placeholder**: Using `Date.now()` as temporary token_id before on-chain confirmation. Will need sync mechanism in Phase 5.
- **Single model**: gpt-4o-mini for cost efficiency during hackathon
- **Structured output**: Using Vercel AI SDK `generateObject()` with zod schema for reliable JSON
- **Pureblood check on rating**: Triggered every time a rating is submitted, checks 3-generation route

## Files Created
- `src/app/api/hatch/route.ts`
- `src/app/api/breed/route.ts`
- `src/app/api/rate/route.ts`
- `src/app/api/mutt/[id]/route.ts`
- `src/lib/server/signer.ts`
- `src/lib/server/llm.ts`
- `src/lib/schema.sql`
