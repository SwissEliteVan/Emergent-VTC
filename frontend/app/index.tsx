import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useRideStore } from '../store/rideStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { responsive, isWeb, isDesktop } from '../utils/responsive';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

// Dynamic map import - Leaflet for web, React Native Maps for mobile
const MapComponent = Platform.OS === 'web' 
  ? require('../components/WebMapLeaflet').default 
  : require('../components/NativeMap').default;

interface Vehicle {
  id: string;
  name: string;
  description: string;
  base_fare: number;
  rate_per_km: number;
  capacity: number;
  icon: string;
}

export default function IndexScreen() {
  const { user, sessionToken, isGuest, login, logout } = useAuth();
  const router = useRouter();
  const rideStore = useRideStore();
  
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [destination, setDestination] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicleState] = useState<Vehicle | null>(null);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    fetchVehicles();
  }, []);

  // Auto-navigate based on role when logged in
  useEffect(() => {
    if (user?.role === 'driver') {
      router.replace('/driver-dispatch');
    }
  }, [user]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès à la localisation est requis');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/vehicles`);
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const calculatePrice = async (vehicle: Vehicle) => {
    if (!destination.trim()) {
      Alert.alert('Destination requise', 'Veuillez entrer une destination');
      return;
    }

    setLoading(true);
    try {
      // Mock distance calculation (in real app, use Google Directions API)
      const distanceKm = Math.random() * 20 + 5; // 5-25 km
      
      const response = await axios.post(`${BACKEND_URL}/api/rides/calculate`, {
        pickup: {
          latitude: currentLocation?.coords.latitude || 0,
          longitude: currentLocation?.coords.longitude || 0,
          address: 'Position actuelle'
        },
        destination: {
          latitude: (currentLocation?.coords.latitude || 0) + 0.1,
          longitude: (currentLocation?.coords.longitude || 0) + 0.1,
          address: destination
        },
        vehicle_type: vehicle.id,
        distance_km: distanceKm
      });
      
      setPrice(response.data.price);
      rideStore.setDistanceKm(distanceKm);
      rideStore.setPrice(response.data.price);
      rideStore.setSelectedVehicle(vehicle);
      rideStore.setDestination({
        latitude: (currentLocation?.coords.latitude || 0) + 0.1,
        longitude: (currentLocation?.coords.longitude || 0) + 0.1,
        address: destination
      });
    } catch (error) {
      console.error('Price calculation failed:', error);
      Alert.alert('Erreur', 'Impossible de calculer le prix');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicleState(vehicle);
    calculatePrice(vehicle);
  };

  const handleBooking = async () => {
    if (!selectedVehicle || !destination.trim()) {
      Alert.alert('Information manquante', 'Veuillez sélectionner un véhicule et une destination');
      return;
    }
    
    // Check if user is authenticated
    if (isGuest) {
      // Store trip details in ride store for post-login redirect
      if (currentLocation) {
        rideStore.setPickup({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: 'Position actuelle'
        });
      }
      
      rideStore.setDestination({
        latitude: (currentLocation?.coords.latitude || 0) + 0.1,
        longitude: (currentLocation?.coords.longitude || 0) + 0.1,
        address: destination
      });
      
      rideStore.setSelectedVehicle(selectedVehicle);
      rideStore.setDistanceKm(rideStore.distanceKm);
      rideStore.setPrice(price);
      
      // Set booking intent flag
      await AsyncStorage.setItem('pending_booking_intent', 'true');
      
      // Show login prompt
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter pour réserver une course',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Se connecter', 
            onPress: () => login()
          }
        ]
      );
      return;
    }
    
    // User is logged in, proceed with booking
    if (currentLocation) {
      rideStore.setPickup({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: 'Position actuelle'
      });
    }
    
    router.push('/confirmation');
  };

  // Handle post-login redirect to booking
  useEffect(() => {
    const checkPendingBooking = async () => {
      if (user && !isGuest) {
        const pendingIntent = await AsyncStorage.getItem('pending_booking_intent');
        if (pendingIntent === 'true' && selectedVehicle && price > 0) {
          await AsyncStorage.removeItem('pending_booking_intent');
          router.push('/confirmation');
        }
      }
    };
    
    checkPendingBooking();
  }, [user, isGuest, selectedVehicle, price]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        {isGuest ? (
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>Romuo.ch</Text>
            <Text style={styles.appTagline}>VTC Premium Suisse</Text>
          </View>
        ) : (
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
        )}
        <View style={styles.headerActions}>
          {isGuest ? (
            <TouchableOpacity 
              style={styles.loginHeaderButton}
              onPress={login}
            >
              <Ionicons name="person" size={20} color="#D4AF37" />
              <Text style={styles.loginHeaderText}>Connexion</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.switchButton}
                onPress={async () => {
                  try {
                    await axios.post(
                      `${BACKEND_URL}/api/user/toggle-role`,
                      {},
                      { headers: { Authorization: `Bearer ${sessionToken}` } }
                    );
                    router.replace('/driver-dispatch');
                  } catch (error) {
                    Alert.alert('Erreur', 'Impossible de changer de mode');
                  }
                }}
              >
                <Ionicons name="car-sport" size={20} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={logout}
              >
                <Ionicons name="log-out-outline" size={24} color="#D4AF37" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Map */}
      {Platform.OS === 'web' ? (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={80} color="#D4AF37" />
          <Text style={styles.mapPlaceholderText}>
            Carte disponible sur mobile
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Téléchargez l'app pour accéder à la carte interactive
          </Text>
        </View>
      ) : (
        NativeMap && <NativeMap currentLocation={currentLocation} />
      )}

      {/* Search and Vehicle Selector */}
      <View style={styles.bottomSheet}>
        {/* Destination Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Où allez-vous?"
            placeholderTextColor="#666666"
            value={destination}
            onChangeText={setDestination}
            onFocus={() => setShowVehicleSelector(true)}
          />
        </View>

        {/* Vehicle Selector */}
        {showVehicleSelector && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.vehicleScroll}
          >
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected
                ]}
                onPress={() => handleVehicleSelect(vehicle)}
              >
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
                <Text style={styles.vehiclePrice}>
                  {vehicle.base_fare} CHF + {vehicle.rate_per_km} CHF/km
                </Text>
                {selectedVehicle?.id === vehicle.id && price > 0 && (
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>{price.toFixed(2)} CHF</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Book Button */}
        {selectedVehicle && price > 0 && (
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={handleBooking}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text style={styles.bookButtonText}>
                Commander - {price.toFixed(2)} CHF
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#0A0A0A',
  },
  greeting: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 12,
    color: '#A0A0A0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  loginHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  loginHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  switchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 32,
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  vehicleScroll: {
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#3A3A3A',
  },
  vehicleIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vehicleDescription: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 8,
  },
  vehiclePrice: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '600',
  },
  priceTag: {
    marginTop: 8,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  bookButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
});