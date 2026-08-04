import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toast';
import { colors, spacing, font, radius } from '@/theme/tokens';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!password || !confirm) return toast('Fill in both fields', 'info');
    if (password.length < 6) return toast('Password must be at least 6 characters', 'info');
    if (password !== confirm) return toast('Passwords do not match', 'error');
    setBusy(true);
    try {
      await updatePassword(password);
      toast('Password updated successfully', 'success');
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      toast(e?.message ?? 'Could not update password', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.brand}>New password</Text>
          <Text style={styles.tagline}>Choose a strong password for your account.</Text>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>Create new password</Text>
          <Text style={styles.subtitle}>
            Your new password must be at least 6 characters long.
          </Text>

          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat your password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          <Pressable style={[styles.cta, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Update Password</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brand },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  brand: { fontSize: font.size.xxl, fontWeight: font.weight.heavy as any, color: colors.white },
  tagline: { fontSize: font.size.md, color: colors.white, opacity: 0.9, marginTop: spacing.sm },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 10,
    borderTopRightRadius: radius.lg + 10,
    padding: spacing.xl,
  },
  title: { fontSize: font.size.xl, fontWeight: font.weight.heavy as any, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { fontSize: font.size.sm, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.md },
  label: { fontSize: font.size.sm, color: colors.textMuted, marginBottom: 6, marginTop: spacing.md, fontWeight: font.weight.semibold as any },
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
    marginTop: spacing.xl,
  },
  ctaText: { color: colors.white, fontSize: font.size.md, fontWeight: font.weight.bold as any },
});
