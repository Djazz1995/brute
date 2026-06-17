/** Goal and its value types. See AGENTS.md §4.1, §6, §15.2. */

export type GoalCategory = 'gym' | 'study' | 'chores' | 'diet' | 'sleep' | 'custom';

/** Rudeness tier (AGENTS.md §6). 1 = Mild Disappointment … 4 = Unhinged. */
export type RudenessLevel = 1 | 2 | 3 | 4;

/** How fast escalation waves fire (AGENTS.md §4.1). */
export type EscalationSpeed = 'slow' | 'normal' | 'unhinged';

/**
 * One reminder slot: a weekday + local time. One slot = one notification
 * trigger (Phase 5). Different times per day and multiple times per day are
 * both just multiple slots (AGENTS.md §4.1).
 * - `day`: ISO weekday (1 = Mon … 7 = Sun).
 * - `time`: local "HH:mm".
 * - `label`: optional name for category-specific framing, e.g. "Lunch",
 *   "Bedtime" (diet/sleep). Feeds Wave-1 copy (Phase 6).
 */
export type ScheduleSlot = {
  day: number;
  time: string;
  label?: string;
};

export type Schedule = {
  slots: ScheduleSlot[];
};

export type Goal = {
  id: string;
  userId: string;
  name: string;
  category: GoalCategory;
  /** Concrete trigger text used in Wave 1, e.g. "bag by the door" (§4.1). */
  cue?: string;
  /**
   * User-declared excuses/blockers ("too tired", "no time"). Roast-callback
   * fuel (§5 "it learns you"); the excuse is fair game, never the person
   * (§3.1). Passes the §9.3 safety filter before any generation use.
   */
  blockers: string[];
  schedule: Schedule;
  rudenessLevel: RudenessLevel;
  escalationSpeed: EscalationSpeed;
  /** Accountability buddy witnessing this goal (§4.6), if any. */
  buddyId?: string;
  /** User-named grouping this goal belongs to (§4.1 Collection), if any. */
  collectionId?: string;
  /** Paused goals keep history but fire no notifications (§7.1). */
  paused: boolean;
  createdAt: string;
};
