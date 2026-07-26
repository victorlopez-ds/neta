import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'neta-onboarding-seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}
