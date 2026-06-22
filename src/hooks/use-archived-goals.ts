import { useCallback, useEffect, useState } from 'react';

import type { Goal } from '@/models';
import { goalService } from '@/services/goalService';

/** Lists the user's archived goals (§4.7). `refetch` after unarchive/delete. */
export function useArchivedGoals() {
  const [data, setData] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await goalService.listArchived());
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
