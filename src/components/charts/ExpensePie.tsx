import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, font, spacing, radius, tierColor, tierLabel } from '@/theme/tokens';
import { formatMoney } from '@/lib/money';
import type { CategoryType } from '@/types/database';

export interface PieSegment {
  type: CategoryType;
  total: number;
}

function arc(cx: number, cy: number, r: number, start: number, end: number): string {
  const a0 = (start - 90) * (Math.PI / 180);
  const a1 = (end - 90) * (Math.PI / 180);
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

/** Donut of expenses grouped by the 5 tiers (investment excluded). */
export function ExpensePie({
  segments,
  currency = 'EUR',
}: {
  segments: PieSegment[];
  currency?: string;
}) {
  const data = segments.filter((s) => s.total > 0);
  const total = data.reduce((sum, s) => sum + s.total, 0);
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  let cursor = 0;

  return (
    <View style={styles.wrap}>
      <View>
        <Svg width={size} height={size}>
          {total === 0 ? (
            <Circle cx={cx} cy={cy} r={r} fill={colors.border} />
          ) : (
            data.map((s) => {
              const sweep = (s.total / total) * 360;
              const path = arc(cx, cy, r, cursor, cursor + sweep);
              cursor += sweep;
              return <Path key={s.type} d={path} fill={tierColor[s.type]} />;
            })
          )}
          {/* donut hole */}
          <Circle cx={cx} cy={cy} r={r * 0.58} fill={colors.brandTintBg} />
        </Svg>
      </View>

      <View style={styles.legend}>
        {data.length === 0 ? (
          <Text style={styles.empty}>No expenses yet</Text>
        ) : (
          data.map((s) => (
            <View key={s.type} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: tierColor[s.type] }]} />
              <Text style={styles.legendLabel}>{tierLabel[s.type]}</Text>
              <Text style={styles.legendValue}>{formatMoney(s.total, currency)}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.brandTintBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: font.size.xs, color: colors.textPrimary, fontWeight: font.weight.medium as any },
  legendValue: { fontSize: font.size.xs, color: colors.textPrimary, fontWeight: font.weight.bold as any },
  empty: { color: colors.textMuted, fontSize: font.size.sm },
});
