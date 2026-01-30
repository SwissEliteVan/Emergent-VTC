import { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  User,
  Clock,
  RefreshCw,
  ChevronRight,
  Car,
  Phone,
} from 'lucide-react';
import { adminApi, formatPrice, formatDateTime, getStatusLabel, getStatusColor, getDriverStatusLabel } from '../utils/api';

export default function DispatchBoard() {
  const [dispatchData, setDispatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadDispatchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDispatchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDispatchData = async () => {
    try {
      const response = await adminApi.getDispatchData();
      setDispatchData(response.data);
    } catch (error) {
      console.error('Failed to load dispatch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async (rideId, driverId) => {
    setAssigning(true);
    try {
      await adminApi.assignDriver(rideId, driverId);
      await loadDispatchData();
      setSelectedRide(null);
    } catch (error) {
      console.error('Failed to assign driver:', error);
      alert('Erreur lors de l\'assignation du chauffeur');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!dispatchData) {
    return (
      <div className="text-center py-12 text-gray-500">
        Impossible de charger les données
      </div>
    );
  }

  const availableDrivers = dispatchData.drivers.filter(d => d.status === 'available');

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-sm text-navy-900">Dispatch</h1>
          <p className="text-sm text-gray-500 mt-1">
            {dispatchData.pending_rides.length} courses en attente
          </p>
        </div>
        <button
          onClick={loadDispatchData}
          className="btn-secondary btn-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Rides */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-navy-900">Courses en attente</h2>

          {dispatchData.pending_rides.length === 0 ? (
            <div className="admin-card text-center py-8 text-gray-500">
              Aucune course en attente
            </div>
          ) : (
            <div className="space-y-3">
              {dispatchData.pending_rides.map((ride) => (
                <div
                  key={ride.ride_id}
                  className={`admin-card cursor-pointer transition-all ${
                    selectedRide?.ride_id === ride.ride_id
                      ? 'ring-2 ring-gold-400'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRide(ride)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Locations */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-success-500 mt-1 flex-shrink-0" />
                          <p className="text-sm text-navy-900 truncate">
                            {ride.pickup.address}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Navigation className="w-4 h-4 text-danger-500 mt-1 flex-shrink-0" />
                          <p className="text-sm text-navy-900 truncate">
                            {ride.destination.address}
                          </p>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(ride.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {ride.vehicle_type}
                        </span>
                        <span>{ride.distance_km?.toFixed(1)} km</span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-bold text-navy-900">{formatPrice(ride.price)}</p>
                      <span className="badge badge-warning mt-2">En attente</span>
                    </div>
                  </div>

                  {/* Assign Section - Show when selected */}
                  {selectedRide?.ride_id === ride.ride_id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Assigner un chauffeur:
                      </p>
                      {availableDrivers.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          Aucun chauffeur disponible
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {availableDrivers.map((driver) => (
                            <button
                              key={driver.driver_id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignDriver(ride.ride_id, driver.driver_id);
                              }}
                              disabled={assigning}
                              className="flex items-center gap-3 p-3 rounded-swiss border border-gray-200 hover:border-gold-400 hover:bg-gold-50 transition-all text-left"
                            >
                              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-navy-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-navy-900 truncate">
                                  {driver.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {driver.rating?.toFixed(1)} ★ • {driver.total_trips} courses
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Active Rides */}
          {dispatchData.active_rides.length > 0 && (
            <>
              <h2 className="font-semibold text-navy-900 mt-8">Courses en cours</h2>
              <div className="space-y-3">
                {dispatchData.active_rides.map((ride) => (
                  <div key={ride.ride_id} className="admin-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-success-500 mt-1 flex-shrink-0" />
                            <p className="text-sm text-navy-900 truncate">
                              {ride.pickup.address}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Navigation className="w-4 h-4 text-danger-500 mt-1 flex-shrink-0" />
                            <p className="text-sm text-navy-900 truncate">
                              {ride.destination.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>{ride.vehicle_type}</span>
                          <span>{ride.distance_km?.toFixed(1)} km</span>
                          {ride.driver_id && (
                            <span className="text-navy-600 font-medium">
                              Chauffeur assigné
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-navy-900">{formatPrice(ride.price)}</p>
                        <span className={`badge badge-${getStatusColor(ride.status)} mt-2`}>
                          {getStatusLabel(ride.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Drivers Panel */}
        <div className="space-y-4">
          <h2 className="font-semibold text-navy-900">Chauffeurs</h2>

          {dispatchData.drivers.length === 0 ? (
            <div className="admin-card text-center py-8 text-gray-500">
              Aucun chauffeur enregistré
            </div>
          ) : (
            <div className="space-y-3">
              {dispatchData.drivers.map((driver) => (
                <div key={driver.driver_id} className="admin-card">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center">
                        {driver.photo ? (
                          <img
                            src={driver.photo}
                            alt={driver.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-navy-600" />
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        driver.status === 'available'
                          ? 'bg-success-500'
                          : driver.status === 'busy'
                          ? 'bg-danger-500'
                          : 'bg-gray-400'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy-900 truncate">
                        {driver.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {driver.rating?.toFixed(1)} ★ • {driver.total_trips} courses
                      </p>
                    </div>

                    <span className={`badge ${
                      driver.status === 'available'
                        ? 'badge-success'
                        : driver.status === 'busy'
                        ? 'badge-danger'
                        : 'badge-navy'
                    }`}>
                      {getDriverStatusLabel(driver.status)}
                    </span>
                  </div>

                  {driver.phone && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={`tel:${driver.phone}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900"
                      >
                        <Phone className="w-4 h-4" />
                        {driver.phone}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
