import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from './queryKeys';
import type { Category, CategoryType } from '@/types/database';

export interface NewCategoryInput {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

/** Custom user categories (categories.user_id defaults to auth.uid() server-side is NOT set —
 * unlike movements, the table has no DB default, so we pass it explicitly here). */
export function useCreateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewCategoryInput): Promise<Category> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...input, user_id: userId })
        .select('*')
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.categories }),
  });
}

export function useDeleteCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.categories }),
  });
}
