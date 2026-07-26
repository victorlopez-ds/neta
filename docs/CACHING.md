# Local-first caching strategy — Deliverable 2

Goal: **< 50 ms** screen transitions and zero loading spinners for daily CRUD.
Achieved by making the local cache the source of truth for reads and applying
every write optimistically, syncing to Supabase in the background.

## 1. Three cache tiers

1. **In-memory query cache** — what screens render this session (hot, instant).
2. **Persistent store** — survives app restarts; the app opens straight into
   real data with no network wait (WatermelonDB/Isar/SQLite/MMKV).
3. **Sync queue** — durable log of pending writes, each with a rollback
   snapshot, drained in the background.

Reads always resolve from tier 1, hydrated from tier 2 on boot. The network is
never on the critical path of a navigation or a tap.

## 2. Read path

```
Screen mount ──► read from in-memory cache ──► render immediately (<50ms)
                        │
                        └► if stale, kick a background refetch (no spinner);
                           swap in fresh data when it arrives
```

Freshness policy: aggregate views (`v_monthly_health`, `v_category_breakdown`)
and lists are `staleTime`-cached (e.g. 60 s foreground). A pull-to-refresh or a
Realtime event forces revalidation. Nothing blocks the first paint.

## 3. Write path (optimistic)

Adding a movement, funding a goal, toggling a subscription — all follow one
lifecycle:

```
1. Apply to cache NOW      → UI updates instantly (tier 1 + tier 2)
2. Enqueue the write       → append to sync queue with a rollback snapshot
3. Send to Supabase        → background, off the UI thread
4a. Success  → reconcile the server row (replace the temp id/values), drop queue item
4b. Failure  → roll back to the snapshot, re-render, show a non-blocking toast
```

Key details:

- **Temp ids:** client generates a UUID for new rows (matches `movements.id`
  default), so the optimistic row and the server row share an id — reconciliation
  is a no-op on success, and Realtime echoes don't duplicate.
- **Derived values update too:** the same mutation adjusts the cached monthly
  totals / savings rate locally using the rules in
  [ARCHITECTURE.md](./ARCHITECTURE.md#4-money--health-rules) so the dashboard
  moves in lock-step with the list — no round-trip to see the new balance.
- **Never block on the network:** step 3 is fire-and-forget from the UI's point
  of view.

## 4. Offline & reconnection

- Writes made offline stay in the sync queue and flush automatically when
  connectivity returns (connectivity listener → drain queue in FIFO order).
- Reads keep serving the persistent store, so the app is fully usable offline.
- On reconnect: drain queue → then revalidate the affected months.

## 5. Conflict handling

Single-user-owned data keeps conflicts rare. Policy:

- **Last-write-wins** on scalar edits (goal amount, profile settings) using the
  server row returned by PostgREST as the truth after a successful write.
- **Additive operations use RPCs** (`fund_goal`) so concurrent funding from two
  devices sums correctly instead of clobbering.
- Realtime subscriptions (optional) merge remote inserts/updates into the cache
  so a second device stays live.

## 6. The recurring engine and the cache

The DCA/subscription engine inserts rows server-side (pg_cron). The client picks
them up via a lightweight revalidation on app boot (and/or Realtime), then they
render like any other movement. A client-boot call to `run-recurring` is the
catch-up path if a scheduled run was missed — see the
[backend README](../supabase/README.md#recurring--dca-engine).

## 7. What this buys us against the PRD targets

| PRD requirement | How this design meets it |
|---|---|
| < 50 ms transitions | Reads are synchronous from in-memory cache |
| No loading spinners on CRUD | Optimistic writes; network is background |
| Offline-first | Persistent store + durable sync queue |
| Auto-sync on reconnect | Connectivity listener drains the queue |
| Rollback on failure | Per-write snapshot + non-blocking toast |
