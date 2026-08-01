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

## Frontend status

The fitting-station portal currently exposes the settings controls and keeps the selected values in the portal’s client state. The database migration and API allow-list are now ready for the next integration step: loading the station profile from Supabase and saving authorised station updates through an authenticated mutation path.

The public read route is available at:

```text
/api/tyrelink/station_payment_methods
```

Credentials and service-role keys must remain server-side. Do not add direct browser writes using a service-role key.
