/**
 * Hand-authored to match supabase/migrations exactly. (We do NOT generate these
 * from the currently-linked project, because that project is a different app.
 * Once the finance project is linked, `supabase gen types typescript` can
 * regenerate this file 1:1.)
 */

export type CategoryType =
  | 'income_fixed'
  | 'income_variable'
  | 'expense_essential'
  | 'expense_personal'
  | 'expense_leisure'
  | 'expense_freelance'
  | 'investment';

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly';
export type GoalStatus = 'active' | 'achieved' | 'paused';

export interface Profile {
  id: string;
  display_name: string | null;
  currency: string;
  monthly_budget_limit: number;
  liquid_savings: number;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: string | null; // null => global default
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Movement {
  id: string;
  user_id: string;
  category_id: number;
  concept: string;
  amount: number;
  date: string; // YYYY-MM-DD
  is_recurring: boolean;
  template_id: string | null;
  tags: string[];
  created_at: string;
}

export interface RecurringTemplate {
  id: string;
  user_id: string;
  category_id: number;
  concept: string;
  amount: number;
  frequency: RecurrenceFrequency;
  billing_day: number;
  last_executed_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
}

export type AssetType = 'fund' | 'bond' | 'etf' | 'other';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  asset_type: AssetType;
  current_value: number;
  created_at: string;
}

/** Row shape of the v_monthly_health view. */
export interface MonthlyHealth {
  user_id: string;
  month: string; // first day of month, YYYY-MM-DD
  income_total: number;
  expense_essential: number;
  expense_personal: number;
  expense_leisure: number;
  expense_freelance: number;
  expense_total: number;
  investment_total: number;
  net_balance: number;
  savings_rate: number;
}

/** Row shape of the v_category_breakdown view. */
export interface CategoryBreakdown {
  user_id: string;
  month: string;
  category_type: CategoryType;
  total: number;
}

/** Movement joined with its category (used across list screens). */
export type MovementWithCategory = Movement & { category: Category };

export const INCOME_TYPES: CategoryType[] = ['income_fixed', 'income_variable'];
export const EXPENSE_TYPES: CategoryType[] = [
  'expense_essential',
  'expense_personal',
  'expense_leisure',
  'expense_freelance',
];
