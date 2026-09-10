-- ============================================================
-- STREET PANTS — Supabase schema, RLS, server logic and seed.
-- Run this in the Supabase SQL editor on a fresh project.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hex text not null default '#0B2555'
);

create table if not exists public.sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null unique
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text,
  name text not null,
  description text not null default '',
  price numeric not null check (price >= 0),
  sale_price numeric check (sale_price is null or sale_price >= 0),
  sku text not null default '',
  category text not null default 'essentials',
  details jsonb not null default '[]',
  material text not null default '',
  fit text not null default '',
  care text not null default '',
  keywords jsonb not null default '[]',
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  featured boolean not null default false,
  published boolean not null default true,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  url text not null,
  position integer not null default 0,
  alt text not null default ''
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  color_id uuid not null references public.colors on delete cascade,
  size_id uuid not null references public.sizes on delete cascade,
  stock integer not null default 0 check (stock >= 0),
  unique (product_id, color_id, size_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  customer_name text not null,
  email text not null,
  phone text not null default '',
  address text not null default '',
  city text not null default '',
  notes text,
  status text not null default 'new'
    check (status in ('new','confirmed','preparing','shipped','delivered','cancelled')),
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  discount_code text,
  discount_amount numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid references public.products on delete set null,
  name text not null,
  color text not null,
  size text not null,
  qty integer not null check (qty > 0),
  unit_price numeric not null default 0
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  phone text not null default '',
  city text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null default 'percent' check (type in ('percent','fixed')),
  value numeric not null check (value > 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null
);

-- ------------------------------------------------------------
-- Helper: is the current user an admin? (server-side authority)
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- Auto-create a profile for every auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Server-side order placement: authoritative pricing + stock decrement
-- ------------------------------------------------------------

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql security definer
as $$
declare
  o public.orders;
  it jsonb;
  pid uuid;
  qty int;
  unit numeric;
  subtotal numeric := 0;
  discount numeric;
  ship numeric;
  free_over numeric;
  std numeric;
  exp numeric;
begin
  -- authoritative prices from the database, never from the client
  for it in select * from jsonb_array_elements(payload->'items')
  loop
    pid := (it->>'productId')::uuid;
    qty := (it->>'qty')::int;
    select case when p.sale_price is not null and p.sale_price < p.price then p.sale_price else p.price end
      into unit from public.products p where p.id = pid;
    if unit is null then
      raise exception 'Unknown product %', pid;
    end if;
    subtotal := subtotal + unit * qty;
  end loop;

  select coalesce((value#>>'{}')::numeric, 2000) into free_over from public.site_settings where key = 'freeThreshold';
  select coalesce((value#>>'{}')::numeric, 50)   into std      from public.site_settings where key = 'standardShipping';
  select coalesce((value#>>'{}')::numeric, 120)  into exp      from public.site_settings where key = 'expressShipping';

  discount := coalesce((payload->>'discountAmount')::numeric, 0);
  ship := case
    when payload->>'delivery' = 'express' then exp
    when subtotal - discount >= free_over then 0
    else std
  end;

  insert into public.orders
    (number, customer_name, email, phone, address, city, notes, status, subtotal, shipping, discount_code, discount_amount, total)
  values
    ('SP-' || floor(100000 + random() * 900000)::int::text,
     payload->>'customerName', payload->>'email', payload->>'phone',
     payload->>'address', payload->>'city', payload->>'notes',
     'new', subtotal, ship, payload->>'discountCode', discount,
     greatest(0, subtotal - discount + ship))
  returning * into o;

  -- upsert customer directory
  insert into public.customers (email, name, phone, city)
  values (o.email, o.customer_name, o.phone, o.city)
  on conflict (email) do update set name = excluded.name, phone = excluded.phone, city = excluded.city;

  -- write items + decrement stock atomically
  for it in select * from jsonb_array_elements(payload->'items')
  loop
    pid := (it->>'productId')::uuid;
    qty := (it->>'qty')::int;
    select case when p.sale_price is not null and p.sale_price < p.price then p.sale_price else p.price end
      into unit from public.products p where p.id = pid;

    insert into public.order_items (order_id, product_id, name, color, size, qty, unit_price)
    select o.id, pid, p.name, it->>'color', it->>'size', qty, unit
    from public.products p where p.id = pid;

    update public.product_variants v
      set stock = greatest(0, v.stock - qty)
      where v.product_id = pid
        and v.color_id = (select c.id from public.colors c where c.name = it->>'color')
        and v.size_id  = (select s.id from public.sizes  s where s.label = it->>'size');
  end loop;

  return jsonb_build_object('id', o.id, 'number', o.number);
end $$;

create or replace function public.cancel_order(order_id uuid)
returns void
language plpgsql security definer
as $$
declare it record;
begin
  update public.orders set status = 'cancelled' where id = cancel_order.order_id and status <> 'cancelled';
  if found then
    -- NOTE: qualify order_items.order_id explicitly — an unqualified
    -- "order_id" here is ambiguous with the function parameter and
    -- raises: column reference "order_id" is ambiguous.
    for it in select * from public.order_items oi where oi.order_id = cancel_order.order_id
    loop
      update public.product_variants v
        set stock = v.stock + it.qty
        where v.product_id = it.product_id
          and v.color_id = (select c.id from public.colors c where c.name = it.color)
          and v.size_id  = (select s.id from public.sizes  s where s.label = it.size);
    end loop;
  end if;
end $$;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.colors enable row level security;
alter table public.sizes enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;
alter table public.discount_codes enable row level security;
alter table public.site_settings enable row level security;

-- profiles: users read their own row; admins read all
create policy "profiles self read" on public.profiles for select using (auth.uid() = id or public.is_admin());

-- catalogs: public read; admin write
create policy "colors read" on public.colors for select using (true);
create policy "sizes read" on public.sizes for select using (true);

create policy "products public read published" on public.products for select
  using (published = true or public.is_admin());
create policy "products admin insert" on public.products for insert
  with check (public.is_admin());
create policy "products admin update" on public.products for update
  using (public.is_admin());
create policy "products admin delete" on public.products for delete
  using (public.is_admin());

create policy "images read" on public.product_images for select using (true);
create policy "images admin insert" on public.product_images for insert with check (public.is_admin());
create policy "images admin update" on public.product_images for update using (public.is_admin());
create policy "images admin delete" on public.product_images for delete using (public.is_admin());

create policy "variants read" on public.product_variants for select using (true);
create policy "variants admin insert" on public.product_variants for insert with check (public.is_admin());
create policy "variants admin update" on public.product_variants for update using (public.is_admin());
create policy "variants admin delete" on public.product_variants for delete using (public.is_admin());

-- orders: placed via security-definer rpc (authoritative); only admins read/update
create policy "orders admin read" on public.orders for select using (public.is_admin());
create policy "orders admin update" on public.orders for update using (public.is_admin());
create policy "order items admin read" on public.order_items for select using (public.is_admin());

create policy "customers admin read" on public.customers for select using (public.is_admin());

-- discounts: customers may validate active codes; admins manage
create policy "discounts public read active" on public.discount_codes for select
  using (active = true or public.is_admin());
create policy "discounts admin insert" on public.discount_codes for insert with check (public.is_admin());
create policy "discounts admin update" on public.discount_codes for update using (public.is_admin());
create policy "discounts admin delete" on public.discount_codes for delete using (public.is_admin());

-- settings: public read (store content), admin write
create policy "settings read" on public.site_settings for select using (true);
create policy "settings admin write" on public.site_settings for insert with check (public.is_admin());
create policy "settings admin update" on public.site_settings for update using (public.is_admin());

-- ------------------------------------------------------------
-- Storage bucket for product / site images (public read, admin write)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "storage public read" on storage.objects for select
  using (bucket_id = 'images');
create policy "storage admin insert" on storage.objects for insert
  to authenticated with check (bucket_id = 'images' and public.is_admin());
create policy "storage admin update" on storage.objects for update
  to authenticated using (bucket_id = 'images' and public.is_admin());
create policy "storage admin delete" on storage.objects for delete
  to authenticated using (bucket_id = 'images' and public.is_admin());

-- ------------------------------------------------------------
-- Seed: brand colors, sizes, settings, one welcome discount
-- ------------------------------------------------------------

insert into public.colors (name, hex) values
  ('Deep Navy', '#0B2555'), ('Black', '#050505'), ('Graphite', '#3B4252'),
  ('Stone', '#CFCBC2'), ('Indigo', '#1F2A44'), ('Cream', '#E4DED2')
on conflict (name) do nothing;

insert into public.sizes (label) values ('28'), ('30'), ('32'), ('34'), ('36')
on conflict (label) do nothing;

insert into public.site_settings (key, value) values
  ('storeName', '"STREET PANTS"'),
  ('announcement', '"FREE SHIPPING ON ORDERS OVER 2,000 EGP      ·      NEW DROP — CITY UNIFORM / 01 NOW LIVE      ·      14-DAY EASY RETURNS ACROSS EGYPT"'),
  ('heroImage', '"/images/hero.jpg"'),
  ('bannerImage', '"/images/night.svg"'),
  ('bannerTitle', '"CITY UNIFORM / 01"'),
  ('instagram', '"https://www.instagram.com"'),
  ('youtube', '"https://www.youtube.com"'),
  ('whatsapp', '"+20 100 000 0000"'),
  ('email', '"hello@streetpants.example"'),
  ('phone', '"+20 2 0000 0000"'),
  ('freeThreshold', '2000'),
  ('standardShipping', '50'),
  ('expressShipping', '120'),
  ('currency', '"EGP"')
on conflict (key) do update set value = excluded.value;

insert into public.discount_codes (code, type, value, active)
values ('WELCOME10', 'percent', 10, true)
on conflict (code) do nothing;

-- ------------------------------------------------------------
-- Seed products (uses the same artwork shipped in /public/images).
-- After running, promote your account:
--   update public.profiles set is_admin = true where email = 'you@brand.com';
-- ------------------------------------------------------------

do $$
declare
  r record;
  pid uuid;
  c record;
  s record;
begin
  for r in
    select * from (values
      ('Street Cargo Pants','street-cargo-pants','cargo',1499,'SP-CRG-001',true,true,true,
        array['/images/col-cargo.jpg','/images/prod-back.svg','/images/detail-fabric.jpg','/images/editorial-1.jpg'],
        array['Deep Navy','Black','Graphite']),
      ('Signature Wide Leg Pants','signature-wide-leg-pants','wide-leg',1699,'SP-WDL-002',true,false,true,
        array['/images/col-wideleg.jpg','/images/editorial-1.jpg','/images/detail-fabric.jpg'],
        array['Stone','Deep Navy']),
      ('Essential Black Pants','essential-black-pants','essentials',899,'SP-ESS-003',false,true,true,
        array['/images/col-essentials.jpg','/images/prod-straight.svg','/images/detail-zoom.svg'],
        array['Black','Graphite']),
      ('Navy Utility Pants','navy-utility-pants','utility',1499,'SP-UTL-004',false,true,true,
        array['/images/col-utility.svg','/images/night.svg','/images/detail-fabric.jpg'],
        array['Deep Navy','Black']),
      ('Relaxed Fit Pants','relaxed-fit-pants','essentials',1099,'SP-ESS-005',false,false,false,
        array['/images/prod-relaxed.svg','/images/col-essentials.jpg','/images/detail-zoom.svg'],
        array['Cream','Black','Deep Navy']),
      ('Urban Cargo','urban-cargo','cargo',1299,'SP-CRG-006',false,true,false,
        array['/images/prod-back.svg','/images/col-cargo.jpg','/images/editorial-3.jpg'],
        array['Black','Graphite']),
      ('Premium Straight Pants','premium-straight-pants','essentials',1299,'SP-ESS-007',false,true,true,
        array['/images/prod-straight.svg','/images/col-essentials.jpg','/images/detail-zoom.svg'],
        array['Black','Deep Navy']),
      ('Street Denim Pants','street-denim-pants','denim',1299,'SP-DNM-008',true,false,false,
        array['/images/col-denim.jpg','/images/editorial-2.jpg','/images/detail-fabric.jpg'],
        array['Indigo','Black']),
      ('Wide Leg Cargo','wide-leg-cargo','wide-leg',1699,'SP-WDL-009',true,false,true,
        array['/images/prod-widecargo.svg','/images/editorial-3.jpg','/images/col-wideleg.jpg'],
        array['Deep Navy','Graphite']),
      ('Essential Relaxed Pants','essential-relaxed-pants','essentials',1099,'SP-ESS-010',false,false,false,
        array['/images/prod-essential-relaxed.svg','/images/prod-relaxed.svg','/images/about-1.jpg'],
        array['Deep Navy','Cream'])
    ) as t(name, slug, category, price, sku, is_new, is_best, featured, images, colors)
  loop
    insert into public.products (name, slug, category, price, sku, is_new, is_best_seller, featured, published, description)
    values (r.name, r.slug, r.category, r.price, r.sku, r.is_new, r.is_best, r.featured, true,
            'Premium STREET PANTS silhouette — see storefront for full details.')
    on conflict do nothing
    returning id into pid;

    if pid is not null then
      insert into public.product_images (product_id, url, position)
      select pid, url, ord from unnest(r.images) with ordinality as u(url, ord);

      for c in select id from public.colors where name = any(r.colors)
      loop
        for s in select id from public.sizes
        loop
          insert into public.product_variants (product_id, color_id, size_id, stock)
          values (pid, c.id, s.id, 12)
          on conflict do nothing;
        end loop;
      end loop;
    end if;
  end loop;
end $$;
