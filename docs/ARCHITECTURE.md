# Architecture — Deliverable 1

How the UI-kit screens map onto frontend state and the Supabase backend. This
document is framework-independent; the concrete library names in the last
section swap per chosen stack without changing the architecture.

## 1. Layers

```
┌───────────────────────────────────────────────────────────────┐
│  UI / Screens        (rebuilt from the PNG mockups)            │  reads cache, dispatches intents
├───────────────────────────────────────────────────────────────┤
│  View-model / hooks  (per screen: Home, Analysis, Add, Goals)  │  selectors + optimistic mutations
├───────────────────────────────────────────────────────────────┤
│  Repository          (movements, categories, recurring, goals) │  one API per domain entity
├───────────────────────────────────────────────────────────────┤
│  Local cache (source of truth for reads)  │  Sync queue (writes)│  offline-first
├───────────────────────────────────────────────────────────────┤
│  Supabase client (PostgREST + Auth + Realtime)                 │  auth.uid() injected by RLS
└───────────────────────────────────────────────────────────────┘
```

The UI **never** talks to Supabase directly. It reads from the local cache and
emits intents ("add movement", "fund goal"); the repository applies them to the
cache immediately (optimistic) and enqueues the network write. See
[CACHING.md](./CACHING.md) for the write lifecycle.

## 2. Screen → module → data mapping

| UI-kit screen(s) | Frontend module | Backend source | Notes |
|---|---|---|---|
| `4/9.1 Home`, `6 Account Balance` | `dashboard` | `v_monthly_health`, recent `movements` | Balance = `income_total − expense_total`; burn-rate bar vs `profiles.monthly_budget_limit` |
| `9.2.x Analysis` (Daily/Weekly/Monthly/Yearly) | `analytics` | `v_monthly_summary`, `v_category_breakdown` | Grouped income/expense bars + expense pie by 5 tiers |
| `8 / 9.3 Transaction`, `5 Floating "+" Menu` | `movements` | `movements` (+ `categories`) | Quick-entry form → 5-tier category picker, Concept, Amount, Date, tags |
| `9.4.x Categories` | `categories` | `categories` | Global defaults + user-created (`New Categories` screen) |
| Subscriptions / Bills (recurring items) | `recurring` | `recurring_templates` | Feeds "Gasto Fijo Mensual"; drives the DCA/subscription engine |
| Investment / DCA (repurposed from generic list) | `investments` | `movements WHERE type='investment'` | Rendered as wealth accumulation, **excluded** from expense totals |
| `9.4.8 Savings`, goal detail cards | `goals` | `financial_goals`, `fund_goal()` RPC | Progress = `current_amount / target_amount` |
| `3.x Login/Signup/PIN/Fingerprint` | `auth` | Supabase Auth + `profiles` | Session drives `auth.uid()` for RLS |
| `9.5.x Profile/Settings` | `profile` | `profiles` | Currency, monthly budget limit, display name |

> The kit is a generic budget tracker — it has no Investment/DCA screen. We
> repurpose the transaction-list pattern for the `investment` tier and extend the
> category picker to the 5-tier model (`income_fixed`, `income_variable`,
> `expense_essential`, `expense_personal`, `expense_leisure`, `investment`).

## 3. State ownership

- **Server-derived cache** (movements, categories, templates, goals, the three
  views): owned by the repository/cache layer, keyed by entity + month. This is
  what screens render.
- **Ephemeral UI state** (active tab Daily/Weekly/Monthly, form fields, modal
  open): local component state, never persisted.
- **Session/auth**: a single auth store; on sign-out the cache for that user is
  cleared.
- **Sync queue**: durable list of pending writes with rollback snapshots.

## 4. Money & health rules (must match the backend exactly)

- `amount` stored positive; direction comes from `category.type`.
- Monthly net balance = `income_total − (essential + personal + leisure)`.
- `investment` is **not** an expense — it lifts the savings rate.
- Savings rate = `(income_total − expense_total) / income_total × 100`
  (computed by `v_monthly_health`, mirrored client-side for optimistic updates).

## 5. Security

RLS is the enforcement boundary, not the client. The Supabase session injects
`auth.uid()` into every PostgREST call; policies restrict all rows to the owner
(global categories are the only cross-user readable rows). The client filters
are for UX only — correctness lives in the database.

## 6. Concrete libraries per stack

| Concern | React Native + Expo | Flutter |
|---|---|---|
| Server cache + optimistic mutations | TanStack Query | Riverpod + `AsyncNotifier` |
| Persistent local store | WatermelonDB or MMKV+SQLite | Isar or Drift |
| Supabase client | `@supabase/supabase-js` | `supabase_flutter` |
| Navigation | Expo Router / React Navigation | go_router |
| Charts | Victory Native / `react-native-svg` | fl_chart |

The architecture above is identical for both; only these adapters differ.
