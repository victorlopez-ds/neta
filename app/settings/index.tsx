import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/AuthProvider';
import { colors, spacing, font, radius, shadow } from '@/theme/tokens';

interface Item {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
}

export default function SettingsHub() {
  const router = useRouter();
  const { signOut } = useAuth();

  const sections: { title: string; items: Item[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', route: '/settings/edit-profile' },
        { icon: 'pricetags-outline', label: 'Categories', route: '/category' },
        { icon: 'shield-checkmark-outline', label: 'Security', route: '/settings/security' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center', route: '/settings/help' },
        { icon: 'document-text-outline', label: 'Terms & Conditions', route: '/settings/terms' },
      ],
    },
    {
      title: '',
      items: [
        { icon: 'log-out-outline', label: 'Log Out', danger: true, onPress: signOut },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }}>
        {sections.map((section) => (
          <View key={section.title || 'danger'} style={{ marginBottom: spacing.xl }}>
            {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
            <View style={styles.card}>
              {section.items.map((item, i) => (
                <Pressable
                  key={item.label}
                  style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}
                  onPress={() => (item.onPress ? item.onPress() : item.route && router.push(item.route as any))}
                >
                  <Ionicons name={item.icon} size={20} color={item.danger ? colors.danger : colors.textPrimary} />
                  <Text style={[styles.rowLabel, item.danger && { color: colors.danger }]}>{item.label}</Text>
                  {!item.danger && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  sectionTitle: { fontSize: font.size.sm, fontWeight: font.weight.semibold as any, color: colors.textMuted, marginBottom: spacing.sm },
  card: { backgroundColor: colors.brandTintBg, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, fontSize: font.size.md, color: colors.textPrimary, fontWeight: font.weight.medium as any },
});
