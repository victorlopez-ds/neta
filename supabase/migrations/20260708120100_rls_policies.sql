-- =============================================================================
-- 20260708120100_rls_policies.sql
-- Row-Level Security. Every table is locked to `auth.uid()`. Global default
-- categories (user_id IS NULL) are readable by everyone but writable by no one.
-- =============================================================================

-- ---------- Auto-provision a profile row on sign-up --------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Enable RLS -------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.movements           enable row level security;
alter table public.recurring_templates enable row level security;
alter table public.financial_goals     enable row level security;

-- ---------- profiles ---------------------------------------------------------
-- Insert is handled by the trigger; there is deliberately no DELETE policy
-- (a profile is removed only when the underlying auth.users row is deleted).
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- categories -------------------------------------------------------
-- Read: global defaults + your own custom categories. Write: your own only.
create policy "categories_select" on public.categories
  for select using (user_id is null or user_id = auth.uid());

create policy "categories_insert_own" on public.categories
  for insert with check (user_id = auth.uid());

create policy "categories_update_own" on public.categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "categories_delete_own" on public.categories
  for delete using (user_id = auth.uid());

-- ---------- movements / recurring_templates / financial_goals ----------------
-- Full CRUD, strictly scoped to the owner.
create policy "movements_all_own" on public.movements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "recurring_all_own" on public.recurring_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "goals_all_own" on public.financial_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
