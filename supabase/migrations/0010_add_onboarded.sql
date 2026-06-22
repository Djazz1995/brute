-- Phase 8 — track whether a user finished onboarding (§14.1). Drives the
-- cold-start gate: profiles default to not-onboarded until the flow completes.
-- Idempotent.

alter table public.profiles
  add column if not exists onboarded boolean not null default false;
