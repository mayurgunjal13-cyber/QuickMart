-- QuickMart Supabase Database Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- ============================================
-- 1. PRODUCTS TABLE
-- ============================================
create table if not exists products (
  id serial primary key,
  name text not null,
  price decimal(10,2) not null,
  category text not null,
  emoji text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- 2. PROFILES TABLE (extends auth.users)
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  role text default 'customer' check (role in ('owner', 'admin', 'customer')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- 3. ORDERS TABLE
-- ============================================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  items jsonb not null,
  total decimal(10,2) not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table products enable row level security;
alter table profiles enable row level security;
alter table orders enable row level security;

-- Products: Everyone can read, only admins/owners can write
create policy "Products are viewable by everyone" 
  on products for select 
  using (true);

create policy "Admins can insert products" 
  on products for insert 
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
  );

create policy "Admins can update products" 
  on products for update 
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
  );

create policy "Admins can delete products" 
  on products for delete 
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
  );

-- Profiles: Users can read their own profile, admins can read all
create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Admins can view all profiles" 
  on profiles for select 
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
  );

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on profiles for insert 
  with check (auth.uid() = id);

-- Orders: Users can see their own orders, admins see all
create policy "Users can view own orders" 
  on orders for select 
  using (auth.uid() = user_id);

create policy "Admins can view all orders" 
  on orders for select 
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('owner', 'admin'))
  );

create policy "Users can insert own orders" 
  on orders for insert 
  with check (auth.uid() = user_id);

-- ============================================
-- 5. FUNCTION: Create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case 
      when new.email = 'mayurgunjal13@gmail.com' then 'owner'
      else 'customer'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 6. SEED PRODUCTS DATA
-- ============================================
insert into products (id, name, price, category, emoji) values
  (1, 'Rice 1kg', 45, 'Groceries', '🍚'),
  (2, 'Wheat Flour 1kg', 40, 'Groceries', '🌾'),
  (3, 'Sugar 1kg', 38, 'Groceries', '🍬'),
  (4, 'Oil 1L', 120, 'Groceries', '🫒'),
  (5, 'Salt Packet', 20, 'Groceries', '🧂'),
  (6, 'Milk 1L', 30, 'Groceries', '🥛'),
  (7, 'Bread', 25, 'Groceries', '🍞'),
  (8, 'Butter 100g', 55, 'Groceries', '🧈'),
  (9, 'Eggs (6)', 45, 'Groceries', '🥚'),
  (10, 'Tea Powder 250g', 70, 'Groceries', '🍵'),
  (11, 'Coffee 100g', 90, 'Groceries', '☕'),
  (12, 'Biscuits', 10, 'Groceries', '🍪'),
  (13, 'Chips', 20, 'Groceries', '🍟'),
  (14, 'Maggie Pack', 14, 'Groceries', '🍜'),
  (15, 'Masala 50g', 12, 'Groceries', '🧂'),
  (16, 'Soap', 28, 'Personal Care', '🧼'),
  (17, 'Shampoo Sachet', 5, 'Personal Care', '🧴'),
  (18, 'Detergent 1kg', 65, 'Personal Care', '🧺'),
  (19, 'Toothpaste', 45, 'Personal Care', '🦷'),
  (20, 'Toothbrush', 20, 'Personal Care', '🪥'),
  (21, 'Hair Oil', 35, 'Personal Care', '🧴'),
  (22, 'Facewash', 70, 'Personal Care', '🧴'),
  (23, 'Cream', 55, 'Personal Care', '🧴'),
  (24, 'Tissue Pack', 30, 'Personal Care', '🧻'),
  (25, 'Water Bottle 1L', 20, 'Beverages', '💧'),
  (26, 'Cold Drink 500ml', 35, 'Beverages', '🥤'),
  (27, 'Juice Packet', 25, 'Beverages', '🧃'),
  (28, 'Chocolate', 40, 'Beverages', '🍫'),
  (29, 'Ice Cream Cup', 25, 'Beverages', '🍨'),
  (30, 'Ketchup', 55, 'Groceries', '🍅'),
  (31, 'Pickle', 80, 'Groceries', '🥒'),
  (32, 'Paneer 200g', 60, 'Groceries', '🧀'),
  (33, 'Curd 400g', 35, 'Groceries', '🥣'),
  (34, 'Poha 1kg', 45, 'Groceries', '🍚'),
  (35, 'Dal 1kg', 60, 'Groceries', '🟡'),
  (36, 'Chana 1kg', 70, 'Groceries', '🟢'),
  (37, 'Rava 1kg', 45, 'Groceries', '📦'),
  (38, 'Groundnuts 500g', 50, 'Groceries', '🥜'),
  (39, 'Dry Fruits', 120, 'Groceries', '🌰'),
  (40, 'Soap Powder', 40, 'Personal Care', '📦'),
  (41, 'Room Freshener', 85, 'Personal Care', '🌸'),
  (42, 'Handwash', 55, 'Personal Care', '🧴'),
  (43, 'Battery Pack', 30, 'Household', '🔋'),
  (44, 'Matchbox', 10, 'Household', '🔥'),
  (45, 'Light Bulb', 65, 'Household', '💡')
on conflict (id) do nothing;

-- Reset sequence to avoid ID conflicts
select setval('products_id_seq', (select max(id) from products) + 1);
