import { Check, Users } from 'lucide-react';

export default function VehicleCard({ vehicle, selected, onClick, estimatedPrice }) {
  const IconComponent = vehicle.icon;

  return (
    <div
      onClick={onClick}
      className={`vehicle-card ${selected ? 'selected' : ''} group relative`}
    >
      {/* Badge "Populaire" */}
      {vehicle.popular && (
        <div className="absolute -top-2 -right-2 bg-primary text-dark-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          POPULAIRE
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icône du véhicule */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/30">
            <IconComponent className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              {vehicle.name}
              {selected && <Check className="w-5 h-5 text-primary" />}
            </h3>
          </div>

          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {vehicle.description}
          </p>

          {/* Capacité */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <span>Jusqu'à {vehicle.capacity} passagers</span>
          </div>

          {/* Grille tarifaire professionnelle */}
          <div className="bg-dark-700/50 rounded-lg p-3 border border-dark-600">
            <div className="grid grid-cols-2 gap-3">
              {/* Prix de base */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prise en charge</p>
                <p className="text-primary font-bold text-lg">{vehicle.basePrice} CHF</p>
              </div>

              {/* Prix par km */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Par kilomètre</p>
                <p className="text-primary font-bold text-lg">{vehicle.pricePerKm} CHF</p>
              </div>
            </div>

            {/* Prix estimé si calculé */}
            {estimatedPrice && (
              <div className="mt-3 pt-3 border-t border-dark-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Prix estimé</span>
                  <span className="text-primary font-bold text-xl">{estimatedPrice} CHF</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Caractéristiques détaillées (visible au survol et quand sélectionné) */}
      {selected && (
        <div className="mt-4 pt-4 border-t border-dark-700 animate-slide-up">
          <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wide">Services inclus</p>
          <ul className="space-y-2">
            {vehicle.features.map((feature, idx) => (
              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
