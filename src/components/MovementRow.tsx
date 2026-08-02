import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, font } from '@/theme/tokens';
import { CategoryIcon } from './CategoryIcon';
import { direction, formatMoney } from '@/lib/money';
import type { MovementWithCategory } from '@/types/database';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** A single transaction row: icon · concept + category + date · signed amount. */
export function MovementRow({
  movement,
  currency = 'EUR',
  onPress,
}: {
  movement: MovementWithCategory;
  currency?: string;
  onPress?: () => void;
}) {
  const dir = direction(movement.category.type);
  const amountColor =
    dir === 'income' ? colors.textPrimary : dir === 'investment' ? colors.brand : colors.accentBlue;
  const sign = dir === 'expense' ? '−' : dir === 'income' ? '+' : '';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <CategoryIcon
        icon={movement.category.icon}
        color={movement.category.color}
        type={movement.category.type}
        size={42}
      />
      <View style={styles.middle}>
        <Text style={styles.concept} numberOfLines={1}>
          {movement.concept || movement.category.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {movement.category.name} · {formatDate(movement.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {sign}
        {formatMoney(movement.amount, currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, gap: spacing.sm + 2 },
  middle: { flex: 1, gap: 2 },
  concept: { fontSize: font.size.md, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  meta: { fontSize: font.size.xs, fontWeight: font.weight.medium as any, color: colors.textMuted },
  amount: { fontSize: font.size.md, fontWeight: font.weight.bold as any, minWidth: 70, textAlign: 'right' },
});
