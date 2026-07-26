import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPin } from '@/lib/appLock';
import { PinPad } from './PinPad';
import { colors, spacing, font } from '@/theme/tokens';

/**
 * Wraps the whole app. If a PIN is set, shows a lock screen on cold start and
 * whenever the app returns from background — mirroring the kit's PIN flow.
 * On web, uses the Page Visibility API instead of RN AppState.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const [pin, setPinState] = useState<string | null | 'loading'>('loading');
  const [locked, setLocked] = useState(false);
  const [entry, setEntry] = useState('');
  const [error, setError] = useState(false);
  const appState = useRef(Platform.OS !== 'web' ? AppState.currentState : 'active');

  useEffect(() => {
    getPin().then((p) => {
      setPinState(p);
      setLocked(!!p);
    });

    if (Platform.OS === 'web') {
      // On web, use the Page Visibility API to detect tab switching.
      const handleVisibility = () => {
        if (document.visibilityState === 'hidden') {
          getPin().then((p) => {
            if (p) setLocked(true);
          });
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }

    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/active/) && next === 'background') {
        getPin().then((p) => {
          if (p) setLocked(true);
        });
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  function onDigit(d: string) {
    if (entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    if (next.length === 4) {
      if (next === pin) {
        setLocked(false);
        setEntry('');
        setError(false);
      } else {
        setError(true);
        setTimeout(() => {
          setEntry('');
          setError(false);
        }, 500);
      }
    }
  }

  if (pin === 'loading') return null;
  if (!locked) return <>{children}</>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Enter your PIN</Text>
        {error ? <Text style={styles.error}>Incorrect PIN, try again</Text> : <View style={{ height: 18 }} />}
        <View style={{ marginTop: spacing.xxl }}>
          <PinPad value={entry} onDigit={onDigit} onBackspace={() => setEntry((e) => e.slice(0, -1))} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.brand },
  wrap: { flex: 1, alignItems: 'center', paddingTop: spacing.xxl * 2 },
  title: { fontSize: font.size.lg, fontWeight: font.weight.bold as any, color: colors.white },
  error: { fontSize: font.size.sm, color: '#FFD1D1', marginTop: 6 },
});
