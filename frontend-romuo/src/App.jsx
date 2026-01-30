import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  ArrowLeft,
  Loader2,
  Check,
} from 'lucide-react';
import SwissMap from './components/SwissMap';
import SwissAutocomplete from './components/SwissAutocomplete';
import VehicleSelector from './components/VehicleSelector';
import DriverCard from './components/DriverCard';
import { calculateAllPrices, MOCK_DRIVER } from './utils/vehicles';

// Views: landing, input, vehicle, tracking
const VIEWS = {
  LANDING: 'landing',
  INPUT: 'input',
  VEHICLE: 'vehicle',
  TRACKING: 'tracking',
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1.3; // Multiply by 1.3 for road distance approximation
};

function App() {
  // App State
  const [currentView, setCurrentView] = useState(VIEWS.LANDING);

  // Location State
  const [pickupText, setPickupText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);

  // Booking State
  const [selectedVehicle, setSelectedVehicle] = useState('berline');
  const [distanceKm, setDistanceKm] = useState(null);
  const [prices, setPrices] = useState({});

  // Tracking State
  const [trackingState, setTrackingState] = useState('searching'); // searching, found
  const [driverPosition, setDriverPosition] = useState(null);

  // Calculate distance and prices when locations change
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      const dist = calculateDistance(
        pickupLocation[0],
        pickupLocation[1],
        destinationLocation[0],
        destinationLocation[1]
      );
      setDistanceKm(dist);
      setPrices(calculateAllPrices(dist));
    } else {
      setDistanceKm(null);
      setPrices({});
    }
  }, [pickupLocation, destinationLocation]);

  // Simulate driver search and tracking
  useEffect(() => {
    if (currentView === VIEWS.TRACKING && trackingState === 'searching') {
      const timer = setTimeout(() => {
        setTrackingState('found');
        // Set initial driver position near pickup
        if (pickupLocation) {
          setDriverPosition([
            pickupLocation[0] + 0.01,
            pickupLocation[1] + 0.01,
          ]);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentView, trackingState, pickupLocation]);

  // Animate driver towards pickup
  useEffect(() => {
    if (trackingState === 'found' && driverPosition && pickupLocation) {
      const interval = setInterval(() => {
        setDriverPosition(prev => {
          if (!prev) return prev;
          const newLat = prev[0] + (pickupLocation[0] - prev[0]) * 0.1;
          const newLon = prev[1] + (pickupLocation[1] - prev[1]) * 0.1;
          return [newLat, newLon];
        });
      }, 1000);
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

  // Handle route confirmation (go to vehicle selection)
  const handleConfirmRoute = useCallback(() => {
    if (pickupLocation && destinationLocation) {
      setCurrentView(VIEWS.VEHICLE);
    }
  }, [pickupLocation, destinationLocation]);

  // Handle booking confirmation (go to tracking)
  const handleConfirmBooking = useCallback(() => {
    setTrackingState('searching');
    setCurrentView(VIEWS.TRACKING);
  }, []);

  // Go back to previous view
  const handleBack = useCallback(() => {
    switch (currentView) {
      case VIEWS.INPUT:
        setCurrentView(VIEWS.LANDING);
        break;
      case VIEWS.VEHICLE:
        setCurrentView(VIEWS.INPUT);
        break;
      case VIEWS.TRACKING:
        setCurrentView(VIEWS.VEHICLE);
        setTrackingState('searching');
        setDriverPosition(null);
        break;
      default:
        break;
    }
  }, [currentView]);

  // =====================================================
  // VIEW A: Landing Page
  // =====================================================
  if (currentView === VIEWS.LANDING) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="px-6 py-4">
          <h1 className="text-2xl font-bold text-black tracking-tight">
            Romuo.ch
          </h1>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col justify-center px-6 pb-12">
          <div className="max-w-lg mx-auto w-full">
            <h2 className="text-display text-black mb-6">
              Votre Chauffeur Suisse
            </h2>
            <p className="text-lg text-gray-600 mb-10">
              Transport prive premium en Suisse.
              Prix fixes, chauffeurs professionnels,
              service 24/7.
            </p>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => setCurrentView(VIEWS.INPUT)}
              className="btn-primary w-full text-lg"
            >
              Reserver une course
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>Prix en CHF</span>
            <span>Suisse</span>
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
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>

        {/* Floating Input Card */}
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="floating-card p-4">
            {/* Input Fields with Connector */}
            <div className="relative space-y-3">
              {/* Connector Line */}
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
                  placeholder="Ou allez-vous ?"
                  type="destination"
                  icon={Navigation}
                />
              </div>
            </div>

            {/* Distance Info */}
            {distanceKm && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Distance estimee</span>
                <span className="font-semibold text-black">
                  {distanceKm.toFixed(1)} km
                </span>
              </div>
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
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>

        {/* Route Summary */}
        <div className="absolute top-4 right-4 z-20 bg-white rounded-swiss px-4 py-2 shadow-swiss-md">
          <p className="text-sm font-medium text-black">
            {distanceKm?.toFixed(1)} km
          </p>
        </div>

        {/* Vehicle Selector Bottom Sheet */}
        <VehicleSelector
          selectedVehicle={selectedVehicle}
          onSelect={setSelectedVehicle}
          prices={prices}
          distanceKm={distanceKm}
          onConfirm={handleConfirmBooking}
        />
      </div>
    );
  }

  // =====================================================
  // VIEW D: Live Tracking
  // =====================================================
  if (currentView === VIEWS.TRACKING) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Map Background */}
        <div className="absolute inset-0 bottom-[200px]">
          <SwissMap
            pickup={pickupLocation}
            destination={destinationLocation}
            driverPosition={trackingState === 'found' ? driverPosition : null}
            showRoute={trackingState === 'found'}
            interactive={true}
          />
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-full shadow-swiss-md flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-black animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-black">
                  Recherche d&#39;un chauffeur
                </h3>
                <p className="text-gray-500 mt-1">
                  Veuillez patienter...
                </p>
              </div>
            )}

            {/* Found State */}
            {trackingState === 'found' && (
              <div className="animate-fade-in">
                {/* Status Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-black">
                    Chauffeur trouve
                  </span>
                </div>

                {/* Driver Card */}
                <DriverCard
                  driver={MOCK_DRIVER}
                  onCall={() => alert('Appel en cours...')}
                  onMessage={() => alert('Message en cours...')}
                />

                {/* ETA */}
                <div className="mt-4 p-4 bg-gray-50 rounded-swiss text-center">
                  <p className="text-sm text-gray-500">Arrivee estimee</p>
                  <p className="text-2xl font-bold text-black">3 min</p>
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
