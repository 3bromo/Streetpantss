# Passwordless Android Admin — the ONE required server-side change

## Why a change is needed (architecture fact)

All admin writes in your Supabase project are protected by Row Level Security:
every `insert/update/delete` policy calls `public.is_admin()`, which currently
returns true **only for a signed-in user whose `profiles.is_admin = true`**.
An app with no login screen has no `auth.uid()`, so with the current function
it can read public data but can never write — no client-side trick can change
that. That is the entire blocker; the database tables and data are fine.

## The change (one SQL statement, no new tables, no data changes)

Replace `public.is_admin()` so it ALSO accepts the private admin app when it
sends its revocable app key as the `x-sp-admin-key` HTTP header. The APK ships
with the key `sp-admin-app-30c8e9316ddb6a4962ff47d3` embedded (a private,
app-scoped secret — **not** your session, **not** the service-role key). The
function compares only its SHA-256 hash, so the plaintext never lives in the
database. Website users never send this header, so their access is unchanged.

Run this in the Supabase SQL Editor (Supabase Dashboard → SQL Editor → Run):

```sql
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
```

That is all. No tables created, no data touched, no RLS policies dropped,
no new users, no service key anywhere in the app.

## What this gives you

- The Android app opens **directly on the dashboard** (no login screen) and
  reads/writes the exact same tables, storage bucket and realtime stream as
  the website.
- Your web admin keeps working exactly as before (email/password path).
- Revocation: re-run the function with a different hash (or remove the `or`
  branch) and every installed APK instantly loses write access.

## Verify after running the SQL

1. Open the Android app → Dashboard shows your live stats.
2. In the app: Inventory → tap “+” on any variant → the website product page
   shows the new stock immediately (the storefront now has realtime + polling).
3. On the website admin: change a price → the app refreshes within ~12 s
   (polling) or instantly via realtime.
4. A customer order on the website appears in the app without any migration.

## Security properties

- APK contains: project URL, publishable key (public by design), and the
  app-scoped admin key. It does NOT contain your password, session token, or
  the service-role key.
- The app key grants the same rights as your admin account while embedded;
  treat the APK as private (it is your private device) and rotate the hash if
  the APK ever leaks.
