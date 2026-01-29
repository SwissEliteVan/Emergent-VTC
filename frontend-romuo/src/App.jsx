import { useState, useRef } from 'react';
import {
  Car, Users, Bus, MapPin, Navigation, Phone, Clock,
  ChevronRight, Star, Shield, Zap, Moon, PartyPopper,
  Heart, Map, Briefcase, ArrowRight, Check, Menu, X
} from 'lucide-react';
import AutocompleteInput from './components/AutocompleteInput';
import { VEHICLE_TYPES, SPECIAL_OFFERS, POPULAR_ROUTES, getAllPricesForRoute, estimateDistance } from './utils/vehicles';

// ==========================================================
// COMPOSANT PRINCIPAL - LANDING PAGE
// ==========================================================

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const bookingRef = useRef(null);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Navigation */}
      <Navigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} scrollToBooking={scrollToBooking} />

      {/* Hero Section */}
      <HeroSection scrollToBooking={scrollToBooking} />

      {/* Quick Booking Form */}
      <div ref={bookingRef}>
        <BookingSection
          pickup={pickup}
          setPickup={setPickup}
          destination={destination}
          setDestination={setDestination}
        />
      </div>

      {/* Services - 3 categories */}
      <ServicesSection
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        scrollToBooking={scrollToBooking}
      />

      {/* Offres Speciales */}
      <SpecialOffersSection scrollToBooking={scrollToBooking} />

      {/* Ligne Nocturne */}
      <NightLineSection scrollToBooking={scrollToBooking} />

      {/* Pour qui ? */}
      <AudienceSection scrollToBooking={scrollToBooking} />

      {/* Trajets populaires */}
      <PopularRoutesSection setPickup={setPickup} setDestination={setDestination} scrollToBooking={scrollToBooking} />

      {/* Pourquoi nous ? */}
      <WhyUsSection />

      {/* CTA Final */}
      <FinalCTASection scrollToBooking={scrollToBooking} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ==========================================================
// NAVIGATION
// ==========================================================

function Navigation({ mobileMenuOpen, setMobileMenuOpen, scrollToBooking }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-dark-900 font-bold text-xl shadow-lg">
              R
            </div>
            <span className="text-2xl font-display font-bold text-primary">Romuo</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-gray-300 hover:text-primary transition-colors">Services</a>
            <a href="#offres" className="text-gray-300 hover:text-primary transition-colors">Offres</a>
            <a href="#ligne-nocturne" className="text-gray-300 hover:text-primary transition-colors">Ligne Nocturne</a>
            <a href="#contact" className="text-gray-300 hover:text-primary transition-colors">Contact</a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button
              onClick={scrollToBooking}
              className="bg-primary hover:bg-primary-600 text-dark-900 font-semibold px-6 py-2 rounded-lg transition-all shadow-luxury"
            >
              Reserver
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-800 border-b border-dark-700">
          <div className="px-4 py-4 space-y-3">
            <a href="#services" className="block text-gray-300 hover:text-primary py-2">Services</a>
            <a href="#offres" className="block text-gray-300 hover:text-primary py-2">Offres</a>
            <a href="#ligne-nocturne" className="block text-gray-300 hover:text-primary py-2">Ligne Nocturne</a>
            <a href="#contact" className="block text-gray-300 hover:text-primary py-2">Contact</a>
            <button
              onClick={scrollToBooking}
              className="w-full bg-primary text-dark-900 font-semibold py-3 rounded-lg mt-4"
            >
              Reserver maintenant
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ==========================================================
// HERO SECTION
// ==========================================================

function HeroSection({ scrollToBooking }) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-ebd3fee56b2f?w=1920&auto=format')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-8 animate-fade-in">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-primary text-sm font-medium">Transport VTC en Suisse romande</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-slide-up">
          <span className="text-white">Votre trajet,</span>
          <br />
          <span className="text-primary">notre priorite</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
          De Martigny a Lausanne et au-dela.
          <br className="hidden md:block" />
          <span className="text-primary font-semibold">Voiture, Van ou Bus</span> - le transport qu'il vous faut.
        </p>

        {/* Key benefits */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 text-gray-300">
            <Check className="w-5 h-5 text-primary" />
            <span>Chauffeurs professionnels</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Check className="w-5 h-5 text-primary" />
            <span>Disponible 7j/7</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Check className="w-5 h-5 text-primary" />
            <span>Tarifs transparents</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={scrollToBooking}
            className="bg-primary hover:bg-primary-600 text-dark-900 font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-luxury hover:shadow-2xl hover:scale-105"
          >
            Reserver maintenant
            <ChevronRight className="inline-block w-5 h-5 ml-2" />
          </button>
          <a
            href="tel:+41791234567"
            className="bg-dark-700 hover:bg-dark-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all border border-dark-600"
          >
            <Phone className="inline-block w-5 h-5 mr-2" />
            Appeler
          </a>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-gray-400 text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <Star className="w-4 h-4 text-primary fill-primary" />
            <Star className="w-4 h-4 text-primary fill-primary" />
            <Star className="w-4 h-4 text-primary fill-primary" />
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="ml-2">4.9/5 sur 200+ avis</span>
          </div>
          <span className="hidden md:inline">|</span>
          <span>Plus de 5000 trajets realises</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// BOOKING SECTION
// ==========================================================

function BookingSection({ pickup, setPickup, destination, setDestination }) {
  const [selectedVehicle, setSelectedVehicle] = useState('voiture');
  const distance = pickup && destination ? estimateDistance(pickup, destination) : 30;
  const prices = getAllPricesForRoute(distance);

  return (
    <section id="booking" className="relative -mt-20 z-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Ou voulez-vous aller ?
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <AutocompleteInput
              value={pickup}
              onChange={setPickup}
              placeholder="Adresse de depart"
              label="Depart"
              icon={MapPin}
            />
            <AutocompleteInput
              value={destination}
              onChange={setDestination}
              placeholder="Adresse d'arrivee"
              label="Destination"
              icon={Navigation}
            />
          </div>

          {/* Vehicle selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Type de vehicule</label>
            <div className="grid grid-cols-3 gap-3">
              {VEHICLE_TYPES.map((vehicle) => {
                const VehicleIcon = vehicle.icon;
                const isSelected = selectedVehicle === vehicle.id;
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-dark-600 hover:border-dark-500 bg-dark-700'
                    }`}
                  >
                    <VehicleIcon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                    <p className={`font-semibold ${isSelected ? 'text-primary' : 'text-white'}`}>
                      {vehicle.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {vehicle.capacity} places
                    </p>
                    {prices[vehicle.id] && (
                      <p className="text-sm font-bold text-primary mt-1">
                        des {prices[vehicle.id]} CHF
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Booking button */}
          <button
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              pickup && destination
                ? 'bg-primary hover:bg-primary-600 text-dark-900 shadow-luxury'
                : 'bg-dark-700 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!pickup || !destination}
          >
            {pickup && destination
              ? `Reserver - ${prices[selectedVehicle] || '...'} CHF`
              : 'Entrez votre trajet'
            }
          </button>

          <p className="text-center text-xs text-gray-500 mt-3">
            Paiement a bord - Annulation gratuite - Confirmation immediate
          </p>
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// SERVICES SECTION
// ==========================================================

function ServicesSection({ selectedService, setSelectedService, scrollToBooking }) {
  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Nos <span className="text-primary">services</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Quel que soit votre besoin, nous avons la solution adaptee.
            De 1 a 50 passagers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {VEHICLE_TYPES.map((vehicle, index) => {
            const VehicleIcon = vehicle.icon;
            const isSelected = selectedService === vehicle.id;
            return (
              <div
                key={vehicle.id}
                className={`group relative bg-dark-800 rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] ${
                  isSelected ? 'border-primary shadow-luxury' : 'border-dark-700 hover:border-dark-600'
                }`}
                onClick={() => setSelectedService(isSelected ? null : vehicle.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    vehicle.popular ? 'bg-primary text-dark-900' : 'bg-dark-700 text-gray-300'
                  }`}>
                    {vehicle.badge}
                  </span>
                </div>

                {/* Image */}
                <div className="h-48 overflow-hidden">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <VehicleIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{vehicle.name}</h3>
                      <p className="text-sm text-gray-400">{vehicle.capacity} places max</p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4">{vehicle.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-400">A partir de</p>
                      <p className="text-2xl font-bold text-primary">{vehicle.basePrice} CHF</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Par km</p>
                      <p className="text-lg font-semibold text-white">{vehicle.pricePerKm} CHF</p>
                    </div>
                  </div>

                  {/* Features (shown when selected) */}
                  {isSelected && (
                    <div className="pt-4 border-t border-dark-700 animate-slide-up">
                      <p className="text-sm font-semibold text-gray-300 mb-2">Inclus :</p>
                      <ul className="space-y-2">
                        {vehicle.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToBooking();
                    }}
                    className="w-full mt-4 py-3 bg-dark-700 hover:bg-primary hover:text-dark-900 text-white font-semibold rounded-xl transition-all"
                  >
                    Reserver
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// SPECIAL OFFERS SECTION
// ==========================================================

function SpecialOffersSection({ scrollToBooking }) {
  return (
    <section id="offres" className="py-20 px-4 bg-dark-800/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Offres <span className="text-primary">speciales</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Des tarifs adaptes a tous les budgets
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Tarif Jeune */}
          <div className="bg-gradient-to-br from-green-500/10 to-dark-800 rounded-2xl p-8 border border-green-500/30 hover:border-green-500/50 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-green-400" />
              </div>
              <span className="bg-green-500 text-dark-900 font-bold px-4 py-2 rounded-full text-lg">
                -15%
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Tarif Jeune</h3>
            <p className="text-green-400 font-semibold mb-4">Moins de 26 ans</p>

            <p className="text-gray-300 mb-6">
              Vous avez moins de 26 ans ? Beneficiez automatiquement de 15% de reduction
              sur tous vos trajets. Parfait pour rentrer apres vos soirees en toute securite.
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-green-400" />
                Reduction automatique a la reservation
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-green-400" />
                Valable sur tous les vehicules
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-green-400" />
                Cumulable avec la ligne nocturne
              </li>
            </ul>

            <button
              onClick={scrollToBooking}
              className="w-full py-3 bg-green-500 hover:bg-green-400 text-dark-900 font-bold rounded-xl transition-all"
            >
              Profiter du tarif jeune
            </button>
          </div>

          {/* Covoiturage */}
          <div className="bg-gradient-to-br from-blue-500/10 to-dark-800 rounded-2xl p-8 border border-blue-500/30 hover:border-blue-500/50 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <span className="bg-blue-500 text-dark-900 font-bold px-4 py-2 rounded-full text-lg">
                -25%
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Covoiturage</h3>
            <p className="text-blue-400 font-semibold mb-4">Partagez le trajet</p>

            <p className="text-gray-300 mb-6">
              Vous etes plusieurs a faire le meme trajet ? Partagez les frais et economisez
              jusqu'a 25% sur le prix total. Plus on est de fous, moins c'est cher !
            </p>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-blue-400" />
                A partir de 2 passagers
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-blue-400" />
                Prix divise equitablement
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Check className="w-5 h-5 text-blue-400" />
                Ideal pour les sorties en groupe
              </li>
            </ul>

            <button
              onClick={scrollToBooking}
              className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-dark-900 font-bold rounded-xl transition-all"
            >
              Reserver a plusieurs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// NIGHT LINE SECTION
// ==========================================================

function NightLineSection({ scrollToBooking }) {
  const nightLine = SPECIAL_OFFERS.nightLine;

  return (
    <section id="ligne-nocturne" className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-dark-900 to-purple-900/20" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&auto=format')] bg-cover bg-center opacity-10" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Moon className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-semibold">Nouveau</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ligne <span className="text-purple-400">Nocturne</span>
            </h2>

            <p className="text-2xl text-primary font-semibold mb-4">
              Martigny - Lausanne
            </p>

            <p className="text-xl text-gray-300 mb-6">
              Chaque <span className="text-white font-semibold">vendredi et samedi</span> soir,
              profitez de notre navette pour rentrer en toute securite apres vos soirees.
            </p>

            <div className="bg-dark-800/80 rounded-2xl p-6 mb-6 border border-purple-500/30">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Horaires des departs
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">23h00</p>
                  <p className="text-sm text-gray-400">Depart Martigny</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">01h00</p>
                  <p className="text-sm text-gray-400">Depart Martigny</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">03h00</p>
                  <p className="text-sm text-gray-400">Retour Lausanne</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              {['Martigny', 'Sion', 'Montreux', 'Vevey', 'Lausanne'].map((stop, i) => (
                <span key={stop} className="flex items-center gap-1 text-gray-300">
                  {i > 0 && <ArrowRight className="w-4 h-4 text-purple-400" />}
                  <span className="bg-dark-700 px-3 py-1 rounded-full text-sm">{stop}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-400">A partir de</p>
                <p className="text-4xl font-bold text-purple-400">{nightLine.priceFrom} CHF</p>
              </div>
              <button
                onClick={scrollToBooking}
                className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-8 py-4 rounded-xl transition-all"
              >
                Reserver ma place
              </button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden border-2 border-purple-500/30">
              <img
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format"
                alt="Soiree"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent" />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-purple-500 text-white p-6 rounded-2xl shadow-2xl">
              <p className="text-3xl font-bold">Ven & Sam</p>
              <p className="text-purple-200">Chaque week-end</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// AUDIENCE SECTION
// ==========================================================

function AudienceSection({ scrollToBooking }) {
  const audiences = [
    {
      icon: PartyPopper,
      title: 'Jeunes noctambules',
      description: 'Sortez l\'esprit tranquille, on vous ramene en securite',
      benefit: '-15% sur tous les trajets',
      color: 'green'
    },
    {
      icon: Heart,
      title: 'Seniors',
      description: 'Medecin, courses, visites... service porte-a-porte attentionne',
      benefit: 'Chauffeurs patients et serviables',
      color: 'pink'
    },
    {
      icon: Map,
      title: 'Sans vehicule',
      description: 'Retrouvez votre liberte de deplacement sans contrainte',
      benefit: 'Disponible 7j/7, meme les jours feries',
      color: 'blue'
    },
    {
      icon: Briefcase,
      title: 'Professionnels',
      description: 'Ponctualite et discretion pour tous vos deplacements d\'affaires',
      benefit: 'Facturation entreprise disponible',
      color: 'yellow'
    }
  ];

  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };

  return (
    <section className="py-20 px-4 bg-dark-800/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Romuo, c'est pour <span className="text-primary">vous</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Que vous soyez jeune fêtard, senior actif, sans voiture ou professionnel,
            nous avons une solution adaptee a vos besoins.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <div
                key={index}
                className={`p-6 rounded-2xl border transition-all hover:scale-105 ${colorClasses[audience.color]}`}
              >
                <Icon className="w-10 h-10 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{audience.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{audience.description}</p>
                <p className="text-sm font-semibold">{audience.benefit}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={scrollToBooking}
            className="bg-primary hover:bg-primary-600 text-dark-900 font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-luxury"
          >
            Trouver mon trajet
          </button>
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// POPULAR ROUTES SECTION
// ==========================================================

function PopularRoutesSection({ setPickup, setDestination, scrollToBooking }) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trajets <span className="text-primary">populaires</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Nos itineraires les plus demandes en Suisse romande
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_ROUTES.slice(0, 6).map((route) => (
            <button
              key={route.id}
              onClick={() => {
                setPickup(route.from);
                setDestination(route.to);
                scrollToBooking();
              }}
              className="bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-primary/50 rounded-xl p-5 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span>{route.from}</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span>{route.to}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  <span>{route.distance} km</span>
                  <span className="mx-2">|</span>
                  <span>{route.duration}</span>
                </div>
                <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">
                  des {route.priceFrom} CHF
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// WHY US SECTION
// ==========================================================

function WhyUsSection() {
  const reasons = [
    {
      icon: Shield,
      title: 'Securite garantie',
      description: 'Tous nos chauffeurs sont professionnels, assures et formes aux standards les plus eleves.'
    },
    {
      icon: Clock,
      title: 'Ponctualite',
      description: 'Nous arrivons toujours a l\'heure. Votre temps est precieux, nous le respectons.'
    },
    {
      icon: Star,
      title: 'Qualite premium',
      description: 'Vehicules recents, propres et confortables pour tous vos deplacements.'
    },
    {
      icon: Zap,
      title: 'Reactivite',
      description: 'Reservation en quelques clics, confirmation immediate, disponibilite 7j/7.'
    }
  ];

  return (
    <section className="py-20 px-4 bg-dark-800/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pourquoi choisir <span className="text-primary">Romuo</span> ?
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{reason.title}</h3>
                <p className="text-gray-400 text-sm">{reason.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// FINAL CTA SECTION
// ==========================================================

function FinalCTASection({ scrollToBooking }) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Pret a partir ?
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Reservez votre trajet en moins de 2 minutes.
          <br />
          <span className="text-primary">Paiement a bord, annulation gratuite.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={scrollToBooking}
            className="bg-primary hover:bg-primary-600 text-dark-900 font-bold px-10 py-5 rounded-xl text-xl transition-all shadow-luxury hover:shadow-2xl hover:scale-105"
          >
            Reserver maintenant
          </button>
          <a
            href="tel:+41791234567"
            className="bg-dark-700 hover:bg-dark-600 text-white font-semibold px-10 py-5 rounded-xl text-xl transition-all border border-dark-600"
          >
            <Phone className="inline-block w-6 h-6 mr-2" />
            +41 79 123 45 67
          </a>
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// FOOTER
// ==========================================================

function Footer() {
  return (
    <footer id="contact" className="bg-dark-800 border-t border-dark-700 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-dark-900 font-bold text-xl">
                R
              </div>
              <span className="text-2xl font-display font-bold text-primary">Romuo</span>
            </div>
            <p className="text-gray-400 mb-4">
              Service de transport VTC en Suisse romande.
              Voiture, Van, Bus - de 1 a 50 passagers.
              Ligne Martigny-Lausanne.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Voiture</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Van</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Bus</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Ligne nocturne</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tarif jeune</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+41791234567" className="hover:text-primary transition-colors">+41 79 123 45 67</a>
              </li>
              <li>info@romuo.ch</li>
              <li>Suisse romande</li>
              <li className="pt-2 text-sm">
                Disponible 7j/7
                <br />
                Ligne nocturne : Ven-Sam
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Romuo. Tous droits reserves.</p>
          <p className="mt-2">
            <a href="#" className="hover:text-primary transition-colors">Conditions generales</a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:text-primary transition-colors">Politique de confidentialite</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default App;
