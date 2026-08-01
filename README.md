# TyreLink Ghana

A mobile-first Ghanaian tyre marketplace connecting customers with compatible tyres, approved fitting stations and qualified fitters.

## Current build

This repository contains a native Next.js TypeScript application foundation. The customer and fitting-station journeys are implemented as reusable React features with a typed data boundary. PWA install/offline behaviour is deliberately deferred until the refactor has passed its verification gates.

## Core journey

`Vehicle/size search → catalogue → compare → fitting station → appointment → customer details → order confirmation`

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` when the TyreLink Supabase API boundary is connected. Do not commit credentials.

## Backend

The canonical TyreLink database boundary is the isolated `tyrelink` schema:

- Base schema: `supabase/migrations/001_initial_schema_tyrelink.sql`
- Station settings migration: `supabase/migrations/002_station_profile_settings.sql`
- Demo data: `supabase/seed/001_demo_data.sql`

The schema is separate from the existing Afrikiko data. See `docs/database.md` for the station settings model and migration notes.

## Roles

See `docs/user-roles.md` for customer, admin, fitter and fitting-station boundaries.

## Reference materials and brand assets

- Project proposal: `docs/reference/tyrelink-proposal.pdf`
- Brand guide: `docs/reference/tyrelink-brand-guide.pdf`
- Logo assets: `public/brand/`

See `docs/reference/README.md` and `public/brand/README.md` for the asset inventory and usage notes.
