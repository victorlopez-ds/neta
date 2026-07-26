import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile, useUpdateProfile } from '@/data/profile';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toast';
import { colors, spacing, font, radius } from '@/theme/tokens';

export default function EditProfile() {
  const router = useRouter();
  const toast = useToast();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [name, setName] = useState(profile?.display_name ?? '');

  function save() {
    update.mutate(
      { display_name: name.trim() },
      {
        onSuccess: () => {
          toast('Profile updated', 'success');
          router.back();
        },
        onError: (e: any) => toast(e?.message ?? 'Update failed', 'error'),
      },
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={colors.white} />
          </View>
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Email</Text>
        <View style={[styles.input, styles.disabled]}>
          <Text style={styles.disabledText}>{session?.user.email}</Text>
        </View>
        <Text style={styles.hint}>Email is managed by your account provider and can't be changed here.</Text>

        <Pressable style={styles.cta} onPress={save}>
          <Text style={styles.ctaText}>Save changes</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: font.size.sm, color: colors.textMuted, fontWeight: font.weight.semibold as any, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: { backgroundColor: colors.brandTintBg, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: font.size.md, color: colors.textPrimary },
  disabled: { opacity: 0.6 },
  disabledText: { fontSize: font.size.md, color: colors.textMuted },
  hint: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 6 },
  cta: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: spacing.xxl },
  ctaText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold as any },
});
