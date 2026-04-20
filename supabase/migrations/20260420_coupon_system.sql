-- Coupon system: table + redemption ledger + audit log + RPC helpers
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).

create extension if not exists pgcrypto;

-- 1. Coupons catalog
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_value integer not null check (discount_value > 0),
  discount_type text not null check (discount_type in ('fixed', 'percentage')),
  max_users integer check (max_users is null or max_users > 0),
  used_count integer not null default 0,
  min_amount integer,
  expiry_date timestamptz,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists coupons_code_ci_uniq
  on public.coupons (lower(code));

create index if not exists coupons_status_idx
  on public.coupons (status);

create or replace function public.set_coupons_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_coupons_updated_at on public.coupons;
create trigger set_coupons_updated_at
before update on public.coupons
for each row
execute function public.set_coupons_updated_at();

-- 2. Coupon redemption ledger (one row per reserved/confirmed use)
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  coupon_code text not null,
  purchase_id uuid references public.course_purchases(id) on delete set null,
  customer_email text not null,
  discount_amount integer not null check (discount_amount >= 0),
  status text not null default 'reserved' check (status in ('reserved', 'confirmed', 'cancelled')),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  confirmed_at timestamptz
);

create index if not exists coupon_redemptions_coupon_idx
  on public.coupon_redemptions (coupon_id);

create index if not exists coupon_redemptions_email_idx
  on public.coupon_redemptions (lower(customer_email));

create index if not exists coupon_redemptions_status_idx
  on public.coupon_redemptions (status);

create unique index if not exists coupon_redemptions_purchase_uniq
  on public.coupon_redemptions (purchase_id)
  where purchase_id is not null;

-- 3. Audit log
create table if not exists public.coupon_audit_log (
  id bigserial primary key,
  coupon_id uuid references public.coupons(id) on delete set null,
  coupon_code text,
  action text not null,
  actor text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists coupon_audit_log_coupon_idx
  on public.coupon_audit_log (coupon_id);

create index if not exists coupon_audit_log_action_idx
  on public.coupon_audit_log (action);

-- 4. Extend course_purchases with coupon fields (safe alter)
alter table public.course_purchases
  add column if not exists coupon_code text,
  add column if not exists discount_amount integer not null default 0,
  add column if not exists original_amount integer,
  add column if not exists coupon_redemption_id uuid references public.coupon_redemptions(id) on delete set null;

-- 5. Row-level security: lock everything down, service_role bypasses
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.coupon_audit_log enable row level security;

-- deliberately no policies: anon / authenticated clients get zero rows.
-- All reads / writes must go through edge functions using the service role key.

-- 6. Preview (read-only) coupon check — used for frontend quote
create or replace function public.preview_coupon(
  p_code text,
  p_customer_email text,
  p_cart_amount integer
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons;
  v_active_reservations integer;
  v_already_used boolean;
  v_discount integer;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return json_build_object('ok', false, 'error', 'Please enter a coupon code.');
  end if;

  if p_cart_amount is null or p_cart_amount <= 0 then
    return json_build_object('ok', false, 'error', 'Invalid cart amount.');
  end if;

  select * into v_coupon
    from public.coupons
    where lower(code) = lower(trim(p_code));

  if not found then
    return json_build_object('ok', false, 'error', 'Invalid coupon code.');
  end if;

  if v_coupon.status <> 'active' then
    return json_build_object('ok', false, 'error', 'This coupon is not active.');
  end if;

  if v_coupon.expiry_date is not null and v_coupon.expiry_date < timezone('utc', now()) then
    return json_build_object('ok', false, 'error', 'This coupon has expired.');
  end if;

  if v_coupon.min_amount is not null and p_cart_amount < v_coupon.min_amount then
    return json_build_object('ok', false, 'error', 'Cart amount too low for this coupon.');
  end if;

  -- Active (non-expired) reservations still holding slots
  select count(*) into v_active_reservations
    from public.coupon_redemptions
    where coupon_id = v_coupon.id
      and status = 'reserved'
      and (expires_at is null or expires_at > timezone('utc', now()));

  if v_coupon.max_users is not null
     and (v_coupon.used_count + v_active_reservations) >= v_coupon.max_users then
    return json_build_object('ok', false, 'error', 'Coupon usage limit reached.');
  end if;

  if p_customer_email is not null and length(trim(p_customer_email)) > 0 then
    select exists (
      select 1
        from public.coupon_redemptions
        where coupon_id = v_coupon.id
          and lower(customer_email) = lower(trim(p_customer_email))
          and (
            status = 'confirmed'
            or (status = 'reserved'
                and (expires_at is null or expires_at > timezone('utc', now())))
          )
    ) into v_already_used;

    if v_already_used then
      return json_build_object('ok', false, 'error', 'You have already used this coupon.');
    end if;
  end if;

  if v_coupon.discount_type = 'fixed' then
    v_discount := least(v_coupon.discount_value, p_cart_amount);
  else
    v_discount := (p_cart_amount * v_coupon.discount_value) / 100;
    if v_discount > p_cart_amount then
      v_discount := p_cart_amount;
    end if;
  end if;

  return json_build_object(
    'ok', true,
    'code', v_coupon.code,
    'discount_amount', v_discount,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'expiry_date', v_coupon.expiry_date,
    'remaining_slots',
      case when v_coupon.max_users is null then null
           else greatest(v_coupon.max_users - v_coupon.used_count - v_active_reservations, 0)
      end
  );
end;
$$;

-- 7. Reserve a coupon slot (called during create_order). Race-safe via row lock.
create or replace function public.try_reserve_coupon(
  p_code text,
  p_customer_email text,
  p_cart_amount integer,
  p_hold_minutes integer default 30
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons;
  v_active_reservations integer;
  v_already_used boolean;
  v_discount integer;
  v_redemption_id uuid;
  v_expires_at timestamptz;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return json_build_object('ok', false, 'error', 'Please enter a coupon code.');
  end if;

  if p_customer_email is null or length(trim(p_customer_email)) = 0 then
    return json_build_object('ok', false, 'error', 'Customer email required.');
  end if;

  if p_cart_amount is null or p_cart_amount <= 0 then
    return json_build_object('ok', false, 'error', 'Invalid cart amount.');
  end if;

  select * into v_coupon
    from public.coupons
    where lower(code) = lower(trim(p_code))
    for update;

  if not found then
    return json_build_object('ok', false, 'error', 'Invalid coupon code.');
  end if;

  if v_coupon.status <> 'active' then
    return json_build_object('ok', false, 'error', 'This coupon is not active.');
  end if;

  if v_coupon.expiry_date is not null and v_coupon.expiry_date < timezone('utc', now()) then
    return json_build_object('ok', false, 'error', 'This coupon has expired.');
  end if;

  if v_coupon.min_amount is not null and p_cart_amount < v_coupon.min_amount then
    return json_build_object('ok', false, 'error', 'Cart amount too low for this coupon.');
  end if;

  select count(*) into v_active_reservations
    from public.coupon_redemptions
    where coupon_id = v_coupon.id
      and status = 'reserved'
      and (expires_at is null or expires_at > timezone('utc', now()));

  if v_coupon.max_users is not null
     and (v_coupon.used_count + v_active_reservations) >= v_coupon.max_users then
    return json_build_object('ok', false, 'error', 'Coupon usage limit reached.');
  end if;

  select exists (
    select 1
      from public.coupon_redemptions
      where coupon_id = v_coupon.id
        and lower(customer_email) = lower(trim(p_customer_email))
        and (
          status = 'confirmed'
          or (status = 'reserved'
              and (expires_at is null or expires_at > timezone('utc', now())))
        )
  ) into v_already_used;

  if v_already_used then
    return json_build_object('ok', false, 'error', 'You have already used this coupon.');
  end if;

  if v_coupon.discount_type = 'fixed' then
    v_discount := least(v_coupon.discount_value, p_cart_amount);
  else
    v_discount := (p_cart_amount * v_coupon.discount_value) / 100;
    if v_discount > p_cart_amount then
      v_discount := p_cart_amount;
    end if;
  end if;

  v_expires_at := timezone('utc', now()) + make_interval(mins => greatest(p_hold_minutes, 5));

  insert into public.coupon_redemptions
    (coupon_id, coupon_code, customer_email, discount_amount, status, expires_at)
    values
    (v_coupon.id, v_coupon.code, lower(trim(p_customer_email)), v_discount, 'reserved', v_expires_at)
    returning id into v_redemption_id;

  return json_build_object(
    'ok', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_amount', v_discount,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'redemption_id', v_redemption_id,
    'expires_at', v_expires_at
  );
end;
$$;

-- 8. Confirm a reservation (called from verify_payment after HMAC+amount check)
create or replace function public.confirm_coupon_reservation(
  p_redemption_id uuid,
  p_purchase_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.coupon_redemptions;
begin
  select * into v_redemption
    from public.coupon_redemptions
    where id = p_redemption_id
    for update;

  if not found then
    return json_build_object('ok', false, 'error', 'Redemption not found.');
  end if;

  if v_redemption.status = 'confirmed' then
    return json_build_object('ok', true, 'already_confirmed', true);
  end if;

  if v_redemption.status <> 'reserved' then
    return json_build_object('ok', false, 'error', 'Redemption is not reserved.');
  end if;

  update public.coupon_redemptions
    set status = 'confirmed',
        purchase_id = p_purchase_id,
        confirmed_at = timezone('utc', now()),
        expires_at = null
    where id = p_redemption_id;

  update public.coupons
    set used_count = used_count + 1,
        updated_at = timezone('utc', now())
    where id = v_redemption.coupon_id;

  return json_build_object('ok', true, 'confirmed_at', timezone('utc', now()));
end;
$$;

-- 9. Release a reservation (called on checkout cancel / failure)
create or replace function public.release_coupon_reservation(
  p_redemption_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.coupon_redemptions;
begin
  select * into v_redemption
    from public.coupon_redemptions
    where id = p_redemption_id
    for update;

  if not found then
    return json_build_object('ok', false, 'error', 'Redemption not found.');
  end if;

  if v_redemption.status <> 'reserved' then
    return json_build_object('ok', true, 'already_settled', true);
  end if;

  update public.coupon_redemptions
    set status = 'cancelled',
        expires_at = null
    where id = p_redemption_id;

  return json_build_object('ok', true);
end;
$$;
