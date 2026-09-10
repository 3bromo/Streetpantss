-- ============================================================
-- STREET PANTS — allow admins to DELETE orders (Admin app).
-- Run ONCE in: Supabase Dashboard → SQL Editor → Run.
--
-- Adds ONLY two delete policies gated by the existing is_admin().
-- No tables created, no data touched, RLS stays enabled.
-- (order_items rows are removed automatically via the existing
--  ON DELETE CASCADE foreign key once the policy allows it.)
-- ============================================================

create policy "orders admin delete" on public.orders
  for delete using (public.is_admin());

create policy "order items admin delete" on public.order_items
  for delete using (public.is_admin());

-- done.
