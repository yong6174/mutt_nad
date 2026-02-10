# Phase 4 Review: Frontend Pages

## Summary
Built all 7 pages following the wireframe designs. Dark theme (#0a0a0f) with gold (#c8a84e) Harry Potter aesthetic. All pages build successfully.

## Pages

### `/` — Landing
- Hero with gradient background, catchphrase, CTA button
- 3-step explanation: Hatch → Breed → Rise
- Recent hatched feed (mock data, MuttMini cards)
- Stats bar (Total Mutts, Purebloods, Sacred Houses)

### `/hatch` — Genesis Hatch
- Wallet connection gate (shows ConnectButton if disconnected)
- Identity.md textarea with Paste/Write tabs
- Empty = random persona note
- Hatch button → calls POST /api/hatch
- Result reveal with personality type, description, traits
- Error handling for already-hatched, network errors

### `/mutt/:id` — Profile (Pokemon Card)
- Two-column layout: card | info panel
- Card: image, name, MBTI, description, traits, bloodline badge
- Rating: display + input (StarRating component, 1-5)
- Self-rating blocked (breeder cannot rate own mutt)
- Parents section with links (or Genesis egg for Gen0)
- Details: breeder address, breed cost
- Action buttons: Breed with / Family Tree

### `/breed` — Breeding Chamber
- 3-column arena: Your Mutt | Center | Partner Mutt
- Slot cards with select/clear functionality
- Center: compatibility preview, breed cost, breed button
- Partner search by token ID
- Result reveal after successful breed
- Suspense boundary for useSearchParams (Next.js 15 requirement)
- URL param `?partner=ID` to pre-select partner

### `/family/:id` — Family Tree
- 3-generation vertical tree: grandparents → parents → current
- Async loading of each generation (parallel fetches)
- Pureblood route highlight for qualified lineages
- Node cards with rating, personality, bloodline badge
- Click to navigate to any ancestor's profile

### `/leaderboard` — Sacred 28
- 3 tabs: Sacred 28 / Purebloods / All Mutts
- Expandable house cards with rank, rating, review count
- Top 3 highlighted with gold/silver/bronze colors
- Members list on expand (max 5 per house)
- Mock data (Supabase integration in Phase 5)

### `/my` — My Collection
- Wallet gate
- Stats bar: Mutts Owned, Breeds Done, Purebloods, MON Earned
- Mutt grid with status badges (Ready / Cooldown timer)
- Breed cost display per mutt
- Activity history feed (hatch, breed, rating, earn events)
- Mock data (live data in Phase 5)

## Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MuttCard` | `components/mutt/` | Full pokemon-card style display |
| `MuttMini` | `components/mutt/` | Small card for feeds/search |
| `StarRating` | `components/rating/` | Interactive 1-5 star input |
| `RatingDisplay` | `components/rating/` | Read-only star + number display |

## Key Decisions
- **Mock data** for leaderboard and my collection — will be wired to Supabase in Phase 5
- **No images yet** — placeholder `?` shown, actual MBTI images to be added later
- **Suspense boundary** required for `/breed` due to `useSearchParams()` in Next.js 15
- **tsconfig target** bumped to ES2020 for BigInt literal support

## Build
- All 7 pages + 4 API routes compile and build successfully
- Static: `/`, `/hatch`, `/leaderboard`, `/my`, `/breed`
- Dynamic: `/mutt/[id]`, `/family/[id]`, API routes
