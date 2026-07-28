# TyreLink Native React Refactor Plan

> **For Hermes:** Implement task-by-task with production verification after each milestone.

**Goal:** Replace the HTML injection/global-function prototype wrapper with a typed, native React customer journey and stable live-data layer while preserving the existing 30-screen UX and operational prototype coverage.

**Architecture:** Keep the existing isolated `tyrelink` Supabase schema and same-origin Next.js API proxy. Replace `prototype-source.html`, `DOMParser`, `dangerously`-style DOM mutation, inline `onclick` handlers and `window.go` monkey-patching with React components, typed journey state and explicit event handlers. Build the customer journey first, then migrate operational screens behind the same route/state registry.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, native CSS, same-origin route handlers, Supabase PostgREST through the existing proxy.

---

## Scope and acceptance criteria

| Area | Refactor outcome | Priority |
|---|---|---:|
| Customer journey | Native React screens from home through catalogue, product, station, slot, details, review, payment and success | P0 |
| Live catalogue | One typed request per catalogue entry, retry action, request cancellation/stale-response protection, explicit loading/error/empty states | P0 |
| Live stations and slots | Typed data access and state-driven screens | P0 |
| Journey state | Central typed reducer/context; no global mutable `state` | P0 |
| Prototype visual fidelity | Preserve current visual design and copy while migrating markup into JSX | P0 |
| Operational dashboards | Native React screen registry after customer journey is stable | P1 |
| Payments/order persistence | Remain a clearly labelled prototype until business rules and secure transaction flow are approved | P1 |
| Service worker | Keep only if it does not cache HTML/API; otherwise remove during beta | P1 |
| Legacy HTML | Remove `index.html`/`prototype-source.html` from the runtime path after migration | P0 |

**Not in this refactor:** service-role access in the browser, weakening RLS, real payment settlement, production order creation, or modifying existing Afrikiko tables.

---

## Task 1: Create the refactor branch and baseline evidence

**Files:**
- Branch: `refactor/native-react-journey`
- Test output: `/tmp/tyrelink-baseline.txt`

**Steps:**
1. Confirm `main` is clean and production remains on the last verified deployment.
2. Create the branch from the current production commit.
3. Run `npm run build`, `git diff --check`, and repeated proxy checks for products, inventory, stations and slots.
4. Record the outputs before changing runtime code.

**Acceptance:** Baseline build passes and all four live proxy resources return HTTP 200.

---

## Task 2: Add typed TyreLink API client

**Create:** `src/lib/tyrelink-api.ts`

**Objective:** Centralise all browser-side reads through one typed client and remove duplicated query construction from UI components.

**Required functions:**
- `listTyres(size): Promise<TyreProductWithInventory[]>`
- `listStations(): Promise<FittingStationWithPrice[]>`
- `listSlots(stationId): Promise<StationSlot[]>`

**Rules:**
- Use the same-origin `/api/tyrelink/*` routes only.
- Use `AbortSignal` support on every request.
- Throw typed errors with a safe user-facing message and a diagnostic `resource` field.
- Never log keys or raw credentials.
- Keep the existing public anonymous-key and RLS model.

**Tests:** Add unit tests for query construction, HTTP error mapping and abort handling using mocked `fetch`.

---

## Task 3: Add typed journey reducer/context

**Create:**
- `src/features/journey/journey-types.ts`
- `src/features/journey/journey-reducer.ts`
- `src/features/journey/journey-context.tsx`

**Objective:** Replace the injected prototype's global `state` object and `window.go` navigation with explicit React state.

**State must include:**
- `screen`
- `vehicle`
- `size`
- selected tyre and price
- selected station and fitting fee
- selected slot
- customer details
- selected services
- payment method
- catalogue request status and error

**Actions must include:**
- `GO_TO_SCREEN`
- `SELECT_VEHICLE`
- `SET_SIZE`
- `SELECT_TYRE`
- `SELECT_STATION`
- `SELECT_SLOT`
- `TOGGLE_SERVICE`
- `SET_CUSTOMER_DETAILS`
- `SELECT_PAYMENT`
- `RESET_JOURNEY`

**Acceptance:** Reducer tests cover forward navigation, back navigation, selection persistence and reset.

---

## Task 4: Migrate the customer journey into native React screens

**Create:**
- `src/features/customer/screens/home-screen.tsx`
- `vehicle-screen.tsx`
- `size-screen.tsx`
- `catalogue-screen.tsx`
- `product-screen.tsx`
- `compare-screen.tsx`
- `station-screen.tsx`
- `station-detail-screen.tsx`
- `services-screen.tsx`
- `slot-screen.tsx`
- `details-screen.tsx`
- `review-screen.tsx`
- `payment-screen.tsx`
- `success-screen.tsx`
- `track-screen.tsx`
- `src/features/customer/customer-journey.tsx`

**Objective:** Reproduce the existing customer UX in JSX while retaining the current CSS language and mobile layout.

**Catalogue requirements:**
- Load only when the catalogue screen is entered.
- Show loading state before results.
- Show a retry button on failure.
- Keep successful results visible while a refresh is in progress.
- Cancel obsolete requests on size changes/unmount.
- Never allow an old request to replace newer state.
- Use stable React keys based on product IDs.

**Acceptance:** A manual click-through reaches success without inline handlers, DOMParser, `innerHTML`, global functions or global mutable state.

---

## Task 5: Migrate operational prototype screens

**Create:** `src/features/operations/`

**Objective:** Convert station, fitter and admin screens into React components using a typed screen registry.

**Acceptance:** Existing dashboard navigation remains available, but all navigation is explicit React event handling.

---

## Task 6: Remove legacy runtime injection

**Modify/remove:**
- `src/components/prototype-experience.tsx`
- `public/prototype-source.html`
- root `index.html`
- `src/components/service-worker-register.tsx`
- `public/sw.js`

**Objective:** Ensure the runtime has one source of truth.

**Rules:**
- Do not delete the legacy source until the native customer and operations screens pass acceptance checks.
- Remove DOMParser, runtime script injection, inline `onclick`, `window.go`, and `window.chooseStation`.
- Remove service-worker registration during beta unless offline behaviour is explicitly tested.

---

## Task 7: Verification and deployment

**Checks:**
1. `rm -rf .next && npm run build`
2. `git diff --check`
3. Unit tests for API client and reducer
4. Repeated production proxy checks
5. Browser click-through from home to catalogue, product, station, slot and success
6. Confirm no `innerHTML`, `DOMParser`, `window.go`, `prototype-source.html` or direct browser HTTP Supabase URL remains in the runtime path
7. Deploy preview first, then production after verification

**Final acceptance:** Catalogue data remains visible for at least 60 seconds while navigating, retry recovers from a deliberately failed request, and no stale service worker or previous screen can overwrite current React state.

---
