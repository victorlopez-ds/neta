-- =============================================================================
-- 20260804120000_add_expense_freelance.sql
-- Adds the expense_freelance category type for entrepreneurship/freelance
-- expenses (software, coworking, accounting, etc.).
-- =============================================================================

-- Add the new enum value to category_type
ALTER TYPE public.category_type ADD VALUE IF NOT EXISTS 'expense_freelance';

-- Commit the enum type change so the new value can be used in INSERT
COMMIT;

-- Seed default freelance categories (global defaults, user_id = NULL)
INSERT INTO public.categories (name, type, icon, color) VALUES
  ('Software',    'expense_freelance', 'laptop',    '#E8590C'),
  ('Coworking',   'expense_freelance', 'home',      '#E8590C'),
  ('Accounting',  'expense_freelance', 'receipt',   '#E8590C');
