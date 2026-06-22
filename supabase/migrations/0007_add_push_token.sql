-- Store each device's Expo push token so the server cron can target remote
-- pushes (escalation Wave 2+, buddy notify, daily digest — AGENTS.md §8.2).
-- Idempotent.

alter table public.profiles
  add column if not exists push_token text;
