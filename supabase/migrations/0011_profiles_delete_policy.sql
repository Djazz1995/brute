-- Phase 8 / §10 GDPR — let a user delete their own profile row (the right to
-- erasure). The other user-scoped tables already allow owner DELETE via their
-- "*_crud_own" FOR ALL policies; profiles only had select/update. Idempotent.

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete
  using (auth.uid() = id);
