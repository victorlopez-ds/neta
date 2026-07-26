import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from './queryKeys';
import type { Category } from '@/types/database';

async function fetchCategories(): Promise<Category[]> {
  // RLS returns global defaults (user_id IS NULL) + the user's own categories.
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30, // categories change rarely
  });
}

export function indexCategories(categories: Category[] | undefined) {
  const map = new Map<number, Category>();
  (categories ?? []).forEach((c) => map.set(c.id, c));
  return map;
}
