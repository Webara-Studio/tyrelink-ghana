export type TyreSize = {
  widthMm: number;
  aspectRatio: number;
  rimSize: number;
};

export type TyreProduct = {
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

export type TyreInventory = {
  product_id: string;
  unit_price: number;
  stock_quantity: number;
  status: string;
};

export type TyreProductWithInventory = TyreProduct & {
  unitPrice: number;
  stockQuantity: number;
};

export type FittingStation = {
  id: string;
  trading_name: string;
  address_line: string;
  city: string;
  fitting_bays: number;
  standard_fitting_minutes: number;
};

export type FittingStationWithPrice = FittingStation & {
  fittingPrice: number;
};

export type StationSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
};

type StationService = { station_id: string; price: number };

export class TyreLinkApiError extends Error {
  constructor(
    message: string,
    readonly resource: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TyreLinkApiError";
  }
}

async function getJson<T>(resource: string, params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(params);
  let response: Response;
  try {
    response = await fetch(`/api/tyrelink/${resource}?${query.toString()}`, {
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new TyreLinkApiError("TyreLink is temporarily unavailable.", resource);
  }

  if (!response.ok) {
    throw new TyreLinkApiError("TyreLink is temporarily unavailable.", resource, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new TyreLinkApiError("TyreLink returned an invalid response.", resource, response.status);
  }
}

export function formatTyreSize(size: TyreSize) {
  return `${size.widthMm}/${size.aspectRatio} R${size.rimSize}`;
}

export async function listTyres(size: TyreSize, signal?: AbortSignal): Promise<TyreProductWithInventory[]> {
  const [products, inventory] = await Promise.all([
    getJson<TyreProduct[]>("tyre_products", {
      select: "id,brand,model,width_mm,aspect_ratio,rim_size,category,warranty_description,wet_grip_rating,mileage_notes",
      active: "eq.true",
      order: "category",
      width_mm: `eq.${size.widthMm}`,
      aspect_ratio: `eq.${size.aspectRatio}`,
      rim_size: `eq.${size.rimSize}`,
    }, signal),
    getJson<TyreInventory[]>("supplier_inventory", {
      select: "product_id,unit_price,stock_quantity,status",
      status: "eq.active",
    }, signal),
  ]);

  const inventoryByProduct = new Map(inventory.map((item) => [item.product_id, item]));
  return products.flatMap((product) => {
    const stock = inventoryByProduct.get(product.id);
    if (!stock) return [];
    return [{ ...product, unitPrice: Number(stock.unit_price), stockQuantity: Number(stock.stock_quantity) }];
  });
}

export async function listStations(signal?: AbortSignal): Promise<FittingStationWithPrice[]> {
  const [stations, services] = await Promise.all([
    getJson<FittingStation[]>("fitting_stations", {
      select: "id,trading_name,address_line,city,fitting_bays,standard_fitting_minutes",
      status: "eq.approved",
      order: "city",
    }, signal),
    getJson<StationService[]>("station_services", {
      select: "station_id,price",
      service_id: "eq.50000000-0000-4000-8000-000000000001",
      active: "eq.true",
    }, signal),
  ]);

  const priceByStation = new Map(services.map((item) => [item.station_id, Number(item.price)]));
  return stations.map((station) => ({ ...station, fittingPrice: priceByStation.get(station.id) ?? 0 }));
}

export function listSlots(stationId: string, signal?: AbortSignal) {
  return getJson<StationSlot[]>("station_slots", {
    select: "id,starts_at,ends_at",
    station_id: `eq.${stationId}`,
    active: "eq.true",
    order: "starts_at",
  }, signal);
}
