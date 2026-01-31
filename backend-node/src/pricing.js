const VEHICLE_PRICING = {
  car: { base: 8, perKm: 3.5, label: "Voiture" },
  van: { base: 15, perKm: 5.5, label: "Van" },
  bus: { base: 80, perKm: 12, label: "Bus" }
};

const SURCHARGES = {
  night: { multiplier: 1.2, label: "Nuit" },
  airport: { flat: 12, label: "Aeroport" },
  luggage: { flat: 5, label: "Bagages" }
};

export function calculatePrice({ distanceKm, vehicleType, options = {} }) {
  const config = VEHICLE_PRICING[vehicleType];
  if (!config) {
    throw new Error(`Type de vehicule invalide: ${vehicleType}`);
  }
  if (Number.isNaN(distanceKm) || distanceKm <= 0) {
    throw new Error("La distance doit etre un nombre positif.");
  }

  const base = config.base + config.perKm * distanceKm;
  let total = base;
  const breakdown = [
    {
      label: `Base (${config.label})`,
      amount: Number(base.toFixed(2))
    }
  ];

  if (options.night) {
    const multiplierCharge = total * (SURCHARGES.night.multiplier - 1);
    total += multiplierCharge;
    breakdown.push({
      label: `Surcharge ${SURCHARGES.night.label}`,
      amount: Number(multiplierCharge.toFixed(2))
    });
  }

  if (options.airport) {
    total += SURCHARGES.airport.flat;
    breakdown.push({
      label: `Surcharge ${SURCHARGES.airport.label}`,
      amount: SURCHARGES.airport.flat
    });
  }

  if (options.luggage) {
    total += SURCHARGES.luggage.flat;
    breakdown.push({
      label: `Surcharge ${SURCHARGES.luggage.label}`,
      amount: SURCHARGES.luggage.flat
    });
  }

  return {
    currency: "CHF",
    total: Number(total.toFixed(2)),
    breakdown
  };
}

export function listVehicleOptions() {
  return Object.entries(VEHICLE_PRICING).map(([key, value]) => ({
    key,
    label: value.label,
    base: value.base,
    perKm: value.perKm
  }));
}
