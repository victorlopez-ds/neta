# Neta — personal finance app

Offline-first personal finance app (income / expenses / DCA investments) built to
the spec in [`prompt-logic.md`](./prompt-logic.md), adapting the Figma community
UI kit. **React Native + Expo** frontend, **Supabase** backend.

- Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Caching strategy: [`docs/CACHING.md`](./docs/CACHING.md)
- Backend (schema, RLS, engine): [`supabase/README.md`](./supabase/README.md)

## ⚠️ Before you run: point it at the right Supabase project

The Supabase project currently linked via MCP is **a different app** (a live
meal-planning app: `recipes`, `meal_plans`, `shopping_items`). The backend
migrations were **not** applied there. Create/link a dedicated project for this
finance app, apply `supabase/migrations`, then fill `.env`:

```bash
cp .env.example .env
# set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Run

> Installing `node_modules` (~hundreds of MB) inside a OneDrive-synced folder
> will trigger a large cloud sync. Consider excluding this folder from OneDrive,
> or moving the project outside OneDrive, before installing.

```bash
npm install
npx expo install    # reconcile native dep versions to the Expo SDK
npx expo start      # press i / a, or scan the QR with Expo Go
```

## What's implemented

| Area | Files | Notes |
|---|---|---|
| Auth (email/password) | `app/(auth)/*`, `src/auth/*` | Session drives `auth.uid()` for RLS |
| Home dashboard | `app/(tabs)/index.tsx` | Hero totals derived from cache → optimistic-instant |
| Quick-add (the "+") | `app/movement/new.tsx` | 5-tier category picker, tags, optimistic write |
| Analysis | `app/(tabs)/analysis.tsx` | Grouped income/expense bars + expense pie + savings rate |
| Goals | `app/(tabs)/goals.tsx` | Progress bars, fund via `fund_goal` RPC (optimistic) |
| Subscriptions & DCA | `app/recurring/index.tsx` | `recurring_templates`, "Gasto Fijo Mensual" + monthly DCA |
| Profile | `app/(tabs)/profile.tsx` | Currency, monthly budget limit, sign-out |
| Local-first cache | `src/lib/queryClient.ts`, `src/data/*` | TanStack Query + AsyncStorage persistence |
| Design system | `src/components/*`, `src/theme/tokens.ts` | Rebuilt from the mockups (kit is PNGs, not code) |

## Optimistic-update flow (the core of the "instant" feel)

Adding a movement (`src/data/movements.ts`) updates the in-memory + persisted
cache in `onMutate`, closes the modal immediately, and syncs to Supabase in the
background. On failure it rolls back and shows a non-blocking toast. The Home and
Analysis hero figures are derived from the same movements cache via
`computeTotals`, so the dashboard moves in the same frame — no round-trip. Full
model in [`docs/CACHING.md`](./docs/CACHING.md).

## Honest scope notes

- The UI kit is **128 PNG mockups**, so screens are rebuilt from the designs, not
  wired from existing components.
- This is a **production-grade foundation with the core flows fully wired**, not
  all ~30 kit screens. Secondary screens (onboarding, PIN/fingerprint, help,
  T&Cs, per-category detail) follow the same established patterns.
- Some libraries are pinned approximately; `npx expo install` aligns them to the
  installed Expo SDK. A TypeScript typecheck wasn't run here because deps aren't
  installed in this environment (and installing into OneDrive is undesirable).
- Once the correct Supabase project is linked, run
  `supabase gen types typescript` to replace the hand-authored
  `src/types/database.ts` 1:1.
# neta
