'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './HeroConverter.module.css';
import { useSmartGeolocation } from '../hooks/useSmartGeolocation';
import { useDestinationPredictor } from '../hooks/useDestinationPredictor';
import { usePriceCalculator } from '../hooks/usePriceCalculator';
import { useFunnelTracking } from '../hooks/useFunnelTracking';

const mockEstimate = {
  distanceKm: 68,
  durationMin: 45,
};

function buildAppUrl(from: string, to: string, estimate: number) {
  const params = new URLSearchParams({
    from,
    to,
    estimate: estimate.toFixed(2),
    vehicle: 'standard',
    source: 'homepage_hero',
    medium: 'organic',
    utm_campaign: 'optimised_funnel_v2',
  });
  return `https://app.romuo.ch?${params.toString()}`;
}

export function HeroConverter({ prefillTo, onToChange }: { prefillTo?: string; onToChange?: (value: string) => void }) {
  const { position, loading } = useSmartGeolocation();
  const { suggestions, saveDestination } = useDestinationPredictor();
  const { track } = useFunnelTracking();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showEstimate, setShowEstimate] = useState(false);

  useEffect(() => {
    if (!loading && position.city && !from) {
      setFrom(`${position.city}, Suisse`);
    }
  }, [loading, position.city, from]);

  useEffect(() => {
    if (from && to) {
      setShowEstimate(true);
      track('hero', { from, to });
      saveDestination(to);
    }
  }, [from, to, track, saveDestination]);

  useEffect(() => {
    if (prefillTo && prefillTo !== to) {
      setTo(prefillTo);
    }
  }, [prefillTo, to]);

  const pricing = usePriceCalculator({
    distanceKm: mockEstimate.distanceKm,
    durationMin: mockEstimate.durationMin,
    baseFare: 8,
    pricePerKm: 2.3,
    pricePerMin: 0.55,
    tvaRate: 0.077,
    supplements: { night: false },
  });

  const appUrl = useMemo(() => buildAppUrl(from || 'Genève', to || 'Lausanne', pricing.total), [from, to, pricing.total]);

  const handlePrefetch = () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = 'https://app.romuo.ch';
    document.head.appendChild(link);
  };

  return (
    <section className="section bg-romuo-gray">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div>
          <div className="badge mb-6">✓ 4.9/5 • 15k trajets</div>
          <h1 className="text-4xl md:text-5xl font-display font-semibold leading-tight">
            Votre trajet VTC en Suisse, simplifié
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Réservez en 30s • Prix transparents • 24h/24
          </p>

          <div className="mt-8 grid gap-4">
            <label className="text-sm font-semibold" htmlFor="from">
              🏠 OÙ PARTEZ-VOUS ?
            </label>
            <input
              id="from"
              className={styles.inputField}
              placeholder="Genève, Suisse"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              list="romuo-from"
            />
            <datalist id="romuo-from">
              {suggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>

            <label className="text-sm font-semibold" htmlFor="to">
              🎯 OÙ ALLEZ-VOUS ?
            </label>
            <input
              id="to"
              className={styles.inputField}
              placeholder="Lausanne, Suisse"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                onToChange?.(event.target.value);
              }}
              list="romuo-to"
            />
            <datalist id="romuo-to">
              {suggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          {showEstimate && (
            <div className={clsx('mt-6 card p-6', styles.priceReveal)}>
              <p className="text-sm text-gray-500">Estimation instantanée</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span>Distance: {mockEstimate.distanceKm} km</span>
                <span>Durée: {mockEstimate.durationMin} min</span>
              </div>
              <div className="mt-4 text-3xl font-semibold text-romuo-red">
                {pricing.total.toFixed(0)} CHF
              </div>
              <p className="text-xs text-gray-500 mt-2">
                8 CHF prise en charge + {pricing.distance.toFixed(0)} distance + {pricing.time.toFixed(0)} temps
              </p>
            </div>
          )}

          <a
            href={appUrl}
            className="button-primary mt-8 w-full text-center flex items-center justify-center gap-2"
            onMouseEnter={handlePrefetch}
          >
            🚗 CONTINUER VERS L'APPLICATION →
          </a>
          <p className="text-xs text-gray-500 mt-2">Prix TVA incluse. Pas de frais cachés.</p>
        </div>

        <div className="card p-6 bg-white">
          <h3 className="text-lg font-semibold">Suggestions intelligentes</h3>
          <p className="text-sm text-gray-500 mt-2">Démarrez en un clic avec vos trajets fréquents.</p>
          <div className="mt-4 grid gap-3">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="button-outline w-full"
                onClick={() => {
                  setTo(item);
                  track('hero', { suggestion: item });
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
