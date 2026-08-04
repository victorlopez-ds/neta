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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '@/data/categories';
import { useAddMovement } from '@/data/movements';
import { useProfile, useUpdateLiquidSavings } from '@/data/profile';
import { useToast } from '@/components/Toast';
import { CategoryIcon } from '@/components/CategoryIcon';
import { formatMoney, monthKey, todayISO } from '@/lib/money';
import { colors, spacing, font, radius } from '@/theme/tokens';
import type { Category, CategoryType } from '@/types/database';

type Group = 'expense' | 'income' | 'savings';
const GROUP_TYPES: Record<'expense' | 'income', CategoryType[]> = {
  expense: ['expense_essential', 'expense_personal', 'expense_leisure', 'expense_freelance'],
  income: ['income_fixed', 'income_variable'],
};

export default function NewMovement() {
  const router = useRouter();
  const toast = useToast();
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? 'EUR';
  const liquidSavings = profile?.liquid_savings ?? 0;
  const { data: categories = [] } = useCategories();

  const [group, setGroup] = useState<Group>('expense');
  const [category, setCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(todayISO());
  const [tags, setTags] = useState('');

  const month = monthKey(date);
  const addMovement = useAddMovement(month);
  const updateLiquidSavings = useUpdateLiquidSavings();

  const groupCategories = useMemo(
    () =>
      group === 'savings'
        ? []
        : categories.filter((c) => GROUP_TYPES[group].includes(c.type)),
    [categories, group],
  );

  function save() {
    const value = Number(amount.replace(',', '.'));
    if (!value || value <= 0) return toast('Introduce una cantidad mayor que 0', 'info');

    if (group === 'savings') {
      // Add to liquid savings — no movement record, just update the balance
      const newBalance = liquidSavings + value;
      updateLiquidSavings.mutate(newBalance, {
        onError: (e: any) => toast(e?.message ?? 'No se pudo actualizar — reintentando', 'error'),
        onSuccess: () => toast('Ahorro añadido', 'success'),
      });
      router.back();
      return;
    }

    if (!category) return toast('Selecciona una categoría', 'info');

    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);

    addMovement.mutate(
      { category, amount: value, concept, date, tags: parsedTags },
      {
        onError: (e: any) => toast(e?.message ?? 'No se pudo guardar — revertido', 'error'),
        onSuccess: () => toast('Guardado', 'success'),
      },
    );
    router.back();
  }

  const isSavingsTab = group === 'savings';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isSavingsTab ? 'Añadir ahorro' : 'Nuevo movimiento'}
          </Text>
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
            {(['expense', 'income', 'savings'] as Group[]).map((g) => (
              <Pressable
                key={g}
                onPress={() => {
                  setGroup(g);
                  setCategory(null);
                }}
                style={[styles.groupTab, group === g && styles.groupTabActive]}
              >
                <Text style={[styles.groupText, group === g && styles.groupTextActive]}>
                  {g === 'expense' ? 'Expense' : g === 'income' ? 'Income' : 'Save & Invest'}
                </Text>
              </Pressable>
            ))}
          </View>

          {isSavingsTab ? (
            /* ── Savings-specific UI ── */
            <View style={styles.savingsContent}>
              <View style={styles.savingsCard}>
                <View style={styles.savingsIconBox}>
                  <Ionicons name="wallet-outline" size={32} color={colors.white} />
                </View>
                <Text style={styles.savingsTitle}>Cuenta Remunerada</Text>
                <Text style={styles.savingsSubtitle}>
                  Saldo actual: {formatMoney(liquidSavings, currency)}
                </Text>
              </View>

              <View style={styles.savingsInfo}>
                <Ionicons name="arrow-up-circle" size={20} color={colors.brand} />
                <Text style={styles.savingsInfoText}>
                  La cantidad introducida se sumará a tu saldo de liquidez en la sección de Patrimonio.
                </Text>
              </View>

              <Pressable style={styles.cta} onPress={save}>
                <Text style={styles.ctaText}>Añadir a ahorro</Text>
              </Pressable>
            </View>
          ) : (
            /* ── Normal expense/income UI ── */
            <>
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
                <Text style={styles.ctaText}>Save Movement</Text>
              </Pressable>
            </>
          )}
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

  // Savings tab UI
  savingsContent: {
    marginTop: spacing.xl,
  },
  savingsCard: {
    alignItems: 'center',
    backgroundColor: colors.brandTintBg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  savingsIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  savingsTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold as any,
    color: colors.textPrimary,
  },
  savingsSubtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    fontWeight: font.weight.medium as any,
  },
  savingsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  savingsInfoText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
});

