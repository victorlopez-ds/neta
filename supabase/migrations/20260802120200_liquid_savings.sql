-- =============================================================================
-- 20260802120200_liquid_savings.sql
-- Add liquid_savings field to profiles for tracking savings account balance.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN liquid_savings numeric(14,2) NOT NULL DEFAULT 0;
