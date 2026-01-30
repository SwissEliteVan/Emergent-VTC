import { useState, useEffect } from 'react';
import { MapPin, Navigation, Users as UsersIcon, LogIn, ArrowRight } from 'lucide-react';
import VehicleCard from './VehicleCard';
import AutocompleteInput from './AutocompleteInput';
import { VEHICLE_TYPES, estimateDistance, getAllPricesForRoute } from '../utils/vehicles';

export default function Sidebar() {
  const [pickup, setPickup] = useState('Vevey');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [priceEstimates, setPriceEstimates] = useState({});

  // Calculer les prix par défaut et en temps réel
  useEffect(() => {
    if (pickup && destination) {
      const distance = estimateDistance(pickup, destination);
      setEstimatedDistance(distance);
      const prices = getAllPricesForRoute(distance);
      setPriceEstimates(prices);
    } else {
      // Afficher des prix de référence pour un trajet moyen (25km depuis Vevey vers Lausanne)
      setEstimatedDistance(null);
      const defaultPrices = getAllPricesForRoute(25);
      setPriceEstimates(defaultPrices);
    }
  }, [pickup, destination]);

  const handleBooking = () => {
    if (!pickup || !destination || !selectedVehicle) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const vehicle = VEHICLE_TYPES.find(v => v.id === selectedVehicle);
    alert(`Réservation confirmée !\n\nTrajet: ${pickup} → ${destination}\nVéhicule: ${vehicle.name}\nPrix: ${priceEstimates[selectedVehicle]} CHF`);
  };

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
            <p className="text-xs text-gray-400">Transport Tesla Premium</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm font-medium">
          <LogIn className="w-4 h-4" />
          <span className="hidden lg:inline">Connexion</span>
        </button>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
        {/* Formulaire de réservation */}
        <div className="space-y-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Où allez-vous ?</h2>
            <p className="text-sm text-gray-400">
              Entrez votre destination pour voir les prix
            </p>
          </div>

          {/* Départ */}
          <AutocompleteInput
            value={pickup}
            onChange={setPickup}
            placeholder="Adresse de départ"
            label="Départ"
            icon={MapPin}
          />

          {/* Destination */}
          <AutocompleteInput
            value={destination}
            onChange={setDestination}
            placeholder="Adresse d'arrivée"
            label="Destination"
            icon={Navigation}
          />

          {/* Passagers */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Passagers
            </label>
            <div className="relative">
              <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="input-dark pl-12"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'passager' : 'passagers'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Badge distance */}
          {estimatedDistance && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between animate-fade-in">
              <div>
                <p className="text-primary font-semibold text-sm">Distance estimée</p>
                <p className="text-gray-400 text-xs">Trajet: {pickup} → {destination}</p>
              </div>
              <p className="text-primary font-bold text-xl">{estimatedDistance} km</p>
            </div>
          )}
        </div>

        {/* Liste des véhicules avec prix */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            Choisissez votre Tesla
            {pickup && destination ? (
              <span className="text-sm font-normal text-primary ml-2">
                Prix calculés pour votre trajet
              </span>
            ) : (
              <span className="text-sm font-normal text-gray-400 ml-2">
                Prix de référence (~25km)
              </span>
            )}
          </h3>

          <div className="space-y-4">
            {VEHICLE_TYPES.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={selectedVehicle === vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                estimatedPrice={priceEstimates[vehicle.id]}
              />
            ))}
          </div>
        </div>

        {/* Suggestions de trajets */}
        {!destination && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Trajets populaires</h3>
            <div className="space-y-2">
              {[
                { from: 'Vevey', to: 'Montreux', price: 33 },
                { from: 'Vevey', to: 'Lausanne', price: 96 },
                { from: 'Vevey', to: 'Genève Aéroport', price: 345 },
              ].map((route, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPickup(route.from);
                    setDestination(route.to);
                  }}
                  className="w-full bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-primary/50 rounded-lg p-3 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white">{route.from}</span>
                      <ArrowRight className="w-4 h-4 text-primary" />
                      <span className="text-white">{route.to}</span>
                    </div>
                    <span className="text-primary font-semibold text-sm">dès {route.price} CHF</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-dark-800 rounded-lg border border-dark-700">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-primary">100% Électrique :</span> Tous nos véhicules Tesla sont écologiques, silencieux et conduits par des chauffeurs professionnels certifiés.
          </p>
        </div>
      </div>

      {/* Footer bouton réservation */}
      <div className="bg-dark-800 border-t border-dark-700 px-6 py-4 flex-shrink-0">
        <button
          onClick={handleBooking}
          disabled={!pickup || !destination || !selectedVehicle}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300
            ${pickup && destination && selectedVehicle
              ? 'bg-primary hover:bg-primary-600 text-dark-900 shadow-luxury'
              : 'bg-dark-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {selectedVehicle && priceEstimates[selectedVehicle]
            ? `Réserver maintenant - ${priceEstimates[selectedVehicle]} CHF`
            : 'Complétez votre réservation'}
        </button>
        <p className="text-center text-xs text-gray-500 mt-3">
          Paiement à bord • Annulation gratuite • Confirmation immédiate
        </p>
      </div>
    </div>
  );
}
