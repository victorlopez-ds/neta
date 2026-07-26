import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A simple app-open PIN gate, stored locally (not synced). This is a UX lock,
 * not a substitute for Supabase auth — it just gates re-entry to an already
 * signed-in session, matching the kit's "Security Pin" flow.
 */
const KEY = 'neta-app-pin';

export async function getPin(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function setPin(pin: string): Promise<void> {
  await AsyncStorage.setItem(KEY, pin);
}

export async function clearPin(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function hasPin(): Promise<boolean> {
  return (await getPin()) !== null;
}
