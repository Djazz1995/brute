import { useCallback, useState } from 'react';

import type { Gate } from '@/services/billingService';
import { billingService } from '@/services/billingService';
import type { RudenessLevel } from '@/models';

/**
 * Wrapper over BillingService (§15.1 `useBilling`). `enabled` reflects the
 * monetization master switch — when false, all gate checks resolve allowed.
 */
export function useBilling() {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<Error>();

  const canAddGoal = useCallback((): Promise<Gate> => billingService.canAddGoal(), []);
  const canUseRudeness = useCallback(
    (level: RudenessLevel): Promise<Gate> => billingService.canUseRudeness(level),
    []
  );
  const canUseBuddy = useCallback((): Promise<Gate> => billingService.canUseBuddy(), []);

  const purchase = useCallback(async () => {
    setPurchasing(true);
    setError(undefined);
    try {
      await billingService.purchase();
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setPurchasing(false);
    }
  }, []);

  return {
    enabled: billingService.enabled,
    canAddGoal,
    canUseRudeness,
    canUseBuddy,
    purchase,
    purchasing,
    error,
  };
}
