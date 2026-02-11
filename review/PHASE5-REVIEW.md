# Phase 5 Review: Landing + Hatch Page Revamp

## Summary
Revamped landing page and hatch page based on UPDATE_INSTRUCTIONS.md wireframes. Added Cinzel + Crimson Text fonts, CSS keyframe animations, and multi-scene state machines. All other pages unchanged.

## Landing Page (`/`) — Two-Scene State Machine

### Scene 1: Magic Circle (Intro)
- Full-viewport overlay (`fixed inset-0 z-60`) covering header
- Rotating magic circle with `mix-blend-mode: lighten`
  - SVG placeholder fallback when `magic-circle.webp` not available
  - `spin-slow 40s` rotation + `breathe 5s` opacity pulse
- Golden particle system: 30 CSS-animated dust particles floating upward
- Text overlay: "Hatch. Breed. Chaos." (Cinzel font, gold, text-shadow)
- "tap to enter" with `pulse-hint` blink animation

### Click Transition
1. Magic circle accelerates (`spin-fast 2s`)
2. 1.2s: Golden radial-gradient light burst (`z-70`)
3. 1.8s: Overlay fades out, letter scene + header revealed

### Scene 2: Letter (Main)
- Parchment-style card with `letter-float` bobbing animation
- Double border (outer gold, inner inset at 8px)
- HP-style letter content: seal, greeting, lore, quote, signature
- CTA button with fill-from-bottom hover animation
- Feed section: 4 mock Mutt cards with hover lift
- Stats bar: Total Mutts / Purebloods / Sacred Houses

## Hatch Page (`/hatch`) — Three-State Machine

### State 1: Input
- Identity.md textarea (monospace, dark background)
- Random persona hint box
- "Hatch My Mutt" button with fill hover effect
- Error display for API failures

### State 2: Hatching (Summoning → Video)
- Egg image with `egg-float` animation + "Summoning..." pulse text
- Fallback: 🥚 emoji when `egg.webp` not available
- After 2s: swap to `hatch.mp4` video, text changes to "Hatching..."
- Video: `playsInline muted`, auto-play on swap

### State 3: Result
- Video `onended` (or 8s fallback) triggers golden light burst
- Pokemon-card style result with double border, gradient background
- Shows: avatar, Mutt #, MBTI type, description, traits, bloodline

### Async Coordination
- API call and animation timers run in parallel
- Result shown only when BOTH API response AND video completion are done
- 8s hard fallback if video stalls
- Error handler cancels timers and resets to input state

## Infrastructure Changes

| File | Change |
|------|--------|
| `globals.css` | Added 8 keyframes (spin, breathe, particle-float, letter-float, etc.), Cinzel + Crimson Text font variables |
| `layout.tsx` | Added `next/font/google` for Cinzel + Crimson_Text with CSS variables |
| `Header.tsx` | Updated to use `font-display` class, `backdrop-blur-xl`, transparent bg |
| `public/images/` | Created directory for magic-circle.webp, egg.webp |
| `public/videos/` | Created directory for hatch.mp4 |

## Asset Files (Pending)
Assets to be placed by user:
```
public/images/magic-circle.webp  — Magic circle image (black bg)
public/images/egg.webp           — Dragon egg image (black bg)
public/videos/hatch.mp4          — Egg hatching animation (~5.4MB)
```
All three have graceful fallbacks (SVG placeholder / emoji) when missing.

## Build
- All routes compile successfully
- No TypeScript errors
- Static pages: `/`, `/hatch`, `/breed`, `/leaderboard`, `/my`
- Dynamic pages: `/mutt/[id]`, `/family/[id]`
