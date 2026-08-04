-- =============================================================================
-- 20260804120100_update_views_freelance.sql
-- Recreate the monthly summary and health views to include expense_freelance
-- as a separate column and count it towards expense_total.
-- =============================================================================

-- Drop existing views in cascade order so we can change column layout
DROP VIEW IF EXISTS public.v_monthly_health;
DROP VIEW IF EXISTS public.v_monthly_summary;

-- ---------- Monthly summary --------------------------------------------------
CREATE VIEW public.v_monthly_summary
WITH (security_invoker = true) AS
SELECT
  m.user_id,
  date_trunc('month', m.date)::date AS month,
  coalesce(sum(m.amount) FILTER (WHERE c.type IN ('income_fixed','income_variable')), 0)   AS income_total,
  coalesce(sum(m.amount) FILTER (WHERE c.type = 'expense_essential'), 0)                   AS expense_essential,
  coalesce(sum(m.amount) FILTER (WHERE c.type = 'expense_personal'), 0)                    AS expense_personal,
  coalesce(sum(m.amount) FILTER (WHERE c.type = 'expense_leisure'), 0)                     AS expense_leisure,
  coalesce(sum(m.amount) FILTER (WHERE c.type = 'expense_freelance'), 0)                   AS expense_freelance,
  coalesce(sum(m.amount) FILTER (WHERE c.type IN
           ('expense_essential','expense_personal','expense_leisure','expense_freelance')), 0) AS expense_total,
  coalesce(sum(m.amount) FILTER (WHERE c.type = 'investment'), 0)                          AS investment_total
FROM public.movements m
JOIN public.categories c ON c.id = m.category_id
GROUP BY m.user_id, date_trunc('month', m.date);

-- ---------- Monthly health ---------------------------------------------------
CREATE OR REPLACE VIEW public.v_monthly_health
WITH (security_invoker = true) AS
SELECT
  s.user_id,
  s.month,
  s.income_total,
  s.expense_essential,
  s.expense_personal,
  s.expense_leisure,
  s.expense_freelance,
  s.expense_total,
  s.investment_total,
  s.income_total - s.expense_total AS net_balance,
  CASE
    WHEN s.income_total = 0 THEN 0
    ELSE round((s.income_total - s.expense_total) / s.income_total * 100, 1)
  END AS savings_rate
FROM public.v_monthly_summary s;
