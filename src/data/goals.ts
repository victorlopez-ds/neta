import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from './queryKeys';
import type { FinancialGoal } from '@/types/database';

async function fetchGoals(): Promise<FinancialGoal[]> {
  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as FinancialGoal[];
}

export function useGoals() {
  return useQuery({ queryKey: qk.goals, queryFn: fetchGoals });
}

export interface NewGoalInput {
  title: string;
  target_amount: number;
  target_date?: string | null;
}

export function useCreateGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewGoalInput): Promise<FinancialGoal> => {
      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          title: input.title,
          target_amount: input.target_amount,
          target_date: input.target_date ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as FinancialGoal;
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.goals }),
  });
}

/**
 * Fund a goal via the atomic RPC (see fund_goal in the migrations). Optimistic:
 * bump current_amount locally; on error roll back and toast.
 */
export function useFundGoal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      const { data, error } = await supabase.rpc('fund_goal', {
        p_goal_id: goalId,
        p_amount: amount,
      });
      if (error) throw error;
      return data as FinancialGoal;
    },
    onMutate: async ({ goalId, amount }) => {
      await client.cancelQueries({ queryKey: qk.goals });
      const previous = client.getQueryData<FinancialGoal[]>(qk.goals);
      client.setQueryData<FinancialGoal[]>(qk.goals, (old = []) =>
        old.map((g) =>
          g.id === goalId
            ? {
                ...g,
                current_amount: g.current_amount + amount,
                status:
                  g.current_amount + amount >= g.target_amount ? 'achieved' : g.status,
              }
            : g,
        ),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) client.setQueryData(qk.goals, ctx.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.goals }),
  });
}
