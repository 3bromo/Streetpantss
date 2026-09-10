# STREET PANTS ADMIN — Android build & delivery

Admin-only Android application (Capacitor + React) connected to the **exact same**
Supabase project as the website (`https://werxnlgewnkliuuglovp.supabase.co`).
No separate database, no mock data, no demo mode. Admin access is enforced by the
existing `profiles.is_admin` + Row Level Security; only the publishable/anon key is
embedded (public by design).

## Generated artifacts (already built)

| File | Location | Purpose |
| ---- | -------- | ------- |
| Debug APK | `../android-builds/STREET-PANTS-ADMIN-debug.apk` | Install & test on any phone |
| Signed release APK | `../android-builds/STREET-PANTS-ADMIN-release.apk` | Direct distribution |
| Release AAB | `../android-builds/STREET-PANTS-ADMIN-release.aab` | Google Play upload |

- Package: `com.streetpants.admin` · label `STREET PANTS ADMIN` · targetSdk 34
- Signed with keystore `android/release.keystore` (alias `streetpants-admin`,
  passwords `streetpants123`). **Keep this keystore safe** — it is the upload key.
  For Play App Signing, Google will generate and manage the app-signing key; you
  upload this AAB as-is.

## Install the APK on an Android phone

1. Copy `STREET-PANTS-ADMIN-debug.apk` (or the release APK) to the phone
   (download link, Drive, or USB).
2. Open it — Android asks to allow “Install unknown apps” for your browser/files
   app → allow.
3. Install and open **STREET PANTS ADMIN**, sign in with your Supabase admin
   email/password (the account whose `profiles.is_admin = true`).

Or via USB debugging:

```bash
adb install android-builds/STREET-PANTS-ADMIN-debug.apk
```

## Upload the AAB to Google Play

1. Play Console → Create app → package `com.streetpants.admin`.
2. Production (or internal testing) → Create release → upload
   `STREET-PANTS-ADMIN-release.aab`.
3. Complete store listing; roll out. Play App Signing handles the final key.

## Rebuild from source (your machine)

Requirements: JDK 17, Android SDK (platform 34, build-tools 34).

```bash
cd admin-app
npm install
npm run build            # web bundle → dist/
npx cap sync android     # copy web + plugins into android/
npm run apk:debug        # → android/app/build/outputs/apk/debug/app-debug.apk
npm run apk:release      # signed release APK
npm run aab:release      # signed release AAB
```

If the SDK path differs from `android/local.properties`, update `sdk.dir`.

## What was verified in this build

- TypeScript + production web build pass.
- Supabase URL present inside the packaged app assets.
- `apksigner verify` passes on the release APK.
- Auth flow uses `supabase.auth.signInWithPassword`, session auto-restores on
  reopen, non-admin accounts are rejected client-side **and** by RLS server-side.
- Products/orders/inventory/discounts/settings/image-upload all hit the existing
  tables (`products`, `product_variants`, `product_images`, `colors`, `sizes`,
  `orders`, `order_items`, `customers`, `discount_codes`, `site_settings`,
  `profiles`) and the existing `images` storage bucket; realtime subscriptions
  push website changes into the app.
