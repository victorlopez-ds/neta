import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

interface AuthContextValue {
  session: Session | null;
  userId: string | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Never let one user's cached data bleed into another's session.
      if (!next) queryClient.clear();

      // When the user clicks the recovery link, Supabase fires PASSWORD_RECOVERY.
      // Navigate them straight to the reset-password form.
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Listen for incoming deep-links so Supabase can exchange the recovery token.
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      // Supabase recovery links carry tokens as hash fragments. Calling
      // getSessionFromUrl (via detectSessionInUrl) or manually setting the
      // session lets onAuthStateChange fire PASSWORD_RECOVERY above.
      if (url.includes('reset-password') || url.includes('type=recovery')) {
        await supabase.auth.getSession();
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      initializing,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (email, password, displayName) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: displayName ? { display_name: displayName } : undefined },
        });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
        queryClient.clear();
      },
      resetPassword: async (email) => {
        const redirectTo = Linking.createURL('/(auth)/reset-password');
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
        if (error) throw error;
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      },
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
