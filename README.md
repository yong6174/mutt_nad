# 🐕 Mutt

> **Hatch. Breed. Chaos.**
> *Purebloods are earned, not born.*

**Mutt** is an on-chain AI companion breeding platform on [Monad](https://monad.xyz). Hatch your Genesis Mutt with an AI-generated personality, breed it with others to create unique offspring, and climb the bloodline ranks to earn the coveted **Sacred 28** status.

Each Mutt's personality is determined by an LLM analyzing your IDENTITY.md — or through MBTI genetic inheritance from its parents. Rate other Mutts, build reputation across generations, and watch your bloodline evolve from lowly Mutt to Pureblood royalty.

## 🔗 Live Demo

**[mutt-nad.vercel.app](https://mutt-nad.vercel.app)**

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
│          Next.js 15 + RainbowKit + wagmi            │
│                                                     │
│  /hatch  /breed  /mutt/:id  /family/:id  /my  ...  │
└────────┬────────────────────────┬───────────────────┘
         │ API Routes             │ Contract Calls
         ▼                        ▼
┌─────────────────┐    ┌─────────────────────────────┐
│  Next.js API     │    │  MuttNFT (ERC-1155)         │
│  /api/hatch      │    │  Monad Testnet              │
│  /api/breed      │    │  EIP-712 signed mutations   │
│  /api/sync       │    │  MUTT ERC-20 for fees       │
│  /api/rate       │    └─────────────────────────────┘
│  /api/mutt/[id]  │
│  /api/my         │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────────────────┐
│  Supabase (DB)   │    │  OpenAI (gpt-4o-mini)       │
│  5 tables        │    │  Personality analysis        │
│  Off-chain data  │    │  Breeding prediction         │
└──────────────────┘    └─────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Chain** | Monad Testnet (ID: 10143) |
| **Token** | ERC-1155 (NFT) + ERC-20 (MUTT token) |
| **Contract** | Solidity 0.8.24, Foundry |
| **Frontend** | Next.js 15.5.11, TypeScript, Tailwind CSS v4 |
| **Wallet** | RainbowKit + wagmi (injected only) |
| **AI** | Vercel AI SDK + gpt-4o-mini |
| **DB** | Supabase (PostgreSQL) |
| **Deploy** | Vercel |

## How It Works

### 1. 🥚 Hatch
Connect your wallet and hatch a Genesis Mutt. Paste your IDENTITY.md (or leave blank for random). An LLM analyzes your identity to assign an MBTI personality type, unique name, and visual traits.

### 2. ⭐ Rate
Rate other players' Mutts (1-5 stars). Ratings build reputation — the foundation of bloodline advancement.

### 3. 🧬 Breed
Pick your Mutt and a partner's Mutt. The LLM combines their identities to create offspring with inherited (and potentially mutated) personality traits. Breeding costs MUTT tokens set by the partner.

### 4. 👑 Pureblood
When a 3-generation lineage (child → parent → grandparent) achieves avg rating ≥ 4.7 with ≥ 10 total reviews, the entire route earns **Pureblood** status — retroactively.

### 5. ⚡ Sacred 28
The top 28 Pureblood houses (ranked by route average rating) earn the ultimate title: **Sacred 28**.

## Bloodline System

| Grade | Condition | Badge |
|-------|-----------|-------|
| **Mutt** | Genesis hatch (default) | 🐕 |
| **Halfblood** | Bred offspring | 🩸 |
| **Pureblood** | 3-gen route: avg ≥ 4.7, reviews ≥ 10 | 👑 |
| **Sacred 28** | Top 28 Pureblood houses | ⚡ |

## Smart Contracts

### MuttNFT (ERC-1155)
- **Address**: `0x43a83D0aCc51bA88bdF2eC8e1d3A40123ef15c41`
- **Chain**: Monad Testnet (10143)
- **Features**: Genesis hatch (1/wallet), breeding with EIP-712 signatures, mint/adopt system
- **On-chain data**: personality (0-15), parents, breeder, breedCost, cooldown, mintCost, supply

### MUTT Token (ERC-20)
- **Address**: `0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777`
- **Usage**: Breeding fees (90% to breeder, 10% platform), minting fees

## Directory Structure

```
repo/
├── contract/
│   ├── src/MuttNFT.sol          # Main contract (ERC-1155 + EIP-712)
│   ├── test/MuttNFT.t.sol       # Foundry tests (30/30)
│   └── script/Deploy.s.sol      # Deployment script
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing
│   │   │   ├── hatch/           # Genesis hatch
│   │   │   ├── breed/           # Breeding
│   │   │   ├── mutt/[id]/       # Mutt profile
│   │   │   ├── family/[id]/     # Family tree
│   │   │   ├── leaderboard/     # Sacred 28
│   │   │   ├── my/              # My collection
│   │   │   ├── explore/         # Browse all Mutts
│   │   │   └── api/             # API routes (7 endpoints)
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks (hatch, breed, sync, mint...)
│   │   ├── lib/
│   │   │   ├── chain.ts         # Monad chain config
│   │   │   ├── personality.ts   # MBTI 16-type → 4-group image mapping
│   │   │   ├── bloodline.ts     # Pureblood route checking
│   │   │   ├── contracts/abi.ts # Contract ABI
│   │   │   ├── db.ts            # Supabase client
│   │   │   ├── wagmi.ts         # wagmi config
│   │   │   ├── mock.ts          # Mock mode data
│   │   │   ├── server/llm.ts    # LLM personality analysis
│   │   │   ├── server/signer.ts # EIP-712 signing
│   │   │   └── schema*.sql      # DB schemas
│   │   └── types/index.ts       # TypeScript types
│   └── package.json
│
├── README.md
├── HANDOFF.md
└── llms.txt
```

## Setup

### Prerequisites
- Node.js ≥ 18
- Foundry (for contract development)
- A Monad Testnet wallet with MON

### Environment Variables

Create `frontend/.env.local`:

```env
# Network
NEXT_PUBLIC_NETWORK=testnet

# Monad RPC
NEXT_PUBLIC_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz

# Contract Addresses
NEXT_PUBLIC_TESTNET_MUTT_NFT_ADDRESS=0x43a83D0aCc51bA88bdF2eC8e1d3A40123ef15c41
NEXT_PUBLIC_TESTNET_MUTT_TOKEN_ADDRESS=0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777

# Server Signer (private key for EIP-712 signatures)
TESTNET_SERVER_PRIVATE_KEY=0x...

# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Run Locally

```bash
# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000

# Contract (development)
cd contract
forge build
forge test
```

### Deploy Contract

```bash
cd contract
NETWORK=testnet forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/hatch` | Genesis hatch — LLM analysis + EIP-712 signature |
| POST | `/api/breed` | Breed — parent identity combo + signature |
| POST | `/api/sync` | On-chain verification + DB commit |
| POST | `/api/rate` | Star rating (1-5) + pureblood check |
| GET | `/api/mutt/[id]` | Mutt detail (on-chain + off-chain) |
| GET | `/api/my?address=` | My holdings + activities |
| POST | `/api/pending/cancel` | Clean up stale pending actions |

## Hackathon

Built for the Monad Hackathon.

---

*Purebloods are earned, not born.* 🐕
