# STREET PANTS — Premium Streetwear E-Commerce + Admin

A complete, production-ready e-commerce storefront **and** a secure admin dashboard for a
premium streetwear brand — deep navy / white / black identity, editorial presentation, real
backend integration via **Supabase** (auth + Postgres + Storage), with a clearly-labelled
**local demo mode** so the project works even before any backend is configured.

Built with **React 18 + TypeScript + Tailwind CSS + Framer Motion + @supabase/supabase-js**.

---

## Quick start

```bash
npm install
npm run dev       # local dev (demo mode — data lives in the browser)
npm run build     # type-check + production build → dist/
```

Open `http://localhost:5173` for the storefront and `http://localhost:5173/#/admin` for the
admin dashboard.

---

## Environment variables

Create a `.env` file in the project root (Vite exposes only `VITE_`-prefixed vars to the
browser — by design, **only the public anon key ever reaches the client**):

| Variable                | Required for | Description                                          |
| ----------------------- | ------------ | ---------------------------------------------------- |
| `VITE_SUPABASE_URL`     | production   | Project URL, e.g. `https://xyzcompany.supabase.co`   |
| `VITE_SUPABASE_ANON_KEY`| production   | Public anon key (safe for browsers; RLS enforces access) |

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-KEY
```

> **Never** put the `service_role` key in this project, in `.env`, or anywhere client-side.
> It is only for trusted server environments. All privileged access here is enforced
> server-side by Row Level Security, so the anon key is sufficient.

Without these variables the app still connects to the bundled STREET PANTS Supabase
project (the publishable key is embedded as a fallback — it is public by design).
`.env` overrides the fallback. A clearly-labelled **local demo mode** exists only as a
last resort if both URL and key are absent, so the project never breaks.

---

## Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/schema.sql` (in this repo). It creates:
   - tables: `profiles`, `products`, `product_images`, `product_variants`, `colors`,
     `sizes`, `orders`, `order_items`, `customers`, `discount_codes`, `site_settings`
   - `is_admin()` helper, signup trigger, `place_order()` (authoritative pricing + stock
     decrement) and `cancel_order()` (restock) as security-definer functions
   - **Row Level Security** policies on every table
   - a public `images` storage bucket (public read, admin-only write)
   - seed data: brand colors, sizes, settings, `WELCOME10` code and the 10-product catalog
3. Create your admin account: **Authentication → Users → Add user** (email + password).
4. Promote that user to admin (SQL Editor):

   ```sql
   update public.profiles set is_admin = true where email = 'you@brand.com';
   ```

5. Add the two `VITE_` env vars (locally in `.env`; on Vercel/Netlify in project settings).
6. Done — sign in at `/#/admin/login` with real credentials. The anon key ships to browsers,
   but every admin-only read/write is enforced by RLS on the server.

---

## Security model

- **Admin auth** = Supabase Auth (email/password). No credentials are hardcoded anywhere.
- **Authorization** is enforced server-side: `is_admin()` + RLS policies gate all writes to
  products, variants, images, orders, discounts and settings. Customers (anonymous users)
  can only read published products, active discount codes, public settings and images, and
  place orders through the `place_order()` RPC (which prices items from the database, never
  from the client).
- Admin routes (`/admin/*`) are protected client-side by a session guard that redirects to
  `/admin/login`; real protection is the RLS layer above.
- Cancelling an order restocks its items; placing an order decrements per-variant stock —
  both inside security-definer RPCs.

---

## Admin dashboard (`/#/admin`)

| Route                    | Features |
| ------------------------ | -------- |
| `/admin`                 | Total orders, new orders, total sales, product count, low-stock count, recent orders, stock alerts |
| `/admin/products`        | Create / edit / delete / publish-unpublish; name, description, price, **sale price**, SKU, category, flags |
| `/admin/products/:id`    | Image upload / replace / delete (Supabase Storage), color & size selection, **stock per size/color variant** matrix |
| `/admin/orders`          | All orders, filter by status, inline status updates |
| `/admin/orders/:id`      | Customer info, ordered products, totals, status workflow: New → Confirmed → Preparing → Shipped → Delivered / Cancelled |
| `/admin/inventory`       | Stock alerts, per-variant stock editing with instant save |
| `/admin/discounts`       | Create percent/fixed codes, activate/deactivate, expiration dates |
| `/admin/content`         | Homepage hero image, editorial banner + title, announcement bar text, featured products |
| `/admin/settings`        | Store name, phone, WhatsApp, Instagram, YouTube, email, shipping rules, currency |

The admin is fully responsive (sidebar → mobile drawer) and uses the same navy/white brand
language as the storefront.

---

## Storefront ↔ database

- Products, prices, sale prices, stock, settings, announcement, hero/banner images all load
  from the backend at runtime (`CatalogContext`); the bundled catalog is only a fallback so
  the site never breaks.
- The cart validates against **live stock** (per color/size) and uses **current prices**,
  including sale prices; checkout applies discount codes via the backend and places orders
  through `place_order` (which decrements stock server-side).

---

## Storefront pages

`/` Home · `/shop` (filters + sorting) · `/new-arrivals` · `/collections` · `/best-sellers` ·
`/product/:id` · `/about` · `/search` · `/cart` · `/checkout` · 404

---

## Deploy

- **Vercel** — import the repo; `vercel.json` already sets `npm run build` + `dist`. Add the
  two `VITE_` env vars in project settings.
- **Netlify** — `netlify.toml` handles build/publish; add env vars in site settings.
  (Or drag `dist/` into Netlify Drop.)
- **GitHub** — `git init && git add -A && git commit -m "STREET PANTS"`, push to a new repo.
- Routing uses `HashRouter`, so the static build works on any host with **zero** rewrite
  rules.

---

## Structure

```
src/
  components/   storefront components (Navbar, Hero, ProductCard, CartDrawer, …)
  admin/        AdminLayout, login + 9 management pages, shared admin UI
  context/      CatalogContext (live data), CartContext (stock-aware), Wishlist, UI
  lib/backend/  Backend interface + Supabase implementation + local demo implementation
  data/         seed catalog (fallback) + collections
  pages/        one file per storefront route
supabase/
  schema.sql    tables, RLS, RPCs, storage policies, seed
scripts/
  gen-placeholders.mjs  regenerates the SVG lookbook artwork
```


## Order Email Notifications

- Admin → **Order Emails** (`/#/admin/notifications`): set the notification email, save, send a test email, view status/last test. Stored in the existing `site_settings` table.
- On every successful checkout the website invokes the Supabase Edge Function
  `send-order-notification` (source: `supabase/functions/send-order-notification/index.ts`).
  The function reads the order server-side, sends a branded HTML email (Resend),
  and dedupes by order id (`site_settings.notifiedOrders`) so exactly ONE email
  is sent per order. Email failures never cancel or delete orders.

Deploy once (server-side secrets stay in environment variables, never in code):

```bash
supabase functions deploy send-order-notification --no-verify-jwt
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set EMAIL_FROM="STREET PANTS <orders@your-domain.com>"
supabase secrets set ORDER_NOTIFICATION_EMAIL=you@brand.com   # optional fallback
```
