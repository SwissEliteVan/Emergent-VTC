import { useEffect, useMemo, useState } from 'react';
import { Car, MapPin, User } from 'lucide-react';

const pickupSuggestions = [
  'Zurich, Bahnhofstrasse',
  'Genève, Cornavin',
  'Lausanne, Gare CFF',
  'Basel, Messeplatz',
  'Bern, Bundesplatz',
  'Lugano, Via Nassa',
];

const vehicleOptions = [
  {
    id: 'eco',
    title: 'Eco (Toyota)',
    base: 6,
    perKm: 2.5,
    estimate: '25-30 CHF',
  },
  {
    id: 'berline',
    title: 'Berline (Mercedes)',
    base: 10,
    perKm: 3.5,
    estimate: '45-50 CHF',
  },
  {
    id: 'van',
    title: 'Van (V-Class)',
    base: 15,
    perKm: 4.5,
    estimate: '65-80 CHF',
  },
  {
    id: 'bus',
    title: 'Bus (Executive)',
    base: 25,
    perKm: 6,
    estimate: '95-120 CHF',
  },
];

function App() {
  const [step, setStep] = useState('landing');
  const [pickup, setPickup] = useState('Localisation actuelle');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleOptions[1].id);
  const [isDriverFound, setIsDriverFound] = useState(false);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);

  const isPricingVisible = step === 'pricing' || step === 'tracking';

  const filteredPickupSuggestions = useMemo(() => {
    if (!pickup) return pickupSuggestions;
    return pickupSuggestions.filter((item) =>
      item.toLowerCase().includes(pickup.toLowerCase()),
    );
  }, [pickup]);

  useEffect(() => {
    if (step !== 'tracking') return;
    setIsDriverFound(false);
    const timer = setTimeout(() => setIsDriverFound(true), 2000);
    return () => clearTimeout(timer);
  }, [step]);

  const handleDestinationSubmit = () => {
    if (!destination.trim()) return;
    setStep('pricing');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <header className="w-full border-b border-black/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-lg font-bold tracking-tight">Romuo.ch</div>
          <div className="hidden md:flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-black/60">
            Swiss International Style
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        <section className="grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.4em] text-black/50">PWA VTC Suisse</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-black">
              Votre Chauffeur Suisse
            </h1>
            <button
              type="button"
              onClick={() => setStep('input')}
              className="w-full sm:w-auto bg-black text-white px-8 py-4 text-sm font-semibold tracking-wide"
            >
              Réserver une course
            </button>
          </div>
          <div className="border border-black/10 bg-white p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-black/70">
                <Car className="w-5 h-5 text-black" />
                Flotte premium en Suisse & Europe
              </div>
              <div className="flex items-center gap-3 text-sm text-black/70">
                <MapPin className="w-5 h-5 text-black" />
                Départ pré-sélectionné en Suisse
              </div>
              <div className="flex items-center gap-3 text-sm text-black/70">
                <User className="w-5 h-5 text-black" />
                Chauffeurs certifiés & suivi en direct
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Saisie</h2>
            <button
              type="button"
              onClick={() => setStep('input')}
              className="text-xs uppercase tracking-[0.2em] text-black/50"
            >
              View B
            </button>
          </div>
          <div className="relative h-[360px] border border-black/10 bg-black/5">
            <div className="absolute inset-0">
              <div className="absolute inset-8 border border-black/10" />
              <div className="absolute inset-20 border border-black/10" />
              <div className="absolute inset-32 border border-black/10" />
            </div>

            <div className="absolute left-1/2 top-1/2 w-[360px] -translate-x-1/2 -translate-y-1/2 bg-white border border-black/10 shadow-sm">
              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-2">
                    <div className="w-2 h-2 rounded-full bg-black" />
                    <div className="w-px h-12 bg-black/20" />
                    <div className="w-2 h-2 rounded-full bg-black/40" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="relative">
                      <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                        Lieu de prise en charge
                      </label>
                      <input
                        value={pickup}
                        onChange={(event) => setPickup(event.target.value)}
                        onFocus={() => setShowPickupSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 150)}
                        className="mt-2 w-full border border-black/15 px-3 py-2 text-sm"
                      />
                      {showPickupSuggestions && filteredPickupSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-2 w-full border border-black/10 bg-white shadow-sm">
                          {filteredPickupSuggestions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onMouseDown={() => {
                                setPickup(item);
                                setShowPickupSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-black/5"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                        Destination
                      </label>
                      <input
                        value={destination}
                        onChange={(event) => setDestination(event.target.value)}
                        placeholder="Où allez-vous ?"
                        className="mt-2 w-full border border-black/15 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleDestinationSubmit}
                        className="mt-3 w-full border border-black bg-black text-white py-2 text-sm"
                      >
                        Valider la destination
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-black/50">
                  Départ limité à la Suisse, destination ouverte à toute l&#39;Europe.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sélection Véhicule</h2>
            <button
              type="button"
              onClick={() => setStep('pricing')}
              className="text-xs uppercase tracking-[0.2em] text-black/50"
            >
              View C
            </button>
          </div>

          <div className="relative h-[280px] border border-black/10 bg-black/5">
            <div className="absolute inset-x-0 bottom-0">
              <div className="max-w-5xl mx-auto">
                <div
                  className={`bg-white border border-black/10 shadow-lg transition-all ${
                    isPricingVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                          Tarifs estimés (CHF)
                        </p>
                        <h3 className="text-lg font-semibold text-black">
                          Sélectionnez votre catégorie
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('tracking')}
                        className="border border-black bg-black text-white px-5 py-2 text-sm"
                      >
                        Confirmer
                      </button>
                    </div>

                    <div className="mt-6 grid md:grid-cols-4 gap-4">
                      {vehicleOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedVehicle(option.id)}
                          className={`border px-4 py-4 text-left transition ${
                            selectedVehicle === option.id
                              ? 'border-black bg-black/5'
                              : 'border-black/10 hover:border-black'
                          }`}
                        >
                          <p className="text-sm font-semibold text-black">{option.title}</p>
                          <p className="text-xs text-black/60 mt-1">
                            Base {option.base.toFixed(2)} CHF + {option.perKm.toFixed(2)} CHF/km
                          </p>
                          <p className="text-sm font-semibold text-black mt-3">
                            {option.estimate}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Tracking</h2>
            <button
              type="button"
              onClick={() => setStep('tracking')}
              className="text-xs uppercase tracking-[0.2em] text-black/50"
            >
              View D
            </button>
          </div>

          <div className="border border-black/10 bg-black/5 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                  {isDriverFound ? 'Chauffeur trouvé' : 'Recherche chauffeur'}
                </p>
                <h3 className="text-lg font-semibold text-black">
                  {isDriverFound
                    ? 'Votre chauffeur arrive dans 4 minutes.'
                    : 'Connexion au réseau romuo.ch.'}
                </h3>
              </div>
              <div className="border border-black/10 bg-white px-4 py-3 text-sm">
                {isDriverFound ? 'Statut confirmé' : 'Chargement...'}
              </div>
            </div>

            <div className="relative h-[280px] border border-black/10 bg-white">
              <svg
                className="absolute inset-0"
                viewBox="0 0 800 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M80 220 C 220 120, 360 120, 520 80 C 600 60, 680 80, 720 40"
                  stroke="#2563eb"
                  strokeWidth="3"
                />
                <circle cx="80" cy="220" r="6" fill="#000000" />
                <circle cx="720" cy="40" r="6" fill="#000000" />
              </svg>
              <div className="absolute bottom-8 left-10 bg-white border border-black/10 px-4 py-3 text-sm shadow-sm">
                Départ : {pickup}
              </div>
              <div className="absolute top-8 right-10 bg-white border border-black/10 px-4 py-3 text-sm shadow-sm">
                Destination : {destination || 'Europe'}
              </div>
            </div>

            <div className="border border-black/10 bg-white px-5 py-4 grid md:grid-cols-[auto,1fr] gap-4 items-center">
              <div className="w-14 h-14 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-sm font-semibold">
                RC
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-black">Romain C.</p>
                <p className="text-xs text-black/60">Mercedes EQE · Plaque VD 204 891</p>
                <p className="text-xs text-black/60">Option sélectionnée : {selectedVehicle}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
