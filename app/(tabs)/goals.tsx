import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput } from 'react-native';
import { HeroHeader } from '@/components/HeroHeader';
import { GoalCard } from '@/components/GoalCard';
import { useGoals, useFundGoal, useCreateGoal } from '@/data/goals';
import { useProfile } from '@/data/profile';
import { useToast } from '@/components/Toast';
import { colors, spacing, font, radius } from '@/theme/tokens';
import type { FinancialGoal } from '@/types/database';

export default function Goals() {
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? 'EUR';
  const { data: goals = [] } = useGoals();
  const fundGoal = useFundGoal();
  const createGoal = useCreateGoal();
  const toast = useToast();

  const [funding, setFunding] = useState<FinancialGoal | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

  function submitFund() {
    const value = Number(fundAmount.replace(',', '.'));
    if (!funding || !value || value <= 0) return toast('Enter an amount', 'info');
    fundGoal.mutate(
      { goalId: funding.id, amount: value },
      { onError: (e: any) => toast(e?.message ?? 'Funding failed — reverted', 'error') },
    );
    setFunding(null);
    setFundAmount('');
  }

  function submitCreate() {
    const value = Number(target.replace(',', '.'));
    if (!title.trim() || !value || value <= 0) return toast('Enter a title and target', 'info');
    createGoal.mutate(
      { title: title.trim(), target_amount: value },
      { onError: (e: any) => toast(e?.message ?? 'Could not create goal', 'error') },
    );
    setCreating(false);
    setTitle('');
    setTarget('');
  }

  return (
    <View style={styles.screen}>
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 120 }}>
        <HeroHeader
          title="Savings"
          balance={totalSaved}
          expense={Math.max(totalTarget - totalSaved, 0)}
          limit={totalTarget || 1000}
          currency={currency}
        />

        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.h2}>Your goals</Text>
            <Pressable style={styles.addBtn} onPress={() => setCreating(true)}>
              <Text style={styles.addText}>Add More</Text>
            </Pressable>
          </View>

          {goals.length === 0 ? (
            <Text style={styles.empty}>No goals yet. Tap “Add More” to create one.</Text>
          ) : (
            goals.map((g) => (
              <GoalCard key={g.id} goal={g} currency={currency} onFund={() => setFunding(g)} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Fund modal */}
      <Modal visible={!!funding} transparent animationType="fade" onRequestClose={() => setFunding(null)}>
        <Pressable style={styles.backdrop} onPress={() => setFunding(null)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>Add funds</Text>
            <Text style={styles.modalSub}>{funding?.title}</Text>
            <TextInput
              style={styles.modalInput}
              value={fundAmount}
              onChangeText={setFundAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Pressable style={styles.modalCta} onPress={submitFund}>
              <Text style={styles.modalCtaText}>Fund goal</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create modal */}
      <Modal visible={creating} transparent animationType="fade" onRequestClose={() => setCreating(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCreating(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>New goal</Text>
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Emergency Fund"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { marginTop: spacing.md }]}
              value={target}
              onChangeText={setTarget}
              placeholder="Target amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Pressable style={styles.modalCta} onPress={submitCreate}>
              <Text style={styles.modalCtaText}>Create goal</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand },
  sheet: {
    backgroundColor: colors.brandTintBg,
    borderTopLeftRadius: radius.lg + 10,
    borderTopRightRadius: radius.lg + 10,
    marginTop: -spacing.xl,
    padding: spacing.xl,
    minHeight: 600,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  h2: { fontSize: font.size.lg, fontWeight: font.weight.heavy as any, color: colors.textPrimary },
  addBtn: { backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.pill },
  addText: { color: colors.white, fontWeight: font.weight.bold as any, fontSize: font.size.sm },
  empty: { color: colors.textMuted, fontSize: font.size.sm, textAlign: 'center', paddingVertical: spacing.xxl },
  backdrop: { flex: 1, backgroundColor: 'rgba(11,27,43,0.4)', justifyContent: 'center', padding: spacing.xl },
  modal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  modalTitle: { fontSize: font.size.lg, fontWeight: font.weight.heavy as any, color: colors.textPrimary },
  modalSub: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.brandTintBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: font.size.md,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  modalCta: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg },
  modalCtaText: { color: colors.white, fontWeight: font.weight.bold as any, fontSize: font.size.md },
});
