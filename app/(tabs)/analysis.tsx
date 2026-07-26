import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { HeroHeader } from '@/components/HeroHeader';
import { IncomeExpenseBars, type BarDatum } from '@/components/charts/IncomeExpenseBars';
import { ExpensePie, type PieSegment } from '@/components/charts/ExpensePie';
import { useHealthSeries, useCategoryBreakdown, useMonthlyHealth } from '@/data/dashboard';
import { useMovements } from '@/data/movements';
import { useProfile } from '@/data/profile';
import { computeTotals, formatMoney, monthKey } from '@/lib/money';
import { EXPENSE_TYPES } from '@/types/database';
import { colors, spacing, font, radius } from '@/theme/tokens';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analysis() {
  const month = monthKey(new Date());
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? 'EUR';

  const { data: series = [] } = useHealthSeries(6);
  const { data: breakdown = [] } = useCategoryBreakdown(month);
  const { data: health } = useMonthlyHealth(month);
  const { data: movements = [] } = useMovements(month);

  // Fall back to the movements cache so numbers stay live during optimistic writes.
  const totals = useMemo(() => computeTotals(movements), [movements]);

  const bars: BarDatum[] = useMemo(
    () =>
      series.map((s) => ({
        label: MONTHS[new Date(s.month).getMonth()],
        income: s.income_total,
        expense: s.expense_total,
      })),
    [series],
  );

  const pie: PieSegment[] = useMemo(
    () =>
      breakdown
        .filter((b) => EXPENSE_TYPES.includes(b.category_type))
        .map((b) => ({ type: b.category_type, total: b.total })),
    [breakdown],
  );

  const incomeYtd = series.reduce((s, r) => s + r.income_total, 0) || totals.income;
  const expenseYtd = series.reduce((s, r) => s + r.expense_total, 0) || totals.expenses;

  return (
    <View style={styles.screen}>
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 120 }}>
        <HeroHeader
          title="Analysis"
          balance={health?.net_balance ?? totals.net}
          expense={totals.expenses}
          limit={profile?.monthly_budget_limit || Math.max(totals.expenses * 1.4, 1000)}
          currency={currency}
        />

        <View style={styles.sheet}>
          <Text style={styles.h2}>Income & Expenses</Text>
          <IncomeExpenseBars data={bars.length ? bars : [{ label: MONTHS[new Date().getMonth()], income: totals.income, expense: totals.expenses }]} />

          <View style={styles.totalsRow}>
            <View style={styles.totalCol}>
              <Text style={styles.totalLabel}>Income</Text>
              <Text style={styles.totalIncome}>{formatMoney(incomeYtd, currency)}</Text>
            </View>
            <View style={styles.totalCol}>
              <Text style={styles.totalLabel}>Expense</Text>
              <Text style={styles.totalExpense}>{formatMoney(expenseYtd, currency)}</Text>
            </View>
          </View>

          <Text style={styles.h2}>Where it goes</Text>
          <ExpensePie segments={pie} currency={currency} />

          <View style={styles.healthCard}>
            <Text style={styles.healthLabel}>Financial health · savings rate</Text>
            <Text style={styles.healthValue}>{(health?.savings_rate ?? totals.savingsRate)}%</Text>
            <Text style={styles.healthNote}>Investments (DCA) count as savings, not spending.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand },
  sheet: {
    backgroundColor: colors.brandTintBg,
    borderTopLeftRadius: radius.lg + 10,
    borderTopRightRadius: radius.lg + 10,
    marginTop: -spacing.xl,
    padding: spacing.xl,
    minHeight: 700,
    gap: spacing.md,
  },
  h2: { fontSize: font.size.lg, fontWeight: font.weight.heavy as any, color: colors.textPrimary, marginTop: spacing.sm },
  totalsRow: { flexDirection: 'row', gap: spacing.lg },
  totalCol: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing.lg },
  totalLabel: { color: colors.textMuted, fontSize: font.size.sm, fontWeight: font.weight.semibold as any },
  totalIncome: { color: colors.textPrimary, fontSize: font.size.lg, fontWeight: font.weight.heavy as any, marginTop: 4 },
  totalExpense: { color: colors.accentBlue, fontSize: font.size.lg, fontWeight: font.weight.heavy as any, marginTop: 4 },
  healthCard: { backgroundColor: colors.brand, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm },
  healthLabel: { color: colors.white, opacity: 0.9, fontSize: font.size.sm, fontWeight: font.weight.medium as any },
  healthValue: { color: colors.white, fontSize: font.size.xxl, fontWeight: font.weight.heavy as any, marginTop: 4 },
  healthNote: { color: colors.white, opacity: 0.85, fontSize: font.size.xs, marginTop: 4 },
});
