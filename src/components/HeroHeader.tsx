import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { formatMoney } from '@/lib/money';
import { ProgressBar } from './ProgressBar';

/**
 * The emerald hero used across Home / Transaction / Analysis / Savings. Shows
 * total balance, total expense, and the burn-rate bar vs the monthly limit.
 */
export function HeroHeader({
  title,
  subtitle,
  balance,
  expense,
  limit,
  currency = 'EUR',
  onBell,
  onBack,
}: {
  title: string;
  subtitle?: string;
  balance: number;
  expense: number;
  limit: number;
  currency?: string;
  onBell?: () => void;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const percent = limit > 0 ? expense / limit : 0;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        )}
        {onBack ? <Text style={styles.centerTitle}>{title}</Text> : null}
        <Pressable onPress={onBell} hitSlop={12} style={styles.bell}>
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.amountsRow}>
        <View style={styles.amountCol}>
          <View style={styles.labelRow}>
            <Ionicons name="arrow-up" size={13} color={colors.white} />
            <Text style={styles.amountLabel}>Total Balance</Text>
          </View>
          <Text style={styles.balance}>{formatMoney(balance, currency)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.amountCol}>
          <View style={styles.labelRow}>
            <Ionicons name="arrow-down" size={13} color={colors.white} />
            <Text style={styles.amountLabel}>Total Expense</Text>
          </View>
          <Text style={styles.expense}>−{formatMoney(expense, currency)}</Text>
        </View>
      </View>

      <ProgressBar percent={percent} rightLabel={formatMoney(limit, currency)} />
      <Text style={styles.hint}>
        {percent < 0.8
          ? `${Math.round(percent * 100)}% of your limit. Looks good.`
          : percent < 1
            ? `${Math.round(percent * 100)}% of your limit — ease off.`
            : `Over your monthly limit.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  iconBtn: { padding: 4 },
  title: { fontSize: font.size.xl, fontWeight: font.weight.heavy as any, color: colors.textPrimary },
  centerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: font.size.lg,
    fontWeight: font.weight.bold as any,
    color: colors.textPrimary,
  },
  subtitle: { fontSize: font.size.sm, color: colors.textPrimary, opacity: 0.75, marginTop: 2 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  amountCol: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.9 },
  amountLabel: { color: colors.white, fontSize: font.size.sm, fontWeight: font.weight.medium as any },
  balance: { color: colors.white, fontSize: font.size.xl, fontWeight: font.weight.heavy as any, marginTop: 4 },
  expense: { color: '#EAF2FF', fontSize: font.size.xl, fontWeight: font.weight.heavy as any, marginTop: 4 },
  divider: { width: 1, height: 44, backgroundColor: colors.white, opacity: 0.4, marginHorizontal: spacing.md },
  hint: { color: colors.textPrimary, opacity: 0.85, fontSize: font.size.sm, marginTop: spacing.sm },
});
