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
import { responsive, useResponsive, isWeb, safeAreaPadding, BREAKPOINTS } from '../utils/responsive';

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
  min_passengers?: number;
  max_passengers?: number;
}

export default function IndexScreen() {
  const { user, sessionToken, isGuest, login, logout } = useAuth();
  const router = useRouter();
  const rideStore = useRideStore();
  const { isDesktop, isTablet, width } = useResponsive();
  
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [destination, setDestination] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicleState] = useState<Vehicle | null>(null);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(true);
  const [numPassengers, setNumPassengers] = useState(1);

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
        if (Platform.OS !== 'web') {
          Alert.alert('Permission refusée', 'L\'accès à la localisation est requis');
        }
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
      if (Platform.OS === 'web') {
        alert('Veuillez entrer une destination');
      } else {
        Alert.alert('Destination requise', 'Veuillez entrer une destination');
      }
      return;
    }

    setLoading(true);
    try {
      // Mock distance calculation (in real app, use Google Directions API)
      const distanceKm = Math.random() * 20 + 5; // 5-25 km
      
      const response = await axios.post(`${BACKEND_URL}/api/rides/calculate`, {
        pickup: {
          latitude: currentLocation?.coords.latitude || 46.5197,
          longitude: currentLocation?.coords.longitude || 6.6323,
          address: 'Position actuelle'
        },
        destination: {
          latitude: (currentLocation?.coords.latitude || 46.5197) + 0.1,
          longitude: (currentLocation?.coords.longitude || 6.6323) + 0.1,
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
        latitude: (currentLocation?.coords.latitude || 46.5197) + 0.1,
        longitude: (currentLocation?.coords.longitude || 6.6323) + 0.1,
        address: destination
      });
    } catch (error) {
      console.error('Price calculation failed:', error);
      if (Platform.OS === 'web') {
        alert('Impossible de calculer le prix');
      } else {
        Alert.alert('Erreur', 'Impossible de calculer le prix');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicleState(vehicle);
    if (destination.trim()) {
      calculatePrice(vehicle);
    }
  };

  const handleBooking = async () => {
    if (!selectedVehicle || !destination.trim()) {
      const msg = 'Veuillez sélectionner un véhicule et une destination';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Information manquante', msg);
      }
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
        latitude: (currentLocation?.coords.latitude || 46.5197) + 0.1,
        longitude: (currentLocation?.coords.longitude || 6.6323) + 0.1,
        address: destination
      });
      
      rideStore.setSelectedVehicle(selectedVehicle);
      rideStore.setDistanceKm(rideStore.distanceKm);
      rideStore.setPrice(price);
      
      // Set booking intent flag
      await AsyncStorage.setItem('pending_booking_intent', 'true');
      
      // Show login prompt
      if (Platform.OS === 'web') {
        if (confirm('Connexion requise pour réserver. Se connecter maintenant?')) {
          login();
        }
      } else {
        Alert.alert(
          'Connexion requise',
          'Veuillez vous connecter pour réserver une course',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se connecter', onPress: () => login() }
          ]
        );
      }
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

  // Get filtered vehicles based on passenger count
  const filteredVehicles = vehicles.filter(v => {
    const min = v.min_passengers || 1;
    const max = v.max_passengers || v.capacity;
    return numPassengers >= min && numPassengers <= max;
  });

  // Render the booking panel content
  const renderBookingPanel = () => (
    <View style={[styles.bookingPanel, isDesktop && styles.bookingPanelDesktop]}>
      {/* Logo for desktop sidebar */}
      {isDesktop && (
        <View style={styles.sidebarHeader}>
          <View style={styles.logoRow}>
            <Ionicons name="car-sport" size={32} color="#D4AF37" />
            <View style={styles.logoText}>
              <Text style={styles.logoTitle}>Romuo.ch</Text>
              <Text style={styles.logoSubtitle}>VTC Premium Suisse</Text>
            </View>
          </View>
          
          {/* User info or login button */}
          {isGuest ? (
            <TouchableOpacity style={styles.desktopLoginButton} onPress={login}>
              <Ionicons name="person" size={18} color="#D4AF37" />
              <Text style={styles.desktopLoginText}>Connexion</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.userInfoDesktop}>
              <Text style={styles.userNameDesktop}>{user?.name}</Text>
              <View style={styles.userActions}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={async () => {
                    try {
                      await axios.post(
                        `${BACKEND_URL}/api/user/toggle-role`,
                        {},
                        { headers: { Authorization: `Bearer ${sessionToken}` } }
                      );
                      router.replace('/driver-dispatch');
                    } catch (error) {
                      console.error('Switch mode error:', error);
                    }
                  }}
                >
                  <Ionicons name="car-sport" size={18} color="#D4AF37" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={logout}>
                  <Ionicons name="log-out-outline" size={18} color="#D4AF37" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Section Title */}
        <Text style={styles.sectionTitle}>Réserver une course</Text>
        
        {/* Destination Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Destination</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Où allez-vous?"
              placeholderTextColor="#666666"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        {/* Passenger Count */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nombre de passagers</Text>
          <View style={styles.passengerSelector}>
            <TouchableOpacity 
              style={styles.passengerButton}
              onPress={() => setNumPassengers(Math.max(1, numPassengers - 1))}
            >
              <Ionicons name="remove" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.passengerCount}>
              <Ionicons name="people" size={20} color="#D4AF37" />
              <Text style={styles.passengerCountText}>{numPassengers}</Text>
            </View>
            <TouchableOpacity 
              style={styles.passengerButton}
              onPress={() => setNumPassengers(Math.min(15, numPassengers + 1))}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Choisir un véhicule</Text>
          <View style={[styles.vehicleGrid, isDesktop && styles.vehicleGridDesktop]}>
            {(filteredVehicles.length > 0 ? filteredVehicles : vehicles).map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  isDesktop && styles.vehicleCardDesktop,
                  selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected
                ]}
                onPress={() => handleVehicleSelect(vehicle)}
              >
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleCapacity}>
                  {vehicle.min_passengers || 1}-{vehicle.max_passengers || vehicle.capacity} pers.
                </Text>
                <Text style={styles.vehiclePrice}>
                  dès {vehicle.base_fare} CHF
                </Text>
                {selectedVehicle?.id === vehicle.id && price > 0 && (
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>{price.toFixed(2)} CHF</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {filteredVehicles.length === 0 && numPassengers > 4 && (
            <View style={styles.vehicleHint}>
              <Ionicons name="information-circle" size={20} color="#D4AF37" />
              <Text style={styles.vehicleHintText}>
                Pour {numPassengers} passagers, le Bus est recommandé
              </Text>
            </View>
          )}
        </View>

        {/* Price Summary */}
        {selectedVehicle && price > 0 && (
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Estimation</Text>
              <Text style={styles.priceValue}>{price.toFixed(2)} CHF</Text>
            </View>
            <Text style={styles.priceNote}>
              * Prix estimé basé sur la distance
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      {selectedVehicle && (
        <View style={styles.bookButtonContainer}>
          <TouchableOpacity 
            style={[styles.bookButton, !destination.trim() && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={loading || !destination.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text style={styles.bookButtonText}>
                {price > 0 ? `Commander - ${price.toFixed(2)} CHF` : 'Calculer le prix'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Mobile header (only shown on mobile)
  const renderMobileHeader = () => (
    <View style={styles.mobileHeader}>
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
          <TouchableOpacity style={styles.loginHeaderButton} onPress={login}>
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
                  console.error('Switch mode error:', error);
                }
              }}
            >
              <Ionicons name="car-sport" size={20} color="#D4AF37" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={24} color="#D4AF37" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Desktop Layout: Map + Sidebar */}
      {isDesktop ? (
        <View style={styles.desktopLayout}>
          {/* Map takes most space */}
          <View style={styles.mapContainerDesktop}>
            <MapComponent currentLocation={currentLocation} />
          </View>
          
          {/* Sidebar with booking panel */}
          {renderBookingPanel()}
        </View>
      ) : (
        /* Mobile/Tablet Layout */
        <>
          {renderMobileHeader()}
          
          {/* Map */}
          <View style={styles.mapContainer}>
            <MapComponent currentLocation={currentLocation} />
          </View>

          {/* Bottom Sheet */}
          {renderBookingPanel()}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  
  // Desktop Layout
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mapContainerDesktop: {
    flex: 1,
    height: '100%',
  },
  
  // Mobile Header
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsive.padding,
    paddingTop: safeAreaPadding.top,
    paddingBottom: 16,
    backgroundColor: '#0A0A0A',
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: responsive.fontSize.large,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: responsive.fontSize.small,
    color: '#A0A0A0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  greeting: {
    fontSize: responsive.fontSize.small,
    color: '#A0A0A0',
  },
  userName: {
    fontSize: responsive.fontSize.medium + 2,
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
    fontSize: responsive.fontSize.normal,
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
  
  // Map
  mapContainer: {
    flex: 1,
  },
  
  // Booking Panel (Bottom sheet on mobile, sidebar on desktop)
  bookingPanel: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: safeAreaPadding.bottom,
    maxHeight: '60%',
  },
  bookingPanelDesktop: {
    width: 420,
    maxHeight: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#2C2C2C',
    paddingTop: 0,
    paddingBottom: 24,
  },
  
  // Desktop Sidebar Header
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    marginLeft: 12,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#A0A0A0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  desktopLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  desktopLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  userInfoDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userNameDesktop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  
  // Section Title
  sectionTitle: {
    fontSize: responsive.fontSize.large,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    marginTop: 8,
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A0A0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Search Input
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    paddingHorizontal: 16,
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
  
  // Passenger Selector
  passengerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 8,
  },
  passengerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  passengerCountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Vehicle Grid
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleGridDesktop: {
    flexDirection: 'column',
  },
  vehicleCard: {
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardDesktop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  vehicleCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#3A3A3A',
  },
  vehicleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vehicleCapacity: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  vehiclePrice: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
  vehicleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  vehicleHintText: {
    fontSize: 13,
    color: '#D4AF37',
    flex: 1,
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
  
  // Price Summary
  priceSummary: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
  },
  priceNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  
  // Book Button
  bookButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  bookButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#4A4A4A',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
});
