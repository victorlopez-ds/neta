import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font } from '@/theme/tokens';

const SECTIONS = [
  {
    title: '1. Your data',
    body: 'All financial data you enter (movements, categories, recurring plans, goals) is stored in your own account and protected by Row-Level Security — it is never visible to other users.',
  },
  {
    title: '2. Local caching',
    body: 'To keep the app instant, a copy of your recent data is cached on your device. Signing out clears this local cache.',
  },
  {
    title: '3. Automated movements',
    body: 'Recurring templates you configure (subscriptions, DCA plans) will automatically create movements on your behalf according to the schedule you set. You can pause or delete a template at any time.',
  },
  {
    title: '4. No financial advice',
    body: 'This app is a tracking and budgeting tool. Nothing in the app constitutes financial, investment or tax advice.',
  },
  {
    title: '5. Account deletion',
    body: 'You may request deletion of your account and all associated data at any time from Settings.',
  },
];

export default function Terms() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }}>
        {SECTIONS.map((s) => (
          <View key={s.title} style={{ marginBottom: spacing.lg }}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  sectionTitle: { fontSize: font.size.md, fontWeight: font.weight.bold as any, color: colors.textPrimary, marginBottom: 6 },
  sectionBody: { fontSize: font.size.sm, color: colors.textMuted, lineHeight: 20 },
});
