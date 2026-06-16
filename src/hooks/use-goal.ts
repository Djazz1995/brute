import { useCallback, useEffect, useState } from 'react';

import type { Goal } from '@/models';
import { goalService } from '@/services/goalService';

/** Loads a single goal by id. */
export function useGoal(id: string | undefined) {
  const [data, setData] = useState<Goal>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(undefined);
    try {
      setData(await goalService.get(id));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
