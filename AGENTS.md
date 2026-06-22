# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

---

## Docs

- PRD → this file (RoastMode product requirements + §15 Frontend Architecture)
- Build plan → `BUILD_PLAN.md` (phased what/order: tasks, "Done when", build status) — build from this
- Build workflow → `docs/build-workflow.md` (the per-screen/feature procedure to follow) + `docs/od-design-workflow.md` (Open Design wiring + recipe)
- Architecture → this file, Section 15.

---

# Product Requirements Document

## RoastMode — AI-Powered Brutal Motivation App

**Version:** 2.0
**Last Updated:** June 2026
**Status:** Pre-development (pending content-validation gate — see Section 0)

---

## 0. Pre-Build Validation Gate (NEW — do this before writing app code)

The core thesis is "the comedy is the marketing." Test that directly, with zero app code, before committing build months.

- Run a faceless TikTok/IG account posting AI-generated roasts as standalone content.
- Run 2–3 niches in parallel (gym / study / chores) to find the wedge.
- Native format: lock-screen notification stacks + photo-verdict bits (highest-comedy moment).
- **Pass condition:** at least one niche shows organic share/save velocity (not just likes) within ~2 weeks.
- **If nothing travels as posts, it won't travel as an app — stop here.**

The winning niche becomes the launch wedge and paid-ad targeting seed. Reuse a simple `next/og`-style card renderer to mass-produce notification mockups.

### 0.1 Model Bake-Off (NEW — do before locking the AI provider)

The whole product is "is it actually funny." Don't pick the model by price; pick by funny-per-dollar, then confirm it won't refuse the tone. Run a head-to-head before writing generation code.

- **Candidates:** Kimi (Moonshot), DeepSeek, Claude Haiku — plus Claude Sonnet as the quality reference.
- **Test set:** the real prompts for each (category × rudeness level × wave), including the full Tier 4 / "Unhinged" prompts.
- **Score each model on:**
  1. **Funny** — is the roast actually sharp, or flat/generic?
  2. **Refusal / flattening** — does it produce mean-but-not-cruel, or refuse / sand the edge off?
  3. **Safety filter pass rate** — does output clear the Section 9.3 post-generation filter without constant regeneration?
  4. **Data residency** — non-EU hosting (e.g. Moonshot is China-hosted) flagged against GDPR (Section 10).
- **Pick:** the funniest model that does NOT refuse the rude tone. Cost differences are trivial at cached-pool volume (Section 8.4), so cost is a tiebreaker, not the driver.
- **Output feeds Section 8.3** — the winner becomes the default behind the swappable provider interface.

---

## 1. Product Overview

### 1.1 Summary

RoastMode is a mobile app (iOS & Android) that uses AI to motivate users through funny, harsh, relentless notifications **that escalate in tactic, not just volume**. Users set goals across categories like gym, studying, chores, or any custom habit. If they don't act, the AI shifts strategy — shrinking the task, invoking stakes, then going full theatrical roast. Completion is logged by tap (with optional social witness). The comedy is the product _and_ the marketing; the behavioral nudges underneath are what actually move the user.

### 1.2 Vision

To be the app people screenshot and share before they've opened it twice — and keep because it actually gets them off the couch. Every notification should be postable on its own. Harsh-but-funny is the acquisition moat; real behavior change is the retention moat.

**Underneath, this is a habit tracker.** The streaks, schedules, completion logging, and day/week views *are* a habit-tracking app — that's the substrate that actually moves people toward goals (habits compound; one funny push does not). The roast is the motivation layer bolted on top of a competent tracker, not a replacement for one. If the tracking fundamentals are weak, no amount of comedy saves it. Build the habit-tracker core to stand on its own, then let the roast make it the one people don't ignore.

**Roast is the trojan horse, not the cargo.** Be honest about what the roast does and doesn't do: comedy reliably sells the *install* (screenshottable, free marketing, proven by Carrot / the Duolingo owl) but does **not** retain — "AI roast" is a weekend-clonable gimmick, and for many users raw mockery triggers shame → mute → uninstall. The defensible product is the behavior-change engine and the **social witness** (Section 4.6) underneath the jokes; the roast is the delivery vehicle that gets that engine in the door. The failure mode to design against is building a comedy-generator that nags, when the winner is a behavior-engine that happens to be funny (Section 3). The whole acquisition thesis is gated on Section 0 — if roast posts don't travel organically as standalone content, this does not become an app.

### 1.3 Core Premise

- User sets a goal (e.g. "Gym, Monday/Wednesday/Friday, 7am")
- They get a push notification at the scheduled time
- If ignored, notifications escalate **through behavioral tactics** (shrink the task → stakes/social → full roast), not merely louder repetition
- To complete: tap to mark done (optionally witnessed by an accountability buddy)
- Streaks, stats, and shareable roast cards track progress over time

---

## 2. Target Audience

**Primary:** 18–32 year olds who have tried (and failed with) polite reminder apps. People who respond better to being called out than coddled. Gym culture, study grind, productivity communities.

**Secondary:** People buying it as a gift for a lazy friend or partner.

**Psychographic:** Enjoys self-deprecating humor, shares memes about their own procrastination, uses apps socially.

---

## 3. Motivation Mechanism (NEW — the actual function)

This section governs Section 3.4's escalation. Rudeness alone does not reliably motivate — for many it triggers avoidance ("I'm failing, I'll mute it"). The app must wrap proven behavioral levers in comedy, not substitute comedy for them.

### 3.1 The Golden Rule (load-bearing)

**Roast the excuse and the behavior. Never roast the person.**
Behavior-roast → "do the thing." Person-roast → shame → avoidance. This is the line between motivating and harming, and between store-compliant and banned.

### 3.2 The Behavioral Levers

- **Implementation intention** — tie the goal to a concrete cue (when/where/trigger): "Mon 7am, bag by the door."
- **Tiny first step** — when ignored, shrink the ask ("just put your shoes on"), don't raise the volume. Lowering activation energy is the single strongest anti-procrastination lever.
- **Stakes / loss aversion** — optional commitment mode (money or reputation on the line). Loss aversion beats nagging.
- **Social accountability** — a real person sees the proof. Shame works when witnessed.
- **Identity reinforcement** — "You showed up 4 times. That's just who you are now." Roast can build identity, not only mock.
- **Variable reward** — unpredictable comedic verdicts keep the dopamine loop alive.

### 3.3 Escalation = Tactic Ladder, Not Volume Ladder

When a goal is ignored, the app **changes strategy each wave** rather than just getting louder:

- **Wave 1 (0 min) — Snark / cue.** Light, points at the concrete trigger.
- **Wave 2 (+15 min) — Shrink the task.** "Forget the workout. Put the shoes on. That's the whole assignment."
- **Wave 3 (+30 min) — Stakes / social.** "Want me to tell your accountability buddy you bailed? Last chance."
- **Wave 4+ — Full roast / lore.** The theatrical, maximally shareable payoff.

Each wave maps to a lever in 3.2. The harshness is _functional_ — a nudge ladder that happens to be funny, not a comedy generator that happens to nag.

---

## 4. Core Features

### 4.1 Goal Setup

Each goal has:

- **Name** — e.g. "Gym", "Study Session", "Clean the Bathroom"
- **Category** — Gym / Study / Chores / Diet / Sleep / Custom (sets roast tone; NOT the same as a user **Collection** — the optional named grouping like "Run a marathon" that spans multiple goals)
- **Cue** (NEW) — optional concrete trigger text ("bag by the door") used in Wave 1
- **Blockers** (NEW) — optional list of the user's go-to excuses ("too tired", "no time"). Roast-callback fuel (§5 "it learns you"); the excuse is fair game, the person never (§3.1). Must clear the §9.3 filter before any generation use
- **Schedule** — fixed reminder slots, each a (weekday + time) — supports different/multiple times per day (e.g. diet meals) — **or** a flexible **weekly target** ("N times per week, any day") when the goal isn't clock-bound. Interval mode ("every X hours") deferred
- **Quantified target** (NEW, optional) — a measurable goal (`targetValue` + `unit`, e.g. 20 pages / 2 L). Completion logs an amount; partial counts allowed and become roast fuel (§4.3, §6). Plain done/skip goals leave this unset
- **Rudeness level** — per goal (see Section 6)
- **Escalation speed** — Slow / Normal / Unhinged
- **Accountability buddy** (NEW, optional) — a contact who witnesses completions/skips

### 4.2 Push Notifications & Escalation

Driven by the Section 3.3 tactic ladder. All copy AI-generated (Claude API) with goal name, category, cue, rudeness level, escalation wave, day of week, and recent history as context. No two notifications identical.

**Sample escalation — gym goal, 9am, ignored (tactic ladder):**

- 9:00am (snark/cue): _"Your gym shoes are by the door. They're just sitting there. Staring at you."_
- 9:15am (shrink task): _"New deal: forget the workout. Just put the shoes on and stand up. That's the entire assignment. Go."_
- 9:30am (stakes/social): _"Third skip this week. Want me to let Marco know, or are you going to handle this yourself?"_
- 9:45am (full roast/lore): _"The Council of Goals has reviewed your case. Verdict: the couch wins again. Appeal available by actually standing up."_

### 4.3 Completion & Self-Report

- One-tap "Done" from notification or app marks the goal complete, updates streak.
- **Quantified goals** (§4.1) log an **amount** instead of a bare tap ("logged 4 pages"). Partial counts are allowed and tracked — and feed the roast: the AI mocks the ratio, not just the skip (a low partial is a funnier surface than a clean miss). Tone is roast-the-effort, never the person (§3.1); exact copy comes from the cached pool, not fixed here.
- If an accountability buddy is set, completion (and skips) are shared to them.
- **Photo verification is NOT in v0** — see Section 4.4 and Section 10.

### 4.4 Photo Verification (DEFERRED to v1.1 — rationale)

Originally v1.0. Moved out because:

- Vision judging "is this a gym?" misfires both ways: false FAIL → rage-uninstall ("I DID go"); false PASS → feature is pointless.
- Adds vision-API cost to every completion.
- The highest-comedy moment is also the highest-frustration moment; ship the core loop first.

When added: Claude Vision returns PASS / WEAK / FAIL with a roast verdict. The failed-photo verdict remains the single highest-comedy surface and gets the most copy investment. Ship behind a flag, measure false-rejection complaints before defaulting on.

### 4.5 Skip / Silence Mechanic

Silencing a goal for the day is possible but not frictionless.

**Skip flow:** tap "I can't today" → confirm → select reason → confirm with a short countdown → final roast → skip granted, recorded, counts against streak. Frequent skippers get called out in the weekly summary.

**Sample skip roast:** _"Got it. Skipping the gym today because of 'plans.' Logged. Judged. Moving on."_

### 4.6 Social Accountability (PULLED FORWARD into MVP)

A real human witness is the strongest retention lever, so a minimal version ships in v1.0:

- Optional accountability buddy per goal (invite by link/contact).
- Buddy receives a notification on the user's completion and skip.
- v1.1 expands to "friend sets a goal for you" and "friend judges your proof photo."

This is the retention engine, not a nice-to-have. Comedy gets users in; a watching friend keeps them past day 14.

### 4.7 Progress Tracking

Per goal: current/longest streak, completion rate (7/30/90d), completions vs skips vs ignored, "roasts received" badge, timeline.
Overall: all goals at a glance (done/pending/skipped), **agenda / calendar day-view** (pick a day → that day's goals + status), **stats screen** (per-day done-vs-not, streak, 7-day week grid), weekly summary notification (v1.1).

**Streak freeze / rest day (NEW).** One miss must not nuke a long streak — that turns the loss-aversion lever into a rage-quit trigger. Protect the streak with either a **planned weekly rest day** (scheduled, doesn't break the streak) or a small number of **freezes per period** (auto or manual, consumes a freeze instead of breaking). Free tier gets a low freeze cap; more freezes are a paid perk (§12 upgrade lever). The roast still acknowledges it ("Rest day. Convenient."), but the streak survives.

### 4.8 Social Sharing

Every notification and verdict generates a shareable, watermarked card. One-tap to Instagram Stories, TikTok, X, WhatsApp. Sharing is opt-in per card; no performance data shared unless the user adds it. "Roast of the Week" surfaces the funniest line (v1.1).

---

## 5. Retention Strategy (NEW — beating the day-14 novelty cliff)

The known failure mode: install → screenshot → share → delete in two weeks. **The roast does nothing to defend against this** — it is an acquisition mechanic, and counting on it for retention is the central strategic error to avoid. Defenses, in order of power:

1. **It actually works.** Behavioral levers (Section 3) drive real completions; users keep the app that gets results. Outcome retention > joke retention.
2. **Social witness (Section 4.6).** A human watching is stickier than any AI line. **This is the moat** — the hardest part for a clone to copy and the strongest day-14 defense. Protect its priority in the build; never let it slip to a "nice-to-have."
3. **It learns you.** Callbacks to the user's _specific_ excuses sharpen over weeks → becomes "your" roaster; generic clones can't replace it. This is the switching cost.
4. **Freshness engine.** Rotate personas, unlock new "characters"/lore over time, seasonal events — so the comedy never feels on loop.
5. **Variable reward + streak loss-aversion.** Unpredictable verdicts + visible streak you don't want to break. **Streak freeze / rest day (§4.7) is part of this lever, not a softening of it** — protecting a long streak from a single miss keeps loss-aversion motivating instead of flipping it into "I broke it, why bother" uninstall.
6. **Identity.** Reinforce "you're becoming someone who shows up."

Retention target stays D7 40%+ but is explicitly treated as the primary product risk, validated with the stripped MVP before scaling spend.

---

## 6. Rudeness Levels

Global default with per-goal override. Four tiers:

| Level | Name                | Tone                                       |
| ----- | ------------------- | ------------------------------------------ |
| 1     | Mild Disappointment | Sarcastic but gentle. Disapproving parent. |
| 2     | Drill Sergeant      | Loud, direct, no excuses entertained.      |
| 3     | Full Roast          | Comedic and brutal. Jokes at your expense. |
| 4     | Unhinged            | Absurdist, theatrical. Maximum chaos.      |

Every generation call is briefed on the current level. Tier 4 may include fake lore ("The Council of Goals"), running gags, callbacks.

**Hard limits at all levels:** No comments on body, weight, appearance, identity, or mental health. Roast the excuse and the behavior, never the person's worth. Keeps it funny, store-compliant, and not harmful. (See Section 9 for moderation.)

---

## 7. Settings

### 7.1 Per-Goal

Name, category, cue, schedule, rudeness override, escalation speed, accountability buddy, notifications on/off (pause without deleting).

### 7.2 Global

Default rudeness, default escalation speed, quiet hours, weekly summary on/off (v1.1), sharing preferences (always watermark / never share location metadata), notification sound (standard / drill whistle / foghorn / silent).

---

## 8. Tech Stack

### 8.1 Mobile

- **React Native (Expo)** — single codebase iOS + Android. Handles local notification scheduling and deep links from notification tap.

### 8.2 Backend

- **Supabase** — accounts, goals, completion history, streaks, buddy links.
- **Firebase Cloud Messaging (FCM)** — push delivery both platforms.
- **Scheduled jobs** — Supabase Edge Functions / cron to trigger generation at goal times.

### 8.3 AI (provider-swappable — NOT locked to one vendor)

- **Generation goes behind a thin provider interface**, not hardcoded to one vendor. A single `generateRoast(context)` abstraction wraps whichever model wins the bake-off (Section 0.1). Swapping providers must be a config change, not a refactor.
- **Default candidate: Anthropic Claude (claude-sonnet-4-6)** for comedy quality and reliable handling of the rude-but-not-cruel tone; **vision verdicts (claude-sonnet-4-6)** when 4.4 ships. But the choice is decided by the bake-off, not assumed.
- **Cost-tier candidates for batch generation:** Kimi (Moonshot), DeepSeek, Gemini Flash, Claude Haiku. At cached-pool volume (Section 8.4) per-token price is near-irrelevant — pick on comedy + refusal behavior, not headline price.
- **Two non-price selection criteria that matter more than cost:**
  - **Refusal / flattening** — the model must do mean-but-not-cruel (Tier 4) without refusing or sanding the edge off. Test exact Tier 4 prompts before committing.
  - **Data residency / GDPR (Section 10)** — some cheap providers are non-EU-hosted (e.g. Moonshot is China-hosted). Confirm where prompts + logs go before using for EU users.
- Prompt context: goal name, category, cue, rudeness level, escalation wave + mapped tactic, recent history, day of week.

### 8.4 AI Unit Economics (NEW — decided, not open)

Per-user generation cost is a real constraint on a free tier. Controls:

- **Pre-generate + cache** a pool of wave-appropriate lines per (category, level, wave); personalize only the top layer (cue, name, callback) at send time.
- **Caching makes per-token price near-irrelevant.** Lines are a _shared_ pool reused across all users, not per-user. Rough volume: 6 cat × 4 level × 4 wave × ~50 lines ≈ 4,800 lines, generated once and refreshed (e.g. weekly) — pennies on any candidate model. → optimize comedy quality, not headline token price.
- **Personalization layer = template string, not an API call, in v1.** Inserting cue/name/callback into a cached line is string interpolation. Live inference at send time is avoided entirely for v1 unless a feature provably needs it.
- **Batch** generation off-peak; avoid a live API call per push where a cached variant works.
- **Free tier caps** generation volume; **Unhinged tier + multi-goal are paid** (covers cost and creates the upgrade reason).
- Track **AI cost per active user** from day 1 as a first-class metric.

### 8.5 Media

- Verification photos (v1.1) to Supabase Storage; processed by Anthropic API, not stored long-term without opt-in.
- Shareable cards generated client-side or via a light image service.

---

## 9. App Store Compliance & Moderation

### 9.1 iOS

- Framed as opt-in tough-love; rudeness is user-controlled → content is self-directed.
- No slurs, no targeting protected groups, no body shaming.
- Precedent: Carrot Fitness (similar harsh/sarcastic tone, years on store).
- Category: Health & Fitness or Productivity.
- First-launch notice: "This app uses harsh humor. Content is opt-in and user-controlled."

### 9.2 Google Play

More lenient; same content rules, lower review risk.

### 9.3 Generation Guardrails (NEW)

AI generating "brutal" content is a brand/store gun, especially Tier 4. Controls:

- System prompt enforces the golden rule + hard limits on every call.
- **Post-generation safety filter** (classifier or rules) rejects/regenerates lines crossing body/identity/mental-health/self-harm lines before send.
- Server-side logging of prompts + completions for abuse review (de-identified).
- Kill switch + line-level blocklist for anything that slips through.

---

## 10. Privacy & Data

- Verification photos (when shipped) processed by Anthropic API, not stored beyond session unless user opts into a "proof history" feature.
- Goal data private by default; sharing always opt-in, per-card.
- No data selling, no ad targeting.
- GDPR compliant (EU users can request/delete all data).
- Generation logs de-identified.

---

## 11. MVP Scope (v1.0)

**Include:**

- Goal creation (up to 5 goals) with cue field, **fixed schedule or weekly-target frequency, optional quantified target**
- **Optional Collections** — user-named groupings spanning goals (§4.1)
- Push notifications with AI-generated copy
- **Tactic-ladder escalation (3–4 waves, Section 3.3)**
- **Daily-digest roast** at day-start (§4.2-adjacent)
- Self-report completion (tap), **amount logging for quantified goals + partial-completion roast (§4.3)**
- **Minimal social accountability buddy (Section 4.6)**
- Rudeness levels (all 4) with post-generation safety filter
- Basic streak tracking, **streak freeze / rest day (§4.7)**
- **Agenda / calendar day-view + stats screen with week grid (§4.7)**
- **Archive / completed-goal history (§4.7)**
- Skip mechanic with friction
- Shareable notification cards
- Onboarding flow **with habit templates**
- AI cost controls: cached line pool + free-tier caps (Section 8.4)

**Defer to v1.1+:**

- Photo verification + verdicts (Section 4.4)
- Weekly summary notifications
- "Friend sets/judges your goal" multiplayer
- Custom escalation intervals
- "Roast of the Week"
- Detailed analytics dashboard
- Wearables
- **Home-screen widgets (v1.1, high retention value).** Glanceable today's-tasks + streak widget (iOS WidgetKit / Android App Widget). Strong habit-tracker lever — a streak you see every time you unlock your phone drives loss-aversion with zero app-open friction; can also surface the day's roast line. Native work (Expo config plugin, not pure JS), so out of the v1.0 core, but prioritized early in v1.1 — not buried with wearables. Reads the same scheduled-vs-acted status source as the agenda/stats screens.

---

## 12. Open Questions

- **Monetization:** Free = 1 goal + Levels 1–3, capped generation. Paid ($2.99/mo or $14.99/yr) = up to 5 goals + Unhinged + accountability buddy. One-time vs sub still to confirm — but gating decided enough to model.
- **Ignored vs skipped:** Treat a silently-ignored goal differently from an explicit skip in streak math? (Lean: ignored = harsher streak penalty, since explicit skip at least engages.)
- **Proof wall:** Optional opt-in gallery of completion photos when 4.4 ships.

---

## 13. Success Metrics

- **Content-gate (Section 0):** organic shares/saves per post on the validation account — the go/no-go before build.
- **D7 retention** — target 40%+; treated as the primary risk metric.
- **Notification open rate** — target 30%+ (vs ~10% industry).
- **Tactic-wave conversion** (NEW) — at which wave do completions actually happen? Tells you whether "shrink the task" / "stakes" beats "full roast" at driving action. Tune the ladder on this.
- **Organic shares/week** — growth metric, via UTM on cards.
- **Streak length distribution** — habit formation vs novelty.
- **AI cost per active user** (NEW) — unit economics guardrail.

---

## 14. Screen / Page Inventory (v1.0 MVP)

The UI surfaces needed for the MVP scope (Section 11), grouped by flow. Deferred-feature screens are listed separately and are NOT built in v1.0.

### 14.1 Onboarding (first launch)

1. **Welcome / hook** — one-line pitch + sample roast card.
2. **Harsh-humor consent notice** — required by Section 9.1 ("opt-in, user-controlled").
3. **Default rudeness + escalation pick** — global defaults.
4. **Notification permission prompt** — native push grant.
5. **First goal create** — funnels into goal setup.

### 14.2 Core loop

6. **Home / dashboard** — all goals at a glance (done/pending/skipped today) + streak summary (Section 4.7).
7. **Goal create / edit** — name, category, cue, schedule, rudeness override, escalation speed, buddy (Section 4.1).
8. **Goal detail** — per-goal streak, completion rate, timeline, roasts-received badge (Section 4.7).
9. **Completion confirm** — tap Done → verdict card (Section 4.3).
10. **Skip flow** — "I can't today" → reason → countdown → final roast (Section 4.5; friction is intentional).

### 14.3 Social + share

11. **Accountability buddy** — invite/manage buddy, see what gets shared (Section 4.6).
12. **Share card** — watermarked roast card, export to IG / TikTok / X / WhatsApp (Section 4.8).

### 14.4 Settings

13. **Settings (global)** — default rudeness, escalation, quiet hours, sound, sharing prefs (Section 7.2).
14. **Paywall / upgrade** — free vs paid gating: 5 goals, Unhinged, buddy (Section 12).

### 14.5 System surface (not a full screen)

15. **Notification + deep-link targets** — push taps route into completion / skip / goal detail. Needs design, but not a standalone page.

### 14.6 Deferred to v1.1+ (no page in v1.0)

Photo verification + verdicts (4.4), weekly summary notifications, "friend sets/judges your goal" multiplayer, "Roast of the Week", analytics dashboard.

---

## 15. Frontend Architecture (service-based)

Layered architecture. UI calls services only; services own all I/O and return models. No SDK access from screens.

### 15.1 Layers

```
src/
  models/      pure data shapes (TS interfaces/types) — no logic, no I/O
  services/    business logic + all I/O; return models, throw on error
  hooks/       thin React wrappers (useGoals, useStreak…); hold state, catch errors
  lib/         thin SDK clients (supabase, fcm, ai provider) — services wrap these
  screens/     UI (Section 14 pages) — call hooks only
```

**Flow:** `screens → hooks → services → lib`. Models flow back up.

**Rules:**

- Screens import models for typing + call hooks. Never import `services` or `lib` directly.
- Services are plain TS (framework-agnostic, testable without React). Return the model directly; **throw on error**.
- Hooks (`useGoals`, `useGoal(id)`, `useStreak(id)`, `useSkip`, `useRoastCard`, `useBuddy`, `useUser`, `useBilling`) wrap services, hold loading/error state, catch.
- `lib` wraps vendor SDKs so providers stay swappable (Section 8.3).

### 15.2 Models (`src/models`)

| Model                 | Core fields                                                                         | PRD     |
| --------------------- | ----------------------------------------------------------------------------------- | ------- |
| `Goal`                | id, name, category, cue, schedule, rudenessLevel, escalationSpeed, buddyId?, paused | 4.1     |
| `GoalCategory`        | enum: gym/study/chores/diet/sleep/custom                                            | 4.1     |
| `Schedule`            | days[], timeOfDay, intervalHours?                                                   | 4.1     |
| `RudenessLevel`       | enum 1–4                                                                            | 6       |
| `EscalationSpeed`     | enum slow/normal/unhinged                                                           | 4.1     |
| `EscalationWave`      | wave#, tactic (snark/shrink/stakes/roast)                                           | 3.3     |
| `Completion`          | id, goalId, timestamp, source (tap/notif), witnessed                                | 4.3     |
| `Skip`                | id, goalId, timestamp, reason                                                       | 4.5     |
| `StreakStats`         | current, longest, completionRate7/30/90, ignoredCount                               | 4.7     |
| `RoastCard`           | id, goalId, text, wave, watermark, createdAt                                        | 4.8     |
| `Buddy`               | id, contact, inviteStatus                                                           | 4.6     |
| `User`                | id, defaults (rudeness/escalation/quietHours/sound), tier (free/paid)               | 7.2, 12 |
| `NotificationPayload` | goalId, wave, body, deepLink                                                        | 4.2     |

### 15.3 Services (`src/services`)

| Service               | Responsibility          | Key methods → returns                                                                      |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `GoalService`         | CRUD goals              | `list()→Goal[]`, `get(id)→Goal`, `create/update/delete`, `pause(id)`                       |
| `CompletionService`   | mark done, streak math  | `complete(goalId)→Completion`, `getStats(goalId)→StreakStats`                              |
| `SkipService`         | skip flow + friction    | `skip(goalId,reason)→Skip`                                                                 |
| `RoastService`        | fetch/personalize lines | `getLine(goalId,wave)→RoastCard` (cached pool + template interp, 8.4 — no live AI call v1) |
| `NotificationService` | schedule + deep links   | `scheduleForGoal(goal)`, `cancel(goalId)`, `handleTap(payload)`                            |
| `BuddyService`        | invite, notify buddy    | `invite(contact)→Buddy`, `notifyCompletion/notifySkip`                                     |
| `ShareService`        | build/export cards      | `buildCard(roast)→RoastCard`, `export(card,target)`                                        |
| `UserService`         | profile, defaults, tier | `getUser()→User`, `updateDefaults()`, `getTier()`                                          |
| `BillingService`      | paywall gating          | `canAddGoal()`, `canUseUnhinged()`, `purchase()`                                           |
| `EscalationService`   | tactic-ladder logic     | `nextWave(goal,history)→EscalationWave` (maps wave→tactic, 3.3)                            |

### 15.4 Lib (`src/lib`) — swappable SDK wrappers

| Module             | Wraps                              | Notes                                                |
| ------------------ | ---------------------------------- | ---------------------------------------------------- |
| `supabase.ts`      | Supabase client                    | accounts, goals, history (8.2)                       |
| `fcm.ts`           | Firebase messaging                 | push delivery (8.2)                                  |
| `notifications.ts` | expo-notifications                 | local schedule + tap deep link                       |
| `ai/provider.ts`   | `generateRoast(context)` interface | swappable vendor (8.3); batch/cron only, not runtime |

### 15.5 Where AI lives

Per Section 8.4: **no live AI call at send time in v1.** Generation runs in a **batch job** (Supabase Edge Function / cron) → fills shared cached line pool. `RoastService` reads the pool + string-interpolates cue/name/callback. `ai/provider.ts` is server-side/batch only — frontend services never call it live.

---

_End of PRD v2.0_
