import { useMemo } from 'react';

const VEHICLES = [
  {
    id: 'eco',
    tier: 'ECO',
    name: 'Toyota Prius',
    model: 'Compacte propre',
    base: 6.0,
    rate: 3.2,
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'van',
    tier: 'VAN',
    name: 'Mercedes V-Class',
    model: 'Van noir luxe',
    base: 12.0,
    rate: 4.5,
    image:
      'https://images.unsplash.com/photo-1523983309090-0d6e9f6c0e5b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'bus',
    tier: 'BUS',
    name: 'Minibus Sprinter',
    model: 'Minibus vitré',
    base: 20.0,
    rate: 6.0,
    image:
      'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&w=600&q=80',
  },
];

const toRad = (value) => (value * Math.PI) / 180;

const getDistanceKm = (from, to) => {
  if (!from || !to) return 0;
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const estimateDurationMinutes = (distanceKm) => {
  if (!distanceKm) return 0;
  const averageSpeedKmH = 38;
  return Math.max(6, Math.round((distanceKm / averageSpeedKmH) * 60));
};

export default function usePriceCalculator({ pickup, destination }) {
  const distanceKm = useMemo(
    () => getDistanceKm(pickup, destination),
    [pickup, destination],
  );
  const durationMinutes = useMemo(
    () => estimateDurationMinutes(distanceKm),
    [distanceKm],
  );

  const estimates = useMemo(() => {
    if (!distanceKm) return {};
    return VEHICLES.reduce((accumulator, vehicle) => {
      const total = vehicle.base + distanceKm * vehicle.rate + durationMinutes * vehicle.rate;
      accumulator[vehicle.id] = Math.round(total);
      return accumulator;
    }, {});
  }, [distanceKm, durationMinutes]);

  return {
    vehicles: VEHICLES,
    distanceKm,
    durationMinutes,
    estimates,
  };
}
