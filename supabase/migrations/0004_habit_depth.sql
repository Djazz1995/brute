-- Phase 4.6 habit-tracker depth (AGENTS.md §4.1, §4.3, §4.7):
--   * flexible weekly-target cadence (stored inside the goals.schedule jsonb,
--     so no column needed — `{ slots, weeklyTarget }`),
--   * quantified target (target_value + unit) with per-completion amount,
--   * weekly rest day (non-breaking miss),
--   * archive flag.
-- Idempotent: safe to re-run.

alter table public.goals
  add column if not exists target_value numeric,
  add column if not exists unit         text,
  add column if not exists rest_day     smallint check (rest_day between 1 and 7),
  add column if not exists archived      boolean not null default false;

-- Partial index: the active list filters on archived = false constantly.
create index if not exists goals_active_idx on public.goals (user_id) where archived = false;

alter table public.completions
  add column if not exists amount numeric;
