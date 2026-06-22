// Supabase Edge Function — escalation + buddy + digest push driver (AGENTS.md §8.2).
//
// STATUS: scaffold. The local app already schedules Wave-1 reminders on-device
// (src/lib/notifications.ts). This server cron drives the parts a device can't:
//   • conditional escalation — fire Wave 2+ only if the scheduled occurrence
//     was ignored (and stop once completed/skipped),
//   • buddy notify on complete/skip,
//   • daily digest at day start.
//
// NOT YET DEPLOYED / VERIFIED — needs:
//   1. `supabase functions deploy escalation-cron`
//   2. a cron schedule (e.g. every 5 min) via pg_cron / dashboard Schedules,
//   3. EXPO_ACCESS_TOKEN (optional) for the Expo Push API,
//   4. devices to have registered profiles.push_token (migration 0007).
//
// The escalation timing/state (which waves already fired for an occurrence)
// needs a small `notification_log` table — see TODO below — so we don't double-
// send and can stop the ladder once the goal is acted on.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// Escalation ladder offsets (mirror of src/services/escalationService.ts).
const OFFSETS: Record<string, number[]> = {
  slow: [0, 30, 60, 120],
  normal: [0, 15, 30, 45],
  unhinged: [0, 5, 10, 15],
};

type PushMessage = { to: string; title: string; body: string; data?: Record<string, unknown> };

async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(Deno.env.get('EXPO_ACCESS_TOKEN')
        ? { Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}` }
        : {}),
    },
    body: JSON.stringify(messages),
  });
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // service role: bypass RLS for cron reads
  );

  const now = new Date();

  // 1. ESCALATION ───────────────────────────────────────────────────────────
  // TODO: query active, non-paused goals whose schedule has a slot whose time
  // has passed today, join completions/skips for today to find IGNORED ones,
  // and a `notification_log` to know how many waves already fired for this
  // occurrence. Use OFFSETS[goal.escalation_speed] to decide if the next wave
  // is due now, pull a cached roast line (Phase 6 roast_lines pool) for the
  // wave's tactic, and push to profiles.push_token. Record the send in the log.
  void OFFSETS;

  // 2. BUDDY NOTIFY ───────────────────────────────────────────────────────────
  // TODO: completions/skips since last run on goals with buddy_id set → push the
  // buddy. (Requires the buddy to be an app user with a push_token; otherwise
  // fall back to invite-link/SMS — out of scope here.)

  // 3. DAILY DIGEST ───────────────────────────────────────────────────────────
  // TODO: at each user's day-start (respecting quiet hours §7.2), count today's
  // due goals and push one summary roast. Suppress when zero due.

  void now;
  void supabase;
  return new Response(JSON.stringify({ ok: true, note: 'scaffold — see TODOs' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
