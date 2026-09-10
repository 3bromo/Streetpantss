-- ============================================================
-- STREET PANTS — fix "column reference \"order_id\" is ambiguous"
-- when cancelling an order from the Admin Panel.
--
-- Run ONCE in: Supabase Dashboard → SQL Editor → Run.
--
-- Cause: inside cancel_order(), the unqualified column name
-- "order_id" in the order_items query collided with the function
-- PARAMETER of the same name. The column is now explicitly
-- qualified (oi.order_id / cancel_order.order_id).
--
-- This ONLY replaces the function. No tables, rows, or data are
-- touched. Orders, items and stock history stay exactly as they are.
-- ============================================================

create or replace function public.cancel_order(order_id uuid)
returns void
language plpgsql security definer
as $$
declare it record;
begin
  update public.orders set status = 'cancelled'
    where id = cancel_order.order_id and status <> 'cancelled';
  if found then
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

-- done. Cancelling orders from the Admin Panel now works.
