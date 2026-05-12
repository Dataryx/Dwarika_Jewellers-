-- LEGACY: PostgreSQL / Supabase schema (no longer used by the API).
-- The app now stores catalog, cart, and orders in MongoDB — see api/_mongo.js
-- and run: npm run seed:mongo (with MONGODB_URI in .env).
-- ============================================================================
-- Below: optional reference if you ever switch back to Postgres.
-- ============================================================================

-- Lumière Jewellery — PostgreSQL schema for Supabase (or any Postgres host)

-- Products (store + admin)
create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null default 0,
  image_url text not null default '',
  category text not null default 'rings',
  material text not null default '',
  stock integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  customer_email text not null,
  total numeric(12, 2) not null default 0,
  payment_method text not null default 'cod',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Order line items
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete restrict,
  quantity integer not null default 1,
  price numeric(12, 2) not null default 0
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- Shared cart (demo app uses one server-side cart; API clears on checkout)
create table if not exists public.cart_items (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists cart_items_product_id_idx on public.cart_items (product_id);

-- Optional starter data (only if products table is empty)
do $$
begin
  if not exists (select 1 from public.products limit 1) then
    insert into public.products (name, description, price, image_url, category, material, stock, featured)
    values
      (
        'Aurora Ring',
        'Hand-set pavé diamonds in 18k gold.',
        2480,
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
        'rings',
        '18k gold, diamond',
        12,
        true
      ),
      (
        'Celeste Necklace',
        'Minimal chain with a single brilliant stone.',
        1890,
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
        'necklaces',
        'White gold, sapphire',
        8,
        true
      ),
      (
        'Luna Earrings',
        'Drop earrings with freshwater pearls.',
        920,
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
        'earrings',
        'Sterling silver, pearl',
        20,
        true
      ),
      (
        'Solstice Bracelet',
        'Slim cuff with engraved detail.',
        1340,
        'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
        'bracelets',
        'Rose gold',
        15,
        true
      );
  end if;
end $$;

-- Row Level Security: API uses the service role and bypasses RLS.
-- Enable RLS so accidental anon key use from the browser does not expose tables.
-- Add policies later if you read/write these tables from the client with the anon key.

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;

-- No policies = deny direct access with anon/authenticated keys.
-- Your Vercel routes in /api use SUPABASE_SERVICE_ROLE_KEY and are unaffected.
