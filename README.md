# TyreLink Ghana — clickable prototype

A mobile-first, click-through prototype for a Ghanaian tyre marketplace connecting customers, tyre suppliers and approved fitting stations.

## Prototype journey

`Find my tyres → Choose vehicle → Compare tyres → Choose fitting station → Book a fitting time → Review all-in price → Confirmation`

## Backend foundation

- [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) — initial PostgreSQL/Supabase schema
- [`docs/user-roles.md`](docs/user-roles.md) — customer, admin, fitter and fitting-station boundaries

The schema deliberately separates the individual **fitter** from the approved **fitting station**. Suppliers are represented as admin-managed marketplace entities in the first release; a supplier portal can be added later.

## Important

This is a front-end demonstration only. It uses illustrative tyre listings, fitting stations, prices and appointment slots. There is no backend, live inventory, payment processing, account system or real booking.

## Run locally

```bash
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).

## Product idea represented

- Suppliers/manufacturers list tyres.
- Customers compare tyre brand, size, price and warranty.
- Tyres are delivered only to approved fitting stations.
- Fitting fee is calculated by the number of tyres.
- Customers see the fitting location, price and estimated time before confirming.
- Suppliers and stations would later receive stock, booking and settlement dashboards.

## Deferred from this prototype

- Live stock and supplier accounts
- MoMo/card payments
- Real maps and location search
- Customer accounts and order history
- Supplier dispatch workflow
- Fitting-station approval and membership billing
- Warranty and returns workflow
