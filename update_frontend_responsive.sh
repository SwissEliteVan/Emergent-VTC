#!/bin/bash
# ============================================
# ROMUO.CH - Script de mise à jour Frontend Responsive
# Usage: bash update_frontend_responsive.sh
# ============================================

set -e

echo "🚀 Mise à jour Frontend Romuo.ch - Version Responsive"
echo "======================================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Répertoire frontend
FRONTEND_DIR="/app/frontend"

# 1. Créer utils/responsive.ts
echo -e "${YELLOW}[1/5] Création de utils/responsive.ts...${NC}"
mkdir -p "$FRONTEND_DIR/utils"
cat > "$FRONTEND_DIR/utils/responsive.ts" << 'RESPONSIVE_EOF'
import { Dimensions, Platform, PixelRatio } from 'react-native';
import { useState, useEffect } from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

export const isWeb = Platform.OS === 'web';

export const getDeviceType = (width: number) => {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
};

export const createResponsiveValue = <T,>(mobile: T, tablet: T, desktop: T): T => {
  const width = Dimensions.get('window').width;
  if (width >= BREAKPOINTS.desktop) return desktop;
  if (width >= BREAKPOINTS.tablet) return tablet;
  return mobile;
};

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });
    return () => subscription?.remove();
  }, []);

  const deviceType = getDeviceType(dimensions.width);
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType,
  };
};

const currentWidth = Dimensions.get('window').width;
export const isMobile = currentWidth < BREAKPOINTS.tablet;
export const isTablet = currentWidth >= BREAKPOINTS.tablet && currentWidth < BREAKPOINTS.desktop;
export const isDesktop = currentWidth >= BREAKPOINTS.desktop;

export const responsive = {
  padding: createResponsiveValue(16, 24, 32),
  paddingHorizontal: createResponsiveValue(16, 32, 48),
  paddingVertical: createResponsiveValue(16, 24, 32),
  fontSize: {
    xs: createResponsiveValue(10, 11, 12),
    small: createResponsiveValue(12, 13, 14),
    normal: createResponsiveValue(14, 15, 16),
    medium: createResponsiveValue(16, 17, 18),
    large: createResponsiveValue(18, 20, 24),
    xlarge: createResponsiveValue(24, 28, 32),
    xxlarge: createResponsiveValue(32, 40, 48),
  },
  maxWidth: createResponsiveValue('100%', '100%', 1200),
  contentMaxWidth: createResponsiveValue('100%', 720, 960),
  sidebarWidth: createResponsiveValue(0, 0, 320),
  borderRadius: {
    small: createResponsiveValue(8, 10, 12),
    medium: createResponsiveValue(12, 14, 16),
    large: createResponsiveValue(16, 20, 24),
  },
  buttonHeight: createResponsiveValue(48, 52, 56),
  iconButtonSize: createResponsiveValue(44, 48, 52),
  headerHeight: createResponsiveValue(100, 80, 80),
  touchTarget: 44,
  cardWidth: createResponsiveValue('100%', '48%', '32%'),
  vehicleCardWidth: createResponsiveValue(160, 180, 200),
  columns: createResponsiveValue(1, 2, 3),
  gap: {
    small: createResponsiveValue(8, 10, 12),
    medium: createResponsiveValue(12, 16, 20),
    large: createResponsiveValue(16, 24, 32),
  },
};

export const getResponsiveStyle = <T extends object>(
  mobileStyle: T,
  tabletStyle?: Partial<T>,
  desktopStyle?: Partial<T>
): T => {
  const width = Dimensions.get('window').width;
  if (width >= BREAKPOINTS.desktop && desktopStyle) {
    return { ...mobileStyle, ...tabletStyle, ...desktopStyle };
  }
  if (width >= BREAKPOINTS.tablet && tabletStyle) {
    return { ...mobileStyle, ...tabletStyle };
  }
  return mobileStyle;
};

export const safeAreaPadding = {
  top: isWeb && isDesktop ? 20 : 60,
  bottom: isWeb && isDesktop ? 20 : 40,
};

export default responsive;
RESPONSIVE_EOF
echo -e "${GREEN}   ✓ utils/responsive.ts créé${NC}"

# 2. Créer components/WebMapLeaflet.tsx
echo -e "${YELLOW}[2/5] Création de components/WebMapLeaflet.tsx...${NC}"
mkdir -p "$FRONTEND_DIR/components"
cat > "$FRONTEND_DIR/components/WebMapLeaflet.tsx" << 'WEBMAP_EOF'
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebMapLeafletProps {
  currentLocation: { coords: { latitude: number; longitude: number } } | null;
}

export default function WebMapLeaflet({ currentLocation }: WebMapLeafletProps) {
  const lat = currentLocation?.coords.latitude?.toFixed(4) || '46.5197';
  const lng = currentLocation?.coords.longitude?.toFixed(4) || '6.6323';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          title="map"
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: 12 }}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng)-0.02},${Number(lat)-0.02},${Number(lng)+0.02},${Number(lat)+0.02}&layer=mapnik&marker=${lat},${lng}`}
        />
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={16} color="#FFFFFF" />
          <Text style={styles.locationText}>{lat}, {lng}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mapPlaceholder}>
      <Ionicons name="map" size={64} color="#D4AF37" />
      <Text style={styles.placeholderText}>Carte</Text>
      <Text style={styles.coordsText}>{lat}, {lng}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  locationBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  mapPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  coordsText: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 8,
  },
});
WEBMAP_EOF
echo -e "${GREEN}   ✓ components/WebMapLeaflet.tsx créé${NC}"

# 3. Mettre à jour app/index.tsx
echo -e "${YELLOW}[3/5] Mise à jour de app/index.tsx...${NC}"
cat > "$FRONTEND_DIR/app/index.tsx" << 'INDEX_EOF'
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useRideStore } from '../store/rideStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { responsive, useResponsive, isWeb, safeAreaPadding } from '../utils/responsive';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

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
  const { isDesktop } = useResponsive();
  
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [destination, setDestination] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicleState] = useState<Vehicle | null>(null);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [numPassengers, setNumPassengers] = useState(1);

  useEffect(() => {
    requestLocationPermission();
    fetchVehicles();
  }, []);

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
      if (Platform.OS === 'web') alert('Veuillez entrer une destination');
      else Alert.alert('Destination requise', 'Veuillez entrer une destination');
      return;
    }

    setLoading(true);
    try {
      const distanceKm = Math.random() * 20 + 5;
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
      if (Platform.OS === 'web') alert('Impossible de calculer le prix');
      else Alert.alert('Erreur', 'Impossible de calculer le prix');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicleState(vehicle);
    if (destination.trim()) calculatePrice(vehicle);
  };

  const handleBooking = async () => {
    if (!selectedVehicle || !destination.trim()) {
      const msg = 'Veuillez sélectionner un véhicule et une destination';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Information manquante', msg);
      return;
    }
    
    if (isGuest) {
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
      rideStore.setPrice(price);
      await AsyncStorage.setItem('pending_booking_intent', 'true');
      
      if (Platform.OS === 'web') {
        if (confirm('Connexion requise pour réserver. Se connecter maintenant?')) login();
      } else {
        Alert.alert('Connexion requise', 'Veuillez vous connecter pour réserver une course', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => login() }
        ]);
      }
      return;
    }
    
    if (currentLocation) {
      rideStore.setPickup({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: 'Position actuelle'
      });
    }
    router.push('/confirmation');
  };

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

  const filteredVehicles = vehicles.filter(v => {
    const min = v.min_passengers || 1;
    const max = v.max_passengers || v.capacity;
    return numPassengers >= min && numPassengers <= max;
  });

  const renderBookingPanel = () => (
    <View style={[styles.bookingPanel, isDesktop && styles.bookingPanelDesktop]}>
      {isDesktop && (
        <View style={styles.sidebarHeader}>
          <View style={styles.logoRow}>
            <Ionicons name="car-sport" size={32} color="#D4AF37" />
            <View style={styles.logoText}>
              <Text style={styles.logoTitle}>Romuo.ch</Text>
              <Text style={styles.logoSubtitle}>VTC Premium Suisse</Text>
            </View>
          </View>
          {isGuest ? (
            <TouchableOpacity style={styles.desktopLoginButton} onPress={login}>
              <Ionicons name="person" size={18} color="#D4AF37" />
              <Text style={styles.desktopLoginText}>Connexion</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.userInfoDesktop}>
              <Text style={styles.userNameDesktop}>{user?.name}</Text>
              <View style={styles.userActions}>
                <TouchableOpacity style={styles.iconButton} onPress={async () => {
                  try {
                    await axios.post(`${BACKEND_URL}/api/user/toggle-role`, {}, { headers: { Authorization: `Bearer ${sessionToken}` } });
                    router.replace('/driver-dispatch');
                  } catch (error) { console.error('Switch mode error:', error); }
                }}>
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

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <Text style={styles.sectionTitle}>Réserver une course</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Destination</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Où allez-vous?" placeholderTextColor="#666666" value={destination} onChangeText={setDestination} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nombre de passagers</Text>
          <View style={styles.passengerSelector}>
            <TouchableOpacity style={styles.passengerButton} onPress={() => setNumPassengers(Math.max(1, numPassengers - 1))}>
              <Ionicons name="remove" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.passengerCount}>
              <Ionicons name="people" size={20} color="#D4AF37" />
              <Text style={styles.passengerCountText}>{numPassengers}</Text>
            </View>
            <TouchableOpacity style={styles.passengerButton} onPress={() => setNumPassengers(Math.min(15, numPassengers + 1))}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Choisir un véhicule</Text>
          <View style={[styles.vehicleGrid, isDesktop && styles.vehicleGridDesktop]}>
            {(filteredVehicles.length > 0 ? filteredVehicles : vehicles).map((vehicle) => (
              <TouchableOpacity key={vehicle.id} style={[styles.vehicleCard, isDesktop && styles.vehicleCardDesktop, selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected]} onPress={() => handleVehicleSelect(vehicle)}>
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleCapacity}>{vehicle.min_passengers || 1}-{vehicle.max_passengers || vehicle.capacity} pers.</Text>
                <Text style={styles.vehiclePrice}>dès {vehicle.base_fare} CHF</Text>
                {selectedVehicle?.id === vehicle.id && price > 0 && (
                  <View style={styles.priceTag}><Text style={styles.priceText}>{price.toFixed(2)} CHF</Text></View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedVehicle && price > 0 && (
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Estimation</Text><Text style={styles.priceValue}>{price.toFixed(2)} CHF</Text></View>
            <Text style={styles.priceNote}>* Prix estimé basé sur la distance</Text>
          </View>
        )}
      </ScrollView>

      {selectedVehicle && (
        <View style={styles.bookButtonContainer}>
          <TouchableOpacity style={[styles.bookButton, !destination.trim() && styles.bookButtonDisabled]} onPress={handleBooking} disabled={loading || !destination.trim()}>
            {loading ? <ActivityIndicator color="#0A0A0A" /> : <Text style={styles.bookButtonText}>{price > 0 ? `Commander - ${price.toFixed(2)} CHF` : 'Calculer le prix'}</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderMobileHeader = () => (
    <View style={styles.mobileHeader}>
      {isGuest ? (
        <View style={styles.headerLeft}><Text style={styles.appName}>Romuo.ch</Text><Text style={styles.appTagline}>VTC Premium Suisse</Text></View>
      ) : (
        <View style={styles.headerLeft}><Text style={styles.greeting}>Bonjour,</Text><Text style={styles.userName}>{user?.name}</Text></View>
      )}
      <View style={styles.headerActions}>
        {isGuest ? (
          <TouchableOpacity style={styles.loginHeaderButton} onPress={login}><Ionicons name="person" size={20} color="#D4AF37" /><Text style={styles.loginHeaderText}>Connexion</Text></TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.switchButton} onPress={async () => {
              try { await axios.post(`${BACKEND_URL}/api/user/toggle-role`, {}, { headers: { Authorization: `Bearer ${sessionToken}` } }); router.replace('/driver-dispatch'); } catch (error) { console.error('Switch mode error:', error); }
            }}><Ionicons name="car-sport" size={20} color="#D4AF37" /></TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}><Ionicons name="log-out-outline" size={24} color="#D4AF37" /></TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {isDesktop ? (
        <View style={styles.desktopLayout}>
          <View style={styles.mapContainerDesktop}><MapComponent currentLocation={currentLocation} /></View>
          {renderBookingPanel()}
        </View>
      ) : (
        <>
          {renderMobileHeader()}
          <View style={styles.mapContainer}><MapComponent currentLocation={currentLocation} /></View>
          {renderBookingPanel()}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  desktopLayout: { flex: 1, flexDirection: 'row' },
  mapContainerDesktop: { flex: 1, height: '100%' },
  mobileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: responsive.padding, paddingTop: safeAreaPadding.top, paddingBottom: 16, backgroundColor: '#0A0A0A' },
  headerLeft: { flex: 1 },
  appName: { fontSize: responsive.fontSize.large, fontWeight: '700', color: '#D4AF37', letterSpacing: 1 },
  appTagline: { fontSize: responsive.fontSize.small, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: 1 },
  greeting: { fontSize: responsive.fontSize.small, color: '#A0A0A0' },
  userName: { fontSize: responsive.fontSize.medium + 2, fontWeight: '700', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', gap: 12 },
  loginHeaderButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, gap: 8 },
  loginHeaderText: { fontSize: responsive.fontSize.normal, fontWeight: '600', color: '#D4AF37' },
  switchButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center' },
  logoutButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center' },
  mapContainer: { flex: 1 },
  bookingPanel: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, paddingBottom: safeAreaPadding.bottom, maxHeight: '60%' },
  bookingPanelDesktop: { width: 420, maxHeight: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderLeftWidth: 1, borderLeftColor: '#2C2C2C', paddingTop: 0, paddingBottom: 24 },
  sidebarHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logoText: { marginLeft: 12 },
  logoTitle: { fontSize: 24, fontWeight: '700', color: '#D4AF37' },
  logoSubtitle: { fontSize: 12, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: 1 },
  desktopLoginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2C2C', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, gap: 8 },
  desktopLoginText: { fontSize: 14, fontWeight: '600', color: '#D4AF37' },
  userInfoDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userNameDesktop: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  userActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flex: 1 },
  scrollContentContainer: { paddingHorizontal: 24, paddingBottom: 16 },
  sectionTitle: { fontSize: responsive.fontSize.large, fontWeight: '700', color: '#FFFFFF', marginBottom: 24, marginTop: 8 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#A0A0A0', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2C', borderRadius: 12, paddingHorizontal: 16 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 16 },
  passengerSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2C2C', borderRadius: 12, padding: 8 },
  passengerButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3A3A3A', justifyContent: 'center', alignItems: 'center' },
  passengerCount: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 8 },
  passengerCountText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vehicleGridDesktop: { flexDirection: 'column' },
  vehicleCard: { backgroundColor: '#2C2C2C', borderRadius: 16, padding: 16, width: '48%', borderWidth: 2, borderColor: 'transparent' },
  vehicleCardDesktop: { width: '100%', flexDirection: 'row', alignItems: 'center', padding: 16 },
  vehicleCardSelected: { borderColor: '#D4AF37', backgroundColor: '#3A3A3A' },
  vehicleIcon: { fontSize: 32, marginBottom: 8 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  vehicleCapacity: { fontSize: 12, color: '#A0A0A0', marginBottom: 4 },
  vehiclePrice: { fontSize: 14, color: '#D4AF37', fontWeight: '600' },
  priceTag: { marginTop: 8, backgroundColor: '#D4AF37', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  priceText: { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  priceSummary: { backgroundColor: '#2C2C2C', borderRadius: 12, padding: 16, marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 16, color: '#A0A0A0' },
  priceValue: { fontSize: 24, fontWeight: '700', color: '#D4AF37' },
  priceNote: { fontSize: 12, color: '#666', marginTop: 8 },
  bookButtonContainer: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2C2C2C' },
  bookButton: { backgroundColor: '#D4AF37', borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  bookButtonDisabled: { backgroundColor: '#4A4A4A' },
  bookButtonText: { fontSize: 18, fontWeight: '700', color: '#0A0A0A' },
});
INDEX_EOF
echo -e "${GREEN}   ✓ app/index.tsx mis à jour${NC}"

# 4. Mettre à jour app/admin.tsx
echo -e "${YELLOW}[4/5] Mise à jour de app/admin.tsx...${NC}"
cat > "$FRONTEND_DIR/app/admin.tsx" << 'ADMIN_EOF'
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';
import { useResponsive, safeAreaPadding } from '../utils/responsive';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminDashboard() {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = async () => {
    if (!adminPassword.trim()) { if (Platform.OS === 'web') alert('Veuillez entrer le mot de passe admin'); else Alert.alert('Erreur', 'Veuillez entrer le mot de passe admin'); return; }
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/stats`, { params: { admin_password: adminPassword } });
      setStats(response.data);
      setAuthenticated(true);
      fetchData();
    } catch (error) { if (Platform.OS === 'web') alert('Mot de passe admin incorrect'); else Alert.alert('Erreur', 'Mot de passe admin incorrect'); }
    finally { setLoading(false); }
  };

  const fetchData = async () => {
    try {
      const [usersRes, ridesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/users`, { params: { admin_password: adminPassword } }),
        axios.get(`${BACKEND_URL}/api/admin/rides`, { params: { admin_password: adminPassword } })
      ]);
      setUsers(usersRes.data.users);
      setRides(ridesRes.data.rides);
    } catch (error) { console.error('Failed to fetch admin data:', error); }
  };

  const handleAssignDriver = async (rideId: string) => {
    const drivers = users.filter(u => u.role === 'driver');
    if (drivers.length === 0) { if (Platform.OS === 'web') alert('Aucun chauffeur disponible'); else Alert.alert('Erreur', 'Aucun chauffeur disponible'); return; }
    try {
      await axios.post(`${BACKEND_URL}/api/admin/rides/${rideId}/assign`, {}, { params: { admin_password: adminPassword, driver_id: drivers[0].user_id } });
      if (Platform.OS === 'web') alert('Chauffeur assigné avec succès'); else Alert.alert('Succès', 'Chauffeur assigné avec succès');
      fetchData();
    } catch (error) { if (Platform.OS === 'web') alert('Impossible d\'assigner le chauffeur'); else Alert.alert('Erreur', 'Impossible d\'assigner le chauffeur'); }
  };

  if (!authenticated) {
    return (
      <View style={styles.loginContainer}>
        <View style={[styles.loginCard, isDesktop && styles.loginCardDesktop]}>
          <View style={styles.loginHeader}><Ionicons name="shield-checkmark" size={64} color="#D4AF37" /><Text style={styles.loginTitle}>Admin Dashboard</Text><Text style={styles.loginSubtitle}>Romuo.ch</Text></View>
          <TextInput style={styles.passwordInput} placeholder="Mot de passe admin" placeholderTextColor="#666" secureTextEntry value={adminPassword} onChangeText={setAdminPassword} autoCapitalize="none" onSubmitEditing={handleLogin} />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>{loading ? <ActivityIndicator color="#0A0A0A" /> : <Text style={styles.loginButtonText}>Connexion</Text>}</TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.push('/')}><Ionicons name="arrow-back" size={20} color="#A0A0A0" /><Text style={styles.backLinkText}>Retour à l'accueil</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}><Text style={styles.headerTitle}>Admin Dashboard</Text><Text style={styles.headerSubtitle}>Romuo.ch</Text></View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={fetchData}><Ionicons name="refresh" size={20} color="#D4AF37" /></TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setAuthenticated(false)}><Ionicons name="log-out" size={20} color="#D4AF37" /></TouchableOpacity>
        </View>
      </View>

      <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
        <View style={[styles.tabs, isDesktop && styles.tabsDesktop]}>
          {['overview', 'users', 'rides'].map(tab => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive, isDesktop && styles.tabDesktop]} onPress={() => setActiveTab(tab)}>
              <Ionicons name={tab === 'overview' ? 'stats-chart' : tab === 'users' ? 'people' : 'car-sport'} size={20} color={activeTab === tab ? '#D4AF37' : '#A0A0A0'} />
              {(isDesktop || activeTab === tab) && <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'overview' ? 'Aperçu' : tab === 'users' ? 'Utilisateurs' : 'Courses'}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={[styles.content, isDesktop && styles.contentDesktop]} contentContainerStyle={styles.contentContainer}>
          {activeTab === 'overview' && stats && (
            <View>
              <Text style={styles.sectionTitle}>Statistiques</Text>
              <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
                {[{ icon: 'people', color: '#D4AF37', value: stats.users.total, label: 'Utilisateurs' }, { icon: 'car-sport', color: '#4CAF50', value: stats.users.drivers, label: 'Chauffeurs' }, { icon: 'checkmark-circle', color: '#2196F3', value: stats.rides.completed, label: 'Courses complétées' }, { icon: 'time', color: '#FF9800', value: stats.rides.pending, label: 'En attente' }].map((stat, i) => (
                  <View key={i} style={[styles.statCard, isDesktop && styles.statCardDesktop]}><Ionicons name={stat.icon as any} size={32} color={stat.color} /><Text style={styles.statValue}>{stat.value}</Text><Text style={styles.statLabel}>{stat.label}</Text></View>
                ))}
              </View>
              <View style={styles.revenueCard}><View style={styles.revenueHeader}><Ionicons name="cash" size={28} color="#D4AF37" /><Text style={styles.revenueTitle}>Revenu Total</Text></View><Text style={styles.revenueValue}>{stats.revenue.total.toFixed(2)} CHF</Text></View>
            </View>
          )}
          {activeTab === 'users' && (<View><Text style={styles.sectionTitle}>Utilisateurs ({users.length})</Text><View style={[styles.listGrid, isDesktop && styles.listGridDesktop]}>{users.map((user) => (<View key={user.user_id} style={[styles.listCard, isDesktop && styles.listCardDesktop]}><View style={styles.listCardHeader}><View style={styles.userAvatar}><Ionicons name="person" size={24} color="#D4AF37" /></View><View style={styles.userInfo}><Text style={styles.listCardTitle}>{user.name}</Text><Text style={styles.listCardSubtitle}>{user.email}</Text></View><View style={[styles.badge, user.role === 'driver' ? styles.badgeDriver : styles.badgePassenger]}><Text style={styles.badgeText}>{user.role === 'driver' ? 'Chauffeur' : 'Passager'}</Text></View></View></View>))}</View></View>)}
          {activeTab === 'rides' && (<View><Text style={styles.sectionTitle}>Courses ({rides.length})</Text><View style={[styles.listGrid, isDesktop && styles.listGridDesktop]}>{rides.map((ride) => (<View key={ride.ride_id} style={[styles.listCard, isDesktop && styles.listCardDesktop]}><View style={styles.listCardHeader}><View style={styles.rideIcon}><Text style={styles.rideIconText}>{ride.vehicle_type === 'eco' ? '🚗' : ride.vehicle_type === 'berline' ? '🚙' : '🚌'}</Text></View><View style={styles.rideInfo}><Text style={styles.listCardTitle}>Course #{ride.ride_id.slice(-8)}</Text><Text style={styles.rideType}>{ride.vehicle_type.toUpperCase()}</Text></View><View style={[styles.badge, ride.status === 'completed' ? styles.badgeSuccess : ride.status === 'pending' ? styles.badgeWarning : styles.badgePrimary]}><Text style={styles.badgeText}>{ride.status}</Text></View></View><View style={styles.rideDetails}><View style={styles.locationItem}><Ionicons name="location" size={16} color="#4CAF50" /><Text style={styles.locationText} numberOfLines={1}>{ride.pickup?.address || 'N/A'}</Text></View><View style={styles.locationItem}><Ionicons name="flag" size={16} color="#D4AF37" /><Text style={styles.locationText} numberOfLines={1}>{ride.destination?.address || 'N/A'}</Text></View></View><View style={styles.rideFooter}><Text style={styles.ridePrice}>{ride.price.toFixed(2)} CHF</Text><Text style={styles.rideDistance}>{ride.distance_km.toFixed(1)} km</Text></View>{ride.status === 'pending' && (<TouchableOpacity style={styles.assignButton} onPress={() => handleAssignDriver(ride.ride_id)}><Ionicons name="person-add" size={18} color="#FFFFFF" /><Text style={styles.assignButtonText}>Assigner Chauffeur</Text></TouchableOpacity>)}</View>))}</View></View>)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loginCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400 },
  loginCardDesktop: { padding: 48, maxWidth: 480 },
  loginHeader: { alignItems: 'center', marginBottom: 32 },
  loginTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 16 },
  loginSubtitle: { fontSize: 14, color: '#A0A0A0', marginTop: 8 },
  passwordInput: { backgroundColor: '#2C2C2C', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 16, marginBottom: 24 },
  loginButton: { backgroundColor: '#D4AF37', borderRadius: 12, padding: 16, alignItems: 'center' },
  loginButtonText: { fontSize: 18, fontWeight: '700', color: '#0A0A0A' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
  backLinkText: { fontSize: 14, color: '#A0A0A0' },
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: safeAreaPadding.top, paddingBottom: 16, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  headerDesktop: { paddingHorizontal: 32, paddingTop: 20 },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#D4AF37', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center' },
  mainLayout: { flex: 1 },
  mainLayoutDesktop: { flexDirection: 'row' },
  tabs: { flexDirection: 'row', backgroundColor: '#1A1A1A', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  tabsDesktop: { flexDirection: 'column', width: 220, paddingHorizontal: 0, paddingTop: 16, borderBottomWidth: 0, borderRightWidth: 1, borderRightColor: '#2C2C2C' },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 8 },
  tabDesktop: { justifyContent: 'flex-start', paddingVertical: 14, paddingHorizontal: 24, marginHorizontal: 12, borderRadius: 8 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#D4AF37' },
  tabText: { fontSize: 14, color: '#A0A0A0', fontWeight: '600' },
  tabTextActive: { color: '#D4AF37' },
  content: { flex: 1 },
  contentDesktop: { flex: 1 },
  contentContainer: { padding: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statsGridDesktop: { gap: 20 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 20, alignItems: 'center' },
  statCardDesktop: { minWidth: 200, flex: 0, padding: 24 },
  statValue: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginTop: 12 },
  statLabel: { fontSize: 14, color: '#A0A0A0', marginTop: 4 },
  revenueCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#D4AF37' },
  revenueHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  revenueTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  revenueValue: { fontSize: 36, fontWeight: '700', color: '#D4AF37' },
  listGrid: { gap: 16 },
  listGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  listCard: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 20 },
  listCardDesktop: { flex: 1, minWidth: 340, maxWidth: 400 },
  listCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  listCardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  listCardSubtitle: { fontSize: 13, color: '#A0A0A0', marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeDriver: { backgroundColor: '#4CAF50' },
  badgePassenger: { backgroundColor: '#2196F3' },
  badgeSuccess: { backgroundColor: '#4CAF50' },
  badgeWarning: { backgroundColor: '#FF9800' },
  badgePrimary: { backgroundColor: '#2196F3' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF', textTransform: 'capitalize' },
  rideIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#2C2C2C', justifyContent: 'center', alignItems: 'center' },
  rideIconText: { fontSize: 24 },
  rideInfo: { flex: 1 },
  rideType: { fontSize: 12, color: '#A0A0A0', marginTop: 2 },
  rideDetails: { marginTop: 16, gap: 8 },
  locationItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { fontSize: 14, color: '#FFFFFF', flex: 1 },
  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2C2C2C' },
  ridePrice: { fontSize: 20, fontWeight: '700', color: '#D4AF37' },
  rideDistance: { fontSize: 14, color: '#A0A0A0' },
  assignButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', borderRadius: 8, padding: 12, marginTop: 16, gap: 8 },
  assignButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
ADMIN_EOF
echo -e "${GREEN}   ✓ app/admin.tsx mis à jour${NC}"

# 5. Redémarrer le conteneur frontend
echo -e "${YELLOW}[5/5] Redémarrage du frontend...${NC}"

# Si Docker compose est disponible
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    docker compose up -d --build frontend
    echo -e "${GREEN}   ✓ Frontend redémarré via Docker${NC}"
# Sinon, utiliser supervisorctl (environnement dev)
elif command -v supervisorctl &> /dev/null; then
    sudo supervisorctl restart expo
    echo -e "${GREEN}   ✓ Frontend redémarré via Supervisor${NC}"
else
    echo -e "${YELLOW}   ⚠ Veuillez redémarrer manuellement le frontend${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✓ Mise à jour Frontend Responsive terminée!             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Fichiers créés/mis à jour:"
echo "  - utils/responsive.ts"
echo "  - components/WebMapLeaflet.tsx"
echo "  - app/index.tsx"
echo "  - app/admin.tsx"
echo ""
