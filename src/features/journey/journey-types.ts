import type { CustomerService } from "@/domain/order";
import type { FittingStationWithPrice, StationSlot, TyreProductWithInventory, TyreSize } from "@/lib/tyrelink-api";

export type JourneyScreen = "home" | "vehicle" | "size" | "catalogue" | "product" | "station" | "services" | "slot" | "details" | "review" | "payment" | "success" | "tracking";

export type JourneyState = {
  screen: JourneyScreen;
  vehicle: string;
  size: TyreSize;
  tyres: TyreProductWithInventory[];
  selectedTyre?: TyreProductWithInventory;
  stations: FittingStationWithPrice[];
  selectedStation?: FittingStationWithPrice;
  slots: StationSlot[];
  selectedSlot?: StationSlot;
  quantity: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: "MTN MoMo" | "Credit/debit card" | "Cash on fitting";
  selectedServices: CustomerService[];
  orderNumber?: string;
  catalogueStatus: "idle" | "loading" | "ready" | "error";
  catalogueError?: string;
  stationsStatus: "idle" | "loading" | "ready" | "error";
  stationsError?: string;
  slotsStatus: "idle" | "loading" | "ready" | "error";
  slotsError?: string;
};

export type JourneyAction =
  | { type: "GO_TO"; screen: JourneyScreen }
  | { type: "RESET_JOURNEY" }
  | { type: "SELECT_VEHICLE"; vehicle: string; size: TyreSize }
  | { type: "SET_SIZE"; size: TyreSize }
  | { type: "CATALOGUE_LOADING" }
  | { type: "CATALOGUE_READY"; tyres: TyreProductWithInventory[] }
  | { type: "CATALOGUE_ERROR"; message: string }
  | { type: "SELECT_TYRE"; tyre: TyreProductWithInventory }
  | { type: "STATIONS_LOADING" }
  | { type: "STATIONS_READY"; stations: FittingStationWithPrice[] }
  | { type: "STATIONS_ERROR"; message: string }
  | { type: "SELECT_STATION"; station: FittingStationWithPrice }
  | { type: "SLOTS_LOADING" }
  | { type: "SLOTS_READY"; slots: StationSlot[] }
  | { type: "SLOTS_ERROR"; message: string }
  | { type: "SELECT_SLOT"; slot: StationSlot }
  | { type: "SET_CUSTOMER_DETAILS"; name: string; phone: string }
  | { type: "SET_QUANTITY"; quantity: number }
  | { type: "TOGGLE_SERVICE"; service: CustomerService }
  | { type: "SET_PAYMENT_METHOD"; method: JourneyState["paymentMethod"] }
  | { type: "CREATE_ORDER" };
