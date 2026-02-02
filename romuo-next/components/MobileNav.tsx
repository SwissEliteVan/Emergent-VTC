'use client';

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-[var(--romuo-border)] md:hidden z-40">
      <div className="flex items-center justify-around text-xs py-2">
        <a href="#hero" className="flex flex-col items-center gap-1">🏠<span>Accueil</span></a>
        <a href="#zones" className="flex flex-col items-center gap-1">🗺️<span>Zones</span></a>
        <a href="#destinations" className="flex flex-col items-center gap-1">⭐<span>Destinations</span></a>
        <a href="#tarifs" className="flex flex-col items-center gap-1">💰<span>Tarifs</span></a>
      </div>
    </nav>
  );
}
