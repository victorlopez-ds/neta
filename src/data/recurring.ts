import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from './queryKeys';
import type { RecurrenceFrequency, RecurringTemplate } from '@/types/database';

async function fetchTemplates(): Promise<RecurringTemplate[]> {
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RecurringTemplate[];
}

export function useRecurringTemplates() {
  return useQuery({ queryKey: qk.recurring, queryFn: fetchTemplates });
}

export interface NewTemplateInput {
  category_id: number;
  concept: string;
  amount: number;
  frequency: RecurrenceFrequency;
  billing_day: number;
}

export function useCreateTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewTemplateInput) => {
      const { data, error } = await supabase
        .from('recurring_templates')
        .insert(input)
        .select('*')
        .single();
      if (error) throw error;
      return data as RecurringTemplate;
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.recurring }),
  });
}

/** Pause / resume a subscription or DCA plan. */
export function useToggleTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('recurring_templates')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, isActive }) => {
      await client.cancelQueries({ queryKey: qk.recurring });
      const previous = client.getQueryData<RecurringTemplate[]>(qk.recurring);
      client.setQueryData<RecurringTemplate[]>(qk.recurring, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, is_active: isActive } : t)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) client.setQueryData(qk.recurring, ctx.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.recurring }),
  });
}
