import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font, radius } from '@/theme/tokens';

/** 4-dot indicator + numeric keypad, used for both PIN set-up and unlock. */
export function PinPad({
  value,
  length = 4,
  onDigit,
  onBackspace,
}: {
  value: string;
  length?: number;
  onDigit: (d: string) => void;
  onBackspace: () => void;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <View>
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.grid}>
        {keys.map((k, i) =>
          k === '' ? (
            <View key={i} style={styles.key} />
          ) : (
            <Pressable
              key={i}
              style={styles.key}
              onPress={() => (k === 'back' ? onBackspace() : onDigit(k))}
            >
              {k === 'back' ? (
                <Ionicons name="backspace-outline" size={22} color={colors.textPrimary} />
              ) : (
                <Text style={styles.keyText}>{k}</Text>
              )}
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.xxl },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.brand },
  dotFilled: { backgroundColor: colors.brand },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 264, alignSelf: 'center' },
  key: { width: 88, height: 72, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: font.size.xl, fontWeight: font.weight.semibold as any, color: colors.textPrimary },
});
