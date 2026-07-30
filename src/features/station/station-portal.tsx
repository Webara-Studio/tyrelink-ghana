"use client";

import { useState, type ReactNode } from "react";
import { stationOrders } from "./fixtures";
import type { StationOrder, StationView } from "./types";

const orders = stationOrders;

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

function Settings({ setView }: { setView: (view: StationView) => void }) {
  const [saved, setSaved] = useState(false);
  return <><PageIntro title="Your station profile." copy="Keep the station details customers and the operations team rely on." back={() => setView("overview")} /><section className="station-detail-card station-settings"><label>Business name<input className="journey-input" defaultValue="AutoCare East Legon" /></label><label>Location<input className="journey-input" defaultValue="East Legon, Accra" /></label><label>Opening hours<input className="journey-input" defaultValue="Monday–Saturday · 8:00 am–6:00 pm" /></label><label>Fitting bays<input className="journey-input" inputMode="numeric" defaultValue="4" /></label></section><button className="journey-button" onClick={() => setSaved(true)}>{saved ? "Station settings saved ✓" : "Save station settings"}</button></>;
}

function PageIntro({ title, copy, back }: { title: string; copy: string; back: () => void }) {
  return <div className="station-page-intro"><button className="journey-back" onClick={back}>← Back</button><span className="station-eyebrow">Fitting station portal</span><h1>{title}</h1><p className="journey-sub">{copy}</p></div>;
}

export function StationPortal() {
  const [view, setView] = useState<StationView>("overview");
  return <><Header view={view} setView={setView} /><main className="station-shell"><Navigation view={view} setView={setView} />{view === "overview" && <Overview setView={setView} />}{view === "orders" && <Orders setView={setView} />}{view === "order" && <OrderDetail setView={setView} />}{view === "calendar" && <Calendar setView={setView} />}{view === "settings" && <Settings setView={setView} />}</main><footer className="site-footer station-footer"><div><strong>TyreLink Ghana · Station portal</strong><span>Operational testing environment.</span></div><nav aria-label="Main site link"><a href="/">← Back to main site</a></nav></footer></>;
}
