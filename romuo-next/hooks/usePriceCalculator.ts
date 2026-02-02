'use client';

import { useMemo } from 'react';

export interface PricingInput {
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  pricePerKm: number;
  pricePerMin: number;
  tvaRate: number;
  supplements?: {
    night?: boolean;
    childSeat?: boolean;
    premium?: boolean;
    wait?: boolean;
  };
}

export function usePriceCalculator(input: PricingInput) {
  return useMemo(() => {
    const distance = input.distanceKm * input.pricePerKm;
    const time = input.durationMin * input.pricePerMin;
    const subtotal = input.baseFare + distance + time;

    const supplementMultiplier = input.supplements?.night ? 1.25 : 1;
    const premiumMultiplier = input.supplements?.premium ? 1.4 : 1;
    const childSeat = input.supplements?.childSeat ? 5 : 0;
    const wait = input.supplements?.wait ? 30 : 0;

    const adjusted = subtotal * supplementMultiplier * premiumMultiplier + childSeat + wait;
    const tva = adjusted * input.tvaRate;

    return {
      distance,
      time,
      subtotal: adjusted,
      tva,
      total: adjusted + tva,
    };
  }, [
    input.baseFare,
    input.distanceKm,
    input.durationMin,
    input.pricePerKm,
    input.pricePerMin,
    input.supplements?.night,
    input.supplements?.premium,
    input.supplements?.childSeat,
    input.supplements?.wait,
    input.tvaRate,
  ]);
}
