'use client';

import { useState } from 'react';

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[var(--romuo-border)]">
      <div className="mx-auto max-w-6xl px-6 md:px-12 py-4 flex items-center justify-between">
        <div>
          <p className="text-xl font-semibold">Romuo</p>
          <p className="text-xs text-gray-500">VTC Premium Suisse</p>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#tarifs" className="hover:text-romuo-red">Tarifs</a>
          <a href="#zones" className="hover:text-romuo-red">Zones</a>
          <a href="#vehicules" className="hover:text-romuo-red">Véhicules</a>
          <a href="#entreprise" className="hover:text-romuo-red">Entreprise</a>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline badge">✓ 4.9/5 • 15k trajets</span>
          <a href="https://app.romuo.ch?source=header&utm_campaign=optimised_funnel_v2" className="button-primary">
            RÉSERVER
          </a>
          <button
            type="button"
            className="md:hidden text-sm"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            Menu
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-t border-[var(--romuo-border)] px-6 py-4 bg-white">
          <nav className="flex flex-col gap-4 text-sm text-gray-600">
            <a href="#tarifs" onClick={() => setIsOpen(false)}>Tarifs</a>
            <a href="#zones" onClick={() => setIsOpen(false)}>Zones</a>
            <a href="#vehicules" onClick={() => setIsOpen(false)}>Véhicules</a>
            <a href="#entreprise" onClick={() => setIsOpen(false)}>Entreprise</a>
          </nav>
        </div>
      )}
    </header>
  );
}
