import { Platform } from 'react-native';
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persister } from '@tanstack/react-query-persist-client';

/**
 * TanStack Query is the in-memory tier of the cache; AsyncStorage is the
 * persistent tier. On boot the persisted cache is rehydrated synchronously
 * enough that screens render real data immediately (no spinner). See
 * docs/CACHING.md for the full three-tier model.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // serve cache instantly; revalidate in the background
      gcTime: 1000 * 60 * 60 * 24, // keep for a day so offline boots have data
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 2,
    },
  },
});

/**
 * During Expo static rendering (Node.js) `window` is undefined, so
 * AsyncStorage's web implementation (localStorage) would crash. Guard every
 * persister operation so it no-ops on the server.
 */
const isSSR = Platform.OS === 'web' && typeof window === 'undefined';

/** Minimal AsyncStorage-backed persister (keeps the app runnable in Expo Go). */
const asyncStoragePersister: Persister = {
  persistClient: async (client) => {
    if (isSSR) return;
    await AsyncStorage.setItem('neta-query-cache', JSON.stringify(client));
  },
  restoreClient: async () => {
    if (isSSR) return undefined;
    const cached = await AsyncStorage.getItem('neta-query-cache');
    return cached ? JSON.parse(cached) : undefined;
  },
  removeClient: async () => {
    if (isSSR) return;
    await AsyncStorage.removeItem('neta-query-cache');
  },
};

export function enableCachePersistence() {
  if (isSSR) return; // Skip during static rendering
  persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24h
  });
}

