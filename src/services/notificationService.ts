/** Local notification scheduling per goal + tap routing. AGENTS.md §4.2, §15.3.
 *
 *  v1 schedules Wave-1 reminders locally at each goal's scheduled slot times.
 *  Conditional escalation (Wave 2+ only if ignored) and weekly-target/digest
 *  nudges are server-driven (§8.2) — see the Edge Function scaffold. Body copy
 *  here is a placeholder until the Phase 6 cached roast pool lands. */

import { Platform } from 'react-native';

import {
  cancel,
  ensurePermissions,
  getAllScheduled,
  scheduleWeekly,
  setupAndroidChannel,
  type NotifData,
} from '@/lib/notifications';
import type { Goal } from '@/models';
import { escalationService } from '@/services/escalationService';

/** Local notifications are native-only; no-op on web. */
const SUPPORTED = Platform.OS !== 'web';

/** Placeholder Wave-1 copy (Phase 6 replaces with cached, filtered lines). */
function wave1Body(goal: Goal): string {
  const tactic = escalationService.nextWave(goal.escalationSpeed, 0)?.tactic ?? 'snark';
  void tactic; // wave→tactic mapping reserved for Phase 6 copy selection.
  return goal.cue ? `${goal.cue}. It’s staring at you.` : `${goal.name}. Now. No excuses.`;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

export const notificationService = {
  async init(): Promise<boolean> {
    if (!SUPPORTED) return false;
    await setupAndroidChannel();
    return ensurePermissions();
  },

  /** (Re)schedule all of a goal's Wave-1 reminders. Cancels its old ones first. */
  async scheduleForGoal(goal: Goal): Promise<void> {
    if (!SUPPORTED) return;
    await this.cancelForGoal(goal.id);
    if (goal.paused || goal.archived) return;

    for (const slot of goal.schedule.slots) {
      const { hour, minute } = parseTime(slot.time);
      const data: NotifData = {
        goalId: goal.id,
        wave: 1,
        deepLink: `/goal/${goal.id}`,
      };
      await scheduleWeekly({
        isoDay: slot.day,
        hour,
        minute,
        title: 'RoastMode',
        body: wave1Body(goal),
        data,
      });
    }
  },

  /** Cancel every scheduled notification belonging to a goal. */
  async cancelForGoal(goalId: string): Promise<void> {
    if (!SUPPORTED) return;
    const all = await getAllScheduled();
    await Promise.all(
      all
        .filter((req) => {
          const data = req.content.data as Partial<NotifData> | undefined;
          return data?.goalId === goalId;
        })
        .map((req) => cancel(req.identifier))
    );
  },

  /** Re-sync scheduling for the full goal set (e.g. on app start). */
  async rescheduleAll(goals: Goal[]): Promise<void> {
    for (const goal of goals) await this.scheduleForGoal(goal);
  },

  /** Resolve a notification tap to an in-app route. */
  routeForTap(data: NotifData): string {
    return data.deepLink;
  },
};
