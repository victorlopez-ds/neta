import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, tierColor } from '@/theme/tokens';
import type { CategoryType } from '@/types/database';

/** Icon keys used in the seeded categories -> Ionicons glyphs. */
const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  wallet: 'wallet',
  laptop: 'laptop',
  gift: 'gift',
  people: 'people',
  home: 'home',
  cart: 'cart',
  receipt: 'receipt',
  bus: 'bus',
  medicine: 'medkit',
  shirt: 'shirt',
  repeat: 'repeat',
  food: 'fast-food',
  restaurant: 'restaurant',
  plane: 'airplane',
  movie: 'film',
  chart: 'trending-up',
};

export function CategoryIcon({
  icon,
  color,
  type,
  size = 52,
  shape = 'circle',
}: {
  icon?: string | null;
  color?: string | null;
  type?: CategoryType;
  size?: number;
  shape?: 'circle' | 'square';
}) {
  const glyph = (icon && ICONS[icon]) || 'pricetag';
  const bg = color || (type ? tierColor[type] : colors.accentBlue);
  const br = shape === 'circle' ? size / 2 : radius.md;

  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: br, backgroundColor: bg }]}>
      <Ionicons name={glyph} size={size * 0.44} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
