import { useCallback, useEffect, useState } from 'react';

import type { User, UserDefaults } from '@/models';
import { userService } from '@/services/userService';

/** Wraps UserService (§15.1 `useUser`): profile, defaults, tier, onboarded. */
export function useUser() {
  const [data, setData] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await userService.getUser());
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateDefaults = useCallback(async (patch: Partial<UserDefaults>) => {
    const updated = await userService.updateDefaults(patch);
    setData(updated);
    return updated;
  }, []);

  return { data, loading, error, refetch, updateDefaults };
}
