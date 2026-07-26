import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, font, spacing, radius } from '@/theme/tokens';

export interface BarDatum {
  label: string;
  income: number;
  expense: number;
}

/** Grouped income (green) / expense (blue) bars, matching the Analysis mockup. */
export function IncomeExpenseBars({ data, height = 200 }: { data: BarDatum[]; height?: number }) {
  const width = 320;
  const padY = 24;
  const padX = 8;
  const chartH = height - padY * 2;
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const groupW = (width - padX * 2) / Math.max(1, data.length);
  const barW = Math.min(12, groupW / 3);

  return (
    <View style={styles.wrap}>
      <View style={styles.legendRow}>
        <Legend color={colors.brand} label="Income" />
        <Legend color={colors.accentBlue} label="Expense" />
      </View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.5, 1].map((t) => {
          const y = padY + chartH * (1 - t);
          return (
            <Line key={t} x1={padX} y1={y} x2={width - padX} y2={y} stroke={colors.border} strokeWidth={1} />
          );
        })}
        {data.map((d, i) => {
          const gx = padX + groupW * i + groupW / 2;
          const incH = (d.income / max) * chartH;
          const expH = (d.expense / max) * chartH;
          return (
            <React.Fragment key={d.label}>
              <Rect x={gx - barW - 2} y={padY + chartH - incH} width={barW} height={incH} rx={4} fill={colors.brand} />
              <Rect x={gx + 2} y={padY + chartH - expH} width={barW} height={expH} rx={4} fill={colors.accentBlue} />
              <SvgText x={gx} y={height - 6} fontSize={10} fill={colors.textMuted} textAnchor="middle">
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.brandTintBg, borderRadius: radius.lg, padding: spacing.lg },
  legendRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.sm },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: font.size.xs, color: colors.textMuted, fontWeight: font.weight.semibold as any },
});
