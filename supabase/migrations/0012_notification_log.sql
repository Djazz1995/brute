-- Phase 5 server slice — escalation-state log (§3.3, §8.2). The cron records
-- every remote push it sends so it (a) never double-sends a wave for the same
-- scheduled occurrence and (b) sends at most one daily digest per user per day.
-- Written only by the service-role cron; users may read their own rows.
-- Idempotent.

create table if not exists public.notification_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  goal_id     uuid references public.goals (id) on delete cascade,
  occurred_on date not null,           -- the scheduled day the push belongs to
  wave        smallint,                -- escalation wave (null for digest)
  kind        text not null default 'wave' check (kind in ('wave', 'digest')),
  sent_at     timestamptz not null default now()
);

create index if not exists notification_log_user_day_idx
  on public.notification_log (user_id, occurred_on);

-- One row per (goal, day, wave) for escalation; one digest per (user, day).
create unique index if not exists notification_log_wave_uniq
  on public.notification_log (goal_id, occurred_on, wave) where kind = 'wave';
create unique index if not exists notification_log_digest_uniq
  on public.notification_log (user_id, occurred_on) where kind = 'digest';

alter table public.notification_log enable row level security;

drop policy if exists "notification_log_select_own" on public.notification_log;
create policy "notification_log_select_own" on public.notification_log for select
  using (auth.uid() = user_id);
-- No client INSERT/UPDATE policy: only the service-role cron writes (bypasses RLS).
