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
import { Link } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toast';
import { colors, spacing, font, radius } from '@/theme/tokens';

export default function SignIn() {
  const { signIn } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || !password) return toast('Enter your email and password', 'info');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // On success, (auth)/_layout redirects to the tabs automatically.
    } catch (e: any) {
      toast(e?.message ?? 'Sign in failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.brand}>Neta</Text>
          <Text style={styles.tagline}>Track income, expenses & DCA — instantly.</Text>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>Welcome back</Text>

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

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
            Forgot your password?
          </Link>

          <Pressable style={[styles.cta, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ctaText}>Log In</Text>}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.muted}>New here? </Text>
            <Link href="/(auth)/sign-up" style={styles.link}>
              Create account
            </Link>
          </View>
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
  title: { fontSize: font.size.xl, fontWeight: font.weight.heavy as any, color: colors.textPrimary, marginBottom: spacing.xl },
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
  forgotLink: { color: colors.brand, fontSize: font.size.sm, fontWeight: font.weight.medium as any, textAlign: 'right', marginTop: spacing.sm },
  link: { color: colors.brand, fontWeight: font.weight.bold as any, fontSize: font.size.sm },
});
