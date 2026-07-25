# TyreLink Ghana — user roles and operating boundaries

## The four application roles

### 1. Customer

The customer searches for compatible tyres, compares products, selects an approved fitting station, chooses a fitting appointment and completes or tracks an order.

Customer can:

- Search by vehicle or tyre size.
- View active tyre products and supplier listings.
- Compare tyre price, category, warranty and availability.
- View approved fitting stations and their services.
- Select an appointment slot.
- Create and view their own orders.
- View payment status and order history.
- Receive fitting and delivery updates.

Customer cannot:

- Change catalogue prices.
- Change station slots.
- See another customer’s order.
- Mark an order as dispatched or fitted.

### 2. Admin

The admin is the marketplace operator and has operational control over the platform.

Admin can:

- Approve, reject or suspend fitting stations.
- Approve, reject or suspend fitters.
- Approve and manage suppliers.
- Manage the canonical tyre catalogue.
- Manage vehicle-fitment records.
- Manage supplier inventory and pricing.
- Monitor and update orders.
- Manage services, commissions and settlements.
- Resolve disputes, refunds and operational exceptions.
- View audit events and portfolio reporting.

The admin does not replace the fitter. The admin manages the marketplace; the fitter performs the physical work.

### 3. Fitter

A fitter is an individual technician. A fitter may work at one or more approved fitting stations.

Fitter can:

- Maintain their technician profile.
- Belong to approved fitting stations.
- View assigned or station-authorised appointments.
- See the vehicle, tyre quantity and selected services for a job.
- Add fitting notes.
- Mark work as started or completed.
- Record completed services or operational issues.

Fitter cannot:

- Change the marketplace tyre catalogue.
- Change supplier stock or product prices.
- View unrelated customer orders.
- Manage station membership or approval.
- Issue refunds or settlements.

### 4. Fitting station

A fitting station is an approved business and physical location. Its account represents the station manager or operations team, not an individual technician.

Fitting station can:

- Maintain station details, location and opening hours.
- Declare fitting bays and service capacity.
- Publish fitting, balancing and alignment services.
- Create and manage appointment slots.
- View orders assigned to the station.
- Confirm tyres received.
- Assign a fitter to an appointment.
- Reschedule appointments within policy.
- Confirm fitting completion.
- View station-level earnings and job history.

Fitting station cannot:

- Approve itself.
- Approve fitters globally.
- Change supplier inventory.
- Change customer payment status.
- View other stations’ operational data.

## Why fitter and station are separate

Keeping them separate reflects the real operation:

- A station can employ several fitters.
- A fitter may work across several stations.
- A station controls slots, bays and customer reception.
- A fitter controls the technical completion of the job.
- The marketplace needs to know who performed the work without treating that person as the owner of the business location.

The database therefore uses a many-to-many relationship between `fitters` and `fitting_stations` through `fitter_station_memberships`.

## Supplier boundary in the first release

Suppliers are included as business entities, inventory owners and settlement beneficiaries, but they are not yet a fifth application role. Admins manage supplier listings initially.

This is deliberate. It lets TyreLink validate the customer-to-station transaction before building a full supplier portal. A supplier portal can later be added with a dedicated supplier role and policies without changing the core order model.

## Core operational flow

```text
Customer selects tyre
  → supplier inventory is reserved
  → payment is confirmed
  → supplier dispatches to station
  → station confirms receipt
  → station books or assigns fitter
  → fitter completes the job
  → station confirms completion
  → admin approves settlement
```

## Important implementation rule

Every material transition should create an `order_events` record. This gives the admin an audit trail and prevents customer-support disputes from depending on chat messages or verbal explanations.
