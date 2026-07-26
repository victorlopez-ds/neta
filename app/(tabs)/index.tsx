import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeroHeader } from '@/components/HeroHeader';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { MovementRow } from '@/components/MovementRow';
import { useMovements } from '@/data/movements';
import { useProfile } from '@/data/profile';
import { computeTotals, formatMoney, monthKey, todayISO } from '@/lib/money';
import { colors, spacing, font, radius, shadow } from '@/theme/tokens';

type Period = 'daily' | 'weekly' | 'monthly';

export default function Home() {
  const router = useRouter();
  const month = monthKey(new Date());
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? 'EUR';
  const { data: movements = [], isRefetching, refetch } = useMovements(month);
  const [period, setPeriod] = useState<Period>('monthly');

  // Derive hero figures from the movements cache so an optimistic add moves the
  // dashboard in the same frame (docs/CACHING.md §3).
  const totals = useMemo(() => computeTotals(movements), [movements]);

  const visible = useMemo(() => {
    if (period === 'monthly') return movements;
    const today = todayISO();
    if (period === 'daily') return movements.filter((m) => m.date === today);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const cut = weekAgo.toISOString().slice(0, 10);
    return movements.filter((m) => m.date >= cut);
  }, [movements, period]);

  const limit = profile?.monthly_budget_limit && profile.monthly_budget_limit > 0
    ? profile.monthly_budget_limit
    : Math.max(totals.expenses * 1.4, 1000);

  return (
    <View style={styles.screen}>
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.white} />}
      >
        <HeroHeader
          title="Hi, Welcome Back"
          subtitle={profile?.display_name ? `Good to see you, ${profile.display_name}` : 'Good morning'}
          balance={totals.net}
          expense={totals.expenses}
          limit={limit}
          currency={currency}
          onBell={() => {}}
        />

        <View style={styles.sheet}>
          {/* Highlight card: DCA/investment + savings rate — the metrics the kit's
              generic "revenue/food" card doesn't cover. */}
          <View style={styles.statCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Invested (DCA)</Text>
              <Text style={styles.statValue}>{formatMoney(totals.investment, currency)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Savings rate</Text>
              <Text style={[styles.statValue, { color: totals.savingsRate >= 20 ? colors.brand : colors.accentBlue }]}>
                {totals.savingsRate}%
              </Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <SegmentedTabs
              value={period}
              onChange={setPeriod}
              options={[
                { key: 'daily', label: 'Daily' },
                { key: 'weekly', label: 'Weekly' },
                { key: 'monthly', label: 'Monthly' },
              ]}
            />
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <Pressable onPress={() => router.push('/recurring')} style={styles.subsLink}>
              <Ionicons name="repeat" size={16} color={colors.brand} />
              <Text style={styles.subsText}>Subscriptions & DCA</Text>
            </Pressable>
          </View>

          {visible.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={34} color={colors.textMuted} />
              <Text style={styles.emptyText}>No movements yet. Tap ＋ to add one.</Text>
            </View>
          ) : (
            visible.map((m) => (
              <MovementRow key={m.id} movement={m} currency={currency} />
            ))
          )}
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    minHeight: 600,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  statCol: { flex: 1 },
  statLabel: { color: colors.white, opacity: 0.9, fontSize: font.size.sm, fontWeight: font.weight.medium as any },
  statValue: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.heavy as any, marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.white, opacity: 0.4, marginHorizontal: spacing.md },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.xs },
  sectionTitle: { fontSize: font.size.lg, fontWeight: font.weight.heavy as any, color: colors.textPrimary },
  subsLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subsText: { color: colors.brand, fontWeight: font.weight.bold as any, fontSize: font.size.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: font.size.sm },
});
