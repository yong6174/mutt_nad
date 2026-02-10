# Phase 1 Review: Project Setup

## Summary
Scaffolded the Mutt project with Next.js 15.5.11, configured all core dependencies, and established the foundation for development.

## What Was Done

### Project Creation
- `create-next-app@15.5.11` with TypeScript, Tailwind v4, App Router, `src/` directory, Turbopack

### Dependencies Installed
| Package | Purpose |
|---------|---------|
| `@rainbow-me/rainbowkit` | Wallet connection UI |
| `wagmi` + `viem@2.x` | Ethereum client + React hooks |
| `@tanstack/react-query` | Async state management (wagmi peer) |
| `ai` + `@ai-sdk/openai` | Vercel AI SDK for LLM calls |
| `@supabase/supabase-js` | Database client |

### Directory Structure
```
src/
├── app/
│   ├── layout.tsx          # RootLayout with Providers + Header
│   ├── page.tsx            # Landing placeholder
│   ├── providers.tsx       # WagmiProvider + RainbowKit + QueryClient
│   └── globals.css         # Tailwind v4 @theme tokens
├── components/
│   └── layout/
│       └── Header.tsx      # Nav + ConnectButton
├── lib/
│   ├── chain.ts            # Monad Testnet chain definition
│   ├── wagmi.ts            # wagmi config (injected wallets only)
│   ├── personality.ts      # MBTI 16 types data + helpers
│   ├── bloodline.ts        # Pureblood route checking logic
│   ├── db.ts               # Supabase client (admin + public)
│   └── contracts/
│       └── addresses.ts    # Contract address constants
└── types/
    └── index.ts            # All shared TypeScript types
```

### Theme (Tailwind v4 `@theme inline`)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-primary` | `#0a0a0f` | Page background |
| `--color-bg-secondary` | `#0d0d14` | Card/header background |
| `--color-gold` | `#c8a84e` | Accent, headings, CTAs |
| `--color-gold-dim` | `#8a7d65` | Secondary nav text |
| `--color-text-primary` | `#d4c5a0` | Body text |
| `--color-text-secondary` | `#6a5f4a` | Muted text |
| `--color-border-primary` | `#2a2520` | Card borders |

### Key Decisions
- **WalletConnect disabled** — `projectId: 'none'`, injected wallets only (MetaMask etc.)
- **RainbowKit darkTheme** — custom gold accent, no border radius (sharp edges for HP aesthetic)
- **Font** — Georgia serif (matching wireframes)
- **No ESLint** — skipped for speed during hackathon

## Build Status
- `npm run build` passes with 0 errors
- Static pages generated successfully (/, /_not-found)

## Files Created
- `src/app/layout.tsx`, `providers.tsx`, `page.tsx`, `globals.css`
- `src/components/layout/Header.tsx`
- `src/lib/chain.ts`, `wagmi.ts`, `personality.ts`, `bloodline.ts`, `db.ts`
- `src/lib/contracts/addresses.ts`
- `src/types/index.ts`
- `.env.local` (template)
- `HANDOFF.md`
