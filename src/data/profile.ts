import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from './queryKeys';
import type { Profile } from '@/types/database';

async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: fetchProfile });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'display_name' | 'currency' | 'monthly_budget_limit' | 'liquid_savings'>>) => {
      const { data: sessionData } = await supabase.auth.getUser();
      const id = sessionData.user?.id;
      if (!id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.profile }),
  });
}

/** Optimistic update for the liquid savings field. */
export function useUpdateLiquidSavings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data: sessionData } = await supabase.auth.getUser();
      const id = sessionData.user?.id;
      if (!id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update({ liquid_savings: amount })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onMutate: async (amount) => {
      await client.cancelQueries({ queryKey: qk.profile });
      const previous = client.getQueryData<Profile | null>(qk.profile);
      client.setQueryData<Profile | null>(qk.profile, (old) =>
        old ? { ...old, liquid_savings: amount } : old,
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous !== undefined) client.setQueryData(qk.profile, ctx.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.profile }),
  });
}

/** Convenience: currency for the signed-in user, defaulting to EUR. */
export function useCurrency(): string {
  const { data } = useProfile();
  return data?.currency ?? 'EUR';
}
