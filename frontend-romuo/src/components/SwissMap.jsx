import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
if (!L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Custom black marker icon
const createCustomIcon = (color = '#000000') => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const pickupIcon = createCustomIcon('#000000');
const destinationIcon = createCustomIcon('#404040');

// Default center - Lausanne, Switzerland
const DEFAULT_CENTER = [46.5197, 6.6323];

// Component to fit route bounds
function FitRoute({ pickup, destination }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && destination) {
      const bounds = L.latLngBounds([pickup, destination]);
      map.fitBounds(bounds, { padding: [80, 80] });
    } else if (pickup) {
      map.setView(pickup, 14);
    } else if (destination) {
      map.setView(destination, 14);
    } else {
      map.setView(DEFAULT_CENTER, 11);
    }
  }, [pickup, destination, map]);

  return null;
}

// Component to animate driver marker
function AnimatedDriverMarker({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);

  if (!position) return null;

  const driverIcon = L.divIcon({
    className: 'driver-marker-icon',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: #000;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.3.5-.1 1.1.4 1.4l.5.3"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return <Marker position={position} icon={driverIcon} />;
}

export default function SwissMap({
  pickup,
  destination,
  driverPosition,
  showRoute = true,
  interactive = true,
  className = '',
}) {
  // Calculate route positions
  const routePositions = useMemo(() => {
    if (!showRoute || !pickup || !destination) return null;
    return [pickup, destination];
  }, [showRoute, pickup, destination]);

  return (
    <div className={`map-container ${className}`}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={11}
        scrollWheelZoom={interactive}
        zoomControl={interactive}
        dragging={interactive}
        className="h-full w-full"
      >
        {/* Clean, minimal map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <FitRoute pickup={pickup} destination={destination} />

        {/* Pickup Marker */}
        {pickup && <Marker position={pickup} icon={pickupIcon} />}

        {/* Destination Marker */}
        {destination && <Marker position={destination} icon={destinationIcon} />}

        {/* Route Polyline */}
        {routePositions && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#000000',
              weight: 4,
              opacity: 0.8,
              dashArray: '8, 8',
            }}
          />
        )}

        {/* Driver Marker (for tracking view) */}
        {driverPosition && (
          <AnimatedDriverMarker position={driverPosition} />
        )}
      </MapContainer>
    </div>
  );
}
