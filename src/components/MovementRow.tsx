import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, font } from '@/theme/tokens';
import { CategoryIcon } from './CategoryIcon';
import { direction, formatMoney } from '@/lib/money';
import type { MovementWithCategory } from '@/types/database';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** A single transaction row: icon · concept + date · category · signed amount. */
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
        size={48}
      />
      <View style={styles.middle}>
        <Text style={styles.concept} numberOfLines={1}>
          {movement.concept || movement.category.name}
        </Text>
        <Text style={styles.date}>{formatDate(movement.date)}</Text>
      </View>
      <Text style={styles.category} numberOfLines={1}>
        {movement.category.name}
      </Text>
      <Text style={[styles.amount, { color: amountColor }]}>
        {sign}
        {formatMoney(movement.amount, currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  middle: { flex: 1.2, gap: 3 },
  concept: { fontSize: font.size.md, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  date: { fontSize: font.size.xs, fontWeight: font.weight.semibold as any, color: colors.accentBlue },
  category: { flex: 0.9, fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center' },
  amount: { fontSize: font.size.md, fontWeight: font.weight.bold as any, minWidth: 84, textAlign: 'right' },
});
