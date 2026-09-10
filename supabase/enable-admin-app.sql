-- ============================================================
-- STREET PANTS — enable the passwordless Admin APK (secure)
-- Run ONCE in: Supabase Dashboard → SQL Editor → Run.
--
-- What this does (and does NOT do):
--  * DOES NOT disable RLS, DOES NOT create tables/databases,
--    DOES NOT touch data, DOES NOT use the service-role key.
--  * Makes is_admin() additionally accept the private Admin APK
--    when it sends its revocable key as the `x-sp-admin-key`
--    header (compared by SHA-256 hash; plaintext never stored).
--  * Recreates the 3 Storage write policies WITHOUT the
--    `TO authenticated` restriction (a login-less app is role
--    anon; the is_admin() check still gates everything).
--  * Website users never send this header → their access is
--    unchanged; customer reads unchanged; your email/password
--    web admin unchanged.
--  * Revocation: re-run with a different hash, or drop the OR
--    branch, and every installed APK instantly loses writes.
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  )
  or (
    coalesce(current_setting('request.header.x-sp-admin-key', true), '') <> ''
    and encode(
          digest(current_setting('request.header.x-sp-admin-key', true), 'sha256'),
          'hex'
        ) = 'cf49616ecfa47353c062dc3d4c029e6ab7a798b05e64db90c68d33547538f874'
  );
$$;

-- Storage write policies: gate by is_admin() for ALL roles
-- (previously `to authenticated`, unreachable by a login-less app).
drop policy if exists "storage admin insert" on storage.objects;
drop policy if exists "storage admin update" on storage.objects;
drop policy if exists "storage admin delete" on storage.objects;

create policy "storage admin insert" on storage.objects for insert
  with check (bucket_id = 'images' and public.is_admin());

create policy "storage admin update" on storage.objects for update
  using (bucket_id = 'images' and public.is_admin());

create policy "storage admin delete" on storage.objects for delete
  using (bucket_id = 'images' and public.is_admin());

-- done. No other policy, table, row, or bucket is modified.
