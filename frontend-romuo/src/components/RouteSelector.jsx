import { ArrowRight, Clock } from 'lucide-react';
import { POPULAR_ROUTES, getAllPricesForRoute } from '../utils/vehicles';

export default function RouteSelector({ onSelectRoute }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Trajets populaires</h2>
        <p className="text-sm text-gray-400">
          Choisissez un trajet ou créez le vôtre
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {POPULAR_ROUTES.map((route) => {
          const prices = route.distance > 0 ? getAllPricesForRoute(route.distance) : null;
          const minPrice = prices ? Math.min(...Object.values(prices)) : null;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route)}
              className="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-luxury"
            >
              {/* Image de fond */}
              <div className="relative h-32">
                <img
                  src={route.image}
                  alt={route.description}
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent" />

                {/* Contenu */}
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  {/* Prix en haut à droite */}
                  {minPrice && (
                    <div className="self-end">
                      <div className="bg-primary text-dark-900 px-3 py-1.5 rounded-full font-bold text-sm">
                        dès {minPrice} CHF
                      </div>
                    </div>
                  )}

                  {/* Infos en bas */}
                  <div>
                    {route.id !== 'custom' ? (
                      <>
                        <div className="flex items-center gap-2 text-white mb-1">
                          <span className="font-bold">{route.from}</span>
                          <ArrowRight className="w-4 h-4 text-primary" />
                          <span className="font-bold">{route.to}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-300">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {route.duration}
                          </span>
                          <span>{route.distance} km</span>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="font-bold text-white mb-1">Trajet personnalisé</p>
                        <p className="text-xs text-gray-300">Choisissez votre destination</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
