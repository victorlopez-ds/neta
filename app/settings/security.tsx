import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PinPad } from '@/components/PinPad';
import { getPin, setPin as savePin, clearPin, hasPin } from '@/lib/appLock';
import { useToast } from '@/components/Toast';
import { colors, spacing, font, radius } from '@/theme/tokens';

type Step = 'idle' | 'create' | 'confirm';

export default function Security() {
  const router = useRouter();
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [firstEntry, setFirstEntry] = useState('');
  const [entry, setEntry] = useState('');

  useEffect(() => {
    hasPin().then(setEnabled);
  }, []);

  function toggle(next: boolean) {
    if (next) {
      setStep('create');
      setEntry('');
    } else {
      clearPin().then(() => {
        setEnabled(false);
        toast('PIN disabled', 'info');
      });
    }
  }

  function onDigit(d: string) {
    if (entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length === 4) {
      if (step === 'create') {
        setFirstEntry(next);
        setStep('confirm');
        setEntry('');
      } else if (step === 'confirm') {
        if (next === firstEntry) {
          savePin(next).then(() => {
            setEnabled(true);
            setStep('idle');
            toast('PIN set', 'success');
          });
        } else {
          toast('PINs did not match — try again', 'error');
          setStep('create');
          setEntry('');
        }
      }
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => (step === 'idle' ? router.back() : setStep('idle'))} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 22 }} />
      </View>

      {step === 'idle' ? (
        <View style={{ padding: spacing.xl }}>
          <View style={styles.row}>
            <Ionicons name="keypad-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.rowLabel}>App PIN lock</Text>
            <Switch
              value={enabled}
              onValueChange={toggle}
              trackColor={{ true: colors.brand, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={styles.hint}>
            When enabled, the app asks for your 4-digit PIN each time it opens. This is a local device
            lock — your account credentials in Supabase are unaffected.
          </Text>
        </View>
      ) : (
        <View style={styles.pinWrap}>
          <Text style={styles.pinTitle}>{step === 'create' ? 'Create a PIN' : 'Confirm your PIN'}</Text>
          <View style={{ marginTop: spacing.xxl }}>
            <PinPad
              value={entry}
              onDigit={onDigit}
              onBackspace={() => setEntry((e) => e.slice(0, -1))}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold as any, color: colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.brandTintBg, borderRadius: radius.md, padding: spacing.lg },
  rowLabel: { flex: 1, fontSize: font.size.md, fontWeight: font.weight.medium as any, color: colors.textPrimary },
  hint: { fontSize: font.size.xs, color: colors.textMuted, marginTop: spacing.md, lineHeight: 18 },
  pinWrap: { flex: 1, alignItems: 'center', paddingTop: spacing.xxl * 2 },
  pinTitle: { fontSize: font.size.lg, fontWeight: font.weight.bold as any, color: colors.textPrimary },
});
