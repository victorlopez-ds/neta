import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font, radius } from '@/theme/tokens';

const FAQ = [
  {
    q: 'How does the 5-tier category model work?',
    a: 'Every movement belongs to one of: fixed income, variable income, essential expenses, personal expenses, or leisure expenses — plus a separate investment tier for DCA. This keeps your budgeting rules consistent and drives the analysis charts.',
  },
  {
    q: 'Are investments (DCA) counted as expenses?',
    a: 'No. Investments are tracked separately and are excluded from your expense total — they count toward your savings rate instead, since they are wealth relocation, not spending.',
  },
  {
    q: 'How do subscriptions and DCA plans get created automatically?',
    a: 'A recurring template (Subscriptions & DCA screen) defines the amount, category and billing day. A daily background job checks due templates and posts the matching movement automatically.',
  },
  {
    q: 'Does the app work offline?',
    a: 'Yes. Reads always come from a local cache and writes apply instantly, syncing to the server in the background. If a write fails, it rolls back and you get a toast notification.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Row-Level Security on the database ensures every read and write is scoped to your account — no one else can see or modify your data.',
  },
];

export default function HelpCenter() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }}>
        {FAQ.map((item) => (
          <View key={item.q} style={styles.card}>
            <Text style={styles.question}>{item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>
          </View>
        ))}

        <Pressable style={styles.contact} onPress={() => Linking.openURL('mailto:support@neta.app')}>
          <Ionicons name="mail-outline" size={20} color={colors.white} />
          <Text style={styles.contactText}>Contact support</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  card: { backgroundColor: colors.brandTintBg, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  question: { fontSize: font.size.md, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  answer: { fontSize: font.size.sm, color: colors.textMuted, marginTop: 6, lineHeight: 20 },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 14,
    marginTop: spacing.md,
  },
  contactText: { color: colors.white, fontWeight: font.weight.bold as any, fontSize: font.size.md },
});
