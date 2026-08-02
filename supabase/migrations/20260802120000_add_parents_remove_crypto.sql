-- =============================================================================
-- 20260802120000_add_parents_remove_crypto.sql
-- Add "Parents" as a global income category, remove "DCA Crypto".
-- =============================================================================

-- Add "Parents" as a global default category (income_variable)
INSERT INTO public.categories (name, type, icon, color)
VALUES ('Parents', 'income_variable', 'people', '#2FD98A');

-- Remove "DCA Crypto" from global defaults (user_id IS NULL = global)
DELETE FROM public.categories
WHERE name = 'DCA Crypto'
  AND user_id IS NULL;
