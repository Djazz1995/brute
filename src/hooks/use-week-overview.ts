import { useCallback, useEffect, useState } from 'react';

import type { Goal } from '@/models';
import { statsService, type WeekOverview } from '@/services/statsService';

/** Week grid (done/due per day) + per-goal streaks (§4.7). */
export function useWeekOverview(goals: Goal[]) {
  const [data, setData] = useState<WeekOverview>({ grid: [], streaks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const ids = goals.map((g) => g.id).join(',');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await statsService.getOverview(goals));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
