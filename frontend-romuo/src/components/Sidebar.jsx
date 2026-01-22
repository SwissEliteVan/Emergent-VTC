import { useState } from 'react';
import { MapPin, Navigation, Users as UsersIcon, Calendar, Clock, LogIn } from 'lucide-react';
import VehicleCard from './VehicleCard';
import { VEHICLE_TYPES } from '../utils/vehicles';

export default function Sidebar() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleBooking = () => {
    if (!pickup || !destination || !selectedVehicle) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Ici vous pouvez intégrer l'API backend
    const bookingData = {
      pickup,
      destination,
      passengers,
      vehicleType: selectedVehicle,
      date,
      time
    };

    console.log('Réservation:', bookingData);
    alert('Réservation en cours... (Intégration API à venir)');
  };

  return (
    <div className="h-full bg-dark-900 flex flex-col">
      {/* Header avec logo */}
      <div className="bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-dark-900 font-bold text-xl">
            R
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Romuo.ch</h1>
            <p className="text-xs text-gray-400">VTC Premium</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors text-sm">
          <LogIn className="w-4 h-4" />
          <span className="hidden lg:inline">Connexion</span>
        </button>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
        {/* Formulaire de réservation */}
        <div className="space-y-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Réservez votre course</h2>
            <p className="text-sm text-gray-400 mb-4">
              Service disponible 24/7 dans la région de Vevey et Montreux
            </p>
          </div>

          {/* Lieu de prise en charge */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lieu de prise en charge *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Ex: Vevey, Place du Marché"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="input-dark pl-12"
              />
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination *
            </label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Ex: Montreux, Château de Chillon"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="input-dark pl-12"
              />
            </div>
          </div>

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
          <h3 className="text-lg font-bold text-white mb-4">Choisissez votre véhicule *</h3>
          <div className="space-y-4">
            {VEHICLE_TYPES.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={selectedVehicle === vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
              />
            ))}
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-6 p-4 bg-dark-800 rounded-lg border border-dark-700">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-primary">📍 Zone de service :</span> Vevey, Montreux, Lavaux, et communes environnantes.
            Déplacements vers Lausanne, Genève et aéroports sur demande.
          </p>
        </div>
      </div>

      {/* Footer avec bouton de réservation */}
      <div className="bg-dark-800 border-t border-dark-700 px-6 py-4 flex-shrink-0">
        <button
          onClick={handleBooking}
          className="btn-primary w-full text-lg"
          disabled={!pickup || !destination || !selectedVehicle}
        >
          {selectedVehicle && pickup && destination
            ? 'Réserver maintenant'
            : 'Complétez le formulaire'}
        </button>
        <p className="text-center text-xs text-gray-500 mt-3">
          Paiement sécurisé • Annulation gratuite jusqu'à 2h avant
        </p>
      </div>
    </div>
  );
}
