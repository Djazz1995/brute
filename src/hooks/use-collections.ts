import { useCallback, useEffect, useState } from 'react';

import type { Collection } from '@/models';
import { collectionService } from '@/services/collectionService';

/** Lists the user's goal collections (§4.1). */
export function useCollections() {
  const [data, setData] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await collectionService.list());
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
