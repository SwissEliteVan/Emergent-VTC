import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, LogIn, Shield, CreditCard, Clock } from 'lucide-react';
import RouteSelector from './RouteSelector';
import AutocompleteInput from './AutocompleteInput';
import PriceComparator from './PriceComparator';
import VehicleCard from './VehicleCard';
import { VEHICLE_TYPES, calculatePrice, estimateDistance, getAllPricesForRoute } from '../utils/vehicles';

export default function Sidebar() {
  const [step, setStep] = useState(1); // 1: Trajet, 2: Véhicule, 3: Confirmation
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [priceEstimates, setPriceEstimates] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [passengers, setPassengers] = useState(1);

  // Calculer les prix quand le trajet change
  useEffect(() => {
    if (pickup && destination) {
      const distance = estimateDistance(pickup, destination);
      setEstimatedDistance(distance);
      const prices = getAllPricesForRoute(distance);
      setPriceEstimates(prices);
    } else if (selectedRoute && selectedRoute.distance > 0) {
      setEstimatedDistance(selectedRoute.distance);
      const prices = getAllPricesForRoute(selectedRoute.distance);
      setPriceEstimates(prices);
    } else {
      setEstimatedDistance(null);
      setPriceEstimates({});
    }
  }, [pickup, destination, selectedRoute]);

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    if (route.id !== 'custom') {
      setPickup(route.from);
      setDestination(route.to);
      setStep(2); // Passer directement à l'étape véhicule
    } else {
      setPickup('');
      setDestination('');
      // Rester sur l'étape 1 pour saisie custom
    }
  };

  const canProceedToStep2 = () => {
    return pickup && destination && estimatedDistance;
  };

  const canProceedToStep3 = () => {
    return selectedVehicle && canProceedToStep2();
  };

  const handleBooking = () => {
    const bookingData = {
      pickup,
      destination,
      passengers,
      vehicleType: selectedVehicle,
      estimatedPrice: priceEstimates[selectedVehicle],
      estimatedDistance
    };
    console.log('Réservation:', bookingData);
    alert(`Réservation confirmée\n\nTrajet: ${pickup} → ${destination}\nVéhicule: ${VEHICLE_TYPES.find(v => v.id === selectedVehicle)?.name}\nPrix: ${priceEstimates[selectedVehicle]} CHF`);
  };

  const selectedVehicleData = VEHICLE_TYPES.find(v => v.id === selectedVehicle);

  return (
    <div className="h-full bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-dark-900 font-bold text-xl shadow-lg">
            R
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Romuo</h1>
            <p className="text-xs text-gray-400">Transport Électrique Premium</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm font-medium">
          <LogIn className="w-4 h-4" />
          <span className="hidden lg:inline">Connexion</span>
        </button>
      </div>

      {/* Stepper */}
      <div className="bg-dark-800 border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all
                ${step >= stepNum
                  ? 'bg-primary text-dark-900'
                  : 'bg-dark-700 text-gray-500'
                }
              `}>
                {stepNum}
              </div>
              <div className="flex-1 mx-2">
                <div className={`h-0.5 transition-all ${step > stepNum ? 'bg-primary' : 'bg-dark-700'}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className={step >= 1 ? 'text-primary font-medium' : 'text-gray-500'}>Trajet</span>
          <span className={step >= 2 ? 'text-primary font-medium' : 'text-gray-500'}>Véhicule</span>
          <span className={step >= 3 ? 'text-primary font-medium' : 'text-gray-500'}>Confirmation</span>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
        {/* ÉTAPE 1: Choix du trajet */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <RouteSelector onSelectRoute={handleRouteSelect} />

            {/* Trajet personnalisé */}
            {selectedRoute?.id === 'custom' && (
              <div className="space-y-4 animate-slide-up">
                <div className="border-t border-dark-700 pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Ou saisissez votre trajet</h3>

                  <AutocompleteInput
                    value={pickup}
                    onChange={setPickup}
                    placeholder="Ville de départ"
                    label="Lieu de prise en charge"
                  />
                </div>

                <AutocompleteInput
                  value={destination}
                  onChange={setDestination}
                  placeholder="Ville d'arrivée"
                  label="Destination"
                />

                {estimatedDistance && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                    <p className="text-primary text-sm font-semibold">
                      Distance estimée : {estimatedDistance} km
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 2: Choix du véhicule */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Choisissez votre Tesla</h2>
              <div className="bg-dark-800 rounded-lg p-3 text-sm">
                <p className="text-gray-300">
                  <span className="font-semibold text-primary">{pickup}</span>
                  <ArrowRight className="inline w-4 h-4 mx-2 text-primary" />
                  <span className="font-semibold text-primary">{destination}</span>
                </p>
                <p className="text-gray-500 text-xs mt-1">{estimatedDistance} km</p>
              </div>
            </div>

            <PriceComparator
              prices={priceEstimates}
              onSelectVehicle={setSelectedVehicle}
              selectedVehicle={selectedVehicle}
            />
          </div>
        )}

        {/* ÉTAPE 3: Confirmation */}
        {step === 3 && selectedVehicleData && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Confirmez votre réservation</h2>
              <p className="text-sm text-gray-400">
                Vérifiez les détails avant de valider
              </p>
            </div>

            {/* Résumé du trajet */}
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Trajet</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Départ</span>
                  <span className="text-white font-medium">{pickup}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Arrivée</span>
                  <span className="text-white font-medium">{destination}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Distance</span>
                  <span className="text-white font-medium">{estimatedDistance} km</span>
                </div>
              </div>
            </div>

            {/* Véhicule sélectionné */}
            <VehicleCard
              vehicle={selectedVehicleData}
              selected={true}
              onClick={() => {}}
              estimatedPrice={priceEstimates[selectedVehicle]}
            />

            {/* Badges de confiance */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-gray-400">Paiement sécurisé</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <CreditCard className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-gray-400">Annulation gratuite</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-gray-400">Confirmation immédiate</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer avec navigation */}
      <div className="bg-dark-800 border-t border-dark-700 px-6 py-4 flex-shrink-0">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg font-semibold transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          )}

          <button
            onClick={() => {
              if (step === 1 && canProceedToStep2()) setStep(2);
              else if (step === 2 && canProceedToStep3()) setStep(3);
              else if (step === 3) handleBooking();
            }}
            disabled={
              (step === 1 && !canProceedToStep2()) ||
              (step === 2 && !canProceedToStep3())
            }
            className={`flex-1 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2
              ${(step === 1 && canProceedToStep2()) || (step === 2 && canProceedToStep3()) || step === 3
                ? 'bg-primary hover:bg-primary-600 text-dark-900 shadow-luxury'
                : 'bg-dark-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {step === 1 && 'Choisir un véhicule'}
            {step === 2 && selectedVehicle && `Continuer (${priceEstimates[selectedVehicle]} CHF)`}
            {step === 2 && !selectedVehicle && 'Sélectionnez un véhicule'}
            {step === 3 && `Réserver pour ${priceEstimates[selectedVehicle]} CHF`}
            {step < 3 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">
          Confirmation instantanée • Chauffeur assigné en 5 minutes
        </p>
      </div>
    </div>
  );
}
