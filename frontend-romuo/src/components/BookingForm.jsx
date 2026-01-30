import { useMemo, useState } from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import usePriceCalculator from '../utils/usePriceCalculator';

const WAIT_TIMES = {
  eco: '4 min',
  van: '6 min',
  bus: '9 min',
};

export default function BookingForm({
  pickup,
  destination,
  pickupLocation,
  destinationLocation,
  onPickupChange,
  onDestinationChange,
  onPickupSelect,
  onDestinationSelect,
}) {
  const [selectedVehicle, setSelectedVehicle] = useState('eco');
  const { vehicles, distanceKm, durationMinutes, estimates } = usePriceCalculator({
    pickup: pickupLocation,
    destination: destinationLocation,
  });

  const tripMeta = useMemo(() => {
    if (!distanceKm) return null;
    return {
      distance: `${distanceKm.toFixed(1)} km`,
      duration: `${durationMinutes} min`,
    };
  }, [distanceKm, durationMinutes]);

  return (
    <div className="rounded-3xl border border-night/10 bg-white shadow-card p-6">
      <h2 className="text-2xl font-semibold text-night">Estimation instantanée</h2>
      <p className="text-sm text-ink/70 mt-1">
        Sélectionnez votre itinéraire et choisissez votre gamme de véhicule.
      </p>

      <div className="mt-6 space-y-4">
        <AutocompleteInput
          value={pickup}
          onChange={onPickupChange}
          onSelect={onPickupSelect}
          placeholder="Adresse de départ"
          label="Départ"
          icon={MapPin}
        />
        <AutocompleteInput
          value={destination}
          onChange={onDestinationChange}
          onSelect={onDestinationSelect}
          placeholder="Adresse d'arrivée"
          label="Arrivée"
          icon={Navigation}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-night/5 px-4 py-3 flex items-center justify-between text-sm text-night">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Temps estimé</span>
        </div>
        <div className="font-semibold">
          {tripMeta ? `${tripMeta.distance} • ${tripMeta.duration}` : 'Indiquez un trajet'}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicle === vehicle.id;
          const estimate = estimates[vehicle.id];
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => setSelectedVehicle(vehicle.id)}
              className={`text-left rounded-2xl border p-4 transition-all shadow-soft hover:shadow-lg ${
                isSelected
                  ? 'border-night bg-night/5'
                  : 'border-night/10 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-20 h-16 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink/50">{vehicle.tier}</p>
                      <p className="text-lg font-semibold text-night">{vehicle.name}</p>
                      <p className="text-xs text-ink/60">{vehicle.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink/50">Prix estimé</p>
                      <p className="text-xl font-semibold text-night">
                        {estimate ? `~${estimate} CHF` : '--'}
                      </p>
                      <p className="text-xs text-ink/60">Attente {WAIT_TIMES[vehicle.id]}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink/60">
                    <span>Base {vehicle.base.toFixed(2)} CHF</span>
                    <span>{vehicle.rate.toFixed(2)} CHF / km + min</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={`mt-6 w-full rounded-2xl px-6 py-4 text-base font-semibold shadow-lg transition ${
          distanceKm
            ? 'bg-night text-white hover:bg-night/90'
            : 'bg-night/20 text-night/50 cursor-not-allowed'
        }`}
        disabled={!distanceKm}
      >
        Estimer ma course gratuitement
      </button>
    </div>
  );
}
