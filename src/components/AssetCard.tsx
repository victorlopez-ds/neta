import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font, radius, shadow } from '@/theme/tokens';
import { formatMoney } from '@/lib/money';
import type { Asset } from '@/types/database';

const TYPE_LABELS: Record<string, string> = {
  fund: 'Fondo',
  bond: 'Bono',
  etf: 'ETF',
  other: 'Otro',
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  fund: 'trending-up',
  bond: 'document-text',
  etf: 'bar-chart',
  other: 'cube',
};

const TYPE_COLORS: Record<string, string> = {
  fund: '#0FBE7C',
  bond: '#2F6BFF',
  etf: '#7A5CFF',
  other: '#FF7A00',
};

export function AssetCard({
  asset,
  currency = 'EUR',
  onFund,
  onDelete,
}: {
  asset: Asset;
  currency?: string;
  onFund?: () => void;
  onDelete?: () => void;
}) {
  const typeColor = TYPE_COLORS[asset.asset_type] ?? TYPE_COLORS.other;
  const typeIcon = TYPE_ICONS[asset.asset_type] ?? TYPE_ICONS.other;
  const typeLabel = TYPE_LABELS[asset.asset_type] ?? 'Otro';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: typeColor }]}>
          <Ionicons name={typeIcon} size={20} color={colors.white} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{asset.name}</Text>
          <Text style={styles.typeBadge}>{typeLabel}</Text>
        </View>
        <Text style={styles.value}>{formatMoney(asset.current_value, currency)}</Text>
      </View>

      <View style={styles.actions}>
        {onFund && (
          <Pressable style={styles.actionBtn} onPress={onFund}>
            <Ionicons name="add-circle-outline" size={15} color={colors.brand} />
            <Text style={styles.actionText}>Añadir fondos</Text>
          </Pressable>
        )}
        {onDelete && (
          <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Eliminar</Text>
          </Pressable>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold as any,
    color: colors.textPrimary,
  },
  typeBadge: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.medium as any,
  },
  value: {
    fontSize: font.size.lg,
    fontWeight: font.weight.heavy as any,
    color: colors.brand,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTintBg,
  },
  deleteBtn: {
    backgroundColor: '#FFF0F0',
  },
  actionText: {
    color: colors.brand,
    fontWeight: font.weight.bold as any,
    fontSize: font.size.sm,
  },
});
