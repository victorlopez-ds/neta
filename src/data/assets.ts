import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from './queryKeys';
import type { Asset, AssetType } from '@/types/database';

async function fetchAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Asset[];
}

export function useAssets() {
  return useQuery({ queryKey: qk.assets, queryFn: fetchAssets });
}

export interface NewAssetInput {
  name: string;
  asset_type: AssetType;
  current_value: number;
}

export function useCreateAsset() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewAssetInput): Promise<Asset> => {
      const { data, error } = await supabase
        .from('assets')
        .insert({
          name: input.name,
          asset_type: input.asset_type,
          current_value: input.current_value,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as Asset;
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.assets }),
  });
}

export function useUpdateAssetValue() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, value }: { assetId: string; value: number }) => {
      const { data, error } = await supabase
        .from('assets')
        .update({ current_value: value })
        .eq('id', assetId)
        .select('*')
        .single();
      if (error) throw error;
      return data as Asset;
    },
    onMutate: async ({ assetId, value }) => {
      await client.cancelQueries({ queryKey: qk.assets });
      const previous = client.getQueryData<Asset[]>(qk.assets);
      client.setQueryData<Asset[]>(qk.assets, (old = []) =>
        old.map((a) => (a.id === assetId ? { ...a, current_value: value } : a)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) client.setQueryData(qk.assets, ctx.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.assets }),
  });
}

export function useDeleteAsset() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: qk.assets });
      const previous = client.getQueryData<Asset[]>(qk.assets);
      client.setQueryData<Asset[]>(qk.assets, (old = []) =>
        old.filter((a) => a.id !== id),
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) client.setQueryData(qk.assets, ctx.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.assets }),
  });
}
