# Build Workflow — how to build screens & features (RoastMode)

_Operating procedure for any agent building RoastMode. Follow this loop for every screen and every feature. It binds the build plan (what/order — `BUILD_PLAN.md`), the layered architecture (`AGENTS.md` §15), Open Design (design — `docs/od-design-workflow.md`), and the security skills (safety) into one repeatable process. Do not freelance around it._

> RoastMode-specific reality this workflow respects:
> - **This is a habit tracker with a roast layer on top** (`AGENTS.md` §1.2, `BUILD_PLAN.md` Positioning). Build the tracker fundamentals to stand alone; the roast is the delivery vehicle, not the cargo. Don't ship a comedy-generator that nags.
> - **No live AI at send time in v1** (`AGENTS.md` §8.4, §15.5). Roast copy comes from a pre-generated cached pool + string interpolation. `ai/provider.ts` is batch/cron only — frontend services never call it live.
> - **The Golden Rule is load-bearing** (`AGENTS.md` §3.1): roast the excuse and the behavior, never the person. Every generation path and every `blockers`/callback slot must clear the §9.3 safety filter before use.

---

## 0. Preconditions (once, before any screen)

Foundation must exist before building a screen or service. From `BUILD_PLAN.md`:

- **Phases 1–2 done:** Expo init + Router (SDK 54), folder skeleton `src/{models,services,hooks,lib,screens}` + path aliases (`@/`), lint/format, all §15.2 models, Supabase client + auth (`ensureSession`), schema migrations applied.
- Verify the data spine works: `npm run db:smoke` (anon sign-in → insert → read → delete) passes.

If foundation is incomplete, build it first — a screen against no spine is invalid.

**Verify every Expo API against https://docs.expo.dev/versions/v54.0.0/ before coding.** Expo has changed; don't rely on memory of older APIs.

---

## 1. The build loop (per screen)

Work screens in `BUILD_PLAN.md` phase order. Depth-first on the core slice (prove the stack once), breadth-first after (cheap copies reusing shared components — `Button`, `ThemedText`, `ThemedView`, the goal-form field-blocks).

### Step 1 — Read the plan
- Open the screen's phase entry in `BUILD_PLAN.md`: what it must do, its "Done when", and which services/models it leans on.
- Cross-read the relevant `AGENTS.md` section (the PRD): the screen's purpose (§4/§14), every state it must cover, and any 🔒 hard-limit / safety note (§3.1, §6, §9.3).
- Note the screen's data dependencies (services + hooks + migrations it needs).

### Step 2 — Build the screen's data spine first
A screen is not just UI. Before the UI, build/confirm its dependencies in layer order `models → lib → services → hooks`:
- Models exist in `src/models` (pure shapes, no logic/I-O).
- Service(s) implemented — plain TS, own all Supabase I/O, snake↔camel map, **throw on error**. Add a `db:smokeN` script and verify the round-trip with no mocks (the project's convention — see existing `smoke-phaseN.mjs`).
- Hook(s) wrapping the service, holding loading/error state.
- Any migration the screen needs is written **and applied to the cloud project** (don't leave it "pending apply" — that's the one gap to avoid repeating from Phase 5's `0007`).

### Step 3 — Design with Open Design → you VERIFY
- Run OD per `docs/od-design-workflow.md` recipe, prompting with the screen's PRD purpose + every state + "use the project's gluestack v3 token scale + NativeWind classes, stay on-system, colors tokenized."
- Poll `get_run` → `succeeded` → `get_artifact` (or open `previewUrl`).
- **STOP. Present the design to the user for verification.** Do not build UI until the user approves. Iterate via OD on feedback.
- For trivial/utility screens that reuse an existing layout wholesale (e.g. a second list screen identical to Home), OD is optional — say so and reuse the approved pattern.

### Step 4 — Build the UI on the approved design
- Translate the OD artifact into **React Native + gluestack-ui v3** components from `src/components/ui/*` (`Box`, `Text`, `Heading`, `VStack`, `HStack`, `Button`, `Input`, …) styled with NativeWind classes on the gluestack token scale. The shared `ThemedText` / `ThemedView` / `Button` wrappers are gluestack-backed and fine to reuse. OD outputs web — this is a translation, not paste.
- UI lives only in `screens`/`components`. Screens import hooks + models — never `services`/`lib` directly (`AGENTS.md` §15).
- Implement **every state**: loading / empty / error / offline, and the roast-specific ones — paused goal, weekly-target pending, partial-completion, skipped, anonymous session.
- **Golden Rule + hard limits** (§3.1, §6): any roast copy rendered must be excuse/behavior-directed, never person/body/identity/mental-health. If the copy is interpolated from `blockers` or callbacks, it must already have cleared the §9.3 filter upstream — the screen renders, it does not sanitize.
- `security-guidance` runs automatically on edits — **fix its findings or justify them; never ignore.**

### Step 5 — VERIFY it runs
- Launch on a simulator (`/run` or the `verify` skill). Design-correct ≠ working.
- Force each state (loading/empty/error/offline + paused/weekly-pending/partial/skipped). Confirm navigation + notification deep-link in/out where relevant.

### Step 6 — Security review (right cadence)
- `security-guidance` already covered the edits (auto).
- Run **`/security-review`** now **only for sensitive screens** — anything touching auth/session, Supabase RLS-guarded writes, push tokens, the AI/roast generation path, or `blockers` (user-declared excuses = personal data + roast fuel that must pass §9.3).
- For pure-tracker screens (agenda/stats/lists), **defer** the review to the phase wrap (don't run per screen — wasteful).
- Apply the screen's hard-limit / privacy criteria as DoD.

### Step 7 — Close out
- Tick the screen's box(es) `[x]` in `BUILD_PLAN.md` (use `[~]` while in progress).
- Confirm "Done when": code + all states + 🔒 limits + layered-lint + `tsc` clean + the phase's `db:smoke` green.

---

## 2. Feature (non-screen) variant

For migrations, services, libs, notifications, the roast pipeline — same skeleton **minus Step 3/4 OD design**:
1. Read the `BUILD_PLAN.md` task + the `AGENTS.md` section behind it.
2. Build in layer order (`models → lib → services → hooks`); migrations applied to cloud.
3. Verify with a `db:smokeN` round-trip (services) — no mocks, the project standard.
4. `security-guidance` auto + `/security-review` if it touches auth / push / the AI generation path / personal data.
5. Tick the box.

**The roast pipeline (Phase 6) carries extra gates** (`AGENTS.md` §8.4, §9.3):
- `ai/provider.ts` behind a swappable interface; batch/cron only, never called live from a frontend service.
- Every generated line passes the **post-generation safety filter** (§9.3) before it lands in `roast_lines`. Blocklist + kill switch wired.
- System prompt enforces the Golden Rule + hard limits on every generation call.
- `RoastService.getLine()` only reads the cached pool + interpolates `{cue}`/`{name}`/`{excuse}`/`{done}`/`{target}` — no live inference.

---

## 3. Phase wrap (end of each phase)

Do not advance a phase until:
- Its "Done when" criterion is met and the phase's `db:smoke` script (where one exists) passes.
- `tsc` clean, `expo lint` exit 0, web export succeeds (the project's green bar).
- `security-guidance` has no unresolved findings on the phase diff; run `/security-review` if the phase touched auth / push / AI / personal data.
- Migrations are **applied to the cloud project**, not just written.

---

## 4. Rules that always hold

- **Layered architecture** (`AGENTS.md` §15): `screens → hooks → services → lib`; models flow up; UI never in services/hooks/lib; services throw, hooks catch.
- **Tracker first, roast second.** A screen's tracking job must be solid on its own; the roast is the layer on top.
- **No live AI at send time** (§8.4). Cached pool + string interpolation only in v1.
- **Golden Rule is non-negotiable** (§3.1): roast the excuse/behavior, never the person. Hard limits (§6) hold at all four rudeness levels.
- **§9.3 filter before any generation use** — including `blockers` callbacks. Excuse OK; person/body/identity/mental-health never.
- **Tokens, not hardcoded values.** Style with gluestack v3 + NativeWind classes on the token scale (`tailwind.config.js` + provider `config.ts`); recolor later = single `--color-primary-*` swap. No hardcoded hex.
- **Migrations applied, not pending.** Write it → apply to cloud → smoke it.
- **OD outputs web; the app is React Native.** Always translate, never paste.
- **Flag contradictions** between `BUILD_PLAN.md` and `AGENTS.md` as you hit them; don't silently design around them.

---

## TL;DR loop

`foundation once → [ plan + PRD → data spine (models→service→hook, smoke-verified, migration applied) → OD design → USER verifies → build RN UI with gluestack v3 (security-guidance auto) → verify runs → /security-review if auth/push/AI/PII → tick box ] → phase wrap → advance`
