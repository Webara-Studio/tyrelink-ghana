"use client";

import { useEffect, useRef } from "react";

type PrototypeWindow = Window & {
  go?: (id: string) => void;
  chooseStation?: (name: string, place: string, fee: string, time: string, stationId?: string) => void;
};

type Product = {
  id: string;
  brand: string;
  model: string;
  width_mm: number;
  aspect_ratio: number;
  rim_size: number;
  category: string;
  warranty_description: string | null;
  wet_grip_rating: string | null;
  mileage_notes: string | null;
};

type Inventory = { product_id: string; unit_price: number; stock_quantity: number; status: string };
type Station = { id: string; trading_name: string; address_line: string; city: string; fitting_bays: number; standard_fitting_minutes: number };
type StationService = { station_id: string; price: number };

async function apiGet<T>(resource: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/tyrelink/${resource}?${query.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`TyreLink API returned ${response.status}`);
  return (await response.json()) as T;
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

function tierLabel(category: string) {
  return category === "mid_range" ? "Mid-range" : category.charAt(0).toUpperCase() + category.slice(1);
}

function sizeFor(product: Product) {
  return `${product.width_mm}/${product.aspect_ratio} R${product.rim_size}`;
}

export function PrototypeExperience() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let liveStationId = "";
    let productRequestId = 0;
    const mount = mountRef.current as HTMLDivElement | null;
    if (!mount) return;
    const host = mount;

    async function loadSource() {
      const response = await fetch("/prototype-source.html");
      if (!response.ok) throw new Error("Prototype source could not be loaded");
      const source = await response.text();
      const documentSource = new DOMParser().parseFromString(source, "text/html");
      const style = document.createElement("style");
      style.textContent = Array.from(documentSource.head.querySelectorAll("style"))
        .map((element) => element.textContent ?? "")
        .join("\n");
      host.appendChild(style);
      const body = documentSource.body.cloneNode(true) as HTMLBodyElement;
      const script = body.querySelector("script");
      const scriptText = script?.textContent ?? "";
      script?.remove();
      host.append(...Array.from(body.childNodes));

      const runtimeScript = document.createElement("script");
      runtimeScript.textContent = scriptText;
      host.appendChild(runtimeScript);
      if (disposed) return;

      const liveWindow = window as PrototypeWindow;
      const originalGo = liveWindow.go;
      const originalChooseStation = liveWindow.chooseStation;
      const originalProductScreen = document.querySelector(".prototype");
      if (originalProductScreen) originalProductScreen.textContent = "Live connected prototype";

      async function renderProducts() {
        const list = host.querySelector("#catalogue .product-list");
        if (!list) return;
        const requestId = ++productRequestId;
        const sizeText = host.querySelector("#size-name")?.textContent?.replace(/\s/g, "") ?? "205/55R16";
        const match = sizeText.match(/(\d+)\/(\d+)R(\d+)/i);
        const productParams: Record<string, string> = {
          select: "id,brand,model,width_mm,aspect_ratio,rim_size,category,warranty_description,wet_grip_rating,mileage_notes",
          active: "eq.true",
          order: "category",
        };
        if (match) {
          productParams.width_mm = `eq.${Number(match[1])}`;
          productParams.aspect_ratio = `eq.${Number(match[2])}`;
          productParams.rim_size = `eq.${Number(match[3])}`;
        }
        let products: Product[];
        let inventory: Inventory[];
        try {
          [products, inventory] = await Promise.all([
            apiGet<Product[]>("tyre_products", productParams),
            apiGet<Inventory[]>("supplier_inventory", { select: "product_id,unit_price,stock_quantity,status", status: "eq.active" }),
          ]);
        } catch {
          if (requestId !== productRequestId) return;
          list.innerHTML = `<p class="demo-note">The live catalogue could not be reached. Please try again.</p>`;
          return;
        }
        if (requestId !== productRequestId) return;
        const inventoryByProduct = new Map(inventory.map((item) => [item.product_id, item]));
        const liveProducts = (products as Product[]).filter((product) => inventoryByProduct.has(product.id));
        list.innerHTML = liveProducts.length
          ? liveProducts.map((product) => {
              const stock = inventoryByProduct.get(product.id)!;
              const tier = tierLabel(product.category);
              const name = `${product.brand} ${product.model}`;
              const warranty = product.warranty_description ?? "12-month warranty";
              const onclick = `chooseTyre(${JSON.stringify(name)},${Number(stock.unit_price)},${JSON.stringify(tier)},${JSON.stringify(warranty)})`;
              return `<article class="product" data-tier="${escapeHtml(tier)}"><div class="brand-block">${escapeHtml(product.brand.toUpperCase())}</div><div><h3>${escapeHtml(name)}</h3><div class="meta">${escapeHtml(sizeFor(product))} · ${escapeHtml(tier)}<br>${escapeHtml(product.mileage_notes ?? "Suitable for everyday Ghanaian driving")} · ${escapeHtml(warranty)}</div></div><div><div class="price">GHS ${Number(stock.unit_price).toLocaleString()}<small>per tyre · ${stock.stock_quantity} in stock</small></div><button class="button small" onclick="${escapeHtml(onclick)}">View and choose</button></div></article>`;
            }).join("")
          : `<p class="demo-note">No live tyres match this size yet. Try 205/55 R16.</p>`;
      }

      async function renderStations() {
        const list = host.querySelector("#station .station-list");
        if (!list) return;
        let stations: Station[];
        let services: StationService[];
        try {
          [stations, services] = await Promise.all([
            apiGet<Station[]>("fitting_stations", { select: "id,trading_name,address_line,city,fitting_bays,standard_fitting_minutes", status: "eq.approved", order: "city" }),
            apiGet<StationService[]>("station_services", { select: "station_id,price", service_id: "eq.50000000-0000-4000-8000-000000000001", active: "eq.true" }),
          ]);
        } catch {
          list.innerHTML = `<p class="demo-note">Approved fitting stations could not be loaded.</p>`;
          return;
        }
        const priceByStation = new Map((services as StationService[]).map((item) => [item.station_id, item.price]));
        list.innerHTML = (stations as Station[]).map((station) => {
          const price = priceByStation.get(station.id) ?? 0;
          const place = `${station.address_line}, ${station.city}`;
          const time = `${station.standard_fitting_minutes} min for 4 tyres`;
          const onclick = `chooseStation(${JSON.stringify(station.trading_name)},${JSON.stringify(place)},${JSON.stringify(`GHS ${price} / tyre`)},${JSON.stringify(time)},${JSON.stringify(station.id)})`;
          return `<button class="station" onclick="${escapeHtml(onclick)}"><div><h3>${escapeHtml(station.trading_name)} <span>✓</span></h3><p>${escapeHtml(place)}<br>${station.fitting_bays} fitting bays · approved station</p></div><div class="station-right"><strong>GHS ${Number(price).toLocaleString()} / tyre</strong><span>${escapeHtml(time)}</span></div></button>`;
        }).join("");
      }

      async function renderSlots() {
        const grids = host.querySelectorAll("#slot .slot-grid");
        const firstGrid = grids[0];
        if (!firstGrid || !liveStationId) return;
        let slots: { id: string; starts_at: string; ends_at: string }[];
        try {
          slots = await apiGet<{ id: string; starts_at: string; ends_at: string }[]>("station_slots", { select: "id,starts_at,ends_at", station_id: `eq.${liveStationId}`, active: "eq.true", order: "starts_at" });
        } catch {
          firstGrid.innerHTML = `<p class="demo-note">Available appointment slots could not be loaded.</p>`;
          return;
        }
        const slotButtons = (slots as { id: string; starts_at: string; ends_at: string }[]).map((slot) => {
          const start = new Date(slot.starts_at);
          const label = start.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
          const stateLabel = `${label} · ${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
          return `<button class="slot" onclick="pickSlot(this,${JSON.stringify(stateLabel)})">${escapeHtml(label)}</button>`;
        }).join("");
        firstGrid.innerHTML = slotButtons || `<p class="demo-note">No appointment slots are available for this station yet.</p>`;
        if (grids[1]) grids[1].innerHTML = "";
      }

      liveWindow.chooseStation = (name, place, fee, time, stationId) => {
        liveStationId = stationId ?? "";
        originalChooseStation?.(name, place, fee, time);
      };
      liveWindow.go = (id) => {
        originalGo?.(id);
        if (id === "catalogue") void renderProducts();
        if (id === "station") void renderStations();
        if (id === "slot") void renderSlots();
      };
    }

    void loadSource().catch(() => {
      if (!disposed && mount) host.innerHTML = `<p class="prototype-error">The TyreLink prototype could not be loaded.</p>`;
    });

    return () => {
      disposed = true;
      if (mount) host.replaceChildren();
    };
  }, []);

  return <div ref={mountRef} className="prototype-mount" />;
}
