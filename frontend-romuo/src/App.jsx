import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  ArrowLeft,
  Loader2,
  Check,
  Menu,
  Clock,
  CreditCard,
  History,
  Settings,
  X,
} from 'lucide-react';
import SwissMap from './components/SwissMap';
import SwissAutocomplete from './components/SwissAutocomplete';
import VehicleSelector from './components/VehicleSelector';
import DriverCard from './components/DriverCard';
import PaymentSelector from './components/PaymentSelector';
import TripHistory from './components/TripHistory';
import { rideApi } from './utils/api';
import { MOCK_DRIVER } from './utils/vehicles';

// Views: landing, input, vehicle, payment, tracking, history
const VIEWS = {
  LANDING: 'landing',
  INPUT: 'input',
  VEHICLE: 'vehicle',
  PAYMENT: 'payment',
  TRACKING: 'tracking',
  HISTORY: 'history',
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1.3;
};

function App() {
  // App State
  const [currentView, setCurrentView] = useState(VIEWS.LANDING);
  const [menuOpen, setMenuOpen] = useState(false);

  // Location State
  const [pickupText, setPickupText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  // Booking State
  const [selectedVehicle, setSelectedVehicle] = useState('berline');
  const [distanceKm, setDistanceKm] = useState(null);
  const [prices, setPrices] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingReference, setBookingReference] = useState(null);

  // Guest contact info
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Tracking State
  const [trackingState, setTrackingState] = useState('searching');
  const [driverPosition, setDriverPosition] = useState(null);
  const [estimatedArrival, setEstimatedArrival] = useState(null);

  // Calculate distance when locations change
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      const dist = calculateDistance(
        pickupLocation[0],
        pickupLocation[1],
        destinationLocation[0],
        destinationLocation[1]
      );
      setDistanceKm(dist);
    } else {
      setDistanceKm(null);
      setPrices({});
    }
  }, [pickupLocation, destinationLocation]);

  // Fetch pricing from backend when route or vehicle changes
  useEffect(() => {
    if (!pickupLocation || !destinationLocation || !distanceKm) {
      return;
    }

    let isActive = true;

    const loadPricing = async () => {
      setPricingLoading(true);
      setPricingError(null);
      try {
        const response = await rideApi.calculate({
          pickup: {
            latitude: pickupLocation[0],
            longitude: pickupLocation[1],
            address: pickupText || 'Point de départ',
          },
          destination: {
            latitude: destinationLocation[0],
            longitude: destinationLocation[1],
            address: destinationText || 'Destination',
          },
          vehicle_type: selectedVehicle,
          distance_km: distanceKm,
          num_passengers: 1,
        });

        if (!isActive) return;
        const allPrices = response.data.all_prices || {};
        const finalPrice = response.data.final_price;
        setPrices({
          ...allPrices,
          [selectedVehicle]: finalPrice,
        });
      } catch (error) {
        console.error('Failed to load pricing:', error);
        if (isActive) {
          setPrices({});
          setPricingError('Impossible de récupérer les tarifs en direct.');
        }
      } finally {
        if (isActive) {
          setPricingLoading(false);
        }
      }
    };

    loadPricing();

    return () => {
      isActive = false;
    };
  }, [pickupLocation, destinationLocation, distanceKm, selectedVehicle, pickupText, destinationText]);

  // Simulate driver search and tracking
  useEffect(() => {
    if (currentView === VIEWS.TRACKING && trackingState === 'searching') {
      const timer = setTimeout(() => {
        setTrackingState('found');
        setEstimatedArrival(Math.floor(Math.random() * 5) + 3);
        if (pickupLocation) {
          setDriverPosition([
            pickupLocation[0] + (Math.random() * 0.02 - 0.01),
            pickupLocation[1] + (Math.random() * 0.02 - 0.01),
          ]);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentView, trackingState, pickupLocation]);

  // Animate driver towards pickup with smooth movement
  useEffect(() => {
    if (trackingState === 'found' && driverPosition && pickupLocation) {
      const interval = setInterval(() => {
        setDriverPosition((prev) => {
          if (!prev) return prev;
          const dx = pickupLocation[0] - prev[0];
          const dy = pickupLocation[1] - prev[1];
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 0.0005) {
            setTrackingState('arriving');
            return prev;
          }

          const speed = 0.08;
          const newLat = prev[0] + dx * speed;
          const newLon = prev[1] + dy * speed;
          return [newLat, newLon];
        });

        setEstimatedArrival((prev) => {
          if (prev > 1) return prev - 0.1;
          return 1;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [trackingState, driverPosition, pickupLocation]);

  // Handle pickup selection
  const handlePickupSelect = useCallback((location) => {
    if (location) {
      setPickupLocation([location.lat, location.lon]);
    } else {
      setPickupLocation(null);
    }
  }, []);

  // Handle destination selection
  const handleDestinationSelect = useCallback((location) => {
    if (location) {
      setDestinationLocation([location.lat, location.lon]);
    } else {
      setDestinationLocation(null);
    }
  }, []);

  // Handle route confirmation
  const handleConfirmRoute = useCallback(() => {
    if (pickupLocation && destinationLocation) {
      setCurrentView(VIEWS.VEHICLE);
    }
  }, [pickupLocation, destinationLocation]);

  // Handle vehicle confirmation
  const handleConfirmVehicle = useCallback(() => {
    setCurrentView(VIEWS.PAYMENT);
  }, []);

  // Handle booking confirmation
  const handleConfirmBooking = useCallback(async () => {
    if (!pickupLocation || !destinationLocation || !distanceKm) {
      setBookingError('Veuillez sélectionner votre trajet.');
      return;
    }

    if (!guestName || (!guestEmail && !guestPhone)) {
      setBookingError('Merci de renseigner votre nom et un email ou téléphone.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const response = await rideApi.createGuest({
        pickup: {
          latitude: pickupLocation[0],
          longitude: pickupLocation[1],
          address: pickupText || 'Point de départ',
        },
        destination: {
          latitude: destinationLocation[0],
          longitude: destinationLocation[1],
          address: destinationText || 'Destination',
        },
        vehicle_type: selectedVehicle,
        distance_km: distanceKm,
        price: prices[selectedVehicle] || 0,
        payment_method: paymentMethod,
        contact: {
          name: guestName,
          email: guestEmail || null,
          phone: guestPhone || null,
        },
      });

      setBookingReference(response.data.ride_id);
      setTrackingState('searching');
      setDriverPosition(null);
      setEstimatedArrival(null);
      setCurrentView(VIEWS.TRACKING);
    } catch (error) {
      console.error('Failed to create booking:', error);
      setBookingError('Impossible de confirmer la réservation pour le moment.');
    } finally {
      setBookingLoading(false);
    }
  }, [
    pickupLocation,
    destinationLocation,
    distanceKm,
    pickupText,
    destinationText,
    selectedVehicle,
    paymentMethod,
    prices,
    guestName,
    guestEmail,
    guestPhone,
  ]);

  // Go back
  const handleBack = useCallback(() => {
    switch (currentView) {
      case VIEWS.INPUT:
        setCurrentView(VIEWS.LANDING);
        break;
      case VIEWS.VEHICLE:
        setCurrentView(VIEWS.INPUT);
        break;
      case VIEWS.PAYMENT:
        setCurrentView(VIEWS.VEHICLE);
        break;
      case VIEWS.TRACKING:
        setCurrentView(VIEWS.PAYMENT);
        setTrackingState('searching');
        setDriverPosition(null);
        break;
      case VIEWS.HISTORY:
        setCurrentView(VIEWS.LANDING);
        break;
      default:
        break;
    }
  }, [currentView]);

  // =====================================================
  // VIEW: History
  // =====================================================
  if (currentView === VIEWS.HISTORY) {
    return <TripHistory onClose={() => setCurrentView(VIEWS.LANDING)} />;
  }

  // =====================================================
  // VIEW A: Landing Page
  // =====================================================
  if (currentView === VIEWS.LANDING) {
    return (
      <div className="min-h-screen bg-gradient-dark flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gold-400 font-bold text-2xl">Romuo</span>
            <span className="text-white/60 text-sm">.ch</span>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Menu Drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-navy-900 animate-slide-in-right">
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-gold-400 font-bold text-xl">Menu</span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setCurrentView(VIEWS.HISTORY);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-swiss transition-colors"
                  >
                    <History className="w-5 h-5" />
                    Mes courses
                  </button>
                  <a
                    href="/admin"
                    className="flex items-center gap-3 w-full px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-swiss transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Administration
                  </a>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <main className="flex-1 flex flex-col justify-center px-6 pb-12">
          <div className="max-w-lg mx-auto w-full">
            <h2 className="text-display-sm text-white mb-4">
              Votre Chauffeur
              <br />
              <span className="text-gold-400">Premium</span> en Suisse
            </h2>
            <p className="text-lg text-white/70 mb-10">
              Transport privé d'excellence.
              Prix transparents, chauffeurs professionnels,
              service 24/7.
            </p>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => setCurrentView(VIEWS.INPUT)}
              className="btn-gold w-full text-lg"
            >
              Réserver une course
            </button>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <button
                onClick={() => setCurrentView(VIEWS.HISTORY)}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <History className="w-4 h-4" />
                <span className="text-sm">Mes courses</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-6 text-sm text-white/40">
            <span>Prix en CHF</span>
            <span className="w-1 h-1 rounded-full bg-gold-400" />
            <span>Suisse Romande</span>
            <span className="w-1 h-1 rounded-full bg-gold-400" />
            <span>24/7</span>
          </div>
        </footer>
      </div>
    );
  }

  // =====================================================
  // VIEW B: Input (Pickup & Destination)
  // =====================================================
  if (currentView === VIEWS.INPUT) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Map Background */}
        <div className="absolute inset-0">
          <SwissMap
            pickup={pickupLocation}
            destination={destinationLocation}
            showRoute={true}
            interactive={true}
          />
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-full shadow-swiss-md flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-navy-900" />
        </button>

        {/* Floating Input Card */}
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="floating-card p-4">
            {/* Romuo Badge */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
              <span className="text-gold-500 font-bold">Romuo</span>
              <span className="text-xs text-gray-400">.ch</span>
            </div>

            {/* Input Fields with Connector */}
            <div className="relative space-y-3">
              <div className="absolute left-6 top-[2.5rem] h-6 w-0.5 bg-gray-200 z-0" />

              {/* Pickup Input */}
              <div className="relative z-10">
                <SwissAutocomplete
                  value={pickupText}
                  onChange={setPickupText}
                  onSelect={handlePickupSelect}
                  placeholder="Lieu de prise en charge"
                  type="pickup"
                  icon={MapPin}
                />
              </div>

              {/* Destination Input */}
              <div className="relative z-10">
                <SwissAutocomplete
                  value={destinationText}
                  onChange={setDestinationText}
                  onSelect={handleDestinationSelect}
                  placeholder="Où allez-vous ?"
                  type="destination"
                  icon={Navigation}
                />
              </div>
            </div>

            {/* Distance Info */}
            {distanceKm && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Distance estimée</span>
                <span className="font-semibold text-navy-900">
                  {distanceKm.toFixed(1)} km
                </span>
              </div>
            )}

            {pricingLoading && (
              <p className="text-xs text-gray-400 mt-3">Calcul des tarifs en cours...</p>
            )}
            {pricingError && (
              <p className="text-xs text-danger-600 mt-3">{pricingError}</p>
            )}

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmRoute}
              disabled={!pickupLocation || !destinationLocation}
              className="btn-primary w-full mt-4"
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // VIEW C: Vehicle Selection
  // =====================================================
  if (currentView === VIEWS.VEHICLE) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Map Background */}
        <div className="absolute inset-0 bottom-[50vh]">
          <SwissMap
            pickup={pickupLocation}
            destination={destinationLocation}
            showRoute={true}
            interactive={false}
          />
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-full shadow-swiss-md flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-navy-900" />
        </button>

        {/* Route Summary */}
        <div className="absolute top-4 right-4 z-20 bg-white rounded-swiss px-4 py-2 shadow-swiss-md">
          <p className="text-sm font-medium text-navy-900">
            {distanceKm?.toFixed(1)} km
          </p>
        </div>

        {/* Vehicle Selector Bottom Sheet */}
        <VehicleSelector
          selectedVehicle={selectedVehicle}
          onSelect={setSelectedVehicle}
          prices={prices}
          distanceKm={distanceKm}
          onConfirm={handleConfirmVehicle}
        />
      </div>
    );
  }

  // =====================================================
  // VIEW D: Payment Selection
  // =====================================================
  if (currentView === VIEWS.PAYMENT) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-navy-900" />
          </button>
          <h1 className="text-lg font-semibold text-navy-900">Confirmer la réservation</h1>
        </header>

        <div className="flex-1 p-4 space-y-6">
          {/* Route Summary */}
          <div className="card-premium p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-success-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Départ</p>
                  <p className="text-sm text-navy-900 truncate mt-0.5">{pickupText}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-danger-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Arrivée</p>
                  <p className="text-sm text-navy-900 truncate mt-0.5">{destinationText}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{distanceKm?.toFixed(1)} km</span>
                <span className="capitalize">{selectedVehicle}</span>
              </div>
              <p className="text-xl font-bold text-navy-900">
                {prices[selectedVehicle] ? `${prices[selectedVehicle]} CHF` : '-- CHF'}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <PaymentSelector
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            showInvoice={false}
          />

          {/* Contact Info */}
          <div className="card-premium p-4 space-y-4">
            <h2 className="text-sm font-semibold text-navy-900">
              Coordonnées pour confirmer la course
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nom complet</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  className="mt-1 w-full rounded-swiss border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300"
                  placeholder="Ex: Camille Dupont"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  className="mt-1 w-full rounded-swiss border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300"
                  placeholder="exemple@email.ch"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Téléphone</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(event) => setGuestPhone(event.target.value)}
                  className="mt-1 w-full rounded-swiss border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300"
                  placeholder="+41 79 000 00 00"
                />
              </div>
            </div>
            {bookingError && (
              <p className="text-xs text-danger-600">{bookingError}</p>
            )}
          </div>
        </div>

        {/* Confirm Button */}
        <div className="p-4 border-t border-gray-100 safe-bottom">
          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={bookingLoading}
            className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <CreditCard className="w-5 h-5" />
            {bookingLoading ? 'Confirmation...' : `Confirmer • ${prices[selectedVehicle] || '--'} CHF`}
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // VIEW E: Live Tracking
  // =====================================================
  if (currentView === VIEWS.TRACKING) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Map Background */}
        <div className="absolute inset-0 bottom-[220px]">
          <SwissMap
            pickup={pickupLocation}
            destination={destinationLocation}
            driverPosition={trackingState !== 'searching' ? driverPosition : null}
            showRoute={trackingState !== 'searching'}
            interactive={true}
          />
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-full shadow-swiss-md flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-navy-900" />
        </button>

        {/* Status Bottom Panel */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-swiss-xl shadow-bottomsheet">
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="px-4 pb-6 safe-bottom">
            {/* Searching State */}
            {trackingState === 'searching' && (
              <div className="py-8 text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-navy-900">
                  Recherche d'un chauffeur
                </h3>
                <p className="text-gray-500 mt-1">
                  Veuillez patienter...
                </p>
              </div>
            )}

            {/* Found State */}
            {(trackingState === 'found' || trackingState === 'arriving') && (
              <div className="animate-fade-in">
                {bookingReference && (
                  <div className="mb-4 rounded-swiss bg-navy-900/90 px-4 py-2 text-xs text-white">
                    Référence course: {bookingReference}
                  </div>
                )}
                {/* Status Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-navy-900">
                    {trackingState === 'arriving' ? 'Chauffeur arrivé' : 'Chauffeur en route'}
                  </span>
                </div>

                {/* Driver Card */}
                <DriverCard
                  driver={MOCK_DRIVER}
                  onCall={() => alert('Appel en cours...')}
                  onMessage={() => alert('Message en cours...')}
                />

                {/* ETA */}
                <div className="mt-4 p-4 bg-gold-50 rounded-swiss text-center">
                  <p className="text-sm text-gold-700">
                    {trackingState === 'arriving' ? 'Votre chauffeur vous attend' : 'Arrivée estimée'}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Clock className="w-5 h-5 text-gold-600" />
                    <p className="text-2xl font-bold text-navy-900">
                      {trackingState === 'arriving'
                        ? 'Maintenant'
                        : `${Math.ceil(estimatedArrival || 3)} min`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
