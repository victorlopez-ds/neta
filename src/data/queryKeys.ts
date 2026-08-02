/** Central registry of query keys so invalidation stays consistent. */
export const qk = {
  profile: ['profile'] as const,
  categories: ['categories'] as const,
  movements: (month: string) => ['movements', month] as const,
  movementsAll: ['movements'] as const,
  monthlyHealth: (month: string) => ['monthly-health', month] as const,
  monthlyHealthAll: ['monthly-health'] as const,
  breakdown: (month: string) => ['breakdown', month] as const,
  healthSeries: ['health-series'] as const,
  goals: ['goals'] as const,
  assets: ['assets'] as const,
  recurring: ['recurring'] as const,
};
