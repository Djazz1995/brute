/** Paywall gating + (stub) purchase. AGENTS.md §12, §15.3.
 *
 *  Master switch is `MONETIZATION_ENABLED` (src/lib/config.ts). When OFF — the
 *  launch default — every gate returns allowed, so the app is fully free and the
 *  paywall never shows. When ON, free-tier limits (FREE_TIER) apply until the
 *  user is `paid`.
 *
 *  v1 `purchase()` is a STUB: it flips the profile tier to 'paid' locally with no
 *  store SDK. Real IAP (expo-iap / RevenueCat) drops in here when monetization is
 *  actually switched on — callers don't change.
 */

import { FREE_TIER, MONETIZATION_ENABLED } from '@/lib/config';
import type { RudenessLevel } from '@/models';
import { goalService } from '@/services/goalService';
import { userService } from '@/services/userService';

/** A gate result: allowed, or blocked with a reason for the paywall copy. */
export type Gate = { allowed: true } | { allowed: false; reason: string };

const ALLOW: Gate = { allowed: true };

async function isPaid(): Promise<boolean> {
  return (await userService.getTier()) === 'paid';
}

export const billingService = {
  /** Is monetization active at all (drives whether the paywall/gates exist). */
  get enabled(): boolean {
    return MONETIZATION_ENABLED;
  },

  /** Can the user create another goal? (§12: free tier capped.) */
  async canAddGoal(): Promise<Gate> {
    if (!MONETIZATION_ENABLED || (await isPaid())) return ALLOW;
    const count = (await goalService.list()).length;
    if (count < FREE_TIER.maxGoals) return ALLOW;
    return {
      allowed: false,
      reason: `Free plan is limited to ${FREE_TIER.maxGoals} goal${FREE_TIER.maxGoals === 1 ? '' : 's'}. Upgrade for up to 5.`,
    };
  },

  /** May this rudeness level be used? Unhinged (4) is paid (§12). */
  async canUseRudeness(level: RudenessLevel): Promise<Gate> {
    if (!MONETIZATION_ENABLED || (await isPaid())) return ALLOW;
    if (level <= FREE_TIER.maxRudeness) return ALLOW;
    return { allowed: false, reason: 'Unhinged mode is a paid feature. Upgrade to unleash it.' };
  },

  /** Is the accountability buddy feature available? Paid (§4.6, §12). */
  async canUseBuddy(): Promise<Gate> {
    if (!MONETIZATION_ENABLED || FREE_TIER.buddyAllowed || (await isPaid())) return ALLOW;
    return { allowed: false, reason: 'Accountability buddies are a paid feature. Upgrade to add one.' };
  },

  /** STUB purchase — flips the tier to 'paid'. Replace with real IAP later. */
  async purchase(): Promise<void> {
    await userService.setTier('paid');
  },

  /** Testing/support: drop back to free. */
  async restoreFree(): Promise<void> {
    await userService.setTier('free');
  },
};
