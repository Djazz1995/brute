-- User-named goal groupings (AGENTS.md §4.1 Collection — distinct from the
-- `category` enum that sets roast tone). A goal belongs to one category and an
-- optional collection. Deleting a collection ungroups its goals (FK set null),
-- it does NOT delete them.
-- Idempotent: safe to re-run.

create table if not exists public.collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  color      text,
  created_at timestamptz not null default now()
);
create index if not exists collections_user_id_idx on public.collections (user_id);

alter table public.goals
  add column if not exists collection_id uuid references public.collections (id) on delete set null;
create index if not exists goals_collection_id_idx on public.goals (collection_id);

alter table public.collections enable row level security;

-- Owner-only CRUD (drop-first so the policy can be re-applied).
drop policy if exists "collections_crud_own" on public.collections;
create policy "collections_crud_own" on public.collections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
