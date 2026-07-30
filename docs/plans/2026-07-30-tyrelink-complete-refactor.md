# TyreLink Ghana Complete Refactor Plan

> **For Hermes:** Execute this plan in small verified milestones. PWA implementation begins only after the refactor acceptance gates pass.

**Goal:** Establish one maintainable, typed Next.js application for TyreLink Ghana before adding offline/PWA behaviour.

**Architecture:** Keep the App Router and same-origin Supabase proxy, but make the customer and station journeys native React feature modules with typed domain contracts, explicit reducer state, screen registries, reusable UI primitives and deterministic loading/error handling. Remove legacy prototype runtime code and defer service-worker behaviour until the application shell is stable.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, native CSS, Supabase PostgREST through a same-origin route handler, Vercel.

---

## Current baseline

- Repository: `Webara-Studio/tyrelink-ghana`
- Production branch: `main`
- Current production commit: `73f9855`
- Baseline build: passes with two Autoprefixer warnings in `globals.css`
- Existing native customer journey: present, but concentrated in `customer-journey.tsx`
- Existing station portal: native React, fixture-backed
- Existing legacy runtime: `prototype-source.html`, `index.html` and `prototype-experience.tsx` remain
- Existing service worker: registered from the application before PWA requirements have been agreed

## Refactor scope

| Area | Outcome | Priority |
|---|---|---:|
| Runtime ownership | One native React source of truth; no injected HTML or global browser functions | P0 |
| Customer journey | Split into typed, screen-level components with a route registry | P0 |
| Journey state | Extract reducer/types/selectors from the component file; preserve selections and reset behaviour | P0 |
| Data layer | One typed API client with shared request/error/retry conventions for tyres, stations and slots | P0 |
| Operational portal | Split station portal into view modules and typed fixtures/data boundary | P1 |
| UI system | Extract repeated journey/station primitives and normalise stylesheet structure | P1 |
| Accessibility | Labels, focus order, keyboard actions, disabled states and semantic landmarks | P0 |
| Tests | Reducer, pricing, API mapping and critical journey checks | P0 |
| Legacy removal | Remove prototype runtime files after parity checks | P0 |
| PWA | Offline shell, manifest, icons, install/update strategy | Deferred until after this plan |

## Explicit non-goals

- Real payment capture or MoMo integration
- Production order persistence or settlement
- Authentication and role-based authorisation
- Service-worker/offline caching implementation
- Replacing the approved visual language with a redesign
- Reusing or modifying Afrikiko tables

---

## Phase 1 — Protect the baseline

1. Create `refactor/complete-foundation` from the current `main` commit.
2. Keep `main` and the production alias untouched during implementation.
3. Record the clean build, `git diff --check`, route list and public API checks.
4. Add a plan-linked refactor checkpoint commit.

**Gate:** branch is clean, baseline build passes, production is unchanged.

## Phase 2 — Establish domain boundaries

Create:

- `src/domain/journey.ts`
- `src/domain/catalogue.ts`
- `src/domain/station.ts`
- `src/domain/order.ts`
- `src/lib/formatters.ts`
- `src/lib/validation.ts`

Move shared types, service definitions, pricing calculations, deposit calculations and display formatting out of UI files. Keep business rules pure and testable.

**Gate:** no duplicated total/deposit calculation remains in screen components; typecheck passes.

## Phase 3 — Stabilise journey state

Modify/create:

- `src/features/journey/journey-types.ts`
- `src/features/journey/journey-reducer.ts`
- `src/features/journey/journey-context.tsx`
- `src/features/journey/journey-selectors.ts`

Requirements:

- screen registry is typed and centralised;
- selection actions clear invalid downstream selections;
- reset returns to a complete initial state;
- order/payment remains explicitly demo-labelled;
- reducer is exported for tests;
- pricing selectors are pure and use integer GHS values.

**Gate:** reducer tests cover vehicle → size → catalogue → product → station → slot → details → review → payment → success, back navigation, quantity bounds, service toggles and reset.

## Phase 4 — Harden the data boundary

Modify:

- `src/lib/tyrelink-api.ts`
- `src/app/api/tyrelink/[resource]/route.ts`

Requirements:

- one request helper with `AbortSignal`, `no-store`, safe error mapping and diagnostic resource names;
- typed mapping for PostgREST responses;
- station and slot reads expose loading/error/empty states and retry;
- no service-role credentials in browser code;
- API route retains an explicit resource allowlist and schema header;
- malformed numeric data is rejected or safely normalised.

**Gate:** API client tests cover query construction, HTTP failures, malformed JSON, aborts and product/inventory joins.

## Phase 5 — Split the customer journey

Create screen modules under `src/features/customer/screens/`:

- `home-screen.tsx`
- `vehicle-screen.tsx`
- `size-screen.tsx`
- `catalogue-screen.tsx`
- `product-screen.tsx`
- `compare-screen.tsx`
- `station-screen.tsx`
- `services-screen.tsx`
- `slot-screen.tsx`
- `details-screen.tsx`
- `review-screen.tsx`
- `payment-screen.tsx`
- `success-screen.tsx`
- `tracking-screen.tsx`

Keep `customer-journey.tsx` as composition only: provider, header, screen registry and footer. Use explicit callbacks, stable keys and semantic HTML. Preserve the existing customer copy and visual structure.

**Gate:** customer click-through works on desktop and mobile; no `innerHTML`, `DOMParser`, inline `onclick`, `window.go` or runtime script injection exists in the application path.

## Phase 6 — Refactor operational portal

Create:

- `src/features/station/types.ts`
- `src/features/station/fixtures.ts`
- `src/features/station/station-state.ts`
- `src/features/station/views/overview.tsx`
- `src/features/station/views/orders.tsx`
- `src/features/station/views/order-detail.tsx`
- `src/features/station/views/calendar.tsx`
- `src/features/station/views/settings.tsx`

Keep fixture-backed behaviour visibly labelled as an operational testing environment. Add explicit loading/data boundaries ready for Supabase later; do not pretend fixture updates are persisted.

**Gate:** `/station` supports navigation, receipt confirmation, settings save feedback, back links and return to the customer site without dead routes.

## Phase 7 — Clean the UI foundation

- Split `globals.css` into maintainable sections or imported feature styles without changing the visual language.
- Remove duplicate legacy selectors that are not used by native routes.
- Define shared focus-visible, disabled, error, empty and loading states.
- Verify touch targets, heading hierarchy, labels and keyboard navigation.
- Add metadata, canonical URL, robots and sitemap only where factual values are available.

**Gate:** no avoidable accessibility warnings in the critical journey; CSS build warnings are resolved or documented.

## Phase 8 — Remove legacy runtime

Only after Phases 2–7 pass:

- remove `src/components/prototype-experience.tsx`;
- remove `public/prototype-source.html`;
- remove root `index.html` if it is not a Next.js runtime entry;
- remove service-worker registration and `public/sw.js` for the non-PWA baseline;
- update README to describe the actual native app and deferred PWA milestone;
- search the complete source tree for legacy runtime patterns.

**Gate:** the only runtime source is native Next.js/React; no stale prototype assets or service-worker cache can affect testing.

## Phase 9 — Verification and release

Run:

```bash
rm -rf .next
npm run typecheck
npm run build
npm run test
npm run lint

git diff --check
```

Then verify:

- production API proxy repeatedly for tyres, inventory, stations and slots;
- fresh browser customer journey from home to tracking;
- fresh browser station journey at `/station`;
- console and network output;
- mobile viewport and keyboard navigation;
- no legacy runtime patterns in `src/` or public runtime assets;
- preview deployment before production promotion.

**Final refactor acceptance:** stable native journeys, verified data/error states, passing automated checks, clean source tree and a documented boundary between demo transactions and future production integration.

## PWA milestone after refactor

Only after this plan is accepted and deployed:

1. Add manifest and correctly sized icons.
2. Define install/update UX.
3. Add a versioned service worker with network-first HTML and no cache-first live API.
4. Decide which assets, if any, are available offline.
5. Test upgrade from an installed previous worker.
6. Verify installability, offline fallback and cache invalidation on real mobile browsers.

