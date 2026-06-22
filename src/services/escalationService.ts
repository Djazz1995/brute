/** Escalation tactic ladder (AGENTS.md §3.3, §15.3). Pure logic — no I/O.
 *
 * Escalation is a *tactic* ladder, not a volume ladder: each wave applies a
 * different behavioral lever (§3.2), and the gaps between waves are set by the
 * goal's escalation speed. A goal ignored at its scheduled time fires Wave 1 at
 * the time, then later waves at increasing offsets until acted on or exhausted.
 */

import type { EscalationSpeed, EscalationTactic, EscalationWave } from '@/models';

/** The four tactics, in ladder order (§3.3). */
const TACTICS: EscalationTactic[] = ['snark', 'shrink', 'stakes', 'roast'];

/**
 * Minutes after the scheduled time each wave fires, per speed. Wave 1 is always
 * at the scheduled time (offset 0); later waves widen (slow) or tighten
 * (unhinged) around the Normal baseline of 0 / 15 / 30 / 45.
 */
const OFFSETS: Record<EscalationSpeed, number[]> = {
  slow: [0, 30, 60, 120],
  normal: [0, 15, 30, 45],
  unhinged: [0, 5, 10, 15],
};

export const escalationService = {
  /** The full wave ladder for a speed (4 waves: snark → shrink → stakes → roast). */
  ladder(speed: EscalationSpeed): EscalationWave[] {
    return OFFSETS[speed].map((offsetMinutes, i) => ({
      wave: i + 1,
      tactic: TACTICS[i],
      offsetMinutes,
    }));
  },

  /**
   * The next wave to fire given how many have already fired for this scheduled
   * occurrence. Returns `undefined` once the ladder is exhausted (§3.3 Wave 4+
   * is the last). `firedCount` = waves already sent (0 → return Wave 1).
   */
  nextWave(speed: EscalationSpeed, firedCount: number): EscalationWave | undefined {
    const ladder = this.ladder(speed);
    return ladder[firedCount];
  },
};
