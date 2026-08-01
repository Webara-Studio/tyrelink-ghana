# TyreLink database model

## Database boundary

TyreLink uses the isolated PostgreSQL schema `tyrelink`. Supabase Auth remains shared, while TyreLink application tables, policies and functions live inside this schema.

The canonical migration sequence is:

```text
supabase/migrations/001_initial_schema_tyrelink.sql
supabase/migrations/002_station_profile_settings.sql
supabase/seed/001_demo_data.sql
```

`supabase/migrations/001_initial_schema.sql` is retained as the older public-schema reference. New TyreLink changes should target the isolated `tyrelink` schema, not the legacy public-schema copy.

## Station services

Station service availability is represented by the existing normalised tables:

- `tyrelink.services` — the service catalogue.
- `tyrelink.station_services` — the services offered by a particular station, including price, unit, duration and active status.

The station portal currently supports these customer-facing add-ons:

- Wheel alignment (`service_type = alignment`)
- Wheel balancing (`service_type = balancing`)
- Tyre rotation (`service_type = rotation`)
- Valve replacement (`service_type = valve`)

The `active` field on `station_services` controls whether a service is currently offered to customers. Pricing remains station-specific and is stored in `station_services.price`.

## Accepted payment methods

The `002_station_profile_settings.sql` migration adds:

```text
tyrelink.station_payment_methods
```

Each station can have one row for each supported method:

| Value | Customer-facing label |
| --- | --- |
| `momo` | Mobile Money (MoMo) |
| `card` | Credit/debit card |
| `cash` | Cash |
| `usdt` | USDT |

The `enabled` boolean is the station’s Yes/No setting. A customer-facing query should filter with `enabled = true` and the relevant `station_id`.

## Security model

Row-level security is enabled on `station_payment_methods`.

- Approved, enabled payment methods are publicly readable for station discovery and checkout.
- Admins can manage all station payment-method rows.
- A station account can manage only rows belonging to its own station through `tyrelink.is_station_account(station_id)`.

Station services continue to use the existing policies:

- Active station services are publicly readable.
- Admins and the relevant station account can manage station service rows.

## Demo seed

The demo seed includes:

- Tyre rotation in the service catalogue.
- MoMo, card and cash enabled for demo stations.
- USDT disabled by default for demo stations.

The seed uses fixed station and service UUIDs and is safe to re-run for the demo environment.

## Frontend integration

The fitting-station portal now uses the Supabase browser client with the signed-in user session:

1. It signs in the station user with Supabase Auth.
2. It resolves the user’s station through `tyrelink.station_accounts`.
3. It loads the station’s service and payment-method rows.
4. It writes Yes/No changes through `station_services` and `station_payment_methods`.
5. RLS enforces that the user can only modify their own station.

The portal does not use a service-role key in the browser. Accounts must exist in `auth.users` and be linked through `tyrelink.station_accounts` before they can edit settings. An account that is authenticated but not linked to a station is refused access to the live controls.

The public read route remains available at:

```text
/api/tyrelink/station_payment_methods
```

Credentials and service-role keys must remain server-side. Do not add direct browser writes using a service-role key.
