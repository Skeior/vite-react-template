type PricingRates = {
  perKm: number;
  drivePerMinute: number;
  parkPerMinute: number;
};

let CURRENT_RATES: PricingRates = {
  perKm: 1,
  drivePerMinute: 2,
  parkPerMinute: 1,
};

export const PRICING_RATES: Readonly<PricingRates> = CURRENT_RATES;

export function setPricingRates(rates: Partial<PricingRates>) {
  CURRENT_RATES = { ...CURRENT_RATES, ...rates };
}

export function getPricingRates(): Readonly<PricingRates> {
  return CURRENT_RATES;
}

export function calculateLineItems(distanceKm: number, driveSeconds: number, parkSeconds: number, rates: PricingRates = CURRENT_RATES) {
  const kmCost = distanceKm * rates.perKm;
  const driveMinutes = driveSeconds / 60;
  const driveCost = driveMinutes * rates.drivePerMinute;
  const parkMinutes = parkSeconds / 60;
  const parkCost = parkMinutes * rates.parkPerMinute;
  return { kmCost, driveCost, parkCost };
}

export function calculateTotal(distanceKm: number, driveSeconds: number, parkSeconds: number, rates: PricingRates = CURRENT_RATES) {
  const { kmCost, driveCost, parkCost } = calculateLineItems(distanceKm, driveSeconds, parkSeconds, rates);
  return kmCost + driveCost + parkCost;
}
