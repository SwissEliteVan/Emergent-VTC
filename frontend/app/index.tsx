import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type MarkerInfo = {
  id: 'departure' | 'arrival';
  label: string;
  lat: number;
  lon: number;
};

const LAUSANNE_CENTER: [number, number] = [46.5197, 6.6323];

const VEHICLES = [
  { id: 'eco', name: 'Éco', description: 'Confortable et économique', eta: '3 min' },
  { id: 'berline', name: 'Berline', description: 'Mercedes Classe E ou similaire', eta: '5 min' },
  { id: 'van', name: 'Van', description: 'Jusqu\'à 7 passagers + bagages', eta: '8 min' },
];

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function IndexScreen() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 900;
  const mapRef = useRef<L.Map | null>(null);

  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [activeField, setActiveField] = useState<'departure' | 'arrival'>('departure');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [departureMarker, setDepartureMarker] = useState<MarkerInfo | null>(null);
  const [arrivalMarker, setArrivalMarker] = useState<MarkerInfo | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        const data = (await response.json()) as NominatimResult[];
        setResults(data);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults([]);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const markers = useMemo(() => {
    return [departureMarker, arrivalMarker].filter(Boolean) as MarkerInfo[];
  }, [departureMarker, arrivalMarker]);

  const handleInputChange = (field: 'departure' | 'arrival', value: string) => {
    setActiveField(field);
    setQuery(value);
    if (field === 'departure') {
      setDeparture(value);
    } else {
      setArrival(value);
    }
  };

  const handleSelectResult = (result: NominatimResult) => {
    const lat = Number(result.lat);
    const lon = Number(result.lon);

    if (activeField === 'departure') {
      setDeparture(result.display_name);
      setDepartureMarker({ id: 'departure', label: 'Départ', lat, lon });
    } else {
      setArrival(result.display_name);
      setArrivalMarker({ id: 'arrival', label: 'Arrivée', lat, lon });
    }

    setQuery('');
    setResults([]);
    mapRef.current?.setView([lat, lon], 14);
  };

  return (
    <View style={[styles.container, isNarrow && styles.containerStacked]}>
      <View style={[styles.sidebar, isNarrow && styles.sidebarStacked]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>R</Text>
          </View>
          <Text style={styles.logoText}>ROMUO</Text>
        </View>

        <Text style={styles.sectionTitle}>Réserver une course</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Départ</Text>
          <TextInput
            style={styles.input}
            placeholder="Adresse de départ"
            placeholderTextColor="#94A3B8"
            value={departure}
            onFocus={() => setActiveField('departure')}
            onChangeText={(value) => handleInputChange('departure', value)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Arrivée</Text>
          <TextInput
            style={styles.input}
            placeholder="Adresse d'arrivée"
            placeholderTextColor="#94A3B8"
            value={arrival}
            onFocus={() => setActiveField('arrival')}
            onChangeText={(value) => handleInputChange('arrival', value)}
          />
        </View>

        {results.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Résultats</Text>
            <FlatList
              data={results}
              keyExtractor={(item) => item.place_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelectResult(item)}
                >
                  <Text style={styles.resultText}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Véhicules disponibles</Text>
        <View style={styles.vehicleList}>
          {VEHICLES.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
              </View>
              <Text style={styles.vehicleEta}>{vehicle.eta}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.orderButton}>
          <Text style={styles.orderButtonText}>Commander</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapWrapper}>
        <MapContainer
          center={LAUSANNE_CENTER}
          zoom={13}
          style={styles.map}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lon]}
              icon={markerIcon}
            >
              <Popup>{marker.label}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  containerStacked: {
    flexDirection: 'column',
  },
  sidebar: {
    width: 400,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  sidebarStacked: {
    width: '100%',
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  resultsCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 16,
    maxHeight: 220,
  },
  resultsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultText: {
    fontSize: 13,
    color: '#0F172A',
  },
  vehicleList: {
    gap: 12,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 12,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  vehicleDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  vehicleEta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  orderButton: {
    marginTop: 20,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  mapWrapper: {
    flex: 1,
    minHeight: 400,
  },
  map: {
    height: '100%',
    width: '100%',
  },
});
