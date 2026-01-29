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
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRideStore } from '../store/rideStore';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design System Colors
const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  darkBlue: '#111827',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  success: '#10B981',
  blue: '#3B82F6',
};

// Vehicle data with SVG-style icons
const VEHICLES = [
  {
    id: 'eco',
    name: 'Éco',
    description: 'Économique et confortable',
    price: 14.50,
    waitTime: 4,
    icon: 'car-outline',
    capacity: '1-3',
  },
  {
    id: 'berline',
    name: 'Berline',
    description: 'Premium business class',
    price: 24.90,
    waitTime: 6,
    icon: 'car-sport-outline',
    capacity: '1-4',
  },
  {
    id: 'van',
    name: 'Van',
    description: 'Groupes et bagages',
    price: 39.00,
    waitTime: 8,
    icon: 'bus-outline',
    capacity: '5-7',
  },
];

// Simulated Driver Data
const DRIVER = {
  name: 'Jean-Pierre M.',
  rating: 4.9,
  trips: 1247,
  photo: null,
  car: 'Mercedes Classe E',
  plate: 'VD 458 291',
  arrivalTime: 4,
};

// App State Types
type AppState = 'map' | 'selection' | 'tracking';

export default function IndexScreen() {
  const { user, isGuest, login, logout } = useAuth();
  const router = useRouter();
  const rideStore = useRideStore();

  const [appState, setAppState] = useState<AppState>('map');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof VEHICLES[0] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [driverFound, setDriverFound] = useState(false);
  
  // Animation for bottom panel
  const panelAnim = useState(new Animated.Value(0))[0];

  // Animate panel when state changes
  useEffect(() => {
    if (appState === 'selection' || appState === 'tracking') {
      Animated.spring(panelAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(panelAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [appState]);

  // Handle destination search
  const handleSearch = () => {
    if (destination.trim()) {
      setAppState('selection');
    }
  };

  // Handle vehicle selection
  const handleSelectVehicle = (vehicle: typeof VEHICLES[0]) => {
    setSelectedVehicle(vehicle);
  };

  // Handle booking
  const handleBook = () => {
    if (!selectedVehicle) return;

    if (isGuest) {
      login();
      return;
    }

    setAppState('tracking');
    setIsSearching(true);

    // Simulate driver search
    setTimeout(() => {
      setIsSearching(false);
      setDriverFound(true);
    }, 3000);
  };

  // Handle cancel
  const handleCancel = () => {
    setAppState('map');
    setSelectedVehicle(null);
    setIsSearching(false);
    setDriverFound(false);
  };

  // Render simulated map
  const renderMap = () => (
    <View style={styles.mapContainer}>
      {/* Simulated vector map */}
      <View style={styles.mapBackground}>
        {/* Grid lines for streets */}
        {[...Array(20)].map((_, i) => (
          <View key={`h-${i}`} style={[styles.mapStreetH, { top: i * 50 }]} />
        ))}
        {[...Array(15)].map((_, i) => (
          <View key={`v-${i}`} style={[styles.mapStreetV, { left: i * 50 }]} />
        ))}
        
        {/* Parks */}
        <View style={[styles.mapPark, { top: 100, left: 50, width: 120, height: 80 }]} />
        <View style={[styles.mapPark, { top: 300, left: 200, width: 100, height: 100 }]} />
        
        {/* Main roads */}
        <View style={[styles.mapMainRoad, { top: 200, left: 0, width: SCREEN_WIDTH }]} />
        <View style={[styles.mapMainRoadV, { top: 0, left: SCREEN_WIDTH / 2 - 15, height: SCREEN_HEIGHT }]} />
        
        {/* User location marker */}
        <View style={styles.userMarker}>
          <View style={styles.userMarkerDot} />
          <View style={styles.userMarkerPulse} />
        </View>

        {/* Route line when tracking */}
        {appState === 'tracking' && (
          <View style={styles.routeLine} />
        )}

        {/* Destination marker */}
        {(appState === 'selection' || appState === 'tracking') && (
          <View style={styles.destinationMarker}>
            <Feather name="map-pin" size={28} color={COLORS.darkBlue} />
          </View>
        )}
      </View>
    </View>
  );

  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Feather name="search" size={20} color={COLORS.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Où allez-vous ?"
          placeholderTextColor={COLORS.gray400}
          value={destination}
          onChangeText={setDestination}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {destination.length > 0 && (
          <TouchableOpacity onPress={() => setDestination('')}>
            <Feather name="x" size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Quick destinations */}
      {appState === 'map' && (
        <View style={styles.quickDestinations}>
          <TouchableOpacity 
            style={styles.quickDestItem}
            onPress={() => {
              setDestination('Aéroport de Genève');
              setAppState('selection');
            }}
          >
            <View style={styles.quickDestIcon}>
              <Feather name="navigation" size={16} color={COLORS.gray600} />
            </View>
            <Text style={styles.quickDestText}>Aéroport de Genève</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickDestItem}
            onPress={() => {
              setDestination('Gare de Lausanne');
              setAppState('selection');
            }}
          >
            <View style={styles.quickDestIcon}>
              <Feather name="navigation" size={16} color={COLORS.gray600} />
            </View>
            <Text style={styles.quickDestText}>Gare de Lausanne</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render vehicle selection panel
  const renderSelectionPanel = () => (
    <Animated.View 
      style={[
        styles.bottomPanel,
        {
          transform: [{
            translateY: panelAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [400, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.panelHandle} />
      
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelTitle}>Choisir un véhicule</Text>
          <Text style={styles.panelSubtitle}>{destination}</Text>
        </View>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <Feather name="x" size={24} color={COLORS.gray600} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.vehicleList} showsVerticalScrollIndicator={false}>
        {VEHICLES.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleCard,
              selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected,
            ]}
            onPress={() => handleSelectVehicle(vehicle)}
            activeOpacity={0.7}
          >
            <View style={styles.vehicleIconContainer}>
              <Ionicons 
                name={vehicle.icon as any} 
                size={32} 
                color={selectedVehicle?.id === vehicle.id ? COLORS.darkBlue : COLORS.gray600} 
              />
            </View>
            
            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleNameRow}>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <View style={styles.capacityBadge}>
                  <Feather name="user" size={12} color={COLORS.gray500} />
                  <Text style={styles.capacityText}>{vehicle.capacity}</Text>
                </View>
              </View>
              <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
              <View style={styles.vehicleTimeRow}>
                <Feather name="clock" size={14} color={COLORS.gray400} />
                <Text style={styles.vehicleTime}>{vehicle.waitTime} min</Text>
              </View>
            </View>
            
            <View style={styles.vehiclePriceContainer}>
              <Text style={styles.vehiclePrice}>CHF {vehicle.price.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Payment Method */}
      <View style={styles.paymentSection}>
        <TouchableOpacity style={styles.paymentMethod}>
          <Feather name="credit-card" size={20} color={COLORS.gray600} />
          <Text style={styles.paymentText}>Apple Pay •••• 4242</Text>
          <Feather name="chevron-right" size={20} color={COLORS.gray400} />
        </TouchableOpacity>
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={[
          styles.bookButton,
          !selectedVehicle && styles.bookButtonDisabled,
        ]}
        onPress={handleBook}
        disabled={!selectedVehicle}
        activeOpacity={0.8}
      >
        <Text style={styles.bookButtonText}>
          {isGuest ? 'Se connecter pour commander' : 'Commander'}
        </Text>
        {selectedVehicle && (
          <Text style={styles.bookButtonPrice}>
            CHF {selectedVehicle.price.toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // Render tracking panel
  const renderTrackingPanel = () => (
    <Animated.View 
      style={[
        styles.bottomPanel,
        styles.trackingPanel,
        {
          transform: [{
            translateY: panelAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [400, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.panelHandle} />

      {isSearching ? (
        <View style={styles.searchingContainer}>
          <ActivityIndicator size="large" color={COLORS.darkBlue} />
          <Text style={styles.searchingText}>Recherche de chauffeur...</Text>
          <Text style={styles.searchingSubtext}>Cela peut prendre quelques instants</Text>
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      ) : driverFound ? (
        <View style={styles.driverContainer}>
          {/* Driver Info */}
          <View style={styles.driverHeader}>
            <View style={styles.driverPhotoContainer}>
              {DRIVER.photo ? (
                <Image source={{ uri: DRIVER.photo }} style={styles.driverPhoto} />
              ) : (
                <View style={styles.driverPhotoPlaceholder}>
                  <Feather name="user" size={32} color={COLORS.gray400} />
                </View>
              )}
            </View>
            
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{DRIVER.name}</Text>
              <View style={styles.driverRatingRow}>
                <Feather name="star" size={14} color={COLORS.darkBlue} />
                <Text style={styles.driverRating}>{DRIVER.rating}</Text>
                <Text style={styles.driverTrips}>• {DRIVER.trips} trajets</Text>
              </View>
            </View>
            
            <View style={styles.arrivalBadge}>
              <Text style={styles.arrivalTime}>{DRIVER.arrivalTime}</Text>
              <Text style={styles.arrivalLabel}>min</Text>
            </View>
          </View>

          {/* Car Info */}
          <View style={styles.carInfo}>
            <View style={styles.carIconContainer}>
              <Ionicons name="car-sport-outline" size={24} color={COLORS.gray600} />
            </View>
            <View style={styles.carDetails}>
              <Text style={styles.carModel}>{DRIVER.car}</Text>
              <Text style={styles.carPlate}>{DRIVER.plate}</Text>
            </View>
          </View>

          {/* Trip Info */}
          <View style={styles.tripInfo}>
            <View style={styles.tripPoint}>
              <View style={styles.tripDotGreen} />
              <Text style={styles.tripAddress}>Position actuelle</Text>
            </View>
            <View style={styles.tripLine} />
            <View style={styles.tripPoint}>
              <View style={styles.tripDotBlack} />
              <Text style={styles.tripAddress}>{destination}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="phone" size={20} color={COLORS.darkBlue} />
              <Text style={styles.actionButtonText}>Appeler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="message-circle" size={20} color={COLORS.darkBlue} />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Feather name="share-2" size={20} color={COLORS.darkBlue} />
              <Text style={styles.actionButtonText}>Partager</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelTripButton} onPress={handleCancel}>
            <Text style={styles.cancelTripText}>Annuler la course</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Animated.View>
  );

  // Render header with user info
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton}>
        <Feather name="menu" size={24} color={COLORS.darkBlue} />
      </TouchableOpacity>
      
      <View style={styles.headerTitle}>
        <Text style={styles.brandName}>ROMUO</Text>
      </View>
      
      {isGuest ? (
        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <Text style={styles.loginButtonText}>Connexion</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.profileButton} onPress={logout}>
          <Feather name="user" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Map Background */}
      {renderMap()}
      
      {/* Header */}
      {renderHeader()}
      
      {/* Search Bar (only in map state) */}
      {appState === 'map' && renderSearchBar()}
      
      {/* Selection Panel */}
      {appState === 'selection' && renderSelectionPanel()}
      
      {/* Tracking Panel */}
      {appState === 'tracking' && renderTrackingPanel()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },

  // Map Styles
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    position: 'relative',
  },
  mapStreetH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.gray200,
  },
  mapStreetV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLORS.gray200,
  },
  mapMainRoad: {
    position: 'absolute',
    height: 30,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray300,
  },
  mapMainRoadV: {
    position: 'absolute',
    width: 30,
    backgroundColor: COLORS.white,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.gray300,
  },
  mapPark: {
    position: 'absolute',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  userMarker: {
    position: 'absolute',
    top: '45%',
    left: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  destinationMarker: {
    position: 'absolute',
    top: '25%',
    left: '65%',
  },
  routeLine: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    width: 100,
    height: 3,
    backgroundColor: COLORS.blue,
    transform: [{ rotate: '-45deg' }],
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkBlue,
    letterSpacing: 3,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkBlue,
    marginLeft: 12,
  },
  quickDestinations: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickDestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  quickDestIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickDestText: {
    fontSize: 15,
    color: COLORS.gray700,
    fontWeight: '500',
  },

  // Bottom Panel Styles
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    maxHeight: '70%',
  },
  trackingPanel: {
    maxHeight: '60%',
  },
  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300,
    alignSelf: 'center',
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  closeButton: {
    padding: 8,
  },

  // Vehicle List Styles
  vehicleList: {
    maxHeight: 250,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: COLORS.darkBlue,
    backgroundColor: COLORS.white,
  },
  vehicleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginRight: 8,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray200,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  capacityText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginLeft: 4,
  },
  vehicleDescription: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: 6,
  },
  vehicleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleTime: {
    fontSize: 13,
    color: COLORS.gray400,
    marginLeft: 6,
  },
  vehiclePriceContainer: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkBlue,
  },

  // Payment Styles
  paymentSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
  },
  paymentText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray700,
    marginLeft: 12,
  },

  // Book Button Styles
  bookButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.darkBlue,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  bookButtonPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Tracking Styles
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchingText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginTop: 20,
  },
  searchingSubtext: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray600,
  },

  // Driver Styles
  driverContainer: {
    paddingTop: 8,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverPhotoContainer: {
    marginRight: 14,
  },
  driverPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  driverPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverRating: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginLeft: 4,
  },
  driverTrips: {
    fontSize: 14,
    color: COLORS.gray500,
    marginLeft: 8,
  },
  arrivalBadge: {
    backgroundColor: COLORS.darkBlue,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  arrivalTime: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  arrivalLabel: {
    fontSize: 12,
    color: COLORS.gray300,
  },

  // Car Info Styles
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    marginBottom: 16,
  },
  carIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  carDetails: {
    flex: 1,
  },
  carModel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },
  carPlate: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 2,
  },

  // Trip Info Styles
  tripInfo: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  tripPoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    marginRight: 14,
  },
  tripDotBlack: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.darkBlue,
    marginRight: 14,
  },
  tripLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.gray300,
    marginLeft: 4,
    marginVertical: 4,
  },
  tripAddress: {
    fontSize: 14,
    color: COLORS.gray700,
  },

  // Driver Actions Styles
  driverActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 6,
  },

  cancelTripButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelTripText: {
    fontSize: 15,
    color: COLORS.gray500,
    textDecorationLine: 'underline',
  },
});
