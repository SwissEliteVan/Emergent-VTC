import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DesktopLayout from '../components/DesktopLayout';

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
  {
    id: 'eco',
    name: 'Éco',
    description: 'Confortable et économique',
    capacity: '1-3 passagers',
    luggage: '2 bagages',
    eta: '3 min',
    price: '28 CHF',
  },
  {
    id: 'berline',
    name: 'Berline',
    description: 'Mercedes Classe E ou similaire',
    capacity: '1-4 passagers',
    luggage: '3 bagages',
    eta: '5 min',
    price: '48 CHF',
  },
  {
    id: 'van',
    name: 'Van',
    description: "Jusqu'à 7 passagers + bagages",
    capacity: '5-7 passagers',
    luggage: '6 bagages',
    eta: '8 min',
    price: '72 CHF',
  },
];

const FARE_BREAKDOWN = [
  { id: 'base', label: 'Forfait prise en charge', value: '8 CHF' },
  { id: 'distance', label: 'Distance estimée', value: '16 CHF' },
  { id: 'service', label: 'Service premium', value: '4 CHF' },
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
  const isDesktop = width >= 1024;
  const mapRef = useRef<L.Map | null>(null);

  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [activeField, setActiveField] = useState<'departure' | 'arrival'>('departure');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [departureMarker, setDepartureMarker] = useState<MarkerInfo | null>(null);
  const [arrivalMarker, setArrivalMarker] = useState<MarkerInfo | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>('berline');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError(null);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setSearchError("Impossible de charger les résultats.");
          setIsSearching(false);
          return;
        }
        const data = (await response.json()) as NominatimResult[];
        setResults(data);
        setIsSearching(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults([]);
          setSearchError("Une erreur est survenue pendant la recherche.");
          setIsSearching(false);
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

  const sidebarContent = (
    <ScrollView
      contentContainerStyle={styles.sidebarContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoRow}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>R</Text>
        </View>
        <Text style={styles.logoText}>ROMUO</Text>
      </View>

      <Text style={styles.sectionTitle}>Réserver une course</Text>

      <View style={styles.inputSection}>
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

        {query.trim().length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Suggestions</Text>
            {isSearching && <Text style={styles.resultsStateText}>Recherche en cours...</Text>}
            {!isSearching && searchError && (
              <Text style={styles.resultsStateText}>{searchError}</Text>
            )}
            {!isSearching && !searchError && results.length === 0 && (
              <Text style={styles.resultsStateText}>Aucun résultat pour cette recherche.</Text>
            )}
            {!isSearching && !searchError && results.length > 0 && (
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
            )}
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Véhicules disponibles</Text>
      <View style={styles.vehicleList}>
        {VEHICLES.map((vehicle) => {
          const isSelected = selectedVehicle === vehicle.id;
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
              onPress={() => setSelectedVehicle(vehicle.id)}
              activeOpacity={0.85}
            >
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleTitleRow}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehiclePrice}>{vehicle.price}</Text>
                </View>
                <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
                <Text style={styles.vehicleMeta}>
                  {vehicle.capacity} • {vehicle.luggage}
                </Text>
                <Text style={styles.vehicleEta}>Disponible en {vehicle.eta}</Text>
              </View>
              <View style={styles.vehicleAction}>
                <Text style={styles.vehicleActionLabel}>Réserver</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.fareCard}>
        <Text style={styles.sectionTitle}>Grille tarifaire</Text>
        {FARE_BREAKDOWN.map((fare) => (
          <View key={fare.id} style={styles.fareRow}>
            <Text style={styles.fareLabel}>{fare.label}</Text>
            <Text style={styles.fareValue}>{fare.value}</Text>
          </View>
        ))}
        <View style={styles.fareTotalRow}>
          <Text style={styles.fareTotalLabel}>Total estimé</Text>
          <Text style={styles.fareTotalValue}>28 CHF</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.orderButton}>
        <Text style={styles.orderButtonText}>Réserver</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const mapContent = (
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
        <Marker key={marker.id} position={[marker.lat, marker.lon]} icon={markerIcon}>
          <Popup>{marker.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );

  if (isDesktop) {
    return (
      <DesktopLayout
        sidebar={
          <View style={[styles.sidebar, styles.sidebarDesktop]}>
            {sidebarContent}
          </View>
        }
        map={<View style={styles.mapWrapper}>{mapContent}</View>}
      />
    );
  }

  return (
    <View style={[styles.container, styles.containerStacked]}>
      <View style={[styles.sidebar, styles.sidebarStacked]}>{sidebarContent}</View>
      <View style={styles.mapWrapper}>{mapContent}</View>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    position: 'relative',
    zIndex: 1000,
    pointerEvents: 'auto',
  },
  sidebarDesktop: {
    width: 460,
    minWidth: 420,
    maxWidth: 480,
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 10, height: 0 },
    elevation: 8,
  },
  sidebarStacked: {
    width: '100%',
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  sidebarContent: {
    paddingBottom: 24,
    overflow: 'visible',
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
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 16,
  },
  inputSection: {
    position: 'relative',
    zIndex: 1001,
    overflow: 'visible',
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
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 16,
    maxHeight: 220,
    zIndex: 9999,
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
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
  resultsStateText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  vehicleList: {
    gap: 12,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  vehicleCardSelected: {
    borderColor: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 12,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  vehicleMeta: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  vehicleEta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  vehicleAction: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#0F172A',
  },
  vehicleActionLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  fareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  fareValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  fareTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  fareTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  fareTotalValue: {
    fontSize: 14,
    fontWeight: '700',
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
    zIndex: 0,
    position: 'relative',
  },
  map: {
    height: '100%',
    width: '100%',
  },
});
