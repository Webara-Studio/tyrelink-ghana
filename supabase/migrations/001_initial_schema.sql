-- TyreLink Ghana — initial Supabase/PostgreSQL schema
--
-- Four application roles:
--   customer        buys tyres and books fitting
--   admin           operates the marketplace
--   fitter          individual technician who performs the work
--   fitting_station approved business/location receiving tyres and hosting fitting
--
-- Suppliers are represented as marketplace entities and are initially managed by
-- admins. A supplier portal can be added later without changing the core order model.

create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin', 'fitter', 'fitting_station');
create type public.account_status as enum ('pending', 'active', 'suspended', 'rejected');
create type public.business_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type public.order_status as enum (
  'draft', 'pending_payment', 'paid', 'stock_reserved', 'dispatched',
  'received_at_station', 'appointment_confirmed', 'ready_for_fitting',
  'completed', 'cancelled', 'refunded'
);
create type public.appointment_status as enum (
  'held', 'booked', 'rescheduled', 'completed', 'cancelled', 'no_show'
);
create type public.payment_status as enum ('pending', 'successful', 'failed', 'refunded');
create type public.inventory_status as enum ('active', 'paused', 'out_of_stock');
create type public.settlement_status as enum ('pending', 'approved', 'paid', 'failed');

-- Updated-at helper.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Identity and the four app roles
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  status public.account_status not null default 'active',
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  default_city text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- Approved business/location where tyres are delivered and fitted.
create table public.fitting_stations (
  id uuid primary key default gen_random_uuid(),
  trading_name text not null,
  legal_name text,
  phone text not null,
  email text,
  address_line text not null,
  city text not null,
  region text,
  digital_address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  status public.business_status not null default 'pending',
  membership_status text not null default 'pending'
    check (membership_status in ('pending', 'active', 'paused', 'cancelled')),
  fitting_bays integer not null default 1 check (fitting_bays > 0),
  standard_fitting_minutes integer not null default 60 check (standard_fitting_minutes > 0),
  opening_hours jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A station-role account is the station manager or station operations user.
create table public.station_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  station_id uuid not null references public.fitting_stations(id) on delete cascade,
  account_title text not null default 'station_manager',
  created_at timestamptz not null default now(),
  unique (profile_id, station_id)
);

-- Individual technician. A fitter may work at more than one station.
create table public.fitters (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  certification_notes text,
  years_experience integer check (years_experience >= 0),
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fitter_station_memberships (
  fitter_id uuid not null references public.fitters(profile_id) on delete cascade,
  station_id uuid not null references public.fitting_stations(id) on delete cascade,
  is_primary boolean not null default false,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (fitter_id, station_id)
);

-- -----------------------------------------------------------------------------
-- Suppliers and catalogue
-- -----------------------------------------------------------------------------

-- Suppliers are admin-managed in the first release. They can later receive their
-- own portal role without changing product, inventory or order relationships.
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  trading_name text not null,
  legal_name text,
  contact_name text,
  phone text,
  email text,
  city text,
  status public.business_status not null default 'pending',
  commission_rate numeric(5,2) not null default 0 check (commission_rate >= 0 and commission_rate <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tyre_products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  width_mm integer not null check (width_mm > 0),
  aspect_ratio integer not null check (aspect_ratio > 0),
  rim_size integer not null check (rim_size > 0),
  load_index text,
  speed_rating text,
  category text not null default 'mid_range'
    check (category in ('budget', 'mid_range', 'premium', 'commercial')),
  warranty_description text,
  wet_grip_rating text,
  mileage_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand, model, width_mm, aspect_ratio, rim_size, load_index, speed_rating)
);

create table public.supplier_inventory (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  product_id uuid not null references public.tyre_products(id) on delete restrict,
  supplier_sku text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  currency char(3) not null default 'GHS',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  dispatch_time_hours integer not null default 24 check (dispatch_time_hours >= 0),
  status public.inventory_status not null default 'active',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (reserved_quantity <= stock_quantity),
  unique (supplier_id, product_id, supplier_sku)
);

create table public.vehicle_fitments (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year_from integer check (year_from >= 1900),
  year_to integer check (year_to >= year_from),
  product_id uuid not null references public.tyre_products(id) on delete cascade,
  recommended boolean not null default false,
  notes text,
  unique (make, model, year_from, year_to, product_id)
);

-- -----------------------------------------------------------------------------
-- Station services and appointment capacity
-- -----------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  service_type text not null
    check (service_type in ('fitting', 'balancing', 'alignment', 'valve', 'disposal', 'other')),
  active boolean not null default true
);

create table public.station_services (
  station_id uuid not null references public.fitting_stations(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  price numeric(12,2) not null check (price >= 0),
  price_unit text not null default 'per_job'
    check (price_unit in ('per_job', 'per_tyre', 'per_vehicle')),
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  active boolean not null default true,
  primary key (station_id, service_id)
);

create table public.station_slots (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.fitting_stations(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 1 check (capacity > 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  active boolean not null default true,
  check (ends_at > starts_at),
  check (booked_count <= capacity),
  unique (station_id, starts_at, ends_at)
);

-- -----------------------------------------------------------------------------
-- Orders, appointments, payments and settlement
-- -----------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('TL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_id uuid not null references public.customers(profile_id) on delete restrict,
  station_id uuid not null references public.fitting_stations(id) on delete restrict,
  status public.order_status not null default 'draft',
  customer_name text not null,
  customer_phone text not null,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_registration text,
  tyre_subtotal numeric(12,2) not null default 0 check (tyre_subtotal >= 0),
  service_subtotal numeric(12,2) not null default 0 check (service_subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  currency char(3) not null default 'GHS',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prices and supplier identity are copied into the order item so history does
-- not change when a supplier updates its listing later.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  inventory_id uuid not null references public.supplier_inventory(id) on delete restrict,
  product_id uuid not null references public.tyre_products(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.order_services (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  station_id uuid not null references public.fitting_stations(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  station_id uuid not null references public.fitting_stations(id) on delete restrict,
  slot_id uuid references public.station_slots(id) on delete restrict,
  fitter_id uuid references public.fitters(profile_id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'held',
  customer_notes text,
  fitter_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null,
  provider_reference text,
  payment_method text not null
    check (payment_method in ('momo', 'card', 'bank_transfer', 'pay_at_station')),
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'GHS',
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  old_status public.order_status,
  new_status public.order_status,
  note text,
  created_at timestamptz not null default now()
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  beneficiary_type text not null check (beneficiary_type in ('supplier', 'fitter', 'fitting_station', 'marketplace')),
  beneficiary_id uuid,
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  commission_amount numeric(12,2) not null default 0 check (commission_amount >= 0),
  net_amount numeric(12,2) not null check (net_amount >= 0),
  currency char(3) not null default 'GHS',
  status public.settlement_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Useful indexes and triggers
-- -----------------------------------------------------------------------------

create index supplier_inventory_product_idx on public.supplier_inventory(product_id);
create index supplier_inventory_available_idx on public.supplier_inventory(status, product_id)
  where status = 'active';
create index vehicle_fitments_lookup_idx on public.vehicle_fitments(make, model, year_from, year_to);
create index station_city_status_idx on public.fitting_stations(city, status);
create index station_slots_lookup_idx on public.station_slots(station_id, starts_at)
  where active = true;
create index orders_customer_idx on public.orders(customer_id, created_at desc);
create index orders_station_status_idx on public.orders(station_id, status, created_at desc);
create index order_events_order_idx on public.order_events(order_id, created_at);
create index appointments_station_time_idx on public.appointments(station_id, starts_at);

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger fitting_stations_updated_at before update on public.fitting_stations
for each row execute function public.set_updated_at();
create trigger fitters_updated_at before update on public.fitters
for each row execute function public.set_updated_at();
create trigger suppliers_updated_at before update on public.suppliers
for each row execute function public.set_updated_at();
create trigger tyre_products_updated_at before update on public.tyre_products
for each row execute function public.set_updated_at();
create trigger supplier_inventory_updated_at before update on public.supplier_inventory
for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Supabase RLS foundation
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.fitting_stations enable row level security;
alter table public.station_accounts enable row level security;
alter table public.fitters enable row level security;
alter table public.fitter_station_memberships enable row level security;
alter table public.suppliers enable row level security;
alter table public.tyre_products enable row level security;
alter table public.supplier_inventory enable row level security;
alter table public.vehicle_fitments enable row level security;
alter table public.services enable row level security;
alter table public.station_services enable row level security;
alter table public.station_slots enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_services enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.order_events enable row level security;
alter table public.settlements enable row level security;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_station_account(target_station_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.station_accounts
    where profile_id = auth.uid() and station_id = target_station_id
  );
$$;

create or replace function public.is_fitter_at_station(target_station_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fitter_station_memberships
    where fitter_id = auth.uid() and station_id = target_station_id and active = true
  );
$$;

-- Public catalogue and approved station discovery.
create policy "approved stations are publicly viewable"
on public.fitting_stations for select
using (status = 'approved');

create policy "admins manage fitting stations"
on public.fitting_stations for all
using (public.is_admin())
with check (public.is_admin());

create policy "active products are publicly viewable"
on public.tyre_products for select
using (active = true);

create policy "admins manage products"
on public.tyre_products for insert
with check (public.is_admin());

create policy "admins update products"
on public.tyre_products for update
using (public.is_admin())
with check (public.is_admin());

create policy "admins delete products"
on public.tyre_products for delete
using (public.is_admin());

create policy "active supplier listings are publicly viewable"
on public.supplier_inventory for select
using (status = 'active');

create policy "vehicle fitments are publicly viewable"
on public.vehicle_fitments for select
using (true);

create policy "active services are publicly viewable"
on public.services for select
using (active = true);

create policy "active station services are publicly viewable"
on public.station_services for select
using (active = true);

create policy "active station slots are publicly viewable"
on public.station_slots for select
using (active = true);

-- Profiles and role-owned records.
create policy "users view their own profile"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "users update their own profile"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "customers manage their own record"
on public.customers for all
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

create policy "station accounts view their station"
on public.station_accounts for select
using (profile_id = auth.uid() or public.is_admin());

create policy "admins manage station accounts"
on public.station_accounts for all
using (public.is_admin())
with check (public.is_admin());

create policy "fitters manage their own record"
on public.fitters for all
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

create policy "station staff view fitter memberships"
on public.fitter_station_memberships for select
using (public.is_station_account(station_id) or public.is_fitter_at_station(station_id) or public.is_admin());

-- Orders: customers see their own; station accounts and assigned fitters see
-- operational orders; admins have full visibility.
create policy "customers create and view their own orders"
on public.orders for select
using (customer_id = auth.uid() or public.is_admin() or public.is_station_account(station_id) or public.is_fitter_at_station(station_id));

create policy "customers create orders"
on public.orders for insert
with check (customer_id = auth.uid());

create policy "operations update orders"
on public.orders for update
using (public.is_admin() or public.is_station_account(station_id) or public.is_fitter_at_station(station_id))
with check (public.is_admin() or public.is_station_account(station_id) or public.is_fitter_at_station(station_id));

create policy "order items follow order visibility"
on public.order_items for select
using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin() or public.is_station_account(o.station_id) or public.is_fitter_at_station(o.station_id))));

create policy "order services follow order visibility"
on public.order_services for select
using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin() or public.is_station_account(o.station_id) or public.is_fitter_at_station(o.station_id))));

create policy "appointments follow station operations"
on public.appointments for all
using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_station_account(o.station_id) or public.is_fitter_at_station(o.station_id))))
with check (public.is_admin() or public.is_station_account(station_id) or public.is_fitter_at_station(station_id));

create policy "payments are visible to customer and admin"
on public.payments for select
using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));

create policy "order events follow order visibility"
on public.order_events for select
using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_admin() or public.is_station_account(o.station_id) or public.is_fitter_at_station(o.station_id))));

create policy "admins manage settlements"
on public.settlements for all
using (public.is_admin())
with check (public.is_admin());

-- Supplier, catalogue administration and settlement writes remain admin-only in
-- the first release. Add supplier-portal policies when that role is introduced.
create policy "admins manage suppliers"
on public.suppliers for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage inventory"
on public.supplier_inventory for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage fitments"
on public.vehicle_fitments for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage services"
on public.services for insert
with check (public.is_admin());

create policy "admins update services"
on public.services for update
using (public.is_admin())
with check (public.is_admin());

create policy "admins delete services"
on public.services for delete
using (public.is_admin());

create policy "station staff manage station services"
on public.station_services for all
using (public.is_admin() or public.is_station_account(station_id))
with check (public.is_admin() or public.is_station_account(station_id));

create policy "station staff manage slots"
on public.station_slots for all
using (public.is_admin() or public.is_station_account(station_id))
with check (public.is_admin() or public.is_station_account(station_id));
