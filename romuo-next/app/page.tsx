'use client';

import { useState } from 'react';
import { HeroConverter } from '../components/HeroConverter';
import { InteractiveMap } from '../components/InteractiveMap';
import { SmartDestinationGrid } from '../components/SmartDestinationGrid';
import { DynamicPricing } from '../components/DynamicPricing';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { SiteHeader } from '../components/SiteHeader';
import { MobileNav } from '../components/MobileNav';

export default function HomePage() {
  const [prefillTo, setPrefillTo] = useState<string | undefined>(undefined);

  return (
    <main className="min-h-screen" id="hero">
      <SiteHeader />
      <HeroConverter prefillTo={prefillTo} onToChange={setPrefillTo} />
      <InteractiveMap onDestinationSelect={setPrefillTo} />
      <SmartDestinationGrid onSelect={setPrefillTo} />
      <DynamicPricing />

      <section className="section" id="vehicules">
        <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-6">
          {['Mercedes A', 'Mercedes E', 'Van Premium'].map((vehicle) => (
            <div key={vehicle} className="card p-6">
              <h3 className="text-lg font-semibold">{vehicle}</h3>
              <p className="text-sm text-gray-500 mt-2">Confort suisse, Wi-Fi, chargeurs, eau minérale.</p>
              <a href="#tarifs" className="mt-4 inline-block text-romuo-red font-semibold underline">
                Voir les détails
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="section bg-romuo-gray" id="entreprise">
        <div className="mx-auto max-w-6xl grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
          <div>
            <h2 className="text-3xl font-semibold">Solutions Entreprise</h2>
            <p className="text-gray-600 mt-2">
              Facturation centralisée, comptes multiples et support dédié pour vos déplacements professionnels.
            </p>
            <ul className="mt-4 text-sm text-gray-600 space-y-2">
              <li>✓ Reporting mensuel détaillé</li>
              <li>✓ Chauffeurs premium disponibles 24/7</li>
              <li>✓ Gestion des coûts par centre</li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Parler à un conseiller</h3>
            <p className="text-sm text-gray-500 mt-2">Réponse sous 1h, engagements SLA suisses.</p>
            <button className="button-primary mt-6 w-full">Planifier un appel</button>
          </div>
        </div>
      </section>

      <ConversionFunnel />
      <MobileNav />
    </main>
  );
}
