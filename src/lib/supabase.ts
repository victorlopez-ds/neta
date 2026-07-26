import { Platform } from 'react-native';

// URL polyfill is only needed on native — the browser already has URL.
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly in dev rather than silently pointing at nothing.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in the finance-app project.',
  );
}

/**
 * SSR-safe storage adapter. During Expo static rendering (Node.js) `window` is
 * undefined, so AsyncStorage's web implementation (which uses localStorage)
 * would crash. This wrapper no-ops on the server and delegates normally in the
 * browser or on native.
 */
const isSSR = Platform.OS === 'web' && typeof window === 'undefined';

const ssrSafeStorage = {
  getItem: (key: string) => (isSSR ? Promise.resolve(null) : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    isSSR ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) => (isSSR ? Promise.resolve() : AsyncStorage.removeItem(key)),
};

/**
 * The auth session is persisted in AsyncStorage. Every PostgREST request made
 * through this client carries the user's JWT, so `auth.uid()` is injected
 * server-side and RLS scopes all reads/writes to the signed-in user.
 */
export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: true,
    persistSession: !isSSR,
    detectSessionInUrl: false,
  },
});
