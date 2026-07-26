/**
 * Design tokens extracted from the UI-kit mockups (emerald hero header, blue
 * expense accents, mint content sheet, gradient category icons). Every screen
 * and component pulls from here so the app reads as one system.
 */
import type { CategoryType } from '@/types/database';

export const colors = {
  // Brand
  brand: '#00C566',
  brandDark: '#009E52',
  brandTintBg: '#EAF9F0', // mint content-sheet background
  brandSoft: '#CFF3DE',

  // Accents
  accentBlue: '#2F6BFF',
  iconBlueFrom: '#7FA8F5',
  iconBlueTo: '#2F6BFF',

  // Neutrals
  surface: '#FFFFFF',
  textPrimary: '#0B1B2B',
  textMuted: '#6B7A8D',
  track: '#FFFFFF',
  trackOnSheet: '#DCEFE4',
  border: '#E4EEE8',

  // Status
  danger: '#FF4D4F',
  warning: '#FFB020',
  success: '#00C566',

  white: '#FFFFFF',
  black: '#0B1B2B',
} as const;

/** One canonical colour per 5-tier category type (+ investment). */
export const tierColor: Record<CategoryType, string> = {
  income_fixed: '#00C566',
  income_variable: '#2FD98A',
  expense_essential: '#2F6BFF',
  expense_personal: '#7A5CFF',
  expense_leisure: '#FF7A00',
  investment: '#0FBE7C',
};

export const tierLabel: Record<CategoryType, string> = {
  income_fixed: 'Fixed income',
  income_variable: 'Variable income',
  expense_essential: 'Essential',
  expense_personal: 'Personal',
  expense_leisure: 'Leisure',
  investment: 'Investment',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const font = {
  size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 26, xxl: 34 },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0B1B2B',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
} as const;
