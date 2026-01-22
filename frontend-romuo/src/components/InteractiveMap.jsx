import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icône personnalisée dorée pour les points d'intérêt
const goldIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="#D4AF37" stroke="#8F7423" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="#1A1A1A" cx="12.5" cy="12.5" r="6"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Points d'intérêt dans la région
const POINTS_OF_INTEREST = [
  {
    id: 1,
    name: 'Vevey',
    position: [46.4607, 6.8427],
    description: 'Centre-ville de Vevey',
    type: 'city'
  },
  {
    id: 2,
    name: 'Montreux',
    position: [46.4312, 6.9107],
    description: 'Ville de Montreux et sa promenade',
    type: 'city'
  },
  {
    id: 3,
    name: 'Château de Chillon',
    position: [46.4144, 6.9275],
    description: 'Monument historique emblématique',
    type: 'landmark'
  },
  {
    id: 4,
    name: 'Lavaux - Vignobles UNESCO',
    position: [46.4850, 6.7500],
    description: 'Vignobles en terrasses classés UNESCO',
    type: 'landmark'
  },
  {
    id: 5,
    name: 'Rochers-de-Naye',
    position: [46.4331, 6.9761],
    description: 'Sommet panoramique à 2042m',
    type: 'landmark'
  }
];

// Composant pour recentrer la carte
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function InteractiveMap({ pickup, destination }) {
  const [center, setCenter] = useState([46.4607, 6.8427]); // Vevey par défaut
  const [zoom, setZoom] = useState(12);

  // Mettre à jour le centre de la carte selon les localisations
  useEffect(() => {
    if (pickup && destination) {
      // Calculer le centre entre les deux points (simplifié)
      setZoom(11);
    } else if (pickup) {
      // Centrer sur le point de départ
      setCenter([46.4607, 6.8427]);
      setZoom(13);
    }
  }, [pickup, destination]);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={true}
      >
        <ChangeView center={center} zoom={zoom} />

        {/* Couche de tuiles OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {/* Marqueurs pour les points d'intérêt */}
        {POINTS_OF_INTEREST.map((point) => (
          <Marker
            key={point.id}
            position={point.position}
            icon={point.type === 'landmark' ? goldIcon : undefined}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold text-primary mb-1">{point.name}</h3>
                <p className="text-sm text-gray-300">{point.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay avec informations */}
      <div className="absolute top-4 left-4 bg-dark-900/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-luxury z-10 max-w-xs">
        <h3 className="text-primary font-bold text-lg mb-1">Région desservie</h3>
        <p className="text-sm text-gray-300">
          Vevey, Montreux et la Riviera lémanique
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Service 24/7 • Réservation instantanée
        </p>
      </div>

      {/* Badge de qualité */}
      <div className="absolute bottom-4 left-4 bg-primary text-dark-900 px-4 py-2 rounded-full shadow-luxury z-10 font-semibold text-sm">
        Service Premium Suisse
      </div>
    </div>
  );
}
