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
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toast';
import { colors, spacing, font, radius } from '@/theme/tokens';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email) return toast('Enter your email address', 'info');
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
      toast('Recovery email sent — check your inbox', 'success');
    } catch (e: any) {
      toast(e?.message ?? 'Could not send recovery email', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.brand}>Reset password</Text>
          <Text style={styles.tagline}>We'll send a recovery link to your email.</Text>
        </View>

        <View style={styles.sheet}>
          {sent ? (
            <View style={styles.sentWrap}>
              <Text style={styles.sentIcon}>✉️</Text>
              <Text style={styles.sentTitle}>Check your inbox</Text>
              <Text style={styles.sentBody}>
                We sent a password reset link to{'\n'}
                <Text style={{ fontWeight: font.weight.bold as any }}>{email}</Text>
              </Text>
              <Text style={styles.sentHint}>
                Tap the link in the email to create a new password. If you don't see it, check your spam folder.
              </Text>

              <Pressable style={styles.cta} onPress={() => router.replace('/(auth)/sign-in')}>
                <Text style={styles.ctaText}>Back to Log In</Text>
              </Pressable>

              <Pressable style={styles.resend} onPress={submit} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={colors.brand} />
                ) : (
                  <Text style={styles.resendText}>Resend email</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter the email you signed up with and we'll send you a link to reset your password.
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Pressable style={[styles.cta, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.ctaText}>Send Reset Link</Text>
                )}
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.muted}>Remember your password? </Text>
                <Link href="/(auth)/sign-in" style={styles.link}>
                  Log in
                </Link>
              </View>
            </>
          )}
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  muted: { color: colors.textMuted, fontSize: font.size.sm },
  link: { color: colors.brand, fontWeight: font.weight.bold as any, fontSize: font.size.sm },

  // Sent confirmation state
  sentWrap: { alignItems: 'center', paddingTop: spacing.xxl },
  sentIcon: { fontSize: 48, marginBottom: spacing.lg },
  sentTitle: { fontSize: font.size.xl, fontWeight: font.weight.heavy as any, color: colors.textPrimary, marginBottom: spacing.sm },
  sentBody: { fontSize: font.size.md, color: colors.textPrimary, textAlign: 'center', lineHeight: 22 },
  sentHint: { fontSize: font.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
  resend: { marginTop: spacing.lg, paddingVertical: spacing.md },
  resendText: { color: colors.brand, fontSize: font.size.sm, fontWeight: font.weight.bold as any },
});
