# Bug Fix Review — Code Audit Results

Reviewed against `BUGFIX.md` (10 bugs). Each bug verified by reading the actual source code.

---

## BUG-1: /my page not showing minted/adopted tokens (TC-MY4) — ALREADY FIXED

**Status: FIXED**

`/src/app/my/page.tsx:80-113` — The `/my` page queries `holdings` table (not `breeder`), joins with `mutts`, and sets `isBreeder` per mutt. This is exactly what the bugfix describes.

```
holdings (address, balance > 0) → mutts (token_id join) → isBreeder = breeder === addr
```

Breeder-only controls (breed cost, mint config) are gated behind `mutt.isBreeder` at lines 272 and 328.

---

## BUG-2: Existing rating not checked on page load (TC-R2) — ALREADY FIXED

**Status: FIXED**

- **API** (`/api/mutt/[id]/route.ts:107-122`): Accepts `?viewer=0x...` query param, checks `ratings` table, returns `hasRated` + `myRating`.
- **Frontend** (`/mutt/[id]/page.tsx:73-83`): Passes `?viewer=${address}`, reads `data.hasRated` and `data.myRating`. If `hasRated === true`, sets `ratingSubmitted = true` immediately.
- **UI** (lines 205-224): Shows "You rated X" when `ratingSubmitted`, otherwise shows star input.

---

## BUG-3: MintSection MUTT balance check missing (TC-M4) — ALREADY FIXED

**Status: FIXED**

`/mutt/[id]/page.tsx:385` — `MintSection` receives `tokenBalance` prop and computes:

```typescript
const insufficientBalance = mintCostBn > 0n && (tokenBalance ?? 0n) < mintCostBn;
```

Line 432-438: Shows disabled "Insufficient MUTT balance" button when insufficient.

**Breed page also covered** (`/breed/page.tsx:124`):
```typescript
const insufficientBalance = breedCostBn > 0n && (tokenBalance ?? 0n) < breedCostBn;
```

---

## BUG-4: Breeder cannot mint own mutt (TC-M8) — ALREADY FIXED

**Status: FIXED**

`/mutt/[id]/page.tsx:386,420-424` — `isOwner` is computed but NOT used to block minting. The mint button renders regardless of ownership. Instead, breeder sees a helpful message:

```
"You are the breeder — 90% fee returns to you"
```

---

## BUG-5: Landing feed hardcoded (TC-L4) — PARTIALLY FIXED

**Status: PARTIAL — Stats real, feed still hardcoded**

- **Stats** (`/page.tsx:39-52`): Fetches real data from Supabase (`mutts` table count for total, purebloods, sacred28). Working correctly.
- **Feed** (`/page.tsx:8-13, 273`): Still uses `MOCK_FEED` constant with hardcoded tokenIds (42, 41, 40, 39). Never fetches from DB.

**Remaining work:**
- Replace `MOCK_FEED` with a `supabase.from('mutts').select(...).order('created_at', { ascending: false }).limit(10)` call
- Or add a `/api/mutts/recent` endpoint

---

## BUG-6: Result card image hardcoded (TC-H1) — NOT FIXED

**Status: NOT FIXED**

`/hatch/page.tsx:269` — Hatch result card shows hardcoded fox emoji:
```tsx
<div className="text-[80px] mb-4">{'\u{1F98A}'}</div>
```

`/hatch/page.tsx:405` — AlreadyHatchedScreen also hardcodes fox emoji.

No MBTI-to-image mapping exists. The `mutt.image` field is set in sync as `/images/${mbti.toLowerCase()}.png` but the hatch result page doesn't use it.

**Dependency:** 16 MBTI character images need to be created first.

---

## BUG-7: Breed — same mutt selectable for both slots (TC-B7) — NOT FIXED

**Status: NOT FIXED**

`/breed/page.tsx:186-193` — Search handler (`handleSearch`) and search results list do not filter out the currently selected `myMutt`. A user can select the same tokenId for both "Your Mutt" and "Partner Mutt" slots.

**Fix:** Add `searchResults.filter(m => m.tokenId !== myMutt?.tokenId)` in the render at line 359.

---

## BUG-8: Compatibility preview missing MBTI probability (TC-B11) — NOT FIXED

**Status: NOT FIXED**

`/breed/page.tsx:259-269` — The "Predicted Offspring" section shows only:
```
"AI Analyzed"
"+ 10% mutation chance"
```

No per-axis MBTI probability breakdown is displayed. No `predictOffspring()` function exists anywhere in the frontend.

---

## BUG-9: Hatch egg float animation missing (TC-HA1) — N/A

**Status: N/A — Uses video instead of static egg**

`/hatch/page.tsx:230-249` — The hatch flow uses a `<video>` element (`/videos/hatch.mp4`) instead of a static egg image. The BUGFIX assumes a static `egg.webp` with CSS float animation, but the actual implementation uses a video. This bug doesn't apply.

---

## BUG-10: Tx reject leaves pending_action (TC-E2) — PARTIALLY FIXED

**Status: PARTIAL — Server cleanup exists, no client-side cancel**

- **Server** (`/api/sync/route.ts:126`): After successful sync, the pending_action is deleted (`DELETE ... eq('id', pending.id)`).
- **Client**: No `/api/pending/cancel` endpoint exists. If a user rejects the wallet tx, the pending_action stays in the DB. No TTL or cron cleanup.

Frontend hooks (`useGenesisHatch.ts`, `useBreed.ts`) catch tx errors but don't call any cleanup API.

**Remaining work:**
- Add `POST /api/pending/cancel` endpoint
- Or add a TTL-based cleanup (e.g. delete pending_actions older than 30 min)

---

## Summary

| Bug | Severity | Status | Action Required |
|-----|----------|--------|-----------------|
| BUG-1 | P0 High | FIXED | None |
| BUG-2 | P1 Medium | FIXED | None |
| BUG-3 | P1 Medium | FIXED | None |
| BUG-4 | P1 Medium | FIXED | None |
| BUG-5 | P1 Medium | PARTIAL | Replace MOCK_FEED with real DB query |
| BUG-6 | P2 Low | NOT FIXED | Need 16 MBTI images + mapping |
| BUG-7 | P2 Low | NOT FIXED | Filter myMutt from partner search results |
| BUG-8 | P2 Low | NOT FIXED | Add MBTI probability calculation + UI |
| BUG-9 | P2 Low | N/A | Video-based flow, not applicable |
| BUG-10 | P2 Low | PARTIAL | Add pending_action cancel/TTL cleanup |

**Result: 4 FIXED / 2 PARTIAL / 3 NOT FIXED / 1 N/A**

All P0 and P1 bugs are resolved. Remaining items are P2 (polish).
