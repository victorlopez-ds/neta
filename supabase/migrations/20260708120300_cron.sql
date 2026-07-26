-- =============================================================================
-- 20260708120300_cron.sql
-- Daily schedule for the recurring/DCA engine.
--
-- This calls the in-database SQL function directly, which is the most robust
-- option (no network hop, no auth juggling). If you would rather drive the
-- Edge Function instead, remove this schedule and see supabase/README.md for
-- the pg_net variant.
--
-- Note: on Supabase, pg_cron must be enabled once for the project
-- (Dashboard -> Database -> Extensions -> pg_cron). The statement below is a
-- no-op if it is already installed.
-- =============================================================================

create extension if not exists pg_cron;

-- Remove a previous definition if this migration is re-run.
select cron.unschedule('process-recurring-daily')
where exists (select 1 from cron.job where jobname = 'process-recurring-daily');

-- Every day at 03:00 UTC.
select cron.schedule(
  'process-recurring-daily',
  '0 3 * * *',
  $$ select public.process_recurring_movements(); $$
);
