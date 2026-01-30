import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { X, MapPin, Navigation, Clock, Car, User, CreditCard } from 'lucide-react';
import { adminApi, formatPrice, formatDateTime, getStatusLabel, getStatusColor } from '../utils/api';

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    loadInitialEvents();
  }, []);

  const loadInitialEvents = async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    await loadEvents(start.toISOString(), end.toISOString());
  };

  const loadEvents = async (start, end) => {
    setLoading(true);
    try {
      const response = await adminApi.getCalendarRides(start, end);
      const formattedEvents = response.data.events.map((event) => ({
        ...event,
        className: `fc-event-${event.status}`,
        backgroundColor: getEventColor(event.status),
        borderColor: getEventColor(event.status),
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      assigned: '#486581',
      driver_en_route: '#486581',
      arrived: '#D4AF37',
      in_progress: '#0F172A',
      completed: '#22c55e',
      cancelled: '#ef4444',
    };
    return colors[status] || '#737373';
  };

  const handleDateChange = (arg) => {
    loadEvents(arg.startStr, arg.endStr);
  };

  const handleEventClick = (arg) => {
    setSelectedEvent(arg.event.extendedProps);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-sm text-navy-900">Planning</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue calendrier de toutes les courses
          </p>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning-500" />
            <span className="text-xs text-gray-600">En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-navy-600" />
            <span className="text-xs text-gray-600">Assigné</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success-500" />
            <span className="text-xs text-gray-600">Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-500" />
            <span className="text-xs text-gray-600">Annulé</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="admin-card">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="spinner" />
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="fr"
          firstDay={1}
          slotMinTime="05:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDateChange}
          height="auto"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
        />
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-navy-900">
                  Détails de la course
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedEvent.ride_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`badge badge-${getStatusColor(selectedEvent.status)}`}>
                  {getStatusLabel(selectedEvent.status)}
                </span>
                <span className="text-xl font-bold text-navy-900">
                  {formatPrice(selectedEvent.price)}
                </span>
              </div>

              {/* Locations */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-success-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Départ</p>
                    <p className="text-sm text-navy-900 mt-1">
                      {selectedEvent.pickup?.address || '--'}
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
                      {selectedEvent.destination?.address || '--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-swiss">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Date</span>
                  </div>
                  <p className="text-sm font-medium text-navy-900">
                    {formatDateTime(selectedEvent.created_at)}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-swiss">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Car className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Véhicule</span>
                  </div>
                  <p className="text-sm font-medium text-navy-900 capitalize">
                    {selectedEvent.vehicle_type}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-swiss">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Navigation className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Distance</span>
                  </div>
                  <p className="text-sm font-medium text-navy-900">
                    {selectedEvent.distance_km?.toFixed(1)} km
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-swiss">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Paiement</span>
                  </div>
                  <p className="text-sm font-medium text-navy-900 capitalize">
                    {selectedEvent.payment_method || 'cash'}
                  </p>
                </div>
              </div>

              {/* Driver Info */}
              {selectedEvent.driver_id && (
                <div className="p-4 bg-navy-50 rounded-swiss">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-navy-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Chauffeur assigné</p>
                      <p className="text-sm font-medium text-navy-900">
                        {selectedEvent.driver_id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="p-4 bg-gray-50 rounded-swiss">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                  <p className="text-sm text-navy-900">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setSelectedEvent(null)}
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
