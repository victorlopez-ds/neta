import {
  type CategoryType,
  type MovementWithCategory,
  INCOME_TYPES,
  EXPENSE_TYPES,
} from '@/types/database';

/** Direction a movement moves the balance, derived from its category type. */
export function direction(type: CategoryType): 'income' | 'expense' | 'investment' {
  if (INCOME_TYPES.includes(type)) return 'income';
  if (type === 'investment') return 'investment';
  return 'expense';
}

export function isIncome(type: CategoryType) {
  return INCOME_TYPES.includes(type);
}
export function isExpense(type: CategoryType) {
  return EXPENSE_TYPES.includes(type);
}

/** e.g. formatMoney(1187.4, 'EUR') -> "€1,187.40" */
export function formatMoney(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Signed display string: income "+€x", expense "−€x", investment "€x". */
export function signedMoney(
  amount: number,
  type: CategoryType,
  currency = 'EUR',
): string {
  const base = formatMoney(amount, currency);
  const dir = direction(type);
  if (dir === 'expense') return `−${base}`;
  if (dir === 'income') return `+${base}`;
  return base;
}

export interface MonthTotals {
  income: number;
  essential: number;
  personal: number;
  leisure: number;
  freelance: number;
  expenses: number; // essential + personal + leisure + freelance (investment excluded)
  investment: number;
  net: number; // income - expenses
  savingsRate: number; // (income - expenses) / income * 100, investment counts as savings
}

/**
 * Mirror of v_monthly_health, computed client-side so optimistic updates can
 * move the dashboard in lock-step with a new movement without a round-trip.
 * MUST stay consistent with supabase/migrations/..._views_functions.sql.
 */
export function computeTotals(movements: MovementWithCategory[]): MonthTotals {
  let income = 0,
    essential = 0,
    personal = 0,
    leisure = 0,
    freelance = 0,
    investment = 0;

  for (const m of movements) {
    switch (m.category.type) {
      case 'income_fixed':
      case 'income_variable':
        income += m.amount;
        break;
      case 'expense_essential':
        essential += m.amount;
        break;
      case 'expense_personal':
        personal += m.amount;
        break;
      case 'expense_leisure':
        leisure += m.amount;
        break;
      case 'expense_freelance':
        freelance += m.amount;
        break;
      case 'investment':
        investment += m.amount;
        break;
    }
  }

  const expenses = essential + personal + leisure + freelance;
  const net = income - expenses;
  const savingsRate = income === 0 ? 0 : Math.round((net / income) * 1000) / 10;

  return { income, essential, personal, leisure, freelance, expenses, investment, net, savingsRate };
}

export function monthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
