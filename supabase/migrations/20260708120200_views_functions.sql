-- =============================================================================
-- 20260708120200_views_functions.sql
-- Server-side aggregates for the dashboard (tiny payloads the client can cache),
-- the recurring/DCA engine, and the goal-funding primitive.
--
-- All views use `security_invoker = true` so the underlying table RLS applies to
-- the querying user (without it, a view would run with the owner's rights and
-- leak other users' rows).
-- =============================================================================

-- ---------- Monthly summary (one row per user per active month) --------------
create or replace view public.v_monthly_summary
with (security_invoker = true) as
select
  m.user_id,
  date_trunc('month', m.date)::date as month,
  coalesce(sum(m.amount) filter (where c.type in ('income_fixed','income_variable')), 0)              as income_total,
  coalesce(sum(m.amount) filter (where c.type = 'expense_essential'), 0)                              as expense_essential,
  coalesce(sum(m.amount) filter (where c.type = 'expense_personal'), 0)                               as expense_personal,
  coalesce(sum(m.amount) filter (where c.type = 'expense_leisure'), 0)                                as expense_leisure,
  coalesce(sum(m.amount) filter (where c.type in
           ('expense_essential','expense_personal','expense_leisure')), 0)                           as expense_total,
  coalesce(sum(m.amount) filter (where c.type = 'investment'), 0)                                     as investment_total
from public.movements m
join public.categories c on c.id = m.category_id
group by m.user_id, date_trunc('month', m.date);

-- ---------- Monthly health (net balance + savings rate) ----------------------
-- Investments are NOT counted as an expense, so they naturally raise the
-- savings rate, exactly as the PRD's financial-health note requires.
create or replace view public.v_monthly_health
with (security_invoker = true) as
select
  s.user_id,
  s.month,
  s.income_total,
  s.expense_essential,
  s.expense_personal,
  s.expense_leisure,
  s.expense_total,
  s.investment_total,
  s.income_total - s.expense_total as net_balance,
  case
    when s.income_total = 0 then 0
    else round((s.income_total - s.expense_total) / s.income_total * 100, 1)
  end as savings_rate
from public.v_monthly_summary s;

-- ---------- Category-type breakdown (for the expense pie chart) --------------
create or replace view public.v_category_breakdown
with (security_invoker = true) as
select
  m.user_id,
  date_trunc('month', m.date)::date as month,
  c.type                            as category_type,
  sum(m.amount)                     as total
from public.movements m
join public.categories c on c.id = m.category_id
group by m.user_id, date_trunc('month', m.date), c.type;

-- ---------- Recurring / DCA engine -------------------------------------------
-- Instantiates due templates into `movements`. Idempotent per period: a monthly
-- template can only produce one movement per calendar month, etc. Runs with
-- definer rights so pg_cron (or the edge function) can process every user.
create or replace function public.process_recurring_movements(p_today date default current_date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  t              record;
  v_target_day   int;
  v_due_date     date;
  v_period_start date;
  v_count        int := 0;
begin
  for t in select * from public.recurring_templates where is_active loop

    if t.frequency = 'monthly' then
      v_period_start := date_trunc('month', p_today)::date;
      -- clamp billing_day to the number of days in the current month (e.g. 31 -> 28/29/30)
      v_target_day   := least(
                          t.billing_day,
                          extract(day from (v_period_start + interval '1 month - 1 day'))::int
                        );
      v_due_date     := v_period_start + (v_target_day - 1);

    elsif t.frequency = 'yearly' then
      v_period_start := date_trunc('year', p_today)::date;
      -- billing_day interpreted as a day-of-year offset, clamped inside the year
      v_due_date     := least(
                          v_period_start + (t.billing_day - 1),
                          (v_period_start + interval '1 year - 1 day')::date
                        );

    else  -- weekly: fires once every 7 days
      v_period_start := p_today;   -- unused for weekly; guarded below
      v_due_date     := p_today;
    end if;

    -- Skip rules -------------------------------------------------------------
    if t.frequency = 'weekly' then
      if t.last_executed_date is not null and t.last_executed_date > p_today - 7 then
        continue;                                   -- ran within the last 7 days
      end if;
    else
      if p_today < v_due_date then
        continue;                                   -- billing day not reached yet
      end if;
      if t.last_executed_date is not null and t.last_executed_date >= v_period_start then
        continue;                                   -- already generated this period
      end if;
    end if;

    -- Materialise the movement ----------------------------------------------
    insert into public.movements
      (user_id, category_id, concept, amount, date, is_recurring, template_id)
    values
      (t.user_id, t.category_id, t.concept, t.amount, v_due_date, true, t.id);

    update public.recurring_templates
       set last_executed_date = p_today
     where id = t.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------- Goal funding primitive -------------------------------------------
-- Atomically move money into a goal and flip it to 'achieved' when the target is
-- reached. Runs as the caller (security invoker) so RLS + the explicit user_id
-- check both apply.
create or replace function public.fund_goal(p_goal_id uuid, p_amount numeric)
returns public.financial_goals
language plpgsql
as $$
declare
  g public.financial_goals;
begin
  if p_amount <= 0 then
    raise exception 'Funding amount must be positive';
  end if;

  update public.financial_goals
     set current_amount = current_amount + p_amount,
         status = case
                    when current_amount + p_amount >= target_amount then 'achieved'::public.goal_status
                    else status
                  end
   where id = p_goal_id
     and user_id = auth.uid()
  returning * into g;

  if g.id is null then
    raise exception 'Goal not found or not owned by caller';
  end if;

  return g;
end;
$$;
