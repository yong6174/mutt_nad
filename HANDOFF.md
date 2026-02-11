## Goal
Build "Mutt" — an AI companion breeding platform on Monad testnet. Users mint companions (ERC-1155) with MBTI personalities derived from IDENTITY.md via LLM, breed them, rate them, and build a Harry Potter-style bloodline system (Mutt -> Halfblood -> Pureblood -> Sacred 28).

## Current Status
**Phase 5: Landing + Hatch Revamp — COMPLETE**

- Landing page: magic circle intro → letter scene (two-scene state machine)
- Hatch page: input → egg/video animation → result card (three-state machine)
- Cinzel + Crimson Text fonts via next/font/google
- 8 CSS keyframe animations added to globals.css
- Header updated to match wireframe (backdrop blur, Cinzel font)
- Asset directories created (public/images/, public/videos/)
- Build passes, all routes compiled

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
- Magic circle overlay approach: fixed z-60 overlay covers header during Scene 1, fades out to reveal header + letter content — avoids need for HeaderContext
- Image fallback pattern: `<img onError>` triggers SVG/emoji fallback for missing assets
- Async coordination in hatch: API call + video timers run in parallel, both must complete before showing result, 8s hard fallback
- Unicode escapes for emoji in JSX to avoid encoding issues

## Next Steps
1. **Add asset files**: Place magic-circle.webp, egg.webp, hatch.mp4 into public/
2. **Phase 5 continued**: Wire leaderboard + my collection to Supabase live data
3. **Wagmi hooks**: useContract, useMutt, useBreed for on-chain interaction
4. **Contract integration**: Connect hatch/breed pages to on-chain transactions
5. **MBTI images**: Add 16 type-specific artwork
6. **Token ID sync**: Replace Date.now placeholder with real token IDs
7. **Sacred 28 ranking**: DB view for leaderboard

## Context
- Dev package: `mutt-dev-package /` — NOT committed
- Git remote: https://github.com/yong6174/mutt_nad.git
- Placeholder images (SVG/emoji fallback) — waiting for actual artwork
- Asset files not yet provided: magic-circle.webp, egg.webp, hatch.mp4
