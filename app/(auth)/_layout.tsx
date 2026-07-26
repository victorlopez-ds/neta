import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';

export default function AuthLayout() {
  const { session, initializing } = useAuth();
  if (!initializing && session) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
