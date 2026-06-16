import { useEffect, useState } from 'react';

import { ensureSession } from '@/lib/auth';

/**
 * Ensures an anonymous session exists before the app touches the DB.
 * Gate the app on `ready` (AGENTS.md §8.2 zero-friction identity).
 */
export function useSession() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let active = true;
    ensureSession()
      .then(() => active && setReady(true))
      .catch((e) => active && setError(e as Error));
    return () => {
      active = false;
    };
  }, []);

  return { ready, error };
}
