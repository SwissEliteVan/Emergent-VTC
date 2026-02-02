'use client';

import { useMemo } from 'react';
import { useDestinationPredictor } from '../hooks/useDestinationPredictor';
import { useFunnelTracking } from '../hooks/useFunnelTracking';

const destinations = [
  { label: '🏢 Travail', name: 'Genève Centre', price: '15-25 CHF' },
  { label: '✈️ Aéroport', name: 'GVA Genève', price: '45 CHF fixe' },
  { label: '🛍️ Commerces', name: 'Balexert', price: '35-45 CHF' },
  { label: '🏥 Hôpitaux', name: 'HUG Genève', price: '20-30 CHF' },
  { label: '🚄 Gares', name: 'Gare Cornavin', price: '15-20 CHF' },
  { label: '🏨 Hôtels', name: 'Beau-Rivage', price: '25-35 CHF' },
];

export function SmartDestinationGrid({ onSelect }: { onSelect: (value: string) => void }) {
  const { suggestions } = useDestinationPredictor();
  const { track } = useFunnelTracking();

  const lastTrip = useMemo(() => {
    return {
      route: 'Genève → Lausanne',
      price: '189 CHF',
      date: '15 déc 2023',
    };
  }, []);

  return (
    <section className="section bg-romuo-gray" id="destinations">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold">Destinations populaires depuis votre position</h2>
        <p className="text-gray-600 mt-2">Prix fixes pour les trajets les plus demandés</p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {destinations.map((item) => (
            <button
              key={item.name}
              type="button"
              className="card p-5 text-left hover:shadow-soft transition duration-300"
              onClick={() => {
                onSelect(item.name);
                track('destinations', { destination: item.name });
              }}
            >
              <div className="text-sm text-gray-500">{item.label}</div>
              <div className="mt-2 text-lg font-semibold">{item.name}</div>
              <div className="mt-1 text-romuo-red font-semibold">{item.price}</div>
            </button>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Système de présélection intelligente</h3>
            <p className="text-sm text-gray-500 mt-2">Basé sur vos habitudes et l'heure locale.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="button-outline"
                  onClick={() => onSelect(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Répéter ma dernière réservation</h3>
            <p className="text-sm text-gray-500 mt-2">{lastTrip.route} • {lastTrip.price} • {lastTrip.date}</p>
            <button
              type="button"
              className="button-primary mt-6 w-full"
              onClick={() => {
                onSelect('Lausanne');
                track('destinations', { action: 'repeat' });
              }}
            >
              🔄 Reprendre ce trajet
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
