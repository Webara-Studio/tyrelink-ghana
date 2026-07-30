import test from "node:test";
import assert from "node:assert/strict";
import { calculateOrderPricing } from "../.test-build/domain/order.js";
import { initialJourneyState, journeyReducer } from "../.test-build/features/journey/journey-reducer.js";

test("calculates tyre, fitting, service, deposit and balance totals", () => {
  const result = calculateOrderPricing({
    quantity: 4,
    tyreUnitPrice: 480,
    fittingUnitPrice: 35,
    services: [
      { id: "balancing", name: "Wheel balancing", price: 40, priceUnit: "per tyre" },
      { id: "alignment", name: "Wheel alignment", price: 120, priceUnit: "per job" },
    ],
  });

  assert.deepEqual(result, {
    tyreSubtotal: 1920,
    fittingSubtotal: 140,
    serviceSubtotal: 280,
    total: 2340,
    deposit: 234,
    balance: 2106,
  });
});

test("journey reducer preserves the critical customer path", () => {
  const size = { widthMm: 205, aspectRatio: 55, rimSize: 16 };
  const station = { id: "station-1", trading_name: "AutoCare", address_line: "East Legon", city: "Accra", fitting_bays: 4, standard_fitting_minutes: 45, fittingPrice: 35 };
  const next = journeyReducer(initialJourneyState, { type: "SELECT_VEHICLE", vehicle: "Toyota Corolla", size });
  assert.equal(next.screen, "size");
  const catalogue = journeyReducer(next, { type: "SET_SIZE", size });
  assert.equal(catalogue.screen, "catalogue");
  const selected = journeyReducer(catalogue, { type: "SELECT_STATION", station });
  assert.equal(selected.screen, "station");
  assert.equal(selected.selectedSlot, undefined);
  assert.equal(selected.slotsStatus, "idle");
});

test("journey reducer bounds quantity and resets cleanly", () => {
  const low = journeyReducer(initialJourneyState, { type: "SET_QUANTITY", quantity: 0 });
  const high = journeyReducer(initialJourneyState, { type: "SET_QUANTITY", quantity: 99 });
  assert.equal(low.quantity, 2);
  assert.equal(high.quantity, 4);
  const changed = journeyReducer(high, { type: "GO_TO", screen: "payment" });
  const reset = journeyReducer(changed, { type: "RESET_JOURNEY" });
  assert.deepEqual(reset, initialJourneyState);
});
