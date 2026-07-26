import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, font } from '@/theme/tokens';

/**
 * Burn-rate bar from the mockups: a dark pill filling a light track, with the
 * percentage on the fill and the limit on the right. Colour shifts
 * green -> yellow -> red as spending approaches the monthly limit.
 */
export function ProgressBar({
  percent,
  rightLabel,
  onSheet = false,
}: {
  percent: number; // 0..1+
  rightLabel?: string;
  onSheet?: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, percent));
  const pct = Math.round(percent * 100);

  const fillColor =
    percent >= 1 ? colors.danger : percent >= 0.8 ? colors.warning : colors.black;

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: onSheet ? colors.trackOnSheet : colors.track },
      ]}
    >
      <View
        style={[
          styles.fill,
          { width: `${Math.max(clamped * 100, 14)}%`, backgroundColor: fillColor },
        ]}
      >
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      {rightLabel ? <Text style={styles.right}>{rightLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 34,
    borderRadius: radius.pill,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    justifyContent: 'center',
    paddingHorizontal: 14,
    minWidth: 56,
  },
  pct: {
    color: colors.white,
    fontWeight: font.weight.bold as any,
    fontSize: font.size.sm,
  },
  right: {
    position: 'absolute',
    right: 16,
    color: colors.textPrimary,
    fontStyle: 'italic',
    fontWeight: font.weight.semibold as any,
    fontSize: font.size.sm,
  },
});
