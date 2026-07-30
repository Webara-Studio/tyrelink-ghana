import type { JourneyAction, JourneyState } from "./journey-types";

export const initialJourneyState: JourneyState = {
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
  selectedServices: [],
  catalogueStatus: "idle",
  stationsStatus: "idle",
  slotsStatus: "idle",
};

export function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case "GO_TO":
      return { ...state, screen: action.screen };
    case "RESET_JOURNEY":
      return initialJourneyState;
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
    case "STATIONS_LOADING":
      return { ...state, stationsStatus: "loading", stationsError: undefined };
    case "STATIONS_READY":
      return { ...state, stations: action.stations, stationsStatus: "ready", stationsError: undefined };
    case "STATIONS_ERROR":
      return { ...state, stationsStatus: "error", stationsError: action.message };
    case "SELECT_STATION":
      return { ...state, selectedStation: action.station, slots: [], selectedSlot: undefined, slotsStatus: "idle", screen: "station" };
    case "SLOTS_LOADING":
      return { ...state, slotsStatus: "loading", slotsError: undefined };
    case "SLOTS_READY":
      return { ...state, slots: action.slots, slotsStatus: "ready", slotsError: undefined };
    case "SLOTS_ERROR":
      return { ...state, slotsStatus: "error", slotsError: action.message };
    case "SELECT_SLOT":
      return { ...state, selectedSlot: action.slot, screen: "details" };
    case "SET_CUSTOMER_DETAILS":
      return { ...state, customerName: action.name, customerPhone: action.phone, screen: "review" };
    case "SET_QUANTITY":
      return { ...state, quantity: Math.max(2, Math.min(4, action.quantity)) };
    case "TOGGLE_SERVICE":
      return {
        ...state,
        selectedServices: state.selectedServices.some((service) => service.id === action.service.id)
          ? state.selectedServices.filter((service) => service.id !== action.service.id)
          : [...state.selectedServices, action.service],
      };
    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.method };
    case "CREATE_ORDER":
      return { ...state, orderNumber: "TL-DEMO-240724-018", screen: "success" };
  }
}
