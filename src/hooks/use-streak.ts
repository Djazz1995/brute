import { useCallback, useEffect, useState } from 'react';

import type { StreakStats } from '@/models';
import { completionService } from '@/services/completionService';

/** Loads derived streak/completion stats for a goal (§4.7). */
export function useStreak(goalId: string | undefined) {
  const [data, setData] = useState<StreakStats>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const refetch = useCallback(async () => {
    if (!goalId) return;
    setLoading(true);
    setError(undefined);
    try {
      setData(await completionService.getStats(goalId));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
