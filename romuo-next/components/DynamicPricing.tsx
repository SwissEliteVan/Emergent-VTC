'use client';

import { useState } from 'react';
import { usePriceCalculator } from '../hooks/usePriceCalculator';
import { useFunnelTracking } from '../hooks/useFunnelTracking';

export function DynamicPricing() {
  const { track } = useFunnelTracking();
  const [distance, setDistance] = useState(68);
  const [duration, setDuration] = useState(45);
  const [supplements, setSupplements] = useState({
    night: true,
    premium: false,
    childSeat: true,
    wait: false,
  });

  const pricing = usePriceCalculator({
    distanceKm: distance,
    durationMin: duration,
    baseFare: 8,
    pricePerKm: 2.5,
    pricePerMin: 0.8,
    tvaRate: 0.077,
    supplements,
  });

  const toggle = (key: keyof typeof supplements) => {
    setSupplements((prev) => ({ ...prev, [key]: !prev[key] }));
    track('pricing', { supplement: key });
  };

  return (
    <section className="section" id="tarifs">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold">Tarifs transparents</h2>
        <p className="text-gray-600 mt-2">Un prix juste, détaillé en temps réel</p>

        <div className="mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="card p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-[var(--romuo-border)] rounded-card p-4">
                <p className="text-sm text-gray-500">Standard</p>
                <p className="text-lg font-semibold">Mercedes A</p>
                <p className="text-sm text-gray-600">2.50 CHF / km</p>
                <p className="text-sm text-gray-600">0.80 CHF / min</p>
              </div>
              <div className="border border-[var(--romuo-border)] rounded-card p-4">
                <p className="text-sm text-gray-500">Premium</p>
                <p className="text-lg font-semibold">Mercedes E</p>
                <p className="text-sm text-gray-600">3.20 CHF / km</p>
                <p className="text-sm text-gray-600">1.00 CHF / min</p>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold">Distance: {distance} km</label>
              <input
                type="range"
                min={5}
                max={120}
                value={distance}
                onChange={(event) => setDistance(Number(event.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-4">
              <label className="text-sm font-semibold">Durée: {duration} min</label>
              <input
                type="range"
                min={10}
                max={180}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold">Décompte en temps réel</h3>
            <div className="mt-4 text-sm text-gray-600 space-y-2">
              <div className="flex justify-between"><span>BASE</span><span>{pricing.subtotal.toFixed(2)} CHF</span></div>
              <div className="flex justify-between"><span>DISTANCE</span><span>{pricing.distance.toFixed(2)} CHF</span></div>
              <div className="flex justify-between"><span>TEMPS</span><span>{pricing.time.toFixed(2)} CHF</span></div>
              <div className="border-t border-[var(--romuo-border)] pt-2 flex justify-between font-semibold">
                <span>SOUS-TOTAL</span><span>{pricing.subtotal.toFixed(2)} CHF</span>
              </div>
              <div className="flex justify-between"><span>TVA 7.7%</span><span>{pricing.tva.toFixed(2)} CHF</span></div>
              <div className="border-t border-[var(--romuo-border)] pt-2 flex justify-between text-romuo-red text-lg font-semibold">
                <span>TOTAL</span><span>{pricing.total.toFixed(2)} CHF</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold">Suppléments optionnels</p>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <label className="flex items-center justify-between">
                  <span>Supplément nuit (22h-6h) +25%</span>
                  <input type="checkbox" checked={supplements.night} onChange={() => toggle('night')} />
                </label>
                <label className="flex items-center justify-between">
                  <span>Véhicule premium +40%</span>
                  <input type="checkbox" checked={supplements.premium} onChange={() => toggle('premium')} />
                </label>
                <label className="flex items-center justify-between">
                  <span>Siège enfant +5 CHF</span>
                  <input type="checkbox" checked={supplements.childSeat} onChange={() => toggle('childSeat')} />
                </label>
                <label className="flex items-center justify-between">
                  <span>Attente supplémentaire +30 CHF/h</span>
                  <input type="checkbox" checked={supplements.wait} onChange={() => toggle('wait')} />
                </label>
              </div>
              <button type="button" className="mt-6 text-romuo-red font-semibold underline" onClick={() => track('pricing', { action: 'details' })}>
                Voir les détails
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
