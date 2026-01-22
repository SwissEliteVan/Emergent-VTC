import { Check, Users, Briefcase } from 'lucide-react';
import { useState } from 'react';

export default function VehicleCard({ vehicle, selected, onClick, estimatedPrice }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer
        ${selected
          ? 'ring-2 ring-primary shadow-luxury'
          : 'border border-dark-700 hover:border-primary/50 hover:shadow-lg'
        }
      `}
    >
      {/* Badge Populaire */}
      {vehicle.popular && (
        <div className="absolute top-3 right-3 z-10 bg-primary text-dark-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
          POPULAIRE
        </div>
      )}

      {/* Checkmark pour sélection */}
      {selected && (
        <div className="absolute top-3 left-3 z-10 bg-primary rounded-full p-1.5 shadow-lg">
          <Check className="w-4 h-4 text-dark-900" strokeWidth={3} />
        </div>
      )}

      {/* Image du véhicule */}
      <div className="relative h-48 bg-gradient-to-br from-dark-800 to-dark-900 overflow-hidden">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500
            ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
            ${selected ? 'brightness-110' : 'brightness-95'}
          `}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />

        {/* Nom du véhicule sur l'image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white text-xl font-bold">{vehicle.name}</h3>
          <p className="text-gray-300 text-sm">{vehicle.vehicleModel}</p>
        </div>
      </div>

      {/* Contenu de la carte */}
      <div className="p-4 bg-dark-800">
        {/* Description */}
        <p className="text-gray-400 text-sm mb-4">{vehicle.description}</p>

        {/* Capacités */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span>{vehicle.capacity} passagers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-primary" />
            <span>{vehicle.luggage} bagages</span>
          </div>
        </div>

        {/* Grille tarifaire */}
        <div className="bg-dark-700/50 rounded-lg p-3 border border-dark-600 mb-3">
          {estimatedPrice ? (
            /* Prix estimé calculé */
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-gray-400">Prix estimé</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">{estimatedPrice}</span>
                  <span className="text-sm text-gray-400">CHF</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Prise en charge {vehicle.basePrice} CHF</span>
                <span>+ {vehicle.pricePerKm} CHF/km</span>
              </div>
            </div>
          ) : (
            /* Tarification standard */
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prise en charge</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-primary">{vehicle.basePrice}</span>
                  <span className="text-xs text-gray-400">CHF</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Par kilomètre</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-primary">{vehicle.pricePerKm}</span>
                  <span className="text-xs text-gray-400">CHF</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Services inclus - visible seulement si sélectionné */}
        {selected && (
          <div className="animate-slide-up">
            <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Services inclus</p>
            <div className="space-y-1.5">
              {vehicle.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="leading-tight">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
