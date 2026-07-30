export type ServicePriceUnit = "per tyre" | "per job";

export type CustomerService = {
  id: string;
  name: string;
  price: number;
  priceUnit: ServicePriceUnit;
};

export type OrderPricingInput = {
  quantity: number;
  tyreUnitPrice: number;
  fittingUnitPrice: number;
  services: CustomerService[];
};

export type OrderPricing = {
  tyreSubtotal: number;
  fittingSubtotal: number;
  serviceSubtotal: number;
  total: number;
  deposit: number;
  balance: number;
};

export function calculateOrderPricing({ quantity, tyreUnitPrice, fittingUnitPrice, services }: OrderPricingInput): OrderPricing {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const tyreSubtotal = safeQuantity * Math.max(0, tyreUnitPrice);
  const fittingSubtotal = safeQuantity * Math.max(0, fittingUnitPrice);
  const serviceSubtotal = services.reduce(
    (total, service) => total + Math.max(0, service.price) * (service.priceUnit === "per tyre" ? safeQuantity : 1),
    0,
  );
  const total = tyreSubtotal + fittingSubtotal + serviceSubtotal;
  const deposit = Math.ceil(total * 0.1);

  return { tyreSubtotal, fittingSubtotal, serviceSubtotal, total, deposit, balance: total - deposit };
}
