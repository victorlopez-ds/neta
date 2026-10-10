import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font, radius } from '@/theme/tokens';

/** Format "2026-08" → "August 2026" */
function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Move a "YYYY-MM" key by `delta` months (-1 = prev, +1 = next). */
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}


/**
 * ◀  August 2026  ▶
 *
 * Arrow-based month navigator.
 */
export function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable onPress={() => onChange(shiftMonth(month, -1))} hitSlop={12} style={styles.arrow}>
        <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
      </Pressable>

      <Text style={styles.label}>{formatMonth(month)}</Text>

      <Pressable
        onPress={() => onChange(shiftMonth(month, 1))}
        hitSlop={12}
        style={styles.arrow}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandTintBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold as any,
    color: colors.textPrimary,
  },
});
