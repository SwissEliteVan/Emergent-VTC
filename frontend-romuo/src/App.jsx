import { useMemo, useRef, useState } from 'react';
import {
  PhoneCall,
  ShieldCheck,
  BadgeCheck,
  MapPin,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import BookingForm from './components/BookingForm';
import Mapbox from './components/Mapbox';

function App() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const bookingRef = useRef(null);

  const reassuranceItems = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: 'Paiement Sécurisé',
        description: 'Transactions protégées et confirmation instantanée.',
      },
      {
        icon: BadgeCheck,
        title: 'Chauffeurs Certifiés',
        description: 'Sélection rigoureuse et service haut de gamme.',
      },
      {
        icon: MapPin,
        title: 'Suivi GPS 24/7',
        description: 'Trajet suivi en temps réel et assistance dédiée.',
      },
    ],
    [],
  );

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-night text-white flex items-center justify-center font-semibold text-lg">
              R
            </div>
            <div>
              <p className="text-lg font-semibold text-night">Romuo</p>
              <p className="text-xs text-ink/60 uppercase tracking-[0.2em]">Swiss Ride</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToBooking}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-night text-white text-sm font-semibold shadow-soft hover:shadow-lg transition"
            >
              Estimer ma course gratuitement
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="tel:+41215550000"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-night transition"
            >
              <PhoneCall className="w-4 h-4" />
              +41 21 555 00 00
            </a>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16">
        <section className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-night/10 text-night text-xs font-semibold tracking-wide">
              Transport privé premium en Suisse romande
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-night">
              L&#39;Excellence du Transport Suisse à la Demande.
            </h1>
            <p className="text-lg text-ink/70">
              Berlines, Vans et Minibus. Chauffeurs professionnels. Prix fixes garantis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={scrollToBooking}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-night text-white text-base font-semibold shadow-lg hover:shadow-xl transition"
              >
                Estimer ma course gratuitement
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#booking"
                className="inline-flex items-center justify-center px-6 py-4 rounded-2xl border border-night/20 text-night font-semibold hover:bg-night/5 transition"
              >
                Planifier un trajet
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-night/10 bg-white shadow-card p-6">
            <h2 className="text-xl font-semibold text-night mb-4">Réservation rapide</h2>
            <div className="space-y-4 text-sm text-ink/70">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-night" />
                <div>
                  <p className="font-semibold text-ink">Service Suisse International</p>
                  <p>Prise en charge à l&#39;aéroport, hôtels 5★ et sièges d&#39;entreprise.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Navigation className="w-5 h-5 text-night" />
                <div>
                  <p className="font-semibold text-ink">Itinéraires optimisés</p>
                  <p>Suivi GPS et gestion proactive du trafic.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-night" />
                <div>
                  <p className="font-semibold text-ink">Accueil discret & premium</p>
                  <p>Confort haut de gamme et service de conciergerie.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="booking"
          ref={bookingRef}
          className="max-w-6xl mx-auto px-6 mt-14 grid lg:grid-cols-[1.1fr,0.9fr] gap-8"
        >
          <div className="order-2 lg:order-1 h-[420px]">
            <Mapbox pickup={pickupLocation} destination={destinationLocation} />
          </div>
          <div className="order-1 lg:order-2">
            <BookingForm
              pickup={pickup}
              destination={destination}
              pickupLocation={pickupLocation}
              destinationLocation={destinationLocation}
              onPickupChange={setPickup}
              onDestinationChange={setDestination}
              onPickupSelect={(location) =>
                setPickupLocation(location ? [location.lat, location.lon] : null)
              }
              onDestinationSelect={(location) =>
                setDestinationLocation(location ? [location.lat, location.lon] : null)
              }
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 mt-16">
          <div className="grid md:grid-cols-3 gap-6">
            {reassuranceItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-night/10 bg-white shadow-soft p-5"
                >
                  <div className="w-10 h-10 rounded-full bg-night/10 text-night flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-night">{item.title}</h3>
                  <p className="text-sm text-ink/70 mt-1">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
