-- Add user-declared blockers/excuses to goals (AGENTS.md §5 "it learns you",
-- §3.1 golden rule: these feed roast callbacks — the excuse, never the person).
-- Used as template slots in Phase 6 generation, behind the §9.3 safety filter.

alter table public.goals
  add column if not exists blockers text[] not null default '{}';
