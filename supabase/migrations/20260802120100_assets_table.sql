-- =============================================================================
-- 20260802120100_assets_table.sql
-- Table for tracking owned investment assets (funds, bonds, ETFs, etc.)
-- =============================================================================

create type public.asset_type as enum ('fund', 'bond', 'etf', 'other');

create table public.assets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid          not null default auth.uid() references public.profiles (id) on delete cascade,
  name           text          not null,
  asset_type     public.asset_type not null default 'fund',
  current_value  numeric(14,2) not null default 0 check (current_value >= 0),
  created_at     timestamptz   not null default now()
);

create index assets_user_idx on public.assets (user_id);

-- RLS
alter table public.assets enable row level security;

create policy "Users can read own assets"
  on public.assets for select
  using (auth.uid() = user_id);

create policy "Users can insert own assets"
  on public.assets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own assets"
  on public.assets for update
  using (auth.uid() = user_id);

create policy "Users can delete own assets"
  on public.assets for delete
  using (auth.uid() = user_id);
