# RoastMode — Build Plan

Phased build plan for the MVP (v1.0). Depth-first on the core slice, breadth-first after.
Each phase ends with something runnable/testable. Section refs (§) point to `AGENTS.md` (the PRD).

**Build rule:** build depth-first once (prove the stack), breadth-first after (cheap copies).
**Critical-path spine:** Phase 1 → 2 → 3 unblocks everything. Phases 5–6 (notifications + roast)
are the riskiest subsystem and the real product — don't leave too late, don't start before the loop works.

---

## Phase 0 — Gates (before any app code, per PRD §0)

- [ ] Content-validation gate (§0) — faceless TikTok/IG roast posts, 2–3 niches. **Go/no-go.**
- [ ] Model bake-off (§0.1) — Kimi / DeepSeek / Haiku vs Sonnet reference. Pick funniest non-refusing. Feeds §8.3.

> Skip only if already decided to build regardless. These are product gates, not code.

## Phase 1 — Project foundation

- [ ] Expo app init (SDK 54 — read https://docs.expo.dev/versions/v54.0.0/ first, per AGENTS.md top).
- [ ] TS strict, folder skeleton: `src/{models,services,hooks,lib,screens}`.
- [ ] Lint/format, path aliases (`@/`).
- [ ] Nav skeleton — tab bar + stacks, empty screen stubs for all §14 pages.
- **Done when:** app boots, navigate between blank screens.

## Phase 2 — Data layer

- [ ] `src/models` — all §15.2 shapes.
- [ ] Supabase project + schema: `users, goals, completions, skips, buddies, roast_lines`.
- [ ] RLS policies (user owns their rows).
- [ ] `src/lib/supabase.ts` client.
- [ ] Auth (Supabase anon/email) — minimal, just need a user id.
- **Done when:** can read/write a goal row from a script/test.

## Phase 3 — Core vertical slice (the proof)

Loop: **create goal → home list → tap Done → streak updates.**

- [ ] `GoalService` (create/list/get/update/delete/pause).
- [ ] `CompletionService` (complete + streak math → `StreakStats`).
- [ ] `useGoals`, `useGoal`, `useComplete`, `useStreak`.
- [ ] Screens: Home/dashboard, Goal create/edit, Goal detail.
- **Done when:** real round-trip, no mocks. Whole stack proven.

## Phase 4 — Engagement mechanics

- [ ] `SkipService` + skip flow screen (friction: reason → countdown → roast, §4.5).
- [ ] `BuddyService` + buddy invite/manage screen (§4.6).
- [ ] Buddy notify on complete/skip.
- **Done when:** skip recorded w/ friction; buddy sees events.

## Phase 5 — Notifications + escalation (own subsystem)

- [ ] `src/lib/notifications.ts` (expo-notifications) — schedule + deep-link tap.
- [ ] `EscalationService` — tactic ladder, wave→tactic map (§3.3).
- [ ] `NotificationService` — schedule per goal, handle tap → route to complete/skip.
- [ ] `fcm.ts` + Supabase cron Edge Function to trigger at goal times (§8.2).
- **Done when:** ignored goal escalates through waves; tap deep-links into app.

## Phase 6 — Roast content pipeline (§8.4)

- [ ] `ai/provider.ts` swappable interface (bake-off winner).
- [ ] Batch/cron job → fills `roast_lines` shared pool (cat × level × wave).
- [ ] `RoastService.getLine()` — read pool + string-interpolate cue/name/callback (NO live AI v1).
- [ ] Post-generation safety filter (§9.3) + blocklist + kill switch.
- **Done when:** notifications pull real cached roast lines, filtered.

## Phase 7 — Share + monetization

- [ ] `ShareService` — watermarked card build + export (IG/TikTok/X/WhatsApp, §4.8).
- [ ] Share card screen.
- [ ] `BillingService` + paywall screen — free vs paid gating (§12): 5 goals / Unhinged / buddy.
- **Done when:** export a card; gating blocks paid features on free tier.

## Phase 8 — Onboarding + settings + compliance

- [ ] Onboarding flow (welcome → harsh-humor consent §9.1 → defaults → push permission → first goal).
- [ ] Global settings screen (§7.2).
- [ ] First-launch harsh-humor notice; rudeness hard-limits enforced in system prompt + filter.
- [ ] GDPR data export/delete (§10).
- **Done when:** cold-start onboarding works end-to-end.

## Phase 9 — Hardening + ship

- [ ] AI-cost-per-active-user metric (§8.4, §13).
- [ ] Analytics: notif open rate, tactic-wave conversion, D7 (§13).
- [ ] Store assets, App Store/Play compliance pass (§9), Carrot precedent framing.
- [ ] TestFlight / internal track beta.
- **Done when:** submittable build.
