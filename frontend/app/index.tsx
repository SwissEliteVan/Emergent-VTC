import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRideStore } from '../store/rideStore';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
// ══════════════════════════════════════════════════════════════
// DESIGN SYSTEM - Corporate Premium
// ══════════════════════════════════════════════════════════════
const COLORS = {
  // Primary
  white: '#FFFFFF',
  black: '#000000',
  primary: '#0F172A',      // Slate 900 - Dark blue
  accent: '#C6A15B',       // Gold accent
  accentSoft: '#F7F2E8',
  
  // Grays (for map and UI)
  gray50: '#F8FAFC',       // Lightest
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
  
  // Semantic
  success: '#22C55E',      // Green for wait time
  successLight: '#DCFCE7',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  
  // Map colors
  mapBackground: '#F1F5F9',
  mapStreet: '#E2E8F0',
  mapMainRoad: '#FFFFFF',
  mapPark: '#DCFCE7',
  mapWater: '#DBEAFE',
  mapBuilding: '#FFFFFF',
};

// Typography
const FONTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Border Radius (12px standard)
const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// ══════════════════════════════════════════════════════════════
// VEHICLE DATA - Structured Pricing
// ══════════════════════════════════════════════════════════════
const VEHICLES = [
  {
    id: 'eco',
    name: 'Éco',
    tagline: 'Le meilleur prix',
    description: 'Confortable et économique',
    baseFare: 5,
    perKm: 1.80,
    waitTime: 3,
    capacity: '1-3',
    icon: 'car-outline',
    popular: false,
  },
  {
    id: 'berline',
    name: 'Berline',
    tagline: 'Voyagez avec style',
    description: 'Mercedes Classe E ou similaire',
    baseFare: 10,
    perKm: 2.50,
    waitTime: 5,
    capacity: '1-4',
    icon: 'car-sport-outline',
    popular: true,
  },
  {
    id: 'van',
    name: 'Van',
    tagline: 'Idéal pour les groupes',
    description: 'Jusqu\'à 7 passagers + bagages',
    baseFare: 15,
    perKm: 3.20,
    waitTime: 8,
    capacity: '5-7',
    icon: 'bus-outline',
    popular: false,
  },
];

// Simulated distance calculation
const calculateDistance = (destination: string): number => {
  const distances: Record<string, number> = {
    'Aéroport de Genève': 45,
    'Gare de Lausanne': 12,
    'Centre-ville': 5,
    'Montreux': 28,
  };
  return distances[destination] || Math.floor(Math.random() * 20) + 8;
};

// Calculate price based on distance
const calculatePrice = (vehicle: typeof VEHICLES[0], distanceKm: number): number => {
  return vehicle.baseFare + (vehicle.perKm * distanceKm);
};

// ══════════════════════════════════════════════════════════════
// DRIVER DATA
// ══════════════════════════════════════════════════════════════
const DRIVER = {
  name: 'Marc D.',
  rating: 4.92,
  trips: 2341,
  car: 'Mercedes Classe E',
  plate: 'VD 892 147',
  color: 'Noir',
};

// ══════════════════════════════════════════════════════════════
// APP STATES
// ══════════════════════════════════════════════════════════════
type AppState = 'splash' | 'map' | 'selection' | 'tracking';

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function IndexScreen() {
  const { user, isGuest, login, logout } = useAuth();
  const router = useRouter();
  const rideStore = useRideStore();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth >= 768;
  const sidebarMin = 400;
  const sidebarPreferred = windowWidth * 0.34;
  const sidebarMax = windowWidth * 0.4;
  const sidebarWidth = isDesktop
    ? Math.max(sidebarMin, Math.min(sidebarPreferred, sidebarMax))
    : 0;
  const mapWidth = isDesktop ? windowWidth - sidebarWidth : windowWidth;

  // States
  const [appState, setAppState] = useState<AppState>('splash');
  const [destination, setDestination] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<typeof VEHICLES[0] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [driverFound, setDriverFound] = useState(false);

  // Animations
  const splashFade = useRef(new Animated.Value(1)).current;
  const panelSlide = useRef(new Animated.Value(windowHeight)).current;
  const mapPulse = useRef(new Animated.Value(1)).current;

  // Pulse animation for user marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(mapPulse, {
          toValue: 1.5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(mapPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Panel animation
  useEffect(() => {
    if (isDesktop) {
      panelSlide.setValue(0);
      return;
    }

    if (appState === 'selection' || appState === 'tracking') {
      Animated.spring(panelSlide, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(panelSlide, {
        toValue: windowHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [appState, isDesktop, panelSlide, windowHeight]);

  // Handle splash to map transition
  const handleEnterApp = () => {
    Animated.timing(splashFade, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setAppState('map');
    });
  };

  // Handle destination selection
  const handleSelectDestination = (dest: string) => {
    setDestination(dest);
    const distance = calculateDistance(dest);
    setDistanceKm(distance);
    setAppState('selection');
  };

  // Handle search
  const handleSearch = () => {
    if (destination.trim()) {
      const distance = calculateDistance(destination);
      setDistanceKm(distance);
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

    setTimeout(() => {
      setIsSearching(false);
      setDriverFound(true);
    }, 3500);
  };

  // Handle cancel
  const handleCancel = () => {
    setAppState('map');
    setSelectedVehicle(null);
    setIsSearching(false);
    setDriverFound(false);
    setDestination('');
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: SPLASH SCREEN (Marketing Landing)
  // ════════════════════════════════════════════════════════════
  const renderSplash = () => (
    <Animated.View style={[styles.splashContainer, { opacity: splashFade }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Background gradient effect */}
      <View style={styles.splashBackground}>
        <View style={styles.splashGradient1} />
        <View style={styles.splashGradient2} />
      </View>

      {/* Content */}
      <View style={styles.splashContent}>
        {/* Logo */}
        <View style={styles.splashLogo}>
          <View style={styles.splashLogoIcon}>
            <Feather name="navigation" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.splashBrand}>ROMUO</Text>
        </View>

        {/* Main Text */}
        <View style={styles.splashTextContainer}>
          <Text style={styles.splashTitle}>
            Votre chauffeur privé,{'\n'}en un clic.
          </Text>
          <Text style={styles.splashSubtitle}>
            Déplacez-vous sans limites au meilleur prix.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.splashFeatures}>
          <View style={styles.splashFeature}>
            <View style={styles.featureIcon}>
              <Feather name="clock" size={20} color={COLORS.white} />
            </View>
            <Text style={styles.featureText}>Disponible 24h/24</Text>
          </View>
          <View style={styles.splashFeature}>
            <View style={styles.featureIcon}>
              <Feather name="shield" size={20} color={COLORS.white} />
            </View>
            <Text style={styles.featureText}>Chauffeurs vérifiés</Text>
          </View>
          <View style={styles.splashFeature}>
            <View style={styles.featureIcon}>
              <Feather name="credit-card" size={20} color={COLORS.white} />
            </View>
            <Text style={styles.featureText}>Paiement sécurisé</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.splashCTA}
          onPress={handleEnterApp}
          activeOpacity={0.9}
        >
          <Text style={styles.splashCTAText}>Commander une course</Text>
          <Feather name="arrow-right" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.splashFooter}>
          Service VTC Premium en Suisse
        </Text>
      </View>
    </Animated.View>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: VECTORIAL MAP (Optimized Design)
  // ════════════════════════════════════════════════════════════
  const renderMap = () => (
    <View style={[styles.mapContainer, isDesktop && styles.mapContainerDesktop]}>
      {/* Map Background - Vectorial Style */}
      <View style={styles.mapBackground}>
        
        {/* Grid of streets (horizontal) */}
        {[...Array(25)].map((_, i) => (
          <View 
            key={`street-h-${i}`} 
            style={[
              styles.mapStreetH, 
              { 
                top: i * 40,
                height: i % 5 === 0 ? 2 : 1,
                backgroundColor: i % 5 === 0 ? COLORS.gray300 : COLORS.mapStreet,
              }
            ]} 
          />
        ))}
        
        {/* Grid of streets (vertical) */}
        {[...Array(15)].map((_, i) => (
          <View 
            key={`street-v-${i}`} 
            style={[
              styles.mapStreetV, 
              { 
                left: i * 40,
                width: i % 4 === 0 ? 2 : 1,
                backgroundColor: i % 4 === 0 ? COLORS.gray300 : COLORS.mapStreet,
              }
            ]} 
          />
        ))}

        {/* Buildings (white blocks) */}
        <View style={[styles.mapBuilding, { top: 120, left: 20, width: 70, height: 50 }]} />
        <View style={[styles.mapBuilding, { top: 120, left: 100, width: 50, height: 70 }]} />
        <View style={[styles.mapBuilding, { top: 200, left: 250, width: 80, height: 60 }]} />
        <View style={[styles.mapBuilding, { top: 350, left: 40, width: 60, height: 80 }]} />
        <View style={[styles.mapBuilding, { top: 400, left: 150, width: 90, height: 50 }]} />
        <View style={[styles.mapBuilding, { top: 280, left: 300, width: 70, height: 70 }]} />

        {/* Parks (green areas) */}
        <View style={[styles.mapPark, { top: 180, left: 180, width: 60, height: 60, borderRadius: 30 }]} />
        <View style={[styles.mapPark, { top: 450, left: 280, width: 80, height: 50, borderRadius: 12 }]} />

        {/* Water feature */}
        <View style={[styles.mapWater, { top: 500, left: 50, width: 120, height: 40 }]} />

        {/* Main roads (wider, white) */}
        <View style={[styles.mapMainRoadH, { top: 240 }]} />
        <View style={[styles.mapMainRoadV, { left: mapWidth / 2 - 20 }]} />

        {/* Route line (when tracking) */}
        {appState === 'tracking' && (
          <View style={styles.routeContainer}>
            <View style={styles.routeLine} />
          </View>
        )}

        {/* Destination marker */}
        {(appState === 'selection' || appState === 'tracking') && (
          <View style={styles.destinationMarker}>
            <View style={styles.destinationPin}>
              <Feather name="map-pin" size={24} color={COLORS.white} />
            </View>
            <View style={styles.destinationShadow} />
          </View>
        )}

        {/* User location marker */}
        <View style={styles.userMarkerContainer}>
          <Animated.View 
            style={[
              styles.userMarkerPulse,
              { transform: [{ scale: mapPulse }] }
            ]} 
          />
          <View style={styles.userMarkerDot} />
        </View>
      </View>
    </View>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: HEADER
  // ════════════════════════════════════════════════════════════
  const renderHeader = () => (
    <View style={isDesktop ? styles.desktopHeader : styles.header}>
      {isDesktop ? (
        <>
          <View style={styles.desktopBrand}>
            <View style={styles.desktopLogoIcon}>
              <Feather name="navigation" size={18} color={COLORS.white} />
            </View>
            <Text style={styles.desktopBrandText}>ROMUO</Text>
          </View>

          <View style={styles.desktopHeaderActions}>
            <TouchableOpacity style={styles.desktopSupportBtn}>
              <Feather name="help-circle" size={18} color={COLORS.gray600} />
              <Text style={styles.desktopSupportText}>Assistance</Text>
            </TouchableOpacity>
            {isGuest ? (
              <TouchableOpacity style={styles.desktopLoginBtn} onPress={login}>
                <Feather name="user" size={18} color={COLORS.white} />
                <Text style={styles.desktopLoginText}>Connexion</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.desktopProfileBtn} onPress={logout}>
                <Feather name="user" size={18} color={COLORS.white} />
                <Text style={styles.desktopProfileText}>Profil</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="menu" size={22} color={COLORS.gray700} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerBrand}>ROMUO</Text>
          </View>

          {isGuest ? (
            <TouchableOpacity style={styles.headerLoginBtn} onPress={login}>
              <Feather name="user" size={18} color={COLORS.gray700} />
              <Text style={styles.headerLoginText}>Connexion</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.headerProfileBtn} onPress={logout}>
              <Feather name="user" size={18} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: SEARCH BAR
  // ════════════════════════════════════════════════════════════
  const renderSearchBar = (variant: 'mobile' | 'desktop' = 'mobile') => (
    <View style={[
      styles.searchContainer,
      variant === 'desktop' && styles.searchContainerDesktop,
    ]}>
      {variant === 'desktop' && (
        <View style={styles.searchHeader}>
          <Text style={styles.searchHeaderTitle}>Réserver une course</Text>
          <Text style={styles.searchHeaderSubtitle}>Service VTC premium</Text>
        </View>
      )}
      {/* Search Input */}
      <View style={[styles.searchCard, variant === 'desktop' && styles.searchCardDesktop]}>
        <View style={styles.searchInputRow}>
          <View style={styles.searchIconContainer}>
            <Feather name="search" size={20} color={COLORS.gray400} />
          </View>
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
            <TouchableOpacity 
              style={styles.searchClearBtn}
              onPress={() => setDestination('')}
            >
              <Feather name="x" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Destinations */}
      <View style={[styles.quickDestCard, variant === 'desktop' && styles.quickDestCardDesktop]}>
        <Text style={styles.quickDestTitle}>Destinations populaires</Text>
        
        {[
          { name: 'Aéroport de Genève', distance: '45 km' },
          { name: 'Gare de Lausanne', distance: '12 km' },
          { name: 'Montreux', distance: '28 km' },
        ].map((dest, index) => (
          <TouchableOpacity
            key={dest.name}
            style={[
              styles.quickDestItem,
              index === 2 && { borderBottomWidth: 0 }
            ]}
            onPress={() => handleSelectDestination(dest.name)}
          >
            <View style={styles.quickDestIcon}>
              <Feather name="navigation" size={16} color={COLORS.gray500} />
            </View>
            <View style={styles.quickDestInfo}>
              <Text style={styles.quickDestName}>{dest.name}</Text>
              <Text style={styles.quickDestDistance}>{dest.distance}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.gray300} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: VEHICLE SELECTION PANEL (Structured Pricing)
  // ════════════════════════════════════════════════════════════
  const renderSelectionPanel = (variant: 'mobile' | 'desktop' = 'mobile') => (
    <Animated.View
      style={[
        variant === 'desktop' ? styles.sidebarPanel : styles.bottomPanel,
        variant === 'mobile' && { transform: [{ translateY: panelSlide }] }
      ]}
    >
      {/* Handle */}
      {variant === 'mobile' && <View style={styles.panelHandle} />}

      {/* Header */}
      <View style={[styles.panelHeader, variant === 'desktop' && styles.panelHeaderDesktop]}>
        <View>
          <Text style={styles.panelTitle}>Choisir un véhicule</Text>
          <View style={styles.panelDestRow}>
            <Feather name="map-pin" size={14} color={COLORS.gray500} />
            <Text style={styles.panelDest}>{destination}</Text>
            <Text style={styles.panelDistance}>{distanceKm} km</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.panelCloseBtn} onPress={handleCancel}>
          <Feather name="x" size={22} color={COLORS.gray500} />
        </TouchableOpacity>
      </View>

      {/* Vehicle Cards */}
      <ScrollView 
        style={[
          styles.vehicleList,
          variant === 'desktop' && styles.vehicleListDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {VEHICLES.map((vehicle) => {
          const price = calculatePrice(vehicle, distanceKm);
          const isSelected = selectedVehicle?.id === vehicle.id;

          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                isSelected && styles.vehicleCardSelected,
              ]}
              onPress={() => handleSelectVehicle(vehicle)}
              activeOpacity={0.7}
            >
              {/* Popular Badge */}
              {vehicle.popular && (
                <View style={styles.popularBadge}>
                  <Feather name="star" size={10} color={COLORS.white} />
                  <Text style={styles.popularText}>Populaire</Text>
                </View>
              )}

              {/* Vehicle Icon */}
              <View style={[
                styles.vehicleIconBox,
                isSelected && styles.vehicleIconBoxSelected
              ]}>
                <Ionicons
                  name={vehicle.icon as any}
                  size={28}
                  color={isSelected ? COLORS.white : COLORS.gray600}
                />
              </View>

              {/* Vehicle Info */}
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleNameRow}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <View style={styles.capacityBadge}>
                    <Feather name="users" size={12} color={COLORS.gray500} />
                    <Text style={styles.capacityText}>{vehicle.capacity}</Text>
                  </View>
                </View>
                <Text style={styles.vehicleTagline}>{vehicle.tagline}</Text>
                
                {/* Wait Time - Green */}
                <View style={styles.waitTimeRow}>
                  <View style={styles.waitTimeBadge}>
                    <Feather name="clock" size={12} color={COLORS.success} />
                    <Text style={styles.waitTimeText}>{vehicle.waitTime} min</Text>
                  </View>
                </View>
              </View>

              {/* Price - Bold & Big */}
              <View style={styles.priceContainer}>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Feather name="check" size={12} color={COLORS.primary} />
                    <Text style={styles.selectedBadgeText}>Sélectionné</Text>
                  </View>
                )}
                <Text style={[
                  styles.priceValue,
                  isSelected && styles.priceValueSelected
                ]}>
                  {price.toFixed(0)}
                </Text>
                <Text style={styles.priceCurrency}>CHF</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Payment Method */}
      <View style={styles.paymentSection}>
        <TouchableOpacity style={styles.paymentCard}>
          <View style={styles.paymentIconBox}>
            <Feather name="credit-card" size={18} color={COLORS.gray600} />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Moyen de paiement</Text>
            <Text style={styles.paymentValue}>Apple Pay •••• 4242</Text>
          </View>
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
        activeOpacity={0.9}
      >
        <Text style={styles.bookButtonText}>
          {isGuest ? 'Se connecter pour réserver' : 'Confirmer la réservation'}
        </Text>
        {selectedVehicle && (
          <View style={styles.bookButtonPrice}>
            <Text style={styles.bookButtonPriceText}>
              {calculatePrice(selectedVehicle, distanceKm).toFixed(0)} CHF
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // ════════════════════════════════════════════════════════════
  // RENDER: TRACKING PANEL
  // ════════════════════════════════════════════════════════════
  const renderTrackingPanel = (variant: 'mobile' | 'desktop' = 'mobile') => (
    <Animated.View
      style={[
        variant === 'desktop' ? styles.sidebarPanel : styles.bottomPanel,
        variant === 'mobile' && styles.trackingPanel,
        variant === 'mobile' && { transform: [{ translateY: panelSlide }] }
      ]}
    >
      {variant === 'mobile' && <View style={styles.panelHandle} />}

      {isSearching ? (
        <View style={styles.searchingState}>
          <View style={styles.searchingSpinner}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.searchingTitle}>Recherche d'un chauffeur...</Text>
          <Text style={styles.searchingSubtitle}>
            Nous trouvons le meilleur chauffeur pour vous
          </Text>
          <TouchableOpacity style={styles.cancelSearchBtn} onPress={handleCancel}>
            <Text style={styles.cancelSearchText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      ) : driverFound ? (
        <View style={styles.driverState}>
          {/* Driver Header */}
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <Feather name="user" size={28} color={COLORS.gray400} />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{DRIVER.name}</Text>
              <View style={styles.driverRatingRow}>
                <Feather name="star" size={14} color={COLORS.primary} />
                <Text style={styles.driverRating}>{DRIVER.rating}</Text>
                <Text style={styles.driverTrips}>{DRIVER.trips} trajets</Text>
              </View>
            </View>
            <View style={styles.arrivalBox}>
              <Text style={styles.arrivalTime}>{selectedVehicle?.waitTime || 5}</Text>
              <Text style={styles.arrivalLabel}>min</Text>
            </View>
          </View>

          {/* Car Info */}
          <View style={styles.carCard}>
            <View style={styles.carIconBox}>
              <Ionicons name="car-sport-outline" size={22} color={COLORS.gray600} />
            </View>
            <View style={styles.carInfo}>
              <Text style={styles.carModel}>{DRIVER.car}</Text>
              <Text style={styles.carDetails}>{DRIVER.color} • {DRIVER.plate}</Text>
            </View>
          </View>

          {/* Trip Route */}
          <View style={styles.tripRoute}>
            <View style={styles.tripPointRow}>
              <View style={styles.tripDotGreen} />
              <Text style={styles.tripPointText}>Position actuelle</Text>
            </View>
            <View style={styles.tripLineVertical} />
            <View style={styles.tripPointRow}>
              <View style={styles.tripDotDark} />
              <Text style={styles.tripPointText}>{destination}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Feather name="phone" size={20} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Feather name="message-circle" size={20} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Feather name="share-2" size={20} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>Partager</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelTripBtn} onPress={handleCancel}>
            <Text style={styles.cancelTripText}>Annuler la course</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Animated.View>
  );

  // ════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={appState === 'splash' ? 'light-content' : 'dark-content'} />

      {/* Splash Screen */}
      {appState === 'splash' && renderSplash()}

      {/* Main App */}
      {appState !== 'splash' && (
        <>
          {isDesktop ? (
            <View style={styles.desktopLayout}>
              <View style={[styles.sidebar, { width: sidebarWidth }]}>
                {renderHeader()}
                <ScrollView
                  contentContainerStyle={styles.sidebarContent}
                  showsVerticalScrollIndicator={false}
                >
                  {renderSearchBar('desktop')}
                  {appState === 'selection' && renderSelectionPanel('desktop')}
                  {appState === 'tracking' && renderTrackingPanel('desktop')}
                </ScrollView>
              </View>
              <View style={styles.desktopMap}>
                {renderMap()}
              </View>
            </View>
          ) : (
            <>
              {renderMap()}
              {renderHeader()}
              {appState === 'map' && renderSearchBar()}
              {appState === 'selection' && renderSelectionPanel()}
              {appState === 'tracking' && renderTrackingPanel()}
            </>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.mapBackground,
  },

  // ═══════════════════════════════════════════════════════════
  // SPLASH SCREEN STYLES
  // ═══════════════════════════════════════════════════════════
  splashContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
    zIndex: 100,
  },
  splashBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  splashGradient1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  splashGradient2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  splashContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 50,
  },
  splashLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  splashLogoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  splashBrand: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 4,
  },
  splashTextContainer: {
    marginBottom: 50,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 46,
    marginBottom: 16,
  },
  splashSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 26,
  },
  splashFeatures: {
    marginBottom: 50,
  },
  splashFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  splashCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginBottom: 30,
  },
  splashCTAText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 10,
  },
  splashFooter: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },

  // ═══════════════════════════════════════════════════════════
  // MAP STYLES (Vectorial Design)
  // ═══════════════════════════════════════════════════════════
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  mapContainerDesktop: {
    position: 'relative',
    flex: 1,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: COLORS.mapBackground,
  },
  mapStreetH: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  mapStreetV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  mapBuilding: {
    position: 'absolute',
    backgroundColor: COLORS.mapBuilding,
    borderRadius: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mapPark: {
    position: 'absolute',
    backgroundColor: COLORS.mapPark,
  },
  mapWater: {
    position: 'absolute',
    backgroundColor: COLORS.mapWater,
    borderRadius: 8,
  },
  mapMainRoadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: COLORS.mapMainRoad,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray200,
  },
  mapMainRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: COLORS.mapMainRoad,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.gray200,
  },
  routeContainer: {
    position: 'absolute',
    top: '30%',
    left: '45%',
    width: 80,
    height: 150,
  },
  routeLine: {
    position: 'absolute',
    width: 4,
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 2,
    transform: [{ rotate: '-30deg' }],
  },
  userMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  userMarkerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.blue,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationMarker: {
    position: 'absolute',
    top: '22%',
    left: '62%',
    alignItems: 'center',
  },
  destinationPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  destinationShadow: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginTop: 6,
  },

  // ═══════════════════════════════════════════════════════════
  // HEADER STYLES
  // ═══════════════════════════════════════════════════════════
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 3,
  },
  headerLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
    marginLeft: 8,
  },
  headerProfileBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopLayout: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    flexDirection: 'row',
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  desktopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopLogoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  desktopBrandText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  desktopHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray50,
    marginRight: 12,
  },
  desktopSupportText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray600,
    marginLeft: 8,
  },
  desktopLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  desktopLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  desktopProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  desktopProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  sidebar: {
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray100,
    shadowColor: COLORS.black,
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1,
  },
  sidebarContent: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  desktopMap: {
    flex: 1,
    backgroundColor: COLORS.mapBackground,
  },

  // ═══════════════════════════════════════════════════════════
  // SEARCH STYLES
  // ═══════════════════════════════════════════════════════════
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  searchContainerDesktop: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  searchHeader: {
    marginBottom: 16,
  },
  searchHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  searchHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchCardDesktop: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray900,
    paddingVertical: 16,
  },
  searchClearBtn: {
    padding: 8,
  },
  quickDestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginTop: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickDestCardDesktop: {
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  quickDestTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  quickDestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  quickDestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickDestInfo: {
    flex: 1,
  },
  quickDestName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: 2,
  },
  quickDestDistance: {
    fontSize: 13,
    color: COLORS.gray500,
  },

  // ═══════════════════════════════════════════════════════════
  // BOTTOM PANEL STYLES
  // ═══════════════════════════════════════════════════════════
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
    maxHeight: '75%',
  },
  sidebarPanel: {
    position: 'relative',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  trackingPanel: {
    maxHeight: '65%',
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
  panelHeaderDesktop: {
    paddingHorizontal: 0,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  panelDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelDest: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: 6,
    marginRight: 8,
  },
  panelDistance: {
    fontSize: 14,
    color: COLORS.gray400,
  },
  panelCloseBtn: {
    padding: 8,
  },

  // ═══════════════════════════════════════════════════════════
  // VEHICLE CARD STYLES
  // ═══════════════════════════════════════════════════════════
  vehicleList: {
    maxHeight: 280,
  },
  vehicleListDesktop: {
    maxHeight: 520,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
  },
  vehicleCardSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.accent,
    shadowOpacity: 0.12,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },
  vehicleIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  vehicleIconBoxSelected: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.gray900,
    marginRight: 10,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray200,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  capacityText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginLeft: 4,
    fontWeight: '500',
  },
  vehicleTagline: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  waitTimeRow: {
    flexDirection: 'row',
  },
  waitTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  waitTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 5,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentSoft,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  priceValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  priceValueSelected: {
    color: COLORS.primary,
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray500,
    marginTop: -2,
  },

  // ═══════════════════════════════════════════════════════════
  // PAYMENT STYLES
  // ═══════════════════════════════════════════════════════════
  paymentSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray800,
  },

  // ═══════════════════════════════════════════════════════════
  // BOOK BUTTON STYLES
  // ═══════════════════════════════════════════════════════════
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  bookButtonPrice: {
    backgroundColor: COLORS.accent,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
  },
  bookButtonPriceText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  // ═══════════════════════════════════════════════════════════
  // TRACKING PANEL STYLES
  // ═══════════════════════════════════════════════════════════
  searchingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchingSpinner: {
    marginBottom: 24,
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  searchingSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: 30,
  },
  cancelSearchBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: RADIUS.md,
  },
  cancelSearchText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  driverState: {
    paddingTop: 8,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverRating: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
    marginRight: 8,
  },
  driverTrips: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  arrivalBox: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  arrivalTime: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  arrivalLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: -2,
  },
  carCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
  },
  carIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  carInfo: {
    flex: 1,
  },
  carModel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  carDetails: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 2,
  },
  tripRoute: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  tripPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    marginRight: 14,
  },
  tripDotDark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: 14,
  },
  tripLineVertical: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.gray300,
    marginLeft: 5,
    marginVertical: 4,
  },
  tripPointText: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  driverActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionBtnText: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 6,
  },
  cancelTripBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelTripText: {
    fontSize: 15,
    color: COLORS.gray500,
    textDecorationLine: 'underline',
  },
});
