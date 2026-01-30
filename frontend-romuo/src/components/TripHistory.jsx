import { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Download,
  ChevronRight,
  Car,
  X,
} from 'lucide-react';
import { rideApi, formatPrice, formatDateTime, getStatusLabel, getStatusColor } from '../utils/api';

export default function TripHistory({ onClose }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await rideApi.getUserHistory();
      setTrips(response.data.rides);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (rideId) => {
    setDownloadingInvoice(rideId);
    try {
      const response = await rideApi.getInvoice(rideId);
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture_${rideId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Erreur lors du téléchargement de la facture');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-navy-900">Mes courses</h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {trips.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune course effectuée</p>
          </div>
        ) : (
          trips.map((trip) => (
            <div
              key={trip.ride_id}
              className="trip-card"
              onClick={() => setSelectedTrip(trip)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Date & Status */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">
                      {formatDateTime(trip.created_at)}
                    </span>
                    <span className={`badge badge-${getStatusColor(trip.status)}`}>
                      {getStatusLabel(trip.status)}
                    </span>
                  </div>

                  {/* Locations */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-navy-900 truncate">
                        {trip.pickup.address}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-navy-900 truncate">
                        {trip.destination.address}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{trip.vehicle_type}</span>
                    <span>{trip.distance_km?.toFixed(1)} km</span>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="flex flex-col items-end gap-2 ml-4">
                  <p className="font-bold text-navy-900">{formatPrice(trip.price)}</p>
                  {trip.status === 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadInvoice(trip.ride_id);
                      }}
                      disabled={downloadingInvoice === trip.ride_id}
                      className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloadingInvoice === trip.ride_id ? '...' : 'Facture'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="modal-overlay" onClick={() => setSelectedTrip(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-navy-900">
                Détails de la course
              </h2>
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Price */}
              <div className="flex items-center justify-between">
                <span className={`badge badge-${getStatusColor(selectedTrip.status)}`}>
                  {getStatusLabel(selectedTrip.status)}
                </span>
                <span className="text-2xl font-bold text-navy-900">
                  {formatPrice(selectedTrip.price)}
                </span>
              </div>

              {/* Locations */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-success-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Départ</p>
                    <p className="text-sm text-navy-900 mt-1">
                      {selectedTrip.pickup.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-4 h-4 text-danger-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Arrivée</p>
                    <p className="text-sm text-navy-900 mt-1">
                      {selectedTrip.destination.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-swiss">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="text-sm font-medium text-navy-900 mt-1">
                    {formatDateTime(selectedTrip.created_at)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-swiss">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Véhicule</p>
                  <p className="text-sm font-medium text-navy-900 mt-1 capitalize">
                    {selectedTrip.vehicle_type}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-swiss">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                  <p className="text-sm font-medium text-navy-900 mt-1">
                    {selectedTrip.distance_km?.toFixed(1)} km
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-swiss">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Paiement</p>
                  <p className="text-sm font-medium text-navy-900 mt-1 capitalize">
                    {selectedTrip.payment_method || 'Espèces'}
                  </p>
                </div>
              </div>

              {/* Invoice Button */}
              {selectedTrip.status === 'completed' && (
                <button
                  onClick={() => downloadInvoice(selectedTrip.ride_id)}
                  disabled={downloadingInvoice === selectedTrip.ride_id}
                  className="btn-gold w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {downloadingInvoice === selectedTrip.ride_id
                    ? 'Téléchargement...'
                    : 'Télécharger la facture'}
                </button>
              )}
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setSelectedTrip(null)}
                className="btn-secondary w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
