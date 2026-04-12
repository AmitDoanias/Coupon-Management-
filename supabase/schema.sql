-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists coupons (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  brand           text not null,
  coupon_type     text not null check (coupon_type in ('barcode', 'card')),
  code            text not null default '',
  category        text not null,
  original_value  numeric(10,2) not null,
  purchase_cost   numeric(10,2) not null,
  current_balance numeric(10,2) not null,
  expiry_date     date not null,
  status          text not null default 'active' check (status in ('active', 'archived')),
  description     text,
  card_number     text,
  card_expiry     text,
  card_cvv        text,
  redemptions     jsonb not null default '[]',
  created_at      date not null default current_date
);

-- Row-level security: each user sees only their own coupons
alter table coupons enable row level security;

create policy "select own coupons" on coupons
  for select using (auth.uid() = user_id);

create policy "insert own coupons" on coupons
  for insert with check (auth.uid() = user_id);

create policy "update own coupons" on coupons
  for update using (auth.uid() = user_id);

create policy "delete own coupons" on coupons
  for delete using (auth.uid() = user_id);
