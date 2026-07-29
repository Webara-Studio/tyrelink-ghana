"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import type { Dispatch, PropsWithChildren } from "react";
import type { TyreProductWithInventory, TyreSize, FittingStationWithPrice, StationSlot } from "@/lib/tyrelink-api";

export type JourneyScreen = "home" | "vehicle" | "size" | "catalogue" | "product" | "station" | "slot" | "details" | "review" | "payment" | "success" | "tracking";

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
  paymentMethod: "MTN MoMo";
  orderNumber?: string;
  catalogueStatus: "idle" | "loading" | "ready" | "error";
  catalogueError?: string;
};

export type JourneyAction =
  | { type: "GO_TO"; screen: JourneyScreen }
  | { type: "SELECT_VEHICLE"; vehicle: string; size: TyreSize }
  | { type: "SET_SIZE"; size: TyreSize }
  | { type: "CATALOGUE_LOADING" }
  | { type: "CATALOGUE_READY"; tyres: TyreProductWithInventory[] }
  | { type: "CATALOGUE_ERROR"; message: string }
  | { type: "SELECT_TYRE"; tyre: TyreProductWithInventory }
  | { type: "STATIONS_READY"; stations: FittingStationWithPrice[] }
  | { type: "SELECT_STATION"; station: FittingStationWithPrice }
  | { type: "SLOTS_READY"; slots: StationSlot[] }
  | { type: "SELECT_SLOT"; slot: StationSlot }
  | { type: "SET_CUSTOMER_DETAILS"; name: string; phone: string }
  | { type: "SET_QUANTITY"; quantity: number }
  | { type: "CREATE_ORDER" };

const initialState: JourneyState = {
  screen: "home",
  vehicle: "Toyota Corolla",
  size: { widthMm: 205, aspectRatio: 55, rimSize: 16 },
  tyres: [],
  stations: [],
  slots: [],
  quantity: 4,
  customerName: "",
  customerPhone: "",
  paymentMethod: "MTN MoMo",
  catalogueStatus: "idle",
};

function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case "GO_TO":
      return { ...state, screen: action.screen };
    case "SELECT_VEHICLE":
      return { ...state, vehicle: action.vehicle, size: action.size, screen: "size" };
    case "SET_SIZE":
      return { ...state, size: action.size, selectedTyre: undefined, catalogueStatus: "idle", screen: "catalogue" };
    case "CATALOGUE_LOADING":
      return { ...state, catalogueStatus: "loading", catalogueError: undefined };
    case "CATALOGUE_READY":
      return { ...state, tyres: action.tyres, catalogueStatus: "ready", catalogueError: undefined };
    case "CATALOGUE_ERROR":
      return { ...state, catalogueStatus: "error", catalogueError: action.message };
    case "SELECT_TYRE":
      return { ...state, selectedTyre: action.tyre, screen: "product" };
    case "STATIONS_READY":
      return { ...state, stations: action.stations };
    case "SELECT_STATION":
      return { ...state, selectedStation: action.station, screen: "station" };
    case "SLOTS_READY":
      return { ...state, slots: action.slots };
    case "SELECT_SLOT":
      return { ...state, selectedSlot: action.slot, screen: "details" };
    case "SET_CUSTOMER_DETAILS":
      return { ...state, customerName: action.name, customerPhone: action.phone, screen: "review" };
    case "SET_QUANTITY":
      return { ...state, quantity: Math.max(2, Math.min(4, action.quantity)) };
    case "CREATE_ORDER":
      return { ...state, orderNumber: "TL-DEMO-240724-018", screen: "success" };
    default:
      return state;
  }
}

const JourneyContext = createContext<{ state: JourneyState; dispatch: Dispatch<JourneyAction> } | null>(null);

export function JourneyProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(journeyReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const value = useContext(JourneyContext);
  if (!value) throw new Error("useJourney must be used within JourneyProvider");
  return value;
}
