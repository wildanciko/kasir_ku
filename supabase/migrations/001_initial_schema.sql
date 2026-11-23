-- ============================================================
-- PosyMart — Initial Schema
-- Run this once in your Supabase project: SQL Editor → Run
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  username    text not null unique,
  password_hash text not null,          -- Argon2id PHC string
  name        text not null,
  role        text not null check (role in ('Admin', 'Kasir', 'Owner')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Seed demo accounts (password hashes match the ones in serverAuth.ts)
-- Passwords: admin→admin123, kasir→kasir123, owner→owner123
insert into public.users (username, password_hash, name, role) values
  ('admin', '$argon2id$v=19$m=19456,t=2,p=1$hluw7e5lhZdYBqUJ6wlBgQ$zbOBcM5Jon+MmWALF6v4pUlIc/Gyg44FDPhiuftzWH8', 'John Doe',      'Admin'),
  ('kasir', '$argon2id$v=19$m=19456,t=2,p=1$1/PZPutxeO5eY9BrlvHyiw$4SVCsulRij4tku2pMR5osDCJtcOVe9YMcsRwMTs8Qd4', 'Siti Rahayu',   'Kasir'),
  ('owner', '$argon2id$v=19$m=19456,t=2,p=1$ECoYVTVceMptMKmRjMo9xw$SPsGIZlvN9Y/0BaxfSxZvd2XlHj51yoUYGYtKXXCnZ4', 'Budi Santoso',  'Owner')
on conflict (username) do nothing;

-- ── Revoked sessions (token denylist) ────────────────────────
create table if not exists public.revoked_sessions (
  jti        text primary key,          -- token unique ID
  revoked_at timestamptz not null default now(),
  expires_at timestamptz not null       -- same as token exp; used for auto-cleanup
);

-- Auto-delete rows after the token would have expired anyway
-- (keeps the table from growing indefinitely)
create index if not exists revoked_sessions_expires_at_idx
  on public.revoked_sessions (expires_at);

-- ── Products ─────────────────────────────────────────────────
create table if not exists public.products (
  id          bigserial primary key,
  name        text not null check (char_length(name) between 1 and 100),
  price       numeric(10, 2) not null check (price > 0 and price <= 1000000),
  emoji       text not null default '🛒',
  category    text not null check (category in ('Coffee', 'Food', 'Drinks', 'Desserts')),
  image_path  text,                     -- Supabase Storage path, e.g. "products/42.webp"
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Seed default menu
insert into public.products (name, price, emoji, category) values
  ('Cappuccino',     3.50, '☕', 'Coffee'),
  ('Latte',          3.80, '🥛', 'Coffee'),
  ('Americano',      2.90, '☕', 'Coffee'),
  ('Mocha',          4.20, '☕', 'Coffee'),
  ('Bagel',          2.80, '🥯', 'Food'),
  ('Sandwich',       5.50, '🥪', 'Food'),
  ('Caesar Salad',   6.50, '🥗', 'Food'),
  ('Muffin',         2.60, '🧁', 'Desserts'),
  ('Orange Juice',   2.90, '🍊', 'Drinks'),
  ('Smoothie',       3.90, '🥤', 'Drinks'),
  ('Chocolate Cake', 4.50, '🎂', 'Desserts'),
  ('Cookie',         1.80, '🍪', 'Desserts')
on conflict do nothing;

-- ── Transactions (audit trail) ───────────────────────────────
create table if not exists public.transactions (
  id             bigserial primary key,
  tx_number      text not null unique,  -- e.g. "0001"
  cashier_id     uuid references public.users(id),
  cashier_name   text not null,
  items          jsonb not null,        -- [{id, name, price, qty, subtotal}]
  subtotal       numeric(10, 2) not null,
  tax            numeric(10, 2) not null,
  total          numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('Cash', 'Card', 'QRIS', 'Transfer')),
  note           text,
  created_at     timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────
-- We use the service role key server-side only, so RLS is a
-- defence-in-depth backstop — not the primary access control.

alter table public.users            enable row level security;
alter table public.revoked_sessions enable row level security;
alter table public.products         enable row level security;
alter table public.transactions     enable row level security;

-- Service role bypasses RLS automatically.
-- Deny all direct client access (anon / authenticated JWT from Supabase Auth).
-- Our app never exposes the supabase client to the browser.
create policy "deny anon users"     on public.users            for all to anon using (false);
create policy "deny anon revoked"   on public.revoked_sessions for all to anon using (false);
create policy "deny anon products"  on public.products         for all to anon using (false);
create policy "deny anon tx"        on public.transactions     for all to anon using (false);

-- ── updated_at triggers ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at    before update on public.users    for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

-- ── Cleanup job (call periodically or via pg_cron) ───────────
-- Removes expired revoked session entries so the table stays small.
-- If you have pg_cron enabled: uncomment and run once.
-- select cron.schedule('cleanup-revoked-sessions', '0 * * * *',
--   $$delete from public.revoked_sessions where expires_at < now()$$);
