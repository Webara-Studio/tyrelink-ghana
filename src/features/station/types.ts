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
