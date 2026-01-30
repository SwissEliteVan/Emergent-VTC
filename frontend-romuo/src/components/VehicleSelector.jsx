import { Users, Check } from 'lucide-react';
import { VEHICLE_TYPES } from '../utils/vehicles';

export default function VehicleSelector({
  selectedVehicle,
  onSelect,
  prices,
  onConfirm,
  distanceKm,
}) {
  return (
    <div className="bottom-sheet animate-slide-up">
      {/* Handle bar */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="px-4 pb-6 safe-bottom">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-black">
            Choisissez votre vehicule
          </h2>
          {distanceKm && (
            <p className="text-sm text-gray-500 mt-1">
              Distance estimee: {distanceKm.toFixed(1)} km
            </p>
          )}
        </div>

        {/* Vehicle Options */}
        <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
          {VEHICLE_TYPES.map((vehicle) => {
            const isSelected = selectedVehicle === vehicle.id;
            const price = prices[vehicle.id];
            const VehicleIcon = vehicle.icon;

            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => onSelect(vehicle.id)}
                className={`vehicle-card w-full text-left ${isSelected ? 'selected' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Vehicle Icon */}
                  <div className={`w-14 h-14 rounded-swiss flex items-center justify-center ${
                    isSelected ? 'bg-black' : 'bg-gray-100'
                  }`}>
                    <VehicleIcon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black">
                        {vehicle.name}
                      </span>
                      {vehicle.popular && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          Populaire
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {vehicle.model}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {vehicle.capacity}
                      </span>
                      <span>
                        {vehicle.waitTime}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-black">
                      {price ? `~${price}` : `~${vehicle.priceRange.min}-${vehicle.priceRange.max}`}
                    </p>
                    <p className="text-xs text-gray-400">CHF</p>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Pricing Details (shown when selected) */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Base: {vehicle.basePrice.toFixed(2)} CHF</span>
                      <span>{vehicle.pricePerKm.toFixed(2)} CHF/km</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedVehicle}
          className="btn-primary w-full mt-4"
        >
          Confirmer la reservation
        </button>
      </div>
    </div>
  );
}
