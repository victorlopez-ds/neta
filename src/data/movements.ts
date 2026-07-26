import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { uuidv4 } from '@/lib/uuid';
import { qk } from './queryKeys';
import type {
  Category,
  Movement,
  MovementWithCategory,
} from '@/types/database';

/** First and last day (inclusive) of a YYYY-MM month key. */
function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const from = `${month}-01`;
  const to = new Date(y, m, 0).toISOString().slice(0, 10); // day 0 of next month = last day
  return { from, to };
}

async function fetchMovements(month: string): Promise<MovementWithCategory[]> {
  const { from, to } = monthRange(month);
  const { data, error } = await supabase
    .from('movements')
    .select('*, category:categories(*)')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MovementWithCategory[];
}

export function useMovements(month: string) {
  return useQuery({
    queryKey: qk.movements(month),
    queryFn: () => fetchMovements(month),
  });
}

export interface NewMovementInput {
  category: Category; // full object so we can build the optimistic joined row
  amount: number;
  concept: string;
  date: string; // YYYY-MM-DD
  tags?: string[];
}

/**
 * Optimistic add. The UI updates instantly (docs/CACHING.md §3):
 *   1. build the row with a client uuid and inject it into the month cache
 *   2. fire the insert in the background
 *   3. on error, roll back to the snapshot; on settle, revalidate derived views
 */
export function useAddMovement(month: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewMovementInput): Promise<Movement> => {
      const id = uuidv4();
      const { data, error } = await supabase
        .from('movements')
        .insert({
          id,
          category_id: input.category.id,
          amount: input.amount,
          concept: input.concept,
          date: input.date,
          tags: input.tags ?? [],
          // user_id is filled server-side by the column default auth.uid()
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as Movement;
    },

    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: qk.movements(month) });
      const previous = client.getQueryData<MovementWithCategory[]>(qk.movements(month));

      const optimistic: MovementWithCategory = {
        id: uuidv4(),
        user_id: 'optimistic',
        category_id: input.category.id,
        concept: input.concept,
        amount: input.amount,
        date: input.date,
        is_recurring: false,
        template_id: null,
        tags: input.tags ?? [],
        created_at: new Date().toISOString(),
        category: input.category,
      };

      client.setQueryData<MovementWithCategory[]>(qk.movements(month), (old = []) =>
        [optimistic, ...old].sort((a, b) => b.date.localeCompare(a.date)),
      );

      return { previous };
    },

    onError: (_err, _input, context) => {
      // Roll back — the caller surfaces a non-blocking toast.
      if (context?.previous) {
        client.setQueryData(qk.movements(month), context.previous);
      }
    },

    onSettled: () => {
      // Reconcile the list + all derived dashboard aggregates for this month.
      client.invalidateQueries({ queryKey: qk.movements(month) });
      client.invalidateQueries({ queryKey: qk.monthlyHealth(month) });
      client.invalidateQueries({ queryKey: qk.breakdown(month) });
      client.invalidateQueries({ queryKey: qk.healthSeries });
    },
  });
}

export function useDeleteMovement(month: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('movements').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: qk.movements(month) });
      const previous = client.getQueryData<MovementWithCategory[]>(qk.movements(month));
      client.setQueryData<MovementWithCategory[]>(qk.movements(month), (old = []) =>
        old.filter((m) => m.id !== id),
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) client.setQueryData(qk.movements(month), ctx.previous);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: qk.movements(month) });
      client.invalidateQueries({ queryKey: qk.monthlyHealth(month) });
      client.invalidateQueries({ queryKey: qk.breakdown(month) });
    },
  });
}
