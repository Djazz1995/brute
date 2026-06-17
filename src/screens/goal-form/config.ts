/**
 * Goal-form configuration (AGENTS.md §4.1). A goal "type" is a descriptor:
 * sensible `defaults` (prefill) + the `blocks` it renders. Adding a type =
 * add an entry here; a genuinely new field = add a block id + one component in
 * `blocks.tsx` and list it. The form renders blocks from the descriptor, so the
 * shared 80% (name, schedule, rudeness, buddy…) is never duplicated.
 */

import type { EscalationSpeed, GoalCategory, RudenessLevel, Schedule, ScheduleSlot } from '@/models';

export const CATEGORIES: GoalCategory[] = [
  'gym',
  'study',
  'chores',
  'diet',
  'water',
  'sleep',
  'custom',
];
export const SPEEDS: EscalationSpeed[] = ['slow', 'normal', 'unhinged'];
export const RUDENESS: RudenessLevel[] = [1, 2, 3, 4];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // index+1 = ISO day
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** A renderable field section. Name + Category are core and always shown. */
export type GoalBlockId =
  | 'cue'
  | 'blockers'
  | 'schedule'
  | 'measure'
  | 'rudeness'
  | 'escalation'
  | 'buddy'
  | 'collection';

/** Category-specific reminder labels (with a default time) for the builder. */
export const LABEL_OPTIONS: Partial<Record<GoalCategory, { label: string; time: string }[]>> = {
  diet: [
    { label: 'Breakfast', time: '08:00' },
    { label: 'Lunch', time: '13:00' },
    { label: 'Dinner', time: '19:00' },
    { label: 'Snack', time: '16:00' },
  ],
  sleep: [
    { label: 'Wind-down', time: '22:00' },
    { label: 'Bedtime', time: '23:00' },
  ],
};

/** Prefill defaults for a goal type — all still editable in the form. */
export type CategoryConfig = {
  scheduleMode: 'fixed' | 'weekly';
  weeklyTarget?: number;
  defaultDays?: number[];
  defaultTime?: string;
  trackAmount: boolean;
  defaultUnit?: string;
  defaultTarget?: number;
  namePlaceholder?: string;
  cuePlaceholder?: string;
};

export type GoalTypeDescriptor = {
  defaults: CategoryConfig;
  blocks: GoalBlockId[];
};

/** Every type renders these unless its descriptor overrides (e.g. chores drops `measure`). */
const FULL_BLOCKS: GoalBlockId[] = [
  'cue',
  'blockers',
  'schedule',
  'measure',
  'rudeness',
  'escalation',
  'buddy',
  'collection',
];

export const GOAL_TYPES: Record<GoalCategory, GoalTypeDescriptor> = {
  gym: {
    defaults: {
      scheduleMode: 'weekly',
      weeklyTarget: 3,
      trackAmount: false,
      namePlaceholder: 'Gym',
      cuePlaceholder: 'bag by the door',
    },
    // Sessions vary (legs / run / lift) — no stable per-time number to track.
    blocks: FULL_BLOCKS.filter((b) => b !== 'measure'),
  },
  study: {
    defaults: {
      scheduleMode: 'weekly',
      weeklyTarget: 5,
      trackAmount: true,
      defaultUnit: 'min',
      defaultTarget: 30,
      namePlaceholder: 'Study session',
      cuePlaceholder: 'books on the desk',
    },
    blocks: FULL_BLOCKS,
  },
  chores: {
    defaults: {
      scheduleMode: 'fixed',
      defaultDays: [2],
      defaultTime: '18:00',
      trackAmount: false,
      namePlaceholder: 'Take out the trash',
    },
    // Binary by nature — no measure block.
    blocks: FULL_BLOCKS.filter((b) => b !== 'measure'),
  },
  diet: {
    defaults: {
      scheduleMode: 'fixed',
      defaultDays: ALL_DAYS,
      defaultTime: '13:00',
      trackAmount: false,
      namePlaceholder: 'Eat clean',
    },
    blocks: FULL_BLOCKS,
  },
  water: {
    defaults: {
      scheduleMode: 'fixed',
      defaultDays: ALL_DAYS,
      defaultTime: '10:00',
      trackAmount: true,
      defaultUnit: 'L',
      defaultTarget: 2,
      namePlaceholder: 'Drink water',
    },
    blocks: FULL_BLOCKS,
  },
  sleep: {
    defaults: {
      scheduleMode: 'fixed',
      defaultDays: ALL_DAYS,
      defaultTime: '23:00',
      trackAmount: false,
      namePlaceholder: 'Sleep on time',
      cuePlaceholder: 'phone out of the room',
    },
    blocks: FULL_BLOCKS,
  },
  custom: {
    defaults: { scheduleMode: 'fixed', trackAmount: false },
    blocks: FULL_BLOCKS,
  },
};

/** Build the initial `Schedule` from a type's defaults. */
export function scheduleFromDefaults(cfg: CategoryConfig): Schedule {
  return cfg.scheduleMode === 'weekly'
    ? { slots: [], weeklyTarget: cfg.weeklyTarget ?? 3 }
    : { slots: [] };
}

export function slotKey(s: ScheduleSlot): string {
  return `${s.day}-${s.time}-${s.label ?? ''}`;
}

export function slotText(s: ScheduleSlot): string {
  return `${WEEKDAYS[s.day - 1]} ${s.label ? `${s.label} ` : ''}${s.time}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function timeToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function dateToTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
