import { useCallback, useEffect, useState } from 'react';

import type { Goal } from '@/models';
import { goalService } from '@/services/goalService';

/** Lists the signed-in user's goals. Exposes `refetch` for after mutations. */
export function useGoals() {
  const [data, setData] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await goalService.list());
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
