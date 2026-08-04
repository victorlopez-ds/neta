import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories } from '@/data/categories';
import { useUpdateMovement, useDeleteMovement } from '@/data/movements';
import { useProfile } from '@/data/profile';
import { useToast } from '@/components/Toast';
import { CategoryIcon } from '@/components/CategoryIcon';
import { monthKey } from '@/lib/money';
import { qk } from '@/data/queryKeys';
import { colors, spacing, font, radius } from '@/theme/tokens';
import type { Category, CategoryType, MovementWithCategory } from '@/types/database';

type Group = 'expense' | 'income';
const GROUP_TYPES: Record<Group, CategoryType[]> = {
  expense: ['expense_essential', 'expense_personal', 'expense_leisure', 'expense_freelance'],
  income: ['income_fixed', 'income_variable'],
};

export default function EditMovement() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? 'EUR';
  const { data: categories = [] } = useCategories();

  // Find the movement in the React Query cache
  const existing = useMemo(() => {
    const allCaches = queryClient.getQueriesData<MovementWithCategory[]>({ queryKey: qk.movementsAll });
    for (const [, data] of allCaches) {
      const found = data?.find((m) => m.id === id);
      if (found) return found;
    }
    return null;
  }, [id, queryClient]);

  // Determine which group this movement belongs to
  const initialGroup = useMemo<Group>(() => {
    if (!existing) return 'expense';
    const type = existing.category.type;
    if (GROUP_TYPES.income.includes(type)) return 'income';
    return 'expense';
  }, [existing]);

  const [group, setGroup] = useState<Group>(initialGroup);
  const [category, setCategory] = useState<Category | null>(existing?.category ?? null);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [concept, setConcept] = useState(existing?.concept ?? '');
  const [date, setDate] = useState(existing?.date ?? '');
  const [tags, setTags] = useState(existing?.tags?.join(', ') ?? '');

  const month = monthKey(existing?.date ?? (date || new Date()));
  const updateMovement = useUpdateMovement(month);
  const deleteMovement = useDeleteMovement(month);

  const groupCategories = useMemo(
    () => categories.filter((c) => GROUP_TYPES[group].includes(c.type)),
    [categories, group],
  );

  function save() {
    const value = Number(amount.replace(',', '.'));
    if (!value || value <= 0) return toast('Introduce una cantidad mayor que 0', 'info');
    if (!category) return toast('Selecciona una categoría', 'info');
    if (!id) return;

    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);

    updateMovement.mutate(
      { id, category, amount: value, concept, date, tags: parsedTags },
      {
        onError: (e: any) => toast(e?.message ?? 'No se pudo actualizar', 'error'),
        onSuccess: () => toast('Movimiento actualizado', 'success'),
      },
    );
    router.back();
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert(
      'Eliminar movimiento',
      '¿Seguro que quieres eliminar este movimiento? No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteMovement.mutate(id, {
              onError: (e: any) => toast(e?.message ?? 'No se pudo eliminar', 'error'),
              onSuccess: () => toast('Movimiento eliminado', 'success'),
            });
            router.back();
          },
        },
      ],
    );
  }

  if (!existing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit movement</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={[styles.sheet, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, marginTop: spacing.md, fontSize: font.size.md }}>
            Movement not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit movement</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text style={styles.amountCurrency}>{currency === 'EUR' ? '€' : '$'}</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="rgba(255,255,255,0.6)"
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        <ScrollView style={styles.sheet} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
          {/* Group switch */}
          <View style={styles.groupRow}>
            {(['expense', 'income'] as Group[]).map((g) => (
              <Pressable
                key={g}
                onPress={() => {
                  setGroup(g);
                  setCategory(null);
                }}
                style={[styles.groupTab, group === g && styles.groupTabActive]}
              >
                <Text style={[styles.groupText, group === g && styles.groupTextActive]}>
                  {g === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.grid}>
            {groupCategories.map((c) => {
              const selected = category?.id === c.id;
              return (
                <Pressable key={c.id} style={styles.catCell} onPress={() => setCategory(c)}>
                  <View style={[styles.catIconWrap, selected && styles.catIconSelected]}>
                    <CategoryIcon icon={c.icon} color={c.color} type={c.type} size={54} shape="square" />
                  </View>
                  <Text style={[styles.catName, selected && { color: colors.brand, fontWeight: '700' }]} numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Concept</Text>
          <TextInput
            style={styles.input}
            value={concept}
            onChangeText={setConcept}
            placeholder="e.g. Weekly shop"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g. Paris Trip 2026"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Pressable style={styles.cta} onPress={save}>
            <Text style={styles.ctaText}>Update Movement</Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteText}>Delete movement</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brand },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.bold as any },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  amountCurrency: { color: colors.white, fontSize: 34, fontWeight: font.weight.bold as any, marginRight: 6 },
  amountInput: { color: colors.white, fontSize: 52, fontWeight: font.weight.heavy as any, minWidth: 120, textAlign: 'center' },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 10,
    borderTopRightRadius: radius.lg + 10,
  },
  groupRow: { flexDirection: 'row', backgroundColor: colors.brandTintBg, borderRadius: radius.pill, padding: 5 },
  groupTab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  groupTabActive: { backgroundColor: colors.brand },
  groupText: { fontSize: font.size.sm, fontWeight: font.weight.semibold as any, color: colors.textPrimary },
  groupTextActive: { color: colors.white, fontWeight: font.weight.bold as any },
  label: { fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.semibold as any, marginTop: spacing.xl, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  catCell: { width: 74, alignItems: 'center', gap: 6 },
  catIconWrap: { padding: 3, borderRadius: radius.md + 3, borderWidth: 2, borderColor: 'transparent' },
  catIconSelected: { borderColor: colors.brand },
  catName: { fontSize: font.size.xs, color: colors.textPrimary, maxWidth: 72, textAlign: 'center' },
  input: {
    backgroundColor: colors.brandTintBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: font.size.md,
    color: colors.textPrimary,
  },
  cta: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  ctaText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold as any },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
  },
  deleteText: { color: colors.danger, fontSize: font.size.md, fontWeight: font.weight.semibold as any },
});
