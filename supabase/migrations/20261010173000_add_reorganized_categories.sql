-- =============================================================================
-- 20261010173000_add_reorganized_categories.sql
-- Adds dedicated categories for Personal Growth (gym/sports/books), Café,
-- Self Care (haircut/skincare), and Family & Gifts.
-- =============================================================================

INSERT INTO public.categories (name, type, icon, color) VALUES
  ('Café',             'expense_leisure',  'cafe',    '#FF7A00'),
  ('Personal Growth',  'expense_personal', 'fitness', '#7A5CFF'),
  ('Self Care',        'expense_personal', 'cut',     '#7A5CFF'),
  ('Family & Gifts',   'expense_personal', 'gift',    '#7A5CFF');
