-- Remove goals.rest_day (added in 0004). Superseded by schedule-aware streaks:
-- the streak now bridges any non-scheduled weekday, so a fixed-schedule goal's
-- off days are implicitly rest days (AGENTS.md §4.7). A standalone rest-day
-- field was redundant with picking days, and only patched a single weekday.
-- Idempotent.

alter table public.goals drop column if exists rest_day;
