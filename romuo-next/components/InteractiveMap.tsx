'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMemo, useState } from 'react';
import { useFunnelTracking } from '../hooks/useFunnelTracking';

const cities = [
  { name: 'Genève', lat: 46.2044, lng: 6.1432, estimate: '45-60 CHF' },
  { name: 'Lausanne', lat: 46.5197, lng: 6.6323, estimate: '180-210 CHF' },
  { name: 'Neuchâtel', lat: 46.9929, lng: 6.9319, estimate: '150-170 CHF' },
];

const airports = [
  { name: 'Aéroport GVA', lat: 46.2381, lng: 6.1090, fixed: '45 CHF fixe' },
  { name: 'Aéroport ZRH', lat: 47.4502, lng: 8.5610, fixed: '320 CHF fixe' },
];

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapEvents({ onSelect }: { onSelect: (value: string) => void }) {
  useMapEvents({
    contextmenu(event) {
      onSelect(`Point ${event.latlng.lat.toFixed(2)}, ${event.latlng.lng.toFixed(2)}`);
    },
  });
  return null;
}

export function InteractiveMap({ onDestinationSelect }: { onDestinationSelect: (value: string) => void }) {
  const { track } = useFunnelTracking();
  const [focusedCity, setFocusedCity] = useState('Genève');

  const center = useMemo(() => [46.2044, 6.1432] as [number, number], []);

  return (
    <section className="section" id="zones">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Nous couvrons toute la Suisse romande et au-delà</h2>
            <p className="text-gray-600 mt-2">Cliquez sur votre ville pour une estimation instantanée</p>
          </div>
          <button
            type="button"
            className="button-outline"
            onClick={() => {
              setFocusedCity('Votre position');
              track('map', { action: 'center' });
            }}
          >
            📌 Centrez sur ma position
          </button>
        </div>

        <div className="mt-8 grid lg:grid-cols-[2fr_1fr] gap-6">
          <div className="card overflow-hidden">
            <MapContainer center={center} zoom={8} style={{ height: '420px', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Circle center={center} radius={80000} pathOptions={{ color: '#D52B1E', fillColor: '#D52B1E', fillOpacity: 0.15 }} />
              {cities.map((city) => (
                <Marker
                  key={city.name}
                  position={[city.lat, city.lng]}
                  icon={markerIcon}
                  eventHandlers={{
                    click: () => {
                      onDestinationSelect(city.name);
                      setFocusedCity(city.name);
                      track('map', { city: city.name });
                    },
                  }}
                >
                  <Popup>
                    <strong>{city.name}</strong>
                    <div>{city.estimate}</div>
                    <button
                      type="button"
                      className="button-outline mt-2"
                      onClick={() => onDestinationSelect(city.name)}
                    >
                      Estimer mon prix
                    </button>
                  </Popup>
                </Marker>
              ))}
              {airports.map((airport) => (
                <Marker
                  key={airport.name}
                  position={[airport.lat, airport.lng]}
                  icon={markerIcon}
                  eventHandlers={{
                    click: () => {
                      onDestinationSelect(airport.name);
                      track('map', { airport: airport.name });
                    },
                  }}
                >
                  <Popup>
                    <strong>{airport.name}</strong>
                    <div>{airport.fixed}</div>
                  </Popup>
                </Marker>
              ))}
              <MapEvents onSelect={onDestinationSelect} />
            </MapContainer>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold">Légende intelligente</h3>
            <ul className="mt-4 text-sm text-gray-600 space-y-2">
              <li>🔴 Zone de service immédiat (0-1h)</li>
              <li>🟡 Zone avec supplément (1-2h)</li>
              <li>✈️ Aéroports: forfait disponible</li>
            </ul>
            <div className="mt-6 p-4 rounded-card bg-romuo-gray">
              <p className="text-sm text-gray-600">Ville sélectionnée</p>
              <p className="text-xl font-semibold mt-2">{focusedCity}</p>
              <p className="text-sm text-gray-500 mt-1">Pré-remplie dans le calculateur en 1 clic.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
