import { Check, ArrowRight } from 'lucide-react';
import { VEHICLE_TYPES } from '../utils/vehicles';

export default function PriceComparator({ prices, onSelectVehicle, selectedVehicle }) {
  if (!prices || Object.keys(prices).length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
        <h3 className="text-primary font-bold mb-2">Comparateur de prix</h3>
        <p className="text-sm text-gray-300">
          Tous nos tarifs incluent le chauffeur professionnel et les services de base
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {VEHICLE_TYPES.map((vehicle) => {
          const price = prices[vehicle.id];
          const isSelected = selectedVehicle === vehicle.id;

          return (
            <div
              key={vehicle.id}
              onClick={() => onSelectVehicle(vehicle.id)}
              className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300
                ${isSelected
                  ? 'bg-primary/20 border-2 border-primary shadow-luxury'
                  : 'bg-dark-800 border border-dark-700 hover:border-primary/50'
                }
              `}
            >
              {/* Badge */}
              {vehicle.badge && (
                <div className="absolute top-3 right-3 bg-primary text-dark-900 text-xs font-bold px-2 py-1 rounded-full">
                  {vehicle.badge}
                </div>
              )}

              {/* Checkmark si sélectionné */}
              {isSelected && (
                <div className="absolute top-3 left-3 bg-primary rounded-full p-1">
                  <Check className="w-4 h-4 text-dark-900" strokeWidth={3} />
                </div>
              )}

              <div className="flex items-center gap-4 mt-2">
                {/* Mini image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-lg mb-1">{vehicle.name}</h4>
                  <p className="text-sm text-gray-400 mb-2 line-clamp-1">{vehicle.vehicleModel}</p>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {vehicle.capacity} passagers • {vehicle.luggage} bagages
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary">{price}</span>
                      <span className="text-sm text-gray-400">CHF</span>
                    </div>
                  </div>
                </div>

                {/* Flèche */}
                <div className={`flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
