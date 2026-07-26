import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecurringTemplates, useToggleTemplate, useCreateTemplate } from '@/data/recurring';
import { useCategories, indexCategories } from '@/data/categories';
import { useProfile } from '@/data/profile';
import { useToast } from '@/components/Toast';
import { CategoryIcon } from '@/components/CategoryIcon';
import { formatMoney } from '@/lib/money';
import { colors, spacing, font, radius, shadow } from '@/theme/tokens';
import type { RecurrenceFrequency } from '@/types/database';

const FREQ: { key: RecurrenceFrequency; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export default function Recurring() {
  const router = useRouter();
  const toast = useToast();
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? 'EUR';
  const { data: templates = [] } = useRecurringTemplates();
  const { data: categories = [] } = useCategories();
  const catIndex = useMemo(() => indexCategories(categories), [categories]);
  const toggle = useToggleTemplate();
  const create = useCreateTemplate();

  const [adding, setAdding] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [billingDay, setBillingDay] = useState('1');

  // "Gasto Fijo Mensual": active monthly non-investment templates.
  const monthlyFixed = useMemo(
    () =>
      templates
        .filter((t) => t.is_active && t.frequency === 'monthly')
        .filter((t) => catIndex.get(t.category_id)?.type !== 'investment')
        .reduce((s, t) => s + t.amount, 0),
    [templates, catIndex],
  );
  const monthlyDca = useMemo(
    () =>
      templates
        .filter((t) => t.is_active && t.frequency === 'monthly')
        .filter((t) => catIndex.get(t.category_id)?.type === 'investment')
        .reduce((s, t) => s + t.amount, 0),
    [templates, catIndex],
  );

  function submit() {
    const value = Number(amount.replace(',', '.'));
    const day = Number(billingDay);
    if (!categoryId) return toast('Pick a category', 'info');
    if (!value || value <= 0) return toast('Enter an amount', 'info');
    if (!day || day < 1 || day > 31) return toast('Billing day must be 1–31', 'info');
    create.mutate(
      { category_id: categoryId, concept, amount: value, frequency, billing_day: day },
      { onError: (e: any) => toast(e?.message ?? 'Could not create', 'error'), onSuccess: () => toast('Recurring added', 'success') },
    );
    setAdding(false);
    setConcept('');
    setAmount('');
    setCategoryId(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscriptions & DCA</Text>
        <Pressable onPress={() => setAdding(true)} hitSlop={12}>
          <Ionicons name="add" size={26} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gasto Fijo Mensual</Text>
          <Text style={styles.summaryValue}>{formatMoney(monthlyFixed, currency)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.brandDark }]}>
          <Text style={styles.summaryLabel}>Monthly DCA</Text>
          <Text style={styles.summaryValue}>{formatMoney(monthlyDca, currency)}</Text>
        </View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={{ padding: spacing.xl }}>
        {templates.length === 0 ? (
          <Text style={styles.empty}>No recurring items yet. Tap ＋ to add a subscription or DCA plan.</Text>
        ) : (
          templates.map((t) => {
            const cat = catIndex.get(t.category_id);
            return (
              <View key={t.id} style={styles.row}>
                <CategoryIcon icon={cat?.icon} color={cat?.color} type={cat?.type} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{t.concept || cat?.name}</Text>
                  <Text style={styles.rowSub}>
                    {t.frequency} · day {t.billing_day}
                    {t.last_executed_date ? ` · last ${t.last_executed_date}` : ''}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>{formatMoney(t.amount, currency)}</Text>
                <Switch
                  value={t.is_active}
                  onValueChange={(v) => toggle.mutate({ id: t.id, isActive: v })}
                  trackColor={{ true: colors.brand, false: colors.border }}
                  thumbColor={colors.white}
                />
              </View>
            );
          })
        )}
        <Text style={styles.engineNote}>
          The engine materialises due items into your movements automatically (pg_cron daily).
        </Text>
      </ScrollView>

      {/* Add template modal */}
      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>New recurring</Text>
              <Pressable onPress={() => setAdding(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingVertical: 4 }}>
              {categories.map((c) => (
                <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={{ alignItems: 'center', opacity: categoryId === c.id ? 1 : 0.55 }}>
                  <CategoryIcon icon={c.icon} color={c.color} type={c.type} size={48} shape="square" />
                  <Text style={styles.catName} numberOfLines={1}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Concept</Text>
            <TextInput style={styles.input} value={concept} onChangeText={setConcept} placeholder="e.g. Netflix / S&P 500 DCA" placeholderTextColor={colors.textMuted} />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Amount</Text>
                <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </View>
              <View style={{ width: 110 }}>
                <Text style={styles.label}>Billing day</Text>
                <TextInput style={styles.input} value={billingDay} onChangeText={setBillingDay} placeholder="1" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
              </View>
            </View>

            <Text style={styles.label}>Frequency</Text>
            <View style={styles.freqRow}>
              {FREQ.map((f) => (
                <Pressable key={f.key} onPress={() => setFrequency(f.key)} style={[styles.freqTab, frequency === f.key && styles.freqTabActive]}>
                  <Text style={[styles.freqText, frequency === f.key && { color: colors.white }]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.modalCta} onPress={submit}>
              <Text style={styles.modalCtaText}>Add recurring</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brand },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.bold as any },
  summaryRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, padding: spacing.lg },
  summaryLabel: { color: colors.white, opacity: 0.9, fontSize: font.size.xs, fontWeight: font.weight.medium as any },
  summaryValue: { color: colors.white, fontSize: font.size.lg, fontWeight: font.weight.heavy as any, marginTop: 4 },
  sheet: { flex: 1, backgroundColor: colors.brandTintBg, borderTopLeftRadius: radius.lg + 10, borderTopRightRadius: radius.lg + 10 },
  empty: { color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center', paddingVertical: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadow.card },
  rowTitle: { fontSize: font.size.md, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  rowSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  rowAmount: { fontSize: font.size.md, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  engineNote: { color: colors.textMuted, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  backdrop: { flex: 1, backgroundColor: 'rgba(11,27,43,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg + 6, borderTopRightRadius: radius.lg + 6, padding: spacing.xl, paddingBottom: spacing.xxl },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: font.size.lg, fontWeight: font.weight.heavy as any, color: colors.textPrimary },
  label: { fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.semibold as any, marginTop: spacing.md, marginBottom: spacing.sm },
  catName: { fontSize: 10, color: colors.textPrimary, maxWidth: 56, textAlign: 'center', marginTop: 4 },
  input: { backgroundColor: colors.brandTintBg, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 12, fontSize: font.size.md, color: colors.textPrimary },
  freqRow: { flexDirection: 'row', backgroundColor: colors.brandTintBg, borderRadius: radius.pill, padding: 5 },
  freqTab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  freqTabActive: { backgroundColor: colors.brand },
  freqText: { fontWeight: font.weight.semibold as any, color: colors.textPrimary, fontSize: font.size.sm },
  modalCta: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: spacing.xl },
  modalCtaText: { color: colors.white, fontWeight: font.weight.bold as any, fontSize: font.size.md },
});
