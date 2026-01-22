import { useState, useEffect } from 'react';
import { MapPin, Navigation, Users as UsersIcon, Calendar, Clock, LogIn, Calculator } from 'lucide-react';
import VehicleCard from './VehicleCard';
import { VEHICLE_TYPES, calculatePrice, estimateDistance } from '../utils/vehicles';

export default function Sidebar() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [priceEstimates, setPriceEstimates] = useState({});

  // Calculer les prix estimés quand pickup/destination changent
  useEffect(() => {
    if (pickup && destination) {
      const distance = estimateDistance(pickup, destination);
      setEstimatedDistance(distance);

      // Calculer le prix pour chaque véhicule
      const estimates = {};
      VEHICLE_TYPES.forEach(vehicle => {
        const priceData = calculatePrice(distance, vehicle.id);
        if (priceData) {
          estimates[vehicle.id] = priceData.total;
        }
      });
      setPriceEstimates(estimates);
    } else {
      setEstimatedDistance(null);
      setPriceEstimates({});
    }
  }, [pickup, destination]);

  const handleBooking = () => {
    if (!pickup || !destination || !selectedVehicle) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const bookingData = {
      pickup,
      destination,
      passengers,
      vehicleType: selectedVehicle,
      date,
      time,
      estimatedPrice: priceEstimates[selectedVehicle],
      estimatedDistance
    };

    console.log('Réservation:', bookingData);
    alert(`Réservation confirmée !\nTrajet: ${pickup} → ${destination}\nPrix estimé: ${priceEstimates[selectedVehicle]} CHF`);
  };

  return (
    <div className="h-full bg-dark-900 flex flex-col">
      {/* Header avec logo */}
      <div className="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-dark-900 font-bold text-xl shadow-lg">
            R
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Romuo</h1>
            <p className="text-xs text-gray-400">Transport Premium</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm font-medium">
          <LogIn className="w-4 h-4" />
          <span className="hidden lg:inline">Connexion</span>
        </button>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
        {/* Section réservation */}
        <div className="space-y-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Réservez votre course</h2>
            <p className="text-sm text-gray-400">
              Service disponible 24/7 • Vevey, Montreux et région
            </p>
          </div>

          {/* Lieu de prise en charge */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lieu de prise en charge
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Entrez une adresse"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="input-dark pl-12"
              />
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination
            </label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Entrez une destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="input-dark pl-12"
              />
            </div>
          </div>

          {/* Estimation de distance */}
          {estimatedDistance && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 animate-fade-in">
              <div className="flex items-center gap-2 text-primary">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-semibold">Distance estimée : {estimatedDistance} km</span>
              </div>
            </div>
          )}

          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-dark pl-10 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Heure
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-dark pl-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Nombre de passagers */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de passagers
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
        </div>

        {/* Liste des véhicules */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            Choisissez votre véhicule
            {Object.keys(priceEstimates).length > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                Prix estimés calculés
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

        {/* Informations supplémentaires */}
        <div className="mt-6 p-4 bg-dark-800 rounded-lg border border-dark-700">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-primary">Service Premium :</span> Tous nos véhicules sont
            récents, entretenus et conduits par des chauffeurs professionnels certifiés.
            Paiement sécurisé • Annulation gratuite jusqu'à 2h avant.
          </p>
        </div>
      </div>

      {/* Footer avec bouton de réservation */}
      <div className="bg-dark-800 border-t border-dark-700 px-6 py-4 flex-shrink-0">
        <button
          onClick={handleBooking}
          disabled={!pickup || !destination || !selectedVehicle}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300
            ${pickup && destination && selectedVehicle
              ? 'bg-primary hover:bg-primary-600 text-dark-900 shadow-luxury hover:shadow-xl'
              : 'bg-dark-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {selectedVehicle && pickup && destination
            ? `Réserver pour ${priceEstimates[selectedVehicle]} CHF`
            : 'Complétez votre réservation'}
        </button>
        <p className="text-center text-xs text-gray-500 mt-3">
          Confirmation instantanée • Chauffeur assigné en moins de 5 minutes
        </p>
      </div>
    </div>
  );
}
