# Supabase backend

Complete, framework-independent backend for the finance app: schema, RLS,
dashboard aggregate views, the recurring/DCA engine, and the daily schedule.

## Files

| File | What it does |
|------|--------------|
| `migrations/20260708120000_init_schema.sql` | Enums, 5 tables, indexes, seeded global categories |
| `migrations/20260708120100_rls_policies.sql` | RLS on every table + auto-provision profile on sign-up |
| `migrations/20260708120200_views_functions.sql` | Dashboard views, `process_recurring_movements()`, `fund_goal()` |
| `migrations/20260708120300_cron.sql` | Daily `pg_cron` job that runs the recurring engine |
| `functions/run-recurring/index.ts` | Optional HTTP trigger for the same engine |

## Data model in one paragraph

`amount` is always a **positive magnitude**; a movement's direction (income /
expense / investment) is derived from its `category.type` using the 5-tier
enum. Investments are tracked as a distinct type so financial-health math never
treats DCA as a dead-weight expense. `movements.tags` is a `text[]` (GIN
indexed) for the free-form tag system. `categories` with `user_id IS NULL` are
global defaults; a user can add their own. Every user-owned row defaults
`user_id` to `auth.uid()`, and RLS enforces `user_id = auth.uid()` on read and
write, so the client never sees another user's data.

## Reads the dashboard should use

Instead of pulling every row, the client reads small pre-aggregated rows:

- `v_monthly_summary`  — income / expense-by-tier / investment totals per month
- `v_monthly_health`   — adds `net_balance` and `savings_rate`
- `v_category_breakdown` — per-type totals for the expense pie chart

All three are `security_invoker` views, so RLS still applies per user.

## Applying it

**Option A — Supabase CLI (recommended for local-first dev):**
```bash
supabase init            # only if this folder isn't a Supabase project yet
supabase link --project-ref <your-ref>
supabase db push         # applies the migrations in order
supabase functions deploy run-recurring   # optional
```

**Option B — MCP / SQL editor:** run each migration file's contents in order in
the SQL editor. Enable the `pg_cron` and `pgcrypto` extensions first
(Dashboard → Database → Extensions) if they aren't already.

## Recurring / DCA engine

The engine is the SQL function `process_recurring_movements(p_today date)`. It
is idempotent per period — a monthly template yields at most one movement per
calendar month — so running it daily (or several times a day) is safe.

- **Monthly**: fires on `billing_day` (clamped to the month length, so 31 →
  28/29/30), once per month.
- **Yearly**: `billing_day` is a day-of-year offset, once per year.
- **Weekly**: fires once every 7 days.

Scheduling choices:

1. **pg_cron → SQL (default).** Already wired in `20260708120300_cron.sql`.
2. **Edge Function.** Deploy `run-recurring` and either hit it from an external
   scheduler or from pg_cron via `pg_net`:
   ```sql
   select cron.schedule('run-recurring-http', '0 3 * * *', $$
     select net.http_post(
       url     := 'https://<ref>.supabase.co/functions/v1/run-recurring',
       headers := jsonb_build_object('Authorization', 'Bearer ' || '<service-role-key>')
     );
   $$);
   ```
3. **Client-boot fallback.** Call the `run-recurring` function (or the RPC) once
   when the app launches, so entries appear even if a scheduled run was missed.

## Goal funding

`fund_goal(p_goal_id uuid, p_amount numeric)` atomically increments
`current_amount` and flips `status` to `achieved` when the target is reached.
It runs as the caller, so RLS applies. Call it from the client as
`supabase.rpc('fund_goal', { p_goal_id, p_amount })`.
