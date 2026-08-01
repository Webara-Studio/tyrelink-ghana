"use client";

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { stationOrders } from "./fixtures";
import type { StationOrder, StationPaymentMethodKey, StationProfileSettings, StationServiceKey, StationView } from "./types";

const orders = stationOrders;

const serviceOptions: Array<{ key: StationServiceKey; label: string; description: string }> = [
  { key: "alignment", label: "Wheel alignment", description: "Alignment checks and adjustments" },
  { key: "balancing", label: "Wheel balancing", description: "Balancing tyres and wheels" },
  { key: "rotation", label: "Tyre rotation", description: "Rotating tyres between wheel positions" },
  { key: "valve-replacement", label: "Valve replacement", description: "Replacing valves during fitting" },
];

const paymentOptions: Array<{ key: StationPaymentMethodKey; label: string; description: string }> = [
  { key: "momo", label: "Mobile Money (MoMo)", description: "Accept customer payments by MoMo" },
  { key: "card", label: "Credit/debit card", description: "Accept card payments at the station" },
  { key: "cash", label: "Cash", description: "Accept cash payments at the station" },
  { key: "usdt", label: "USDT", description: "Accept USDT payments at the station" },
];

function Status({ children }: { children: ReactNode }) {
  const tone = children === "In transit" || children === "Action needed" ? "amber" : "green";
  return <span className={`station-status ${tone}`}>{children}</span>;
}

function Navigation({ view, setView }: { view: StationView; setView: (view: StationView) => void }) {
  const links: Array<[StationView, string]> = [["overview", "Overview"], ["orders", "Orders"], ["calendar", "Appointments"], ["settings", "Station settings"]];
  return <nav className="station-nav" aria-label="Fitting station navigation">
    {links.map(([key, label]) => <button className={view === key ? "active" : ""} key={key} onClick={() => setView(key)}>{label}</button>)}
  </nav>;
}

function Header({ view, setView }: { view: StationView; setView: (view: StationView) => void }) {
  return <header className="journey-header station-header"><button className="journey-logo" onClick={() => setView("overview")}>◉ TyreLink</button><span>Fitting station portal</span></header>;
}

function Overview({ setView }: { setView: (view: StationView) => void }) {
  return <>
    <div className="station-dashboard-head"><div><span className="journey-eyebrow">AutoCare East Legon</span><h1>Good morning, station team.</h1><p className="journey-sub">Wednesday 24 July · 4 fitting bays</p></div><button className="journey-button" onClick={() => setView("orders")}>View station orders →</button></div>
    <div className="station-stat-grid"><div><small>Today’s appointments</small><strong>12</strong><Status>On schedule</Status></div><div><small>Awaiting receipt</small><strong>4</strong><Status>Action needed</Status></div><div><small>Jobs in progress</small><strong>2</strong><Status>On schedule</Status></div><div><small>Today’s earnings</small><strong>GHS 1,420</strong><Status>On schedule</Status></div></div>
    <section className="station-panel"><div className="station-panel-head"><h2>Next appointments</h2><button className="station-link" onClick={() => setView("calendar")}>Open calendar</button></div>{orders.map((order) => <OrderRow key={order.number} order={order} onOpen={() => setView("order")} />)}</section>
  </>;
}

function OrderRow({ order, onOpen }: { order: StationOrder; onOpen: () => void }) {
  return <div className="station-order-row"><div><strong>{order.appointment}</strong><span>{order.number} · {order.vehicle.split(" · ")[0]}</span></div><Status>{order.status}</Status><button className="station-small-button" onClick={onOpen}>Open</button></div>;
}

function Orders({ setView }: { setView: (view: StationView) => void }) {
  return <><PageIntro title="Station order queue." copy="Manage delivery, receipt and fitting hand-offs." back={() => setView("overview")} /><section className="station-panel">{orders.map((order) => <div className="station-order-row" key={order.number}><div><strong>{order.number}</strong><span>{order.product} · {order.quantity} tyres · {order.customer}</span></div><Status>{order.status}</Status><button className="station-small-button" onClick={() => setView("order")}>Open</button></div>)}</section></>;
}

function OrderDetail({ setView }: { setView: (view: StationView) => void }) {
  const [received, setReceived] = useState(false);
  const order = orders[0];
  return <><PageIntro title="Station order detail" copy="Confirm the delivery and prepare the appointment." back={() => setView("orders")} /><section className="station-detail-card"><div className="station-detail-top"><div><span className="station-tag">{received ? "Received at station" : "Arriving today"}</span><h2>{order.number}</h2><p>{order.customer} · {order.vehicle}</p></div><strong>{order.appointment}</strong></div><dl><div><dt>Product</dt><dd>{order.product} × {order.quantity}</dd></div><div><dt>Supplier</dt><dd>RoadMax Ghana Distribution</dd></div><div><dt>Services</dt><dd>Fitting only</dd></div><div><dt>Payment</dt><dd><Status>Confirmed</Status></dd></div></dl></section><div className="station-action-row"><button className="journey-button" onClick={() => setReceived(true)} disabled={received}>{received ? "Tyres received ✓" : "Confirm tyres received"}</button><button className="station-secondary-button" onClick={() => setView("calendar")}>Assign fitter and manage appointment</button></div></>;
}

function Calendar({ setView }: { setView: (view: StationView) => void }) {
  return <><PageIntro title="Appointment calendar." copy="Today · Wednesday 24 July · 4 bays" back={() => setView("overview")} /><section className="station-panel">{orders.map((order) => <div className="station-order-row" key={order.number}><div><strong>{order.appointment}</strong><span>{order.number} · {order.product}</span></div><Status>{order.status === "In transit" ? "In transit" : "Ready to fit"}</Status><button className="station-small-button" onClick={() => setView("order")}>Manage</button></div>)}</section><button className="station-secondary-button" onClick={() => setView("settings")}>Manage availability</button></>;
}

const serviceTypeByKey: Record<StationServiceKey, string> = {
  alignment: "alignment",
  balancing: "balancing",
  rotation: "rotation",
  "valve-replacement": "valve",
};

type StationServiceRow = {
  station_id: string;
  service_id: string;
  active: boolean;
  price: number;
  price_unit: string;
  duration_minutes: number;
  services: { service_type: string } | { service_type: string }[] | null;
};

function Settings({ setView }: { setView: (view: StationView) => void }) {
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<"loading" | "signed_out" | "no_station" | "ready">("loading");
  const [statusMessage, setStatusMessage] = useState("Checking station access…");
  const [stationId, setStationId] = useState<string | null>(null);
  const [serviceIds, setServiceIds] = useState<Partial<Record<StationServiceKey, string>>>({});
  const [serviceRows, setServiceRows] = useState<StationServiceRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState<StationProfileSettings>({
    businessName: "AutoCare East Legon",
    location: "East Legon, Accra",
    openingHours: "Monday–Saturday · 8:00 am–6:00 pm",
    fittingBays: "4",
    services: { alignment: true, balancing: true, rotation: false, "valve-replacement": false },
    paymentMethods: { momo: true, card: true, cash: true, usdt: false },
  });

  const loadLiveSettings = async () => {
    setStatus("loading");
    setStatusMessage("Checking station access…");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setStatus("signed_out");
      setStatusMessage("Sign in with an approved station account to load and save live settings.");
      return;
    }

    const { data: account, error: accountError } = await supabase
      .from("station_accounts")
      .select("station_id")
      .eq("profile_id", session.user.id)
      .maybeSingle();
    if (accountError || !account) {
      setStatus("no_station");
      setStatusMessage("This account is not linked to a fitting station.");
      return;
    }

    const [{ data: catalogue, error: catalogueError }, { data: existingServices, error: servicesError }, { data: payments, error: paymentsError }] = await Promise.all([
      supabase.from("services").select("id,service_type").in("service_type", Object.values(serviceTypeByKey)),
      supabase.from("station_services").select("station_id,service_id,active,price,price_unit,duration_minutes,services!inner(service_type)").eq("station_id", account.station_id),
      supabase.from("station_payment_methods").select("payment_method,enabled").eq("station_id", account.station_id),
    ]);
    if (catalogueError || servicesError || paymentsError) {
      setStatus("no_station");
      setStatusMessage("Live station settings could not be loaded. Please try again.");
      return;
    }

    const nextServiceIds: Partial<Record<StationServiceKey, string>> = {};
    for (const option of serviceOptions) {
      const service = catalogue?.find((item) => item.service_type === serviceTypeByKey[option.key]);
      if (service) nextServiceIds[option.key] = service.id;
    }
    const nextServices = { ...profile.services };
    for (const row of (existingServices ?? []) as StationServiceRow[]) {
      const serviceType = Array.isArray(row.services) ? row.services[0]?.service_type : row.services?.service_type;
      const key = (Object.keys(serviceTypeByKey) as StationServiceKey[]).find((candidate) => serviceTypeByKey[candidate] === serviceType);
      if (key) nextServices[key] = row.active;
    }
    const nextPayments = { ...profile.paymentMethods };
    for (const row of payments ?? []) {
      if (row.payment_method in nextPayments) nextPayments[row.payment_method as StationPaymentMethodKey] = row.enabled;
    }
    setStationId(account.station_id);
    setServiceIds(nextServiceIds);
    setServiceRows((existingServices ?? []) as StationServiceRow[]);
    setProfile((current) => ({ ...current, services: nextServices, paymentMethods: nextPayments }));
    setStatus("ready");
    setStatusMessage("Live station settings connected.");
  };

  useEffect(() => {
    void loadLiveSettings();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void loadLiveSettings(); });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setPassword("");
    await loadLiveSettings();
  };

  const updateField = (field: keyof Pick<StationProfileSettings, "businessName" | "location" | "openingHours" | "fittingBays">, value: string) => {
    setSaved(false);
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const toggleSetting = (group: "services" | "paymentMethods", key: StationServiceKey | StationPaymentMethodKey) => {
    setSaved(false);
    setProfile((current) => {
      const settings = current[group] as Record<string, boolean>;
      return { ...current, [group]: { ...settings, [key]: !settings[key] } };
    });
  };

  return <>
    <PageIntro title="Your station profile." copy="Keep the station details customers and the operations team rely on." back={() => setView("overview")} />
    <section className="station-detail-card station-settings">
      <label>Business name<input className="journey-input" value={profile.businessName} onChange={(event) => updateField("businessName", event.target.value)} /></label>
      <label>Location<input className="journey-input" value={profile.location} onChange={(event) => updateField("location", event.target.value)} /></label>
      <label>Opening hours<input className="journey-input" value={profile.openingHours} onChange={(event) => updateField("openingHours", event.target.value)} /></label>
      <label>Fitting bays<input className="journey-input" inputMode="numeric" value={profile.fittingBays} onChange={(event) => updateField("fittingBays", event.target.value)} /></label>
    </section>

    <section className="station-detail-card station-settings-panel" aria-labelledby="station-services-heading">
      <div className="station-settings-heading"><div><span className="station-eyebrow">Services</span><h2 id="station-services-heading">Additional services</h2></div><p>Select the services customers can add to a booking at this station.</p></div>
      <div className="station-option-list">{serviceOptions.map((option) => <SettingOption key={option.key} label={option.label} description={option.description} enabled={profile.services[option.key]} disabled={status !== "ready"} onToggle={() => toggleSetting("services", option.key)} />)}</div>
    </section>

    <section className="station-detail-card station-settings-panel" aria-labelledby="station-payments-heading">
      <div className="station-settings-heading"><div><span className="station-eyebrow">Payments</span><h2 id="station-payments-heading">Accepted payment methods</h2></div><p>Choose which payment methods customers can use at this station.</p></div>
      <div className="station-option-list">{paymentOptions.map((option) => <SettingOption key={option.key} label={option.label} description={option.description} enabled={profile.paymentMethods[option.key]} disabled={status !== "ready"} onToggle={() => toggleSetting("paymentMethods", option.key)} />)}</div>
    </section>

    {status !== "ready" && <section className="station-detail-card station-auth-card">
      <div className="station-settings-heading"><div><span className="station-eyebrow">Access required</span><h2>Connect your station account</h2></div><p>{statusMessage}</p></div>
      {status === "signed_out" && <form className="station-auth-form" onSubmit={signIn}><label>Email<input className="journey-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input className="journey-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="journey-button" type="submit">Sign in to station portal</button>{authError && <p className="station-auth-error" role="alert">{authError}</p>}</form>}
    </section>}
    {status === "ready" && <p className="station-live-status" role="status">{statusMessage}</p>}
    <button className="journey-button" disabled={status !== "ready"} onClick={async () => {
      if (!stationId) return;
      setSaved(false);
      const serviceUpdates = (Object.keys(serviceTypeByKey) as StationServiceKey[]).flatMap((key) => {
        const serviceId = serviceIds[key];
        if (!serviceId) return [];
        const existing = serviceRows.find((row) => row.service_id === serviceId);
        return [{ station_id: stationId, service_id: serviceId, active: profile.services[key], price: existing?.price ?? 0, price_unit: existing?.price_unit ?? "per_job", duration_minutes: existing?.duration_minutes ?? 30 }];
      });
      const [{ error: servicesError }, { error: paymentsError }] = await Promise.all([
        supabase.from("station_services").upsert(serviceUpdates, { onConflict: "station_id,service_id" }),
        supabase.from("station_payment_methods").upsert((Object.keys(profile.paymentMethods) as StationPaymentMethodKey[]).map((payment_method) => ({ station_id: stationId, payment_method, enabled: profile.paymentMethods[payment_method] })), { onConflict: "station_id,payment_method" }),
      ]);
      if (servicesError || paymentsError) {
        setStatusMessage(servicesError?.message ?? paymentsError?.message ?? "Settings could not be saved.");
        return;
      }
      setSaved(true);
      setStatusMessage("Live station settings saved.");
    }}>{saved ? "Station settings saved ✓" : "Save station settings"}</button>
  </>;
}

function SettingOption({ label, description, enabled, disabled, onToggle }: { label: string; description: string; enabled: boolean; disabled: boolean; onToggle: () => void }) {
  return <div className={`station-setting-option${enabled ? " enabled" : ""}`}><div><strong>{label}</strong><span>{description}</span></div><div className="station-setting-toggle" role="group" aria-label={`${label} availability`}><button type="button" disabled={disabled} className={!enabled ? "selected" : ""} aria-pressed={!enabled} onClick={() => enabled && onToggle()}>No</button><button type="button" disabled={disabled} className={enabled ? "selected" : ""} aria-pressed={enabled} onClick={() => !enabled && onToggle()}>Yes</button></div></div>;
}

function PageIntro({ title, copy, back }: { title: string; copy: string; back: () => void }) {
  return <div className="station-page-intro"><button className="journey-back" onClick={back}>← Back</button><span className="station-eyebrow">Fitting station portal</span><h1>{title}</h1><p className="journey-sub">{copy}</p></div>;
}

export function StationPortal() {
  const [view, setView] = useState<StationView>("overview");
  return <><Header view={view} setView={setView} /><main className="station-shell"><Navigation view={view} setView={setView} />{view === "overview" && <Overview setView={setView} />}{view === "orders" && <Orders setView={setView} />}{view === "order" && <OrderDetail setView={setView} />}{view === "calendar" && <Calendar setView={setView} />}{view === "settings" && <Settings setView={setView} />}</main><footer className="site-footer station-footer"><div><strong>TyreLink Ghana · Station portal</strong><span>Operational testing environment.</span></div><nav aria-label="Main site link"><a href="/">← Back to main site</a></nav></footer></>;
}
