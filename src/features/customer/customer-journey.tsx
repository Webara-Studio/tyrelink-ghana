"use client";

import { useEffect, useRef } from "react";
import { formatTyreSize, listSlots, listStations, listTyres, type TyreProductWithInventory } from "@/lib/tyrelink-api";
import { JourneyProvider, useJourney } from "@/features/journey/journey-context";

function Header() {
  const { dispatch } = useJourney();
  return <header className="journey-header"><button className="journey-logo" onClick={() => dispatch({ type: "GO_TO", screen: "home" })}>◉ TyreLink</button><span>Live connected experience</span></header>;
}

function FlowHead({ step, back }: { step: string; back?: () => void }) {
  return <div className="journey-flow-head">{back ? <button className="journey-back" onClick={back}>← Back</button> : <span /> }<span>{step}</span></div>;
}

function HomeScreen() {
  const { dispatch } = useJourney();
  return <Screen><div className="journey-hero"><div><span className="journey-eyebrow">Tyres. Fitting. Sorted.</span><h1>Buy the right tyres. Fit them nearby.</h1><p>Compare trusted tyre brands, choose an approved fitting station and book a time that works for you.</p><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "vehicle" })}>Find my tyres →</button></div><div className="journey-hero-card"><strong>One place for the whole job</strong><span>Catalogue · fitting · booking</span></div></div></Screen>;
}

function VehicleScreen() {
  const { dispatch } = useJourney();
  const options = [
    ["Toyota Corolla", { widthMm: 205, aspectRatio: 55, rimSize: 16 }],
    ["Hyundai Elantra", { widthMm: 205, aspectRatio: 55, rimSize: 16 }],
    ["Kia Sportage", { widthMm: 235, aspectRatio: 55, rimSize: 18 }],
  ] as const;
  return <Screen><FlowHead step="1 of 9 · Your vehicle" back={() => dispatch({ type: "GO_TO", screen: "home" })} /><div className="journey-narrow"><h2>What are you driving?</h2><p className="journey-sub">Choose a vehicle to see compatible tyre sizes.</p><div className="journey-choice-grid">{options.map(([vehicle, size]) => <button className="journey-choice" key={vehicle} onClick={() => dispatch({ type: "SELECT_VEHICLE", vehicle, size })}><strong>{vehicle}</strong><span>{formatTyreSize(size)}</span></button>)}</div></div></Screen>;
}

function SizeScreen() {
  const { state, dispatch } = useJourney();
  return <Screen><FlowHead step="1 of 9 · Tyre size" back={() => dispatch({ type: "GO_TO", screen: "vehicle" })} /><div className="journey-narrow"><h2>Confirm your tyre size.</h2><p className="journey-sub">We’ll use this size to find compatible tyres in the live catalogue.</p><div className="journey-card"><strong>{state.vehicle}</strong><span>{formatTyreSize(state.size)}</span><button className="journey-button" onClick={() => dispatch({ type: "SET_SIZE", size: state.size })}>Show compatible tyres →</button></div></div></Screen>;
}

function CatalogueScreen() {
  const { state, dispatch } = useJourney();
  const requestRef = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);

  const load = async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const sequence = ++requestSequence.current;
    dispatch({ type: "CATALOGUE_LOADING" });
    try {
      const tyres = await listTyres(state.size, controller.signal);
      if (sequence === requestSequence.current) dispatch({ type: "CATALOGUE_READY", tyres });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (sequence === requestSequence.current) dispatch({ type: "CATALOGUE_ERROR", message: "The live catalogue could not be reached. Please try again." });
    }
  };

  useEffect(() => {
    if (state.catalogueStatus === "idle") void load();
    return () => requestRef.current?.abort();
    // Catalogue reloads only when the selected size changes or the user retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.size.widthMm, state.size.aspectRatio, state.size.rimSize]);

  return <Screen><FlowHead step="2 of 9 · Compare tyres" back={() => dispatch({ type: "GO_TO", screen: "vehicle" })} /><div className="journey-narrow"><h2>Choose your tyres.</h2><p className="journey-sub">Showing live options for <strong>{state.vehicle}</strong> in <strong>{formatTyreSize(state.size)}</strong>.</p>{state.catalogueStatus === "loading" && <div className="journey-card"><span>Checking live TyreLink stock…</span></div>}{state.catalogueStatus === "error" && <div className="journey-error"><strong>Catalogue unavailable</strong><span>{state.catalogueError}</span><button className="journey-button small" onClick={() => void load()}>Try again</button></div>}{state.catalogueStatus === "ready" && (state.tyres.length ? <div className="journey-product-list">{state.tyres.map((tyre) => <TyreCard key={tyre.id} tyre={tyre} onSelect={() => dispatch({ type: "SELECT_TYRE", tyre })} />)}</div> : <div className="journey-card"><span>No live tyres match this size yet.</span></div>)}</div></Screen>;
}

function TyreCard({ tyre, onSelect }: { tyre: TyreProductWithInventory; onSelect: () => void }) {
  return <article className="journey-product"><div className="journey-brand">{tyre.brand}</div><div><h3>{tyre.model}</h3><span>{formatTyreSize({ widthMm: tyre.width_mm, aspectRatio: tyre.aspect_ratio, rimSize: tyre.rim_size })} · {tyre.category}</span><small>{tyre.mileage_notes ?? "Suitable for everyday Ghanaian driving"}</small></div><div className="journey-product-action"><strong>GHS {tyre.unitPrice.toLocaleString()}</strong><small>{tyre.stockQuantity} in stock</small><button className="journey-button small" onClick={onSelect}>View and choose</button></div></article>;
}

function ProductScreen() {
  const { state, dispatch } = useJourney();
  const tyre = state.selectedTyre;
  if (!tyre) return <CatalogueScreen />;
  return <Screen><FlowHead step="3 of 9 · Product detail" back={() => dispatch({ type: "GO_TO", screen: "catalogue" })} /><div className="journey-narrow"><div className="journey-card"><span className="journey-tag">{tyre.category}</span><h2>{tyre.brand} {tyre.model}</h2><p>{formatTyreSize({ widthMm: tyre.width_mm, aspectRatio: tyre.aspect_ratio, rimSize: tyre.rim_size })} · {tyre.warranty_description ?? "12-month warranty"}</p><strong className="journey-large-price">GHS {tyre.unitPrice.toLocaleString()} per tyre</strong><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "station" })}>Choose fitting station →</button></div></div></Screen>;
}

function StationScreen() {
  const { state, dispatch } = useJourney();
  const loaded = useRef(false);
  useEffect(() => { if (!loaded.current) { loaded.current = true; void listStations().then((stations) => dispatch({ type: "STATIONS_READY", stations })).catch(() => undefined); } }, [dispatch]);
  if (state.selectedStation) return <Screen><FlowHead step="4 of 9 · Station detail" back={() => dispatch({ type: "GO_TO", screen: "product" })} /><div className="journey-narrow"><div className="journey-card"><span className="journey-tag">Approved fitting station</span><h2>{state.selectedStation.trading_name}</h2><p>{state.selectedStation.address_line}, {state.selectedStation.city}</p><strong>GHS {state.selectedStation.fittingPrice.toLocaleString()} / tyre</strong><span>{state.selectedStation.standard_fitting_minutes} minutes for 4 tyres · {state.selectedStation.fitting_bays} fitting bays</span><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "slot" })}>Choose an appointment →</button></div></div></Screen>;
  return <Screen><FlowHead step="4 of 9 · Choose station" back={() => dispatch({ type: "GO_TO", screen: "product" })} /><div className="journey-narrow"><h2>Where should we fit them?</h2><p className="journey-sub">Choose an approved TyreLink fitting station.</p><div className="journey-product-list">{state.stations.map((station) => <button className="journey-station" key={station.id} onClick={() => dispatch({ type: "SELECT_STATION", station })}><span><strong>{station.trading_name}</strong><small>{station.address_line}, {station.city} · {station.fitting_bays} bays</small></span><strong>GHS {station.fittingPrice.toLocaleString()} / tyre</strong></button>)}</div></div></Screen>;
}

function SlotScreen() {
  const { state, dispatch } = useJourney();
  const station = state.selectedStation;
  useEffect(() => { if (station) void listSlots(station.id).then((slots) => dispatch({ type: "SLOTS_READY", slots })).catch(() => undefined); }, [dispatch, station]);
  if (!station) return <StationScreen />;
  return <Screen><FlowHead step="6 of 9 · Book a time" back={() => dispatch({ type: "GO_TO", screen: "station" })} /><div className="journey-narrow"><h2>When suits you?</h2><p className="journey-sub">Available slots at {station.trading_name}.</p><div className="journey-slot-grid">{state.slots.map((slot) => <button className="journey-slot" key={slot.id} onClick={() => dispatch({ type: "SELECT_SLOT", slot })}>{new Date(slot.starts_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</button>)}</div></div></Screen>;
}

function DetailsScreen() { const { dispatch } = useJourney(); return <Screen><FlowHead step="7 of 9 · Your details" back={() => dispatch({ type: "GO_TO", screen: "slot" })} /><div className="journey-narrow"><h2>Where should we send your updates?</h2><div className="journey-card"><input className="journey-input" placeholder="Full name" defaultValue="Carl Anthony" /><input className="journey-input" placeholder="Mobile number" /><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "review" })}>Continue →</button></div></div></Screen>; }
function ReviewScreen() { const { state, dispatch } = useJourney(); return <Screen><FlowHead step="8 of 9 · Review" back={() => dispatch({ type: "GO_TO", screen: "details" })} /><div className="journey-narrow"><h2>Nearly sorted.</h2><div className="journey-card"><span>Tyres</span><strong>{state.selectedTyre?.brand} {state.selectedTyre?.model}</strong><span>Station</span><strong>{state.selectedStation?.trading_name}</strong><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "payment" })}>Continue to payment →</button></div></div></Screen>; }
function PaymentScreen() { const { dispatch } = useJourney(); return <Screen><FlowHead step="9 of 9 · Payment" back={() => dispatch({ type: "GO_TO", screen: "review" })} /><div className="journey-narrow"><h2>Choose how to pay.</h2><div className="journey-card"><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "success" })}>Confirm with MTN MoMo →</button></div></div></Screen>; }
function SuccessScreen() { const { dispatch } = useJourney(); return <Screen><div className="journey-narrow journey-success"><span className="journey-success-mark">✓</span><h2>Your order is confirmed.</h2><p>Your fitting appointment is booked. We’ll send updates by mobile.</p><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "home" })}>Back to TyreLink</button></div></Screen>; }

function Screen({ children }: { children: React.ReactNode }) { return <main className="journey-shell">{children}</main>; }

function JourneyRouter() {
  const { state } = useJourney();
  switch (state.screen) {
    case "home": return <HomeScreen />;
    case "vehicle": return <VehicleScreen />;
    case "size": return <SizeScreen />;
    case "catalogue": return <CatalogueScreen />;
    case "product": return <ProductScreen />;
    case "station": return <StationScreen />;
    case "slot": return <SlotScreen />;
    case "details": return <DetailsScreen />;
    case "review": return <ReviewScreen />;
    case "payment": return <PaymentScreen />;
    case "success": return <SuccessScreen />;
  }
}

export function CustomerJourney() { return <JourneyProvider><Header /><JourneyRouter /></JourneyProvider>; }
