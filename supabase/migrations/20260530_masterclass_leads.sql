create table if not exists public.masterclass_leads (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references public.course_purchases(id) on delete set null,
  course_id text not null default 'cpa-masterclass',
  course_name text not null default 'CPA Income Masterclass',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  amount integer not null default 2100,
  source text not null default 'masterclass',
  status text not null default 'created',
  razorpay_order_id text,
  razorpay_payment_id text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  paid_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists masterclass_leads_purchase_idx
  on public.masterclass_leads (purchase_id);

create index if not exists masterclass_leads_email_idx
  on public.masterclass_leads (lower(customer_email));

create index if not exists masterclass_leads_status_idx
  on public.masterclass_leads (status);

create index if not exists masterclass_leads_created_at_idx
  on public.masterclass_leads (created_at desc);

create or replace function public.set_masterclass_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_masterclass_leads_updated_at on public.masterclass_leads;

create trigger set_masterclass_leads_updated_at
before update on public.masterclass_leads
for each row
execute function public.set_masterclass_leads_updated_at();

alter table public.masterclass_leads enable row level security;
