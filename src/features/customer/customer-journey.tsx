"use client";

import { useEffect, useRef, useState } from "react";
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
  return <Screen><div className="journey-hero"><div><span className="journey-eyebrow">Tyres. Fitting. Sorted.</span><h1>Buy the right tyres. Fit them nearby.</h1><p>Compare trusted tyre brands, choose an approved fitting station and book a time that works for you — all in one simple journey.</p><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "vehicle" })}>Find my tyres <span>→</span></button></div><div className="journey-hero-card"><small>One place for the whole job</small><strong>Tyres delivered to your chosen station.</strong></div></div><div className="intro-grid journey-intro-grid"><div className="info-card"><div className="icon">⌕</div><strong>Compare brands</strong><p>See price, size, availability and warranty in one view.</p></div><div className="info-card"><div className="icon">⌖</div><strong>Approved stations</strong><p>Pick where your tyres are delivered and fitted.</p></div><div className="info-card"><div className="icon">◷</div><strong>Track the job</strong><p>Know what happens after you place your order.</p></div></div><div className="section-label journey-section-label">Explore the operating model</div><div className="role-grid journey-role-grid"><div className="role-card"><div className="role-icon">⌂</div><strong>Station portal</strong><p>Receive tyres, manage appointments and assign fitters.</p></div><div className="role-card"><div className="role-icon">⚒</div><strong>Fitter workflow</strong><p>View today’s jobs and record fitting completion.</p></div><div className="role-card"><div className="role-icon">▦</div><strong>Admin control centre</strong><p>Monitor orders, approvals, inventory and settlements.</p></div><div className="role-card"><div className="role-icon">↗</div><strong>Customer tracking</strong><p>Follow the order from payment through to fitting.</p></div></div></Screen>;
}

function VehicleScreen() {
  const { state, dispatch } = useJourney();
  const options = [
    ["Toyota Corolla", { widthMm: 205, aspectRatio: 55, rimSize: 16 }],
    ["Hyundai Elantra", { widthMm: 205, aspectRatio: 55, rimSize: 16 }],
  ] as const;
  return <Screen><FlowHead step="1 of 9 · Your vehicle" back={() => dispatch({ type: "GO_TO", screen: "home" })} /><div className="journey-narrow"><h2>What are you driving?</h2><p className="journey-sub">Choose a vehicle to see compatible tyre sizes, or enter the size printed on your tyre.</p><div className="journey-choice-grid">{options.map(([vehicle, size]) => <button className="journey-choice" key={vehicle} onClick={() => dispatch({ type: "SELECT_VEHICLE", vehicle, size })}><span className="journey-vehicle-icon">🚗</span><strong>{vehicle}</strong><span>{formatTyreSize(size)}</span></button>)}<button className="journey-choice" onClick={() => dispatch({ type: "SELECT_VEHICLE", vehicle: "Any vehicle", size: state.size })}><span className="journey-vehicle-icon">＋</span><strong>Enter tyre size</strong><span>For any vehicle</span></button></div></div></Screen>;
}

function TutorialVideo() {
  return <section className="tutorial-card" aria-labelledby="tyre-size-tutorial-title">
    <div className="tutorial-heading">
      <div><span className="journey-tag">Coming soon</span><h3 id="tyre-size-tutorial-title">How to find your tyre size</h3></div>
      <span className="tutorial-duration">Tutorial video</span>
    </div>
    <div className="video-frame">
      <iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID?rel=0" title="How to find your tyre size tutorial — placeholder" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      <div className="video-placeholder"><strong>Tyre-size tutorial placeholder</strong><span>Replace <code>VIDEO_ID</code> with the final YouTube video.</span></div>
    </div>
  </section>;
}

function SizeScreen() {
  const { state, dispatch } = useJourney();
  const [width, setWidth] = useState(String(state.size.widthMm));
  const [aspect, setAspect] = useState(String(state.size.aspectRatio));
  const [rim, setRim] = useState(String(state.size.rimSize));
  const [error, setError] = useState("");
  const submit = () => {
    const size = { widthMm: Number(width), aspectRatio: Number(aspect), rimSize: Number(rim) };
    if (![size.widthMm, size.aspectRatio, size.rimSize].every(Number.isFinite) || size.widthMm <= 0 || size.aspectRatio <= 0 || size.rimSize <= 0) {
      setError("Enter a valid tyre size, for example 205 / 55 R16.");
      return;
    }
    setError("");
    dispatch({ type: "SET_SIZE", size });
  };
  return <Screen><FlowHead step="1 of 9 · Tyre size" back={() => dispatch({ type: "GO_TO", screen: "vehicle" })} /><div className="journey-narrow"><h2>Confirm your tyre size.</h2><p className="journey-sub">We’ll use this size to find compatible tyres in the live catalogue.</p><div className="journey-card"><strong>{state.vehicle}</strong><div className="journey-size-inputs"><label>Width<input className="journey-input" inputMode="numeric" value={width} onChange={(event) => setWidth(event.target.value)} /></label><span>/</span><label>Aspect ratio<input className="journey-input" inputMode="numeric" value={aspect} onChange={(event) => setAspect(event.target.value)} /></label><span>R</span><label>Rim<input className="journey-input" inputMode="numeric" value={rim} onChange={(event) => setRim(event.target.value)} /></label></div><span>Preview: {formatTyreSize({ widthMm: Number(width) || 0, aspectRatio: Number(aspect) || 0, rimSize: Number(rim) || 0 })}</span>{error && <span className="journey-error-text">{error}</span>}<button className="journey-button" onClick={submit}>Show compatible tyres →</button></div><TutorialVideo /></div></Screen>;
}

function CatalogueScreen() {
  const { state, dispatch } = useJourney();
  const [tier, setTier] = useState("All");
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

  const filteredTyres = tier === "All" ? state.tyres : state.tyres.filter((tyre) => tyre.category === tier);
  const prices = filteredTyres.map((tyre) => tyre.unitPrice).filter(Number.isFinite);
  const priceRange = prices.length ? `GHS ${Math.min(...prices).toLocaleString()} – ${Math.max(...prices).toLocaleString()} per tyre` : "No live prices in this range";
  const filters = [["All", "All brands"], ["budget", "Budget"], ["mid_range", "Mid-range"], ["premium", "Premium"]] as const;
  return <Screen><FlowHead step="2 of 9 · Compare tyres" back={() => dispatch({ type: "GO_TO", screen: "vehicle" })} /><div className="journey-narrow"><h2>Choose your tyres.</h2><p className="journey-sub">Showing live options for <strong>{state.vehicle}</strong> in <strong>{formatTyreSize(state.size)}</strong>.</p><div className="chips">{filters.map(([value, label]) => <button className={`chip${tier === value ? " selected" : ""}`} key={value} onClick={() => setTier(value)}>{label}</button>)}</div><div className="journey-price-range"><span>Typical live price range</span><strong>{priceRange}</strong></div>{state.catalogueStatus === "loading" && <div className="journey-card"><span>Checking live TyreLink stock…</span></div>}{state.catalogueStatus === "error" && <div className="journey-error"><strong>Catalogue unavailable</strong><span>{state.catalogueError}</span><button className="journey-button small" onClick={() => void load()}>Try again</button></div>}{state.catalogueStatus === "ready" && (filteredTyres.length ? <div className="journey-product-list">{filteredTyres.map((tyre) => <TyreCard key={tyre.id} tyre={tyre} onSelect={() => dispatch({ type: "SELECT_TYRE", tyre })} />)}</div> : <div className="journey-card"><span>No live tyres match this filter and size yet.</span></div>)}</div></Screen>;
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
  if (state.selectedStation) return <Screen><FlowHead step="4 of 9 · Station detail" back={() => dispatch({ type: "GO_TO", screen: "product" })} /><div className="journey-narrow"><div className="journey-card"><span className="journey-tag">Approved fitting station</span><h2>{state.selectedStation.trading_name}</h2><p>{state.selectedStation.address_line}, {state.selectedStation.city}</p><strong>GHS {state.selectedStation.fittingPrice.toLocaleString()} / tyre</strong><span>{state.selectedStation.standard_fitting_minutes} minutes for 4 tyres · {state.selectedStation.fitting_bays} fitting bays</span><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "services" })}>Choose services →</button></div></div></Screen>;
  return <Screen><FlowHead step="4 of 9 · Choose station" back={() => dispatch({ type: "GO_TO", screen: "product" })} /><div className="journey-narrow"><h2>Where should we fit them?</h2><p className="journey-sub">Choose an approved TyreLink fitting station.</p><div className="journey-product-list">{state.stations.map((station) => <button className="journey-station" key={station.id} onClick={() => dispatch({ type: "SELECT_STATION", station })}><span><strong>{station.trading_name}</strong><small>{station.address_line}, {station.city} · {station.fitting_bays} bays</small></span><strong>GHS {station.fittingPrice.toLocaleString()} / tyre</strong></button>)}</div></div></Screen>;
}

function ServicesScreen() {
  const { state, dispatch } = useJourney();
  const services = [
    { id: "balancing", name: "Wheel balancing", price: 40, priceUnit: "per tyre" as const },
    { id: "alignment", name: "Wheel alignment", price: 120, priceUnit: "per job" as const },
    { id: "valves", name: "New valves", price: 12, priceUnit: "per tyre" as const },
  ];
  const serviceTotal = state.selectedServices.reduce((sum, service) => sum + service.price * (service.priceUnit === "per tyre" ? state.quantity : 1), 0);
  return <Screen><FlowHead step="5 of 9 · Services" back={() => dispatch({ type: "GO_TO", screen: "station" })} /><div className="journey-narrow"><h2>What should we do while we fit them?</h2><p className="journey-sub">Choose any additional services for {state.selectedStation?.trading_name}.</p><div className="journey-card"><div className="journey-summary-row"><span>Tyres required</span><div className="journey-quantity"><button aria-label="Remove one tyre" onClick={() => dispatch({ type: "SET_QUANTITY", quantity: state.quantity - 1 })}>−</button><strong>{state.quantity}</strong><button aria-label="Add one tyre" onClick={() => dispatch({ type: "SET_QUANTITY", quantity: state.quantity + 1 })}>+</button></div></div>{services.map((service) => { const selected = state.selectedServices.some((item) => item.id === service.id); return <button className={`journey-service-option${selected ? " selected" : ""}`} key={service.id} onClick={() => dispatch({ type: "TOGGLE_SERVICE", service })}><span><strong>{service.name}</strong><small>GHS {service.price.toLocaleString()} {service.priceUnit}</small></span><span>{selected ? "✓ Added" : "Add"}</span></button>; })}<div className="journey-summary-total"><span>Additional services</span><strong>GHS {serviceTotal.toLocaleString()}</strong></div><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "slot" })}>Choose an appointment →</button></div></div></Screen>;
}

function SlotScreen() {
  const { state, dispatch } = useJourney();
  const station = state.selectedStation;
  useEffect(() => { if (station) void listSlots(station.id).then((slots) => dispatch({ type: "SLOTS_READY", slots })).catch(() => undefined); }, [dispatch, station]);
  if (!station) return <StationScreen />;
  return <Screen><FlowHead step="6 of 9 · Book a time" back={() => dispatch({ type: "GO_TO", screen: "services" })} /><div className="journey-narrow"><h2>When suits you?</h2><p className="journey-sub">Available slots at {station.trading_name}.</p><div className="journey-slot-grid">{state.slots.map((slot) => <button className="journey-slot" key={slot.id} onClick={() => dispatch({ type: "SELECT_SLOT", slot })}>{new Date(slot.starts_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</button>)}</div></div></Screen>;
}

function DetailsScreen() {
  const { state, dispatch } = useJourney();
  const [name, setName] = useState(state.customerName || "Carl Anthony");
  const [phone, setPhone] = useState(state.customerPhone);
  const [error, setError] = useState("");
  const submit = () => {
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 9) {
      setError("Enter your full name and a valid Ghanaian mobile number.");
      return;
    }
    setError("");
    dispatch({ type: "SET_CUSTOMER_DETAILS", name: name.trim(), phone: phone.trim() });
  };
  return <Screen><FlowHead step="7 of 9 · Your details" back={() => dispatch({ type: "GO_TO", screen: "slot" })} /><div className="journey-narrow"><h2>Where should we send your updates?</h2><p className="journey-sub">Your mobile number is the primary contact for order and fitting notifications.</p><div className="journey-card"><label className="journey-field-label">Full name<input className="journey-input" placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="journey-field-label">Mobile number<input className="journey-input" placeholder="024 000 0000" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>{error && <span className="journey-error-text">{error}</span>}<button className="journey-button" onClick={submit}>Review order →</button></div></div></Screen>;
}

function ReviewScreen() {
  const { state, dispatch } = useJourney();
  const tyreSubtotal = state.quantity * (state.selectedTyre?.unitPrice ?? 0);
  const fittingSubtotal = state.quantity * (state.selectedStation?.fittingPrice ?? 0);
  const serviceSubtotal = state.selectedServices.reduce((sum, service) => sum + service.price * (service.priceUnit === "per tyre" ? state.quantity : 1), 0);
  const total = tyreSubtotal + fittingSubtotal + serviceSubtotal;
  const deposit = Math.ceil(total * 0.1);
  return <Screen><FlowHead step="8 of 9 · Confirm" back={() => dispatch({ type: "GO_TO", screen: "details" })} /><div className="journey-narrow"><h2>Confirm your order.</h2><p className="journey-sub">Review the itemised total. A 10% deposit is required to secure the booking.</p><div className="journey-card"><div className="journey-summary-row"><span>Customer</span><strong>{state.customerName}</strong></div><div className="journey-summary-row"><span>Tyres</span><strong>{state.selectedTyre?.brand} {state.selectedTyre?.model} × {state.quantity}</strong></div><div className="journey-summary-row"><span>Tyres subtotal</span><strong>GHS {tyreSubtotal.toLocaleString()}</strong></div><div className="journey-summary-row"><span>Fitting · {state.quantity} tyres</span><strong>GHS {fittingSubtotal.toLocaleString()}</strong></div>{state.selectedServices.map((service) => <div className="journey-summary-row" key={service.id}><span>{service.name}</span><strong>GHS {(service.price * (service.priceUnit === "per tyre" ? state.quantity : 1)).toLocaleString()}</strong></div>)}<div className="journey-summary-row"><span>Station</span><strong>{state.selectedStation?.trading_name}</strong></div><div className="journey-summary-row"><span>Appointment</span><strong>{state.selectedSlot ? new Date(state.selectedSlot.starts_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Selected slot"}</strong></div><div className="journey-summary-total"><span>Order total</span><strong>GHS {total.toLocaleString()}</strong></div><div className="journey-deposit"><span>Deposit due now · 10%</span><strong>GHS {deposit.toLocaleString()}</strong><small>Remaining balance at fitting: GHS {(total - deposit).toLocaleString()}</small></div><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "payment" })}>Continue to payment →</button></div></div></Screen>;
}

function PaymentScreen() {
  const { state, dispatch } = useJourney();
  const total = state.quantity * ((state.selectedTyre?.unitPrice ?? 0) + (state.selectedStation?.fittingPrice ?? 0)) + state.selectedServices.reduce((sum, service) => sum + service.price * (service.priceUnit === "per tyre" ? state.quantity : 1), 0);
  const deposit = Math.ceil(total * 0.1);
  const methods: Array<[typeof state.paymentMethod, string, string]> = [["MTN MoMo", "🟡 MTN MoMo", "Pay the 10% deposit from your mobile wallet"], ["Credit/debit card", "💳 Credit/debit card", "Pay the 10% deposit securely by card"], ["Cash on fitting", "💵 Cash on fitting", "Pay the 10% deposit now; settle the balance in cash at fitting"]];
  return <Screen><FlowHead step="9 of 9 · Deposit payment" back={() => dispatch({ type: "GO_TO", screen: "review" })} /><div className="journey-narrow"><h2>Pay your booking deposit.</h2><p className="journey-sub">A 10% deposit of <strong>GHS {deposit.toLocaleString()}</strong> secures your appointment. The balance of GHS {(total - deposit).toLocaleString()} is due at fitting.</p><div className="journey-card">{methods.map(([method, label, copy]) => <button className={`journey-payment-option${state.paymentMethod === method ? " selected" : ""}`} key={method} onClick={() => dispatch({ type: "SET_PAYMENT_METHOD", method })}><span><strong>{label}</strong><small>{copy}</small></span><span>{state.paymentMethod === method ? "✓ Selected" : "Select"}</span></button>)}<button className="journey-button" onClick={() => dispatch({ type: "CREATE_ORDER" })}>Confirm {state.paymentMethod} deposit →</button></div></div></Screen>;
}
function SuccessScreen() { const { state, dispatch } = useJourney(); return <Screen><div className="journey-narrow journey-success"><span className="journey-success-mark">✓</span><h2>Your order is confirmed.</h2><p>Order <strong>{state.orderNumber}</strong> has been recorded for {state.customerName}. Your fitting appointment is booked.</p><div className="journey-card journey-success-card"><span>Deposit status</span><strong>Demo deposit confirmed via {state.paymentMethod}</strong><span>Remaining balance</span><strong>Due at fitting in cash: final balance shown on your confirmation.</strong><span>Next step</span><strong>Tyres will be received and prepared by {state.selectedStation?.trading_name}.</strong><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "tracking" })}>Track this order →</button></div><button className="journey-back" onClick={() => dispatch({ type: "GO_TO", screen: "home" })}>Back to TyreLink</button></div></Screen>; }
function TrackingScreen() { const { state, dispatch } = useJourney(); return <Screen><FlowHead step="Customer order tracking" back={() => dispatch({ type: "GO_TO", screen: "success" })} /><div className="journey-narrow"><h2>Track your order.</h2><p className="journey-sub">{state.orderNumber} · {state.selectedStation?.trading_name}</p><div className="journey-card journey-timeline"><div className="journey-timeline-item done"><strong>Payment confirmed</strong><span>Demo payment recorded</span></div><div className="journey-timeline-item active"><strong>Tyres heading to station</strong><span>The station will confirm receipt next.</span></div><div className="journey-timeline-item"><strong>Fitting appointment</strong><span>{state.selectedSlot ? new Date(state.selectedSlot.starts_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Appointment booked"}</span></div><div className="journey-timeline-item"><strong>Fitting complete</strong><span>Waiting for the fitting team.</span></div></div><button className="journey-button" onClick={() => dispatch({ type: "GO_TO", screen: "home" })}>Back to TyreLink</button></div></Screen>; }

function SiteFooter() {
  return <footer className="site-footer"><div><strong>TyreLink Ghana</strong><span>Testing links for the current application flows.</span></div><nav aria-label="Testing links"><a href="/">Customer journey</a><a href="/station">Fitting station portal</a></nav></footer>;
}

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
    case "services": return <ServicesScreen />;
    case "slot": return <SlotScreen />;
    case "details": return <DetailsScreen />;
    case "review": return <ReviewScreen />;
    case "payment": return <PaymentScreen />;
    case "success": return <SuccessScreen />;
    case "tracking": return <TrackingScreen />;
  }
}

export function CustomerJourney() { return <JourneyProvider><Header /><JourneyRouter /><SiteFooter /></JourneyProvider>; }
