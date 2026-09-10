-- ============================================================
-- STREET PANTS — safe migration to the NEW category/size/color system.
-- Run ONCE in: Supabase Dashboard → SQL Editor → Run.
--
-- * Updates shared dimension tables (sizes/colors) and product categories.
-- * PRESERVES all products, orders, users, images, settings, orders history.
--   (order_items keep their historical text snapshots — untouched.)
-- * Idempotent: safe to run more than once.
-- ============================================================

-- 1) Categories: only Wide Leg / Street Pants / Old Money remain.
update public.products set category = 'street-pants'
 where category in ('essentials', 'cargo', 'utility', 'denim', 'street-pants');
update public.products set category = 'wide-leg' where category = 'wide-leg';
update public.products set category = 'old-money' where category = 'old-money';

-- 2) Sizes: numeric → canonical letters (shared sizes table).
update public.sizes set label = 'S'   where label = '28';
update public.sizes set label = 'M'   where label = '30';
update public.sizes set label = 'L'   where label = '32';
update public.sizes set label = 'XL'  where label = '34';
update public.sizes set label = '2XL' where label = '36';

-- 3) Colors: legacy fixed names → simple admin-editable names.
update public.colors set name = 'Navy'      where name = 'Deep Navy';
update public.colors set name = 'Dark Grey' where name = 'Graphite';
update public.colors set name = 'Beige'     where name = 'Stone';
update public.colors set name = 'Dark Blue' where name = 'Indigo';
update public.colors set name = 'Off White' where name = 'Cream';

-- done. The website + admin now show only the new system everywhere.
