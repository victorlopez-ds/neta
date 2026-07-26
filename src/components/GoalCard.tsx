import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font, radius, shadow } from '@/theme/tokens';
import { formatMoney } from '@/lib/money';
import type { FinancialGoal } from '@/types/database';

export function GoalCard({
  goal,
  currency = 'EUR',
  onFund,
}: {
  goal: FinancialGoal;
  currency?: string;
  onFund?: () => void;
}) {
  const progress = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
  const pct = Math.min(100, Math.round(progress * 100));
  const achieved = goal.status === 'achieved' || progress >= 1;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, achieved && { backgroundColor: colors.brand }]}>
          <Ionicons
            name={achieved ? 'checkmark' : 'flag'}
            size={22}
            color={colors.white}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{goal.title}</Text>
          <Text style={styles.sub}>
            {formatMoney(goal.current_amount, currency)} of {formatMoney(goal.target_amount, currency)}
          </Text>
        </View>
        <Text style={styles.pct}>{pct}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(pct, 3)}%` }]} />
      </View>

      {!achieved && onFund ? (
        <Pressable style={styles.fundBtn} onPress={onFund}>
          <Ionicons name="add" size={16} color={colors.brand} />
          <Text style={styles.fundText}>Add funds</Text>
        </Pressable>
      ) : achieved ? (
        <Text style={styles.done}>Goal reached 🎉</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: font.size.md, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  sub: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  pct: { fontSize: font.size.lg, fontWeight: font.weight.heavy as any, color: colors.brand },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.brandTintBg, overflow: 'hidden' },
  fill: { height: 10, borderRadius: radius.pill, backgroundColor: colors.brand },
  fundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTintBg,
  },
  fundText: { color: colors.brand, fontWeight: font.weight.bold as any, fontSize: font.size.sm },
  done: { marginTop: spacing.md, textAlign: 'center', color: colors.brand, fontWeight: font.weight.semibold as any },
});
