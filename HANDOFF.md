## Goal
Build "Mutt" — an AI companion breeding platform on Monad testnet. Users mint companions (ERC-1155) with MBTI personalities derived from IDENTITY.md via LLM, breed them, rate them, and build a Harry Potter-style bloodline system (Mutt -> Halfblood -> Pureblood -> Sacred 28).

## Current Status
**Phase 6: UI Polish + Mock Mode — COMPLETE**

- All 7 pages polished with HP theme (Cinzel + Crimson Text fonts, gold accents, consistent styling)
- Landing: magic circle + 3 aura layers (glow, dust, light) → letter scene
- Hatch: input → paused video with "Tap to Hatch" overlay → video plays → result card
- Breed: slot cards with gradient backgrounds, fill-hover buttons, search panel
- Mutt Profile: pokemon-card style with double border, rating, parent links
- Family Tree: 3-generation tree with pureblood route display
- Leaderboard: Sacred 28 ranking with expandable house members
- My Collection: stat bar, mutt grid with status badges, activity feed
- Header: Cinzel font, backdrop-blur, added "My" nav link
- Mock mode: all 4 APIs return mock data when Supabase URL is placeholder
- All pages work without wallet connection for UI testing

**Phase 5: Landing + Hatch Revamp — COMPLETE**
**Phase 4: Frontend Pages — COMPLETE**
**Phase 3: API Routes — COMPLETE**
**Phase 2: Smart Contracts — COMPLETE** (17/17 tests)
**Phase 1: Project Setup — COMPLETE**

## What Was Tried
- Dual magic circle layers (inner counter-clockwise) — rolled back due to rotation axis issues
- Aura layers: glow (pulse), dust (slow reverse spin), light (breathe) all with mix-blend-mode:lighten
- Hatch video watermark: overflow-hidden + height 105% clips bottom 5%
- Mock mode via isMockMode() checking Supabase URL placeholder

## Next Steps
1. **Contract deployment**: Deploy MuttNFT.sol to Monad testnet
2. **Wagmi hooks**: useContract, useMutt, useBreed for on-chain interaction
3. **Contract integration**: Connect hatch/breed pages to on-chain transactions
4. **Supabase setup**: Create tables (mutts, ratings, activities), connect APIs
5. **MBTI images**: Add 16 type-specific artwork for mutt avatars
6. **Token ID sync**: Replace Date.now placeholder with real token IDs
7. **Sacred 28 ranking**: DB view for leaderboard with real data

## Context
- Git remote: https://github.com/yong6174/mutt_nad.git
- Placeholder images (SVG/emoji fallback) — waiting for actual MBTI artwork
- Asset files present: magic-circle.webp, egg.webp, hatch.mp4, glow.png, dust.png, light.png
- Unused assets in public/images/: magic.png, magic-inner-circle.webp, magic-circle.old.webp, "magic 복사본.png"
