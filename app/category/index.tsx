import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '@/data/categories';
import { useDeleteCategory } from '@/data/categoriesMutations';
import { useToast } from '@/components/Toast';
import { CategoryIcon } from '@/components/CategoryIcon';
import { tierLabel } from '@/theme/tokens';
import { colors, spacing, font, radius } from '@/theme/tokens';
import type { CategoryType } from '@/types/database';

const ORDER: CategoryType[] = [
  'income_fixed',
  'income_variable',
  'expense_essential',
  'expense_personal',
  'expense_leisure',
  'investment',
];

export default function CategoryList() {
  const router = useRouter();
  const toast = useToast();
  const { data: categories = [] } = useCategories();
  const deleteCategory = useDeleteCategory();

  const grouped = useMemo(() => {
    return ORDER.map((type) => ({
      type,
      items: categories.filter((c) => c.type === type),
    })).filter((g) => g.items.length > 0);
  }, [categories]);

  function confirmDelete(id: number, name: string, isCustom: boolean) {
    if (!isCustom) return toast('Default categories can’t be deleted', 'info');
    Alert.alert('Delete category', `Remove "${name}"? Existing movements keep their history.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteCategory.mutate(id, {
            onError: (e: any) => toast(e?.message ?? 'Could not delete', 'error'),
          }),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Categories</Text>
        <Pressable onPress={() => router.push('/category/new')} hitSlop={12}>
          <Ionicons name="add" size={26} color={colors.brand} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }}>
        {grouped.map((group) => (
          <View key={group.type} style={{ marginBottom: spacing.xl }}>
            <Text style={styles.groupTitle}>{tierLabel[group.type]}</Text>
            <View style={styles.grid}>
              {group.items.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.cell}
                  onLongPress={() => confirmDelete(c.id, c.name, c.user_id !== null)}
                >
                  <CategoryIcon icon={c.icon} color={c.color} type={c.type} size={54} shape="square" />
                  <Text style={styles.cellName} numberOfLines={1}>{c.name}</Text>
                  {c.user_id ? <Text style={styles.customBadge}>Custom</Text> : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.hint}>Long-press a custom category to delete it.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  groupTitle: { fontSize: font.size.sm, fontWeight: font.weight.semibold as any, color: colors.textMuted, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: 76, alignItems: 'center', gap: 4 },
  cellName: { fontSize: font.size.xs, color: colors.textPrimary, maxWidth: 74, textAlign: 'center' },
  customBadge: { fontSize: 9, color: colors.brand, fontWeight: font.weight.bold as any },
  hint: { fontSize: font.size.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
