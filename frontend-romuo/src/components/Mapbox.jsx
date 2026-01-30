import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

if (!L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

const DEFAULT_CENTER = [46.5197, 6.6323];

function FitRoute({ pickup, destination }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && destination) {
      const bounds = L.latLngBounds([pickup, destination]);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (pickup) {
      map.setView(pickup, 13);
    } else if (destination) {
      map.setView(destination, 13);
    } else {
      map.setView(DEFAULT_CENTER, 11);
    }
  }, [pickup, destination, map]);

  return null;
}

export default function Mapbox({ pickup, destination }) {
  const positions = pickup && destination ? [pickup, destination] : null;

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-night/10 shadow-card">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={11}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRoute pickup={pickup} destination={destination} />
        {pickup && <Marker position={pickup} />}
        {destination && <Marker position={destination} />}
        {positions && (
          <Polyline positions={positions} pathOptions={{ color: '#0F172A', weight: 5 }} />
        )}
      </MapContainer>
    </div>
  );
}
