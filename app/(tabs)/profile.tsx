import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeroHeader } from '@/components/HeroHeader';
import { useProfile, useUpdateProfile } from '@/data/profile';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toast';
import { colors, spacing, font, radius } from '@/theme/tokens';

const CURRENCIES = ['EUR', 'USD', 'GBP'];

export default function Profile() {
  const { data: profile } = useProfile();
  const { session, signOut } = useAuth();
  const update = useUpdateProfile();
  const toast = useToast();
  const currency = profile?.currency ?? 'EUR';

  const [limit, setLimit] = useState(String(profile?.monthly_budget_limit ?? ''));

  function saveLimit() {
    const value = Number(limit.replace(',', '.'));
    if (Number.isNaN(value) || value < 0) return toast('Enter a valid limit', 'info');
    update.mutate(
      { monthly_budget_limit: value },
      {
        onSuccess: () => toast('Budget limit updated', 'success'),
        onError: (e: any) => toast(e?.message ?? 'Update failed', 'error'),
      },
    );
  }

  function setCurrency(c: string) {
    update.mutate({ currency: c }, { onError: (e: any) => toast(e?.message ?? 'Update failed', 'error') });
  }

  return (
    <View style={styles.screen}>
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 120 }}>
        <HeroHeader
          title="Profile"
          balance={profile?.monthly_budget_limit ?? 0}
          expense={0}
          limit={profile?.monthly_budget_limit || 1000}
          currency={currency}
        />

        <View style={styles.sheet}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color={colors.white} />
            </View>
            <View>
              <Text style={styles.name}>{profile?.display_name ?? 'Your profile'}</Text>
              <Text style={styles.email}>{session?.user.email}</Text>
            </View>
          </View>

          <Text style={styles.label}>Monthly budget limit</Text>
          <View style={styles.limitRow}>
            <TextInput
              style={styles.input}
              value={limit}
              onChangeText={setLimit}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
            <Pressable style={styles.saveBtn} onPress={saveLimit}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>Drives the burn-rate bar on your dashboard.</Text>

          <Text style={styles.label}>Currency</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currencyText, currency === c && { color: colors.white }]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.signOut} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.signOutText}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: font.size.lg, fontWeight: font.weight.heavy as any, color: colors.textPrimary },
  email: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.semibold as any, marginTop: spacing.xl, marginBottom: spacing.sm },
  limitRow: { flexDirection: 'row', gap: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: font.size.md,
    color: colors.textPrimary,
  },
  saveBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  saveText: { color: colors.white, fontWeight: font.weight.bold as any },
  hint: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 6 },
  currencyRow: { flexDirection: 'row', gap: spacing.md },
  currencyChip: { paddingHorizontal: spacing.xl, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface },
  currencyChipActive: { backgroundColor: colors.brand },
  currencyText: { fontWeight: font.weight.bold as any, color: colors.textPrimary },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xxl, paddingVertical: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.danger },
  signOutText: { color: colors.danger, fontWeight: font.weight.bold as any, fontSize: font.size.md },
});
