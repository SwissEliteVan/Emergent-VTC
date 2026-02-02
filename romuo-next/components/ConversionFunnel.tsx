'use client';

import { useEffect, useState } from 'react';
import { useFunnelTracking } from '../hooks/useFunnelTracking';

const funnelSteps = [
  { step: 'Découverte', description: 'Calculateur instantané', target: 'Hero' },
  { step: 'Personnalisation', description: 'Carte + destinations', target: 'Carte' },
  { step: 'Confirmation', description: 'Prix + CTA', target: 'Tarifs' },
];

export function ConversionFunnel() {
  const { track } = useFunnelTracking();
  const [showExitIntent, setShowExitIntent] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (event: MouseEvent) => {
      if (event.clientY < 20) {
        setShowExitIntent(true);
        track('cta', { intent: 'exit' });
      }
    };

    window.addEventListener('mouseleave', handleMouseLeave);
    return () => window.removeEventListener('mouseleave', handleMouseLeave);
  }, [track]);

  return (
    <section className="section bg-romuo-gray" id="funnel">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold">Un parcours optimisé en 3 étapes</h2>
        <p className="text-gray-600 mt-2">Deux clics maximum pour réserver.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {funnelSteps.map((item) => (
            <div key={item.step} className="card p-6">
              <p className="text-sm text-gray-500">{item.step}</p>
              <h3 className="text-lg font-semibold mt-2">{item.description}</h3>
              <p className="text-sm text-gray-600 mt-2">Objectif: {item.target}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center">
          <a
            href="https://app.romuo.ch?source=homepage_funnel&utm_campaign=optimised_funnel_v2"
            className="button-primary w-full md:w-auto"
            onClick={() => track('cta', { location: 'funnel' })}
          >
            Continuer vers l'application
          </a>
          <button
            type="button"
            className="button-outline w-full md:w-auto"
            onClick={() => track('cta', { location: 'pricing' })}
          >
            Estimer mon prix
          </button>
        </div>
      </div>

      {showExitIntent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-card p-6 max-w-md shadow-soft">
            <h3 className="text-xl font-semibold">Besoin d'aide pour réserver ?</h3>
            <p className="text-sm text-gray-600 mt-2">Profitez de -10% sur votre première course.</p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://app.romuo.ch?source=exit_intent&utm_campaign=optimised_funnel_v2"
                className="button-primary w-full"
                onClick={() => track('cta', { location: 'exit_intent' })}
              >
                Activer l'offre
              </a>
              <button type="button" className="button-outline" onClick={() => setShowExitIntent(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
