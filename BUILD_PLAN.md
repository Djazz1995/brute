# RoastMode — Build Plan

Phased build plan for the MVP (v1.0). Depth-first on the core slice, breadth-first after.
Each phase ends with something runnable/testable. Section refs (§) point to `AGENTS.md` (the PRD).

**Build rule:** build depth-first once (prove the stack), breadth-first after (cheap copies).
**Critical-path spine:** Phase 1 → 2 → 3 unblocks everything. Phases 5–6 (notifications + roast)
are the riskiest subsystem and the real product — don't leave too late, don't start before the loop works.

### Positioning (read before prioritizing)

**Underneath, this is a habit tracker.** Streaks + schedules + completion logging + day/week views = the substrate that actually moves people to their goals. Build it to stand alone (competent tracker first); roast is the layer on top, not a substitute for solid tracking.

**Roast = trojan horse, not the cargo.** Comedy sells the install; it does NOT retain. Treat it as acquisition, never as the whole product.

- **Acquisition (roast):** screenshottable notifications = free marketing. Real, proven (Carrot, Duolingo owl). But "AI roast" is cheap to clone — not a moat.
- **Retention (the moat, currently undersold in this build):** in priority order —
  1. **It works** — behavior change retains (§3 levers). Outcome > joke.
  2. **Social witness** (§4.6) — a human watching beats any AI line. *This is the moat — protect its priority; do not let it slip to "nice-to-have."*
  3. **It learns you** (§5.3) — callbacks to the user's own excuses = switching cost.
- **Failure mode to design against:** building a comedy-generator that nags, when the winner is a behavior-engine that happens to be funny (PRD §3).
- **Non-negotiable:** Phase 0 content gate. If roast posts don't travel organically, the acquisition thesis is dead before code — do not skip to coding.

---

## Phase 0 — Gates (before any app code, per PRD §0)

- [ ] Content-validation gate (§0) — faceless TikTok/IG roast posts, 2–3 niches. **Go/no-go.**
- [ ] Model bake-off (§0.1) — Kimi / DeepSeek / Haiku vs Sonnet reference. Pick funniest non-refusing. Feeds §8.3.

> Skip only if already decided to build regardless. These are product gates, not code.

## Phase 1 — Project foundation ✅ DONE

- [x] Expo app init (SDK 54 — RN 0.81, React 19.1, expo-router 6).
- [x] TS strict, folder skeleton: `src/{models,services,hooks,lib,screens}`.
- [x] Lint/format, path aliases (`@/`). — `expo lint` + prettier (`.prettierrc.json`, `format` script, `eslint-config-prettier`).
- [x] Nav skeleton — root Stack + `(tabs)` group, stubs for all 11 §14 pages (routing in `src/app`, UI in `src/screens` via `ScreenPlaceholder`).
- **Done when:** app boots, navigate between blank screens. — verified: tsc clean, lint exit 0, web + iOS bundles export.

## Phase 2 — Data layer ✅ DONE (round-trip verified)

- [x] `src/models` — all §15.2 shapes (one file per model + barrel `index.ts`).
- [x] Schema: `profiles, goals, completions, skips, buddies, roast_lines` — `supabase/migrations/0001_init.sql` (idempotent). Applied to cloud project.
- [x] RLS policies (owner-only CRUD; `roast_lines` read-only to authenticated). In the migration.
- [x] `src/lib/supabase.ts` client — web-safe chunked SecureStore adapter, `persistSession`, `autoRefreshToken`.
- [x] Auth — `src/lib/auth.ts` `ensureSession()` anon sign-in + profile auto-create trigger. Anonymous sign-ins enabled in dashboard.
- [x] `.env` wired (gitignored) — real project URL + publishable key.
- **Done when:** can read/write a goal row. — ✅ `npm run db:smoke` passes: anon sign-in → insert → read → delete.

## Phase 3 — Core vertical slice (the proof) — code-complete (UI sim run pending)

Loop: **create goal → home list → tap Done → streak updates.**

- [x] `GoalService` (list/get/create/update/setPaused/remove) — `src/services/goalService.ts`, snake↔camel mapper.
- [x] `CompletionService` (complete + streak math → `StreakStats`) — `src/services/completionService.ts`. Streaks from distinct completion days; rates = completions/(completions+skips) per window; `ignoredCount` TODO Phase 5.
- [x] Hooks `useGoals`, `useGoal`, `useComplete`, `useStreak` (+ `useSession` session gate in root layout).
- [x] Screens: Home (list + new), Goal create/edit (form, prefill on edit), Goal detail (stats + Done/Pause/Edit/Delete). Shared `Button` component.
- **Done when:** real round-trip, no mocks. — data path ✅ verified: `npm run db:smoke3` (goal → completion → read → cascade, RLS holds). tsc/lint/web-export green.
  - [x] Visual run in iOS simulator — exercised on device (drove keyboard, tab-bar, time-picker, scheduling fixes).

### Phase 3 polish (UI, no new deps)

- [x] Goal-detail hierarchy: **Done** as hero (taller primary), **Edit** → header-right button, **Delete** demoted to a small red text link, Pause secondary.
- [x] "**Next reminder**" card on goal detail — soonest upcoming slot from `schedule.slots` (pure date math; shows "Paused — next would be" when paused).

## Phase 4 — Engagement mechanics ✅ DONE

- [x] `SkipService` + `useSkip` + skip flow screen (friction: reason → 5s countdown → final roast, §4.5). Entry: "I can't today" on goal detail. Placeholder roasts (Phase 6 replaces).
- [x] `BuddyService` + `useBuddies` + Buddy manage screen (invite by contact / list / remove, §4.6). Reached via Settings. Buddy picker in goal form; `goal.buddyId` wired.
- [x] Completions carry `witnessed` when the goal has a buddy; detail shows a "buddy watching" indicator.
- **Done when:** skip recorded w/ friction; buddy link + witnessed flag persist. — ✅ `npm run db:smoke4` (skip + buddy + witnessed, RLS holds). tsc/lint green.

> Buddy **push delivery** on complete/skip needs FCM infra → tracked in Phase 5. Data (link + witnessed flag) already persists here.

## Phase 4.5 — Goal collections (user grouping) — code-complete (migration apply + smoke pending)

User-named ambitions that group goals (e.g. "Getting fit", "Run a marathon", "Build a side project"). Distinct from §4.1 `category` (gym/study/… — sets roast tone). A goal has one category + an optional collection.

- [x] `Collection` model + `collectionId?` on `Goal` (`src/models`); wired through `goalService` (row map + input).
- [x] Schema: `collections` table + `goals.collection_id` FK (nullable, `on delete set null`) — `supabase/migrations/0003_add_collections.sql`, owner-only RLS. **Not yet applied to cloud (needs dashboard SQL run — only anon key available locally).**
- [x] `CollectionService` (list/create/rename/remove) + `useCollections`. Delete = ungroup goals (FK set null), not delete them.
- [x] UI: pick/create collection in goal form; Home groups goals by collection (SectionList); Collections manage screen reached from Settings.
- [ ] Collection filter on stats + agenda — deferred to Phase 5 (those screens don't exist yet).
- **Done when:** create a collection, assign goals, Home shows goals grouped under it. — code + tsc/lint green; `npm run db:smoke4_5` written (create + group + rename + ungroup-on-delete), **passes once migration 0003 is applied to cloud.**

## Phase 4.6 — Habit-tracker depth

The tracker fundamentals standard habit apps have, and that give the roast better fuel. Extends existing `Goal` / `Schedule` / `CompletionService` (Phases 2–3).

- [ ] **Flexible-frequency goals** — "N times per week, any day" alongside fixed weekday+time slots. Add a frequency mode to `Schedule` (`fixed` slots vs `weeklyTarget: N`). Streak math counts per-period target hit, not per-slot.
- [ ] **Quantified habits** — optional measurable target on a goal (`targetValue` + `unit`, e.g. 20 pages / 2 L). Completion logs an `amount`; partial counts allowed. `Completion` gains `amount?`. Drives partial-credit streaks **and** roast fuel (see Phase 6).
- [ ] **Streak freeze / rest day** — protect the streak from one miss instead of weaponizing it (anti-rage-quit, the §5 loss-aversion lever done right). Either a planned weekly rest day (doesn't break streak) or N freezes/period. Streak math treats a freeze/rest day as non-breaking. Free-tier cap on freezes; more = paid (upgrade lever).
- [ ] **Archive / completed-goal history** — archive a finished or paused-forever goal without deleting its history; browsable past completions (identity lever, §3.2). `Goal` gains `archived` state.
- **Done when:** a weekly-target goal tracks correctly; a quantified goal logs a partial amount; a streak survives a rest day; an archived goal leaves history intact.

## Phase 5 — Notifications + escalation (own subsystem)

- [ ] `src/lib/notifications.ts` (expo-notifications) — schedule + deep-link tap.
- [ ] `EscalationService` — tactic ladder, wave→tactic map (§3.3).
- [ ] `NotificationService` — schedule per goal, handle tap → route to complete/skip.
- [ ] `fcm.ts` + Supabase cron Edge Function to trigger at goal times (§8.2).
- [ ] **Buddy push on complete/skip** (carried from Phase 4) — FCM to the buddy's device when a witnessed goal is completed or skipped (§4.6).
- [ ] Today's per-goal **status (done / pending / skipped)** on home + goal detail — needs scheduled-vs-acted tracking (same source that fills `StreakStats.ignoredCount`, stubbed in Phase 3).
- [ ] **Agenda / calendar screen** — pick a day → see every goal/task scheduled for that day (with its status: done / pending / skipped). Day-by-day view of what's due, driven by `schedule.slots` + the same status source above. New screen, reached from Home. Read-only browse in v1; tap a goal → goal detail.
- [ ] **Daily digest roast** — one push at day-start (configurable time, respects quiet hours §7.2) summarizing today's scheduled goals as a single roast ("3 tasks today. History says you bail on 2."). Schedule + deliver here; roast copy comes from Phase 6. Counts today's slots from `schedule.slots`; suppress if zero goals due.
- [ ] **Stats screen + week overview** — new screen off Home. Per-day done-vs-not-done counts, current/longest streak (reuse `StreakStats`), and a 7-day grid (this week: each day done/missed). Driven by the same scheduled-vs-acted status source above. Read-only.
- **Done when:** ignored goal escalates through waves; tap deep-links into app; agenda day-view lists that day's goals; daily digest fires at day-start; stats screen shows week grid + streak.

## Phase 6 — Roast content pipeline (§8.4)

- [ ] `ai/provider.ts` swappable interface (bake-off winner).
- [ ] Batch/cron job → fills `roast_lines` shared pool (cat × level × wave).
- [ ] `RoastService.getLine()` — read pool + string-interpolate cue/name/callback (NO live AI v1).
- [ ] Wire `goal.blockers` (user-declared excuses) as `{excuse}` callback slots in stakes/roast waves — **must pass the §9.3 safety filter first** (excuse OK, person/mental-health never). Captured in Phase 3.
- [ ] **Daily-digest roast lines** — multi-goal summary variant (new "digest" wave/template, e.g. `{count}` tasks + callback). Same cached-pool + interpolation model, no live AI. Feeds the Phase 5 digest push. Through §9.3 filter.
- [ ] **Partial-completion roast lines** — for quantified goals (Phase 4.6), mock the ratio not just the skip. Template slots `{done}` / `{target}` / `{unit}`. Cached pool keyed by completion ratio bucket (e.g. <25% / ~half / almost). Roast the effort level, never the person (§3.1). Through §9.3 filter. (Tone target: dry, sarcastic praise of a weak partial — actual lines come from the pool, not hardcoded.)
- [ ] Post-generation safety filter (§9.3) + blocklist + kill switch.
- **Done when:** notifications pull real cached roast lines, filtered.

## Phase 7 — Share + monetization

- [ ] `ShareService` — watermarked card build + export (IG/TikTok/X/WhatsApp, §4.8).
- [ ] Share card screen.
- [ ] `BillingService` + paywall screen — free vs paid gating (§12): 5 goals / Unhinged / buddy.
- **Done when:** export a card; gating blocks paid features on free tier.

## Phase 8 — Onboarding + settings + compliance

- [ ] Onboarding flow (welcome → harsh-humor consent §9.1 → defaults → push permission → first goal).
- [ ] **Habit templates** — preset starter goals (gym / water / read / study) on the first-goal step. One tap pre-fills name/category/schedule/quantified target → less setup friction → higher activation. Reduces drop-off at the weakest funnel step.
- [ ] Global settings screen (§7.2).
- [ ] First-launch harsh-humor notice; rudeness hard-limits enforced in system prompt + filter.
- [ ] GDPR data export/delete (§10).
- **Done when:** cold-start onboarding works end-to-end.

## Phase 8.5 — Home-screen widgets (v1.1, high retention value)

Glanceable habit lever — a streak you see on every unlock drives loss-aversion with zero app-open friction. Native (not pure JS), so post-v1.0-core, but prioritized early in v1.1 (not buried with wearables).

- [ ] Expo config plugin for native widget targets (iOS WidgetKit + Android App Widget) — verify against SDK 54 docs before building.
- [ ] Today's-tasks + current-streak widget; optional day's roast line. Reads same scheduled-vs-acted status source as agenda/stats (Phase 5).
- [ ] Shared data bridge (App Group / shared store) so the widget reads goal status without launching the app.
- **Done when:** widget on home screen shows today's goals + streak, updates on completion.

## Phase 9 — Hardening + ship

- [ ] AI-cost-per-active-user metric (§8.4, §13).
- [ ] Analytics: notif open rate, tactic-wave conversion, D7 (§13).
- [ ] Store assets, App Store/Play compliance pass (§9), Carrot precedent framing.
- [ ] TestFlight / internal track beta.
- **Done when:** submittable build.
