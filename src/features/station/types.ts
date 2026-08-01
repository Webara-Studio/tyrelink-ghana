export type StationView = "overview" | "orders" | "order" | "calendar" | "settings";

export type StationOrder = {
  number: string;
  customer: string;
  vehicle: string;
  product: string;
  quantity: number;
  appointment: string;
  status: "In transit" | "Received" | "Ready to fit";
};

export type StationServiceKey = "alignment" | "balancing" | "rotation" | "valve-replacement";
export type StationPaymentMethodKey = "momo" | "card" | "cash" | "usdt";

export type StationProfileSettings = {
  businessName: string;
  location: string;
  openingHours: string;
  fittingBays: string;
  services: Record<StationServiceKey, boolean>;
  paymentMethods: Record<StationPaymentMethodKey, boolean>;
};
