import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/auth/AuthProvider';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { colors } from '@/theme/tokens';

export default function Index() {
  const { session, initializing } = useAuth();
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasSeenOnboarding().then(setSeenOnboarding);
  }, []);

  if (initializing || seenOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    );
  }

  if (!seenOnboarding) return <Redirect href="/onboarding" />;

  return <Redirect href={session ? '/(tabs)' : '/(auth)/sign-in'} />;
}
