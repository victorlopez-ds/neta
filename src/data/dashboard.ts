import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { qk } from './queryKeys';
import type { CategoryBreakdown, MonthlyHealth } from '@/types/database';

/** Reads the pre-aggregated v_monthly_health view for one month. */
async function fetchMonthlyHealth(month: string): Promise<MonthlyHealth | null> {
  const firstOfMonth = `${month}-01`;
  const { data, error } = await supabase
    .from('v_monthly_health')
    .select('*')
    .eq('month', firstOfMonth)
    .maybeSingle();
  if (error) throw error;
  return (data as MonthlyHealth) ?? null;
}

export function useMonthlyHealth(month: string) {
  return useQuery({
    queryKey: qk.monthlyHealth(month),
    queryFn: () => fetchMonthlyHealth(month),
  });
}

async function fetchBreakdown(month: string): Promise<CategoryBreakdown[]> {
  const firstOfMonth = `${month}-01`;
  const { data, error } = await supabase
    .from('v_category_breakdown')
    .select('*')
    .eq('month', firstOfMonth);
  if (error) throw error;
  return (data ?? []) as CategoryBreakdown[];
}

export function useCategoryBreakdown(month: string) {
  return useQuery({
    queryKey: qk.breakdown(month),
    queryFn: () => fetchBreakdown(month),
  });
}

/** Last N months of health rows for the annual income-vs-expense line/bars. */
async function fetchHealthSeries(months = 6): Promise<MonthlyHealth[]> {
  const { data, error } = await supabase
    .from('v_monthly_health')
    .select('*')
    .order('month', { ascending: false })
    .limit(months);
  if (error) throw error;
  return ((data ?? []) as MonthlyHealth[]).reverse();
}

export function useHealthSeries(months = 6) {
  return useQuery({
    queryKey: qk.healthSeries,
    queryFn: () => fetchHealthSeries(months),
  });
}
