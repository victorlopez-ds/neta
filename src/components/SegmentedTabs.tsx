import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, font, spacing } from '@/theme/tokens';

/** Daily / Weekly / Monthly / Year pill selector from the mockups. */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.brand },
  label: { fontSize: font.size.sm, fontWeight: font.weight.semibold as any, color: colors.textPrimary },
  labelActive: { color: colors.white, fontWeight: font.weight.bold as any },
});
