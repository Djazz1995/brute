-- Add 'water' goal category (AGENTS.md §4.1 — Diet split into meal timing vs
-- hydration tracking). Updates the check constraints on both goals.category and
-- the shared roast_lines pool. Idempotent.

alter table public.goals drop constraint if exists goals_category_check;
alter table public.goals
  add constraint goals_category_check
  check (category in ('gym', 'study', 'chores', 'diet', 'water', 'sleep', 'custom'));

alter table public.roast_lines drop constraint if exists roast_lines_category_check;
alter table public.roast_lines
  add constraint roast_lines_category_check
  check (category in ('gym', 'study', 'chores', 'diet', 'water', 'sleep', 'custom'));
