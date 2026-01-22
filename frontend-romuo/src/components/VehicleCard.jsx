import { Check } from 'lucide-react';

export default function VehicleCard({ vehicle, selected, onClick, estimatedPrice }) {
  const IconComponent = vehicle.icon;

  return (
    <div
      onClick={onClick}
      className={`vehicle-card ${selected ? 'selected' : ''} group`}
    >
      {/* Badge "Populaire" */}
      {vehicle.popular && (
        <div className="absolute -top-2 -right-2 bg-primary text-dark-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          ⭐ Populaire
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icône du véhicule */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-dark-700 rounded-lg flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
            {vehicle.image}
          </div>
        </div>

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              {vehicle.name}
              {selected && <Check className="w-5 h-5 text-primary" />}
            </h3>
            <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />
          </div>

          <p className="text-gray-400 text-sm mb-2 line-clamp-2">
            {vehicle.description}
          </p>

          {/* Capacité */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              👤 {vehicle.capacity} passagers
            </span>
          </div>

          {/* Prix */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700">
            <div>
              <p className="text-gray-400 text-xs">À partir de</p>
              <p className="text-primary font-bold text-xl">
                {estimatedPrice || vehicle.basePrice} CHF
              </p>
            </div>
            {!estimatedPrice && (
              <p className="text-xs text-gray-500">
                + {vehicle.pricePerKm} CHF/km
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Caractéristiques (visible au survol) */}
      {selected && (
        <div className="mt-4 pt-4 border-t border-dark-700 animate-slide-up">
          <p className="text-xs text-gray-400 font-semibold mb-2">Inclus dans le service :</p>
          <ul className="space-y-1">
            {vehicle.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                <Check className="w-3 h-3 text-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
