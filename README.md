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

The TyreLink schema is maintained in `supabase/migrations/001_initial_schema.sql`. It is intended for the isolated TyreLink database boundary, separate from the existing Afrikiko data.

## Roles

See `docs/user-roles.md` for customer, admin, fitter and fitting-station boundaries.
