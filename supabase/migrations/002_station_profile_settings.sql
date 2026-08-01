-- TyreLink Ghana — station profile settings
-- Adds station-managed add-on services and accepted payment methods.
-- This migration targets the isolated TyreLink schema. Supabase Auth remains shared.

begin;

-- The existing station_services relation remains the source of truth for service
-- availability and pricing. Add tyre rotation as a first-class service type while
-- preserving the existing 'other' value for future services.
alter table tyrelink.services
  drop constraint if exists services_service_type_check;

alter table tyrelink.services
  add constraint services_service_type_check
  check (service_type in ('fitting', 'balancing', 'alignment', 'rotation', 'valve', 'disposal', 'other'));

insert into tyrelink.services (id, name, service_type, active)
values ('50000000-0000-4000-8000-000000000006', 'Tyre rotation', 'rotation', true)
on conflict (id) do update
set name = excluded.name,
    service_type = excluded.service_type,
    active = excluded.active;

-- Payment availability belongs to the station, not to an order or a global
-- payment provider. This allows each station to publish its own accepted methods.
create table if not exists tyrelink.station_payment_methods (
  station_id uuid not null references tyrelink.fitting_stations(id) on delete cascade,
  payment_method text not null
    check (payment_method in ('momo', 'card', 'cash', 'usdt')),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (station_id, payment_method)
);

create index if not exists station_payment_methods_enabled_idx
  on tyrelink.station_payment_methods(station_id, payment_method)
  where enabled = true;

alter table tyrelink.station_payment_methods enable row level security;

create policy "enabled station payment methods are publicly viewable"
  on tyrelink.station_payment_methods for select
  using (enabled = true);

create policy "station staff manage station payment methods"
  on tyrelink.station_payment_methods for all
  using (tyrelink.is_admin() or tyrelink.is_station_account(station_id))
  with check (tyrelink.is_admin() or tyrelink.is_station_account(station_id));

create trigger station_payment_methods_updated_at
  before update on tyrelink.station_payment_methods
  for each row execute function tyrelink.set_updated_at();

comment on table tyrelink.station_payment_methods is
  'Payment methods each fitting station accepts: momo, card, cash or usdt.';
comment on column tyrelink.station_services.active is
  'Whether this station currently offers the service to customers.';

commit;
