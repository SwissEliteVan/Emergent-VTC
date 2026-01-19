import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Constants from 'expo-constants';
import { useResponsive, responsive, safeAreaPadding } from '../utils/responsive';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Ride {
  ride_id: string;
  user_id: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  vehicle_type: string;
  distance_km: number;
  price: number;
  status: string;
  created_at: string;
}

export default function DriverDispatchScreen() {
  const { user, sessionToken, logout } = useAuth();
  const router = useRouter();
  const { isDesktop, isTablet, width } = useResponsive();
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState({ total: 0, rides: 0 });

  useEffect(() => {
    if (!user) {
      router.replace('/');
      return;
    }
    
    fetchPendingRides();
    fetchActiveRide();
    fetchEarnings();
    
    // Poll for new rides every 5 seconds
    const interval = setInterval(() => {
      fetchPendingRides();
      fetchActiveRide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchPendingRides = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/driver/pending-rides`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      setPendingRides(response.data.rides);
    } catch (error: any) {
      if (error.response?.status !== 403) {
        console.error('Failed to fetch pending rides:', error);
      }
    }
  };

  const fetchActiveRide = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/driver/active-ride`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      setActiveRide(response.data.ride);
    } catch (error) {
      console.error('Failed to fetch active ride:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/driver/earnings`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      setEarnings({
        total: response.data.total_earnings,
        rides: response.data.total_rides
      });
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingRides();
    await fetchActiveRide();
    await fetchEarnings();
    setRefreshing(false);
  };

  const handleAcceptRide = async (rideId: string) => {
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/rides/${rideId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      
      const msg = 'Course acceptée!';
      if (Platform.OS === 'web') {
        alert(msg);
        fetchPendingRides();
        fetchActiveRide();
        router.push({
          pathname: '/driver-active',
          params: { rideId }
        });
      } else {
        Alert.alert('Succès', msg, [
          { text: 'OK', onPress: () => {
            fetchPendingRides();
            fetchActiveRide();
            router.push({
              pathname: '/driver-active',
              params: { rideId }
            });
          }}
        ]);
      }
    } catch (error) {
      const msg = 'Impossible d\'accepter la course';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRide = async (rideId: string) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/rides/${rideId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      
      // Remove from local list
      setPendingRides(prev => prev.filter(r => r.ride_id !== rideId));
    } catch (error) {
      const msg = 'Impossible de refuser la course';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erreur', msg);
    }
  };

  const handleSwitchToPassenger = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/user/toggle-role`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      router.replace('/');
    } catch (error) {
      const msg = 'Impossible de changer de mode';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erreur', msg);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'eco': return '🚗';
      case 'berline': return '🚙';
      case 'bus': return '🚌';
      default: return '🚗';
    }
  };

  // Render sidebar for desktop (earnings + stats)
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {/* Driver Profile */}
      <View style={styles.sidebarProfile}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={32} color="#D4AF37" />
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileRole}>Chauffeur</Text>
      </View>

      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <Ionicons name="cash" size={28} color="#D4AF37" />
        <Text style={styles.earningsLabel}>Gains totaux</Text>
        <Text style={styles.earningsValue}>{earnings.total.toFixed(2)} CHF</Text>
        <Text style={styles.earningsRides}>{earnings.rides} courses complétées</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={handleSwitchToPassenger}
        >
          <Ionicons name="swap-horizontal" size={20} color="#D4AF37" />
          <Text style={styles.quickActionText}>Mode passager</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color="#D4AF37" />
          <Text style={styles.quickActionText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render ride card
  const renderRideCard = (ride: Ride) => (
    <View key={ride.ride_id} style={[styles.rideCard, isDesktop && styles.rideCardDesktop]}>
      {/* Vehicle Type */}
      <View style={styles.rideHeader}>
        <Text style={styles.vehicleIcon}>{getVehicleIcon(ride.vehicle_type)}</Text>
        <View style={styles.rideHeaderInfo}>
          <Text style={styles.vehicleType}>
            {ride.vehicle_type.toUpperCase()}
          </Text>
          <Text style={styles.distance}>
            {ride.distance_km.toFixed(1)} km
          </Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Gain</Text>
          <Text style={styles.priceValue}>{ride.price.toFixed(2)} CHF</Text>
        </View>
      </View>

      {/* Locations */}
      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot}>
            <Ionicons name="location" size={16} color="#4CAF50" />
          </View>
          <Text style={styles.locationText} numberOfLines={1}>
            {ride.pickup.address}
          </Text>
        </View>
        
        <View style={styles.locationConnector} />
        
        <View style={styles.locationRow}>
          <View style={styles.locationDot}>
            <Ionicons name="flag" size={16} color="#D4AF37" />
          </View>
          <Text style={styles.locationText} numberOfLines={1}>
            {ride.destination.address}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRide(ride.ride_id)}
        >
          <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>REFUSER</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRide(ride.ride_id)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#0A0A0A" />
              <Text style={styles.acceptButtonText}>ACCEPTER</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View>
          <Text style={styles.greeting}>Mode Chauffeur</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        {!isDesktop && (
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.switchButton}
              onPress={handleSwitchToPassenger}
            >
              <Ionicons name="swap-horizontal" size={20} color="#D4AF37" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={logout}
            >
              <Ionicons name="log-out-outline" size={24} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Layout */}
      <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
        {/* Sidebar for desktop */}
        {isDesktop && renderSidebar()}

        {/* Main Content */}
        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          {/* Active Ride Alert */}
          {activeRide && (
            <TouchableOpacity 
              style={styles.activeRideAlert}
              onPress={() => router.push({
                pathname: '/driver-active',
                params: { rideId: activeRide.ride_id }
              })}
            >
              <Ionicons name="car-sport" size={24} color="#4CAF50" />
              <View style={styles.activeRideText}>
                <Text style={styles.activeRideTitle}>Course en cours</Text>
                <Text style={styles.activeRideSubtitle}>Appuyez pour voir les détails</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
            </TouchableOpacity>
          )}

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nouvelles demandes</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRides.length}</Text>
            </View>
          </View>

          {/* Rides List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                tintColor="#D4AF37"
              />
            }
            contentContainerStyle={[
              styles.scrollContent,
              isDesktop && styles.scrollContentDesktop
            ]}
          >
            {pendingRides.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time" size={64} color="#666666" />
                <Text style={styles.emptyStateText}>Aucune course disponible</Text>
                <Text style={styles.emptyStateSubtext}>Tirez pour actualiser</Text>
              </View>
            ) : (
              <View style={[styles.ridesGrid, isDesktop && styles.ridesGridDesktop]}>
                {pendingRides.map(renderRideCard)}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
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
    paddingTop: safeAreaPadding.top,
    paddingBottom: 16,
  },
  headerDesktop: {
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#A0A0A0',
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

  // Main Layout
  mainLayout: {
    flex: 1,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
  },

  // Sidebar (Desktop only)
  sidebar: {
    width: 280,
    backgroundColor: '#1A1A1A',
    borderRightWidth: 1,
    borderRightColor: '#2C2C2C',
    padding: 24,
  },
  sidebarProfile: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileRole: {
    fontSize: 14,
    color: '#D4AF37',
    marginTop: 4,
  },
  earningsCard: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 12,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4AF37',
    marginTop: 4,
  },
  earningsRides: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 8,
  },
  quickActions: {
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  quickActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentDesktop: {
    paddingHorizontal: 32,
    paddingTop: 8,
  },
  
  // Active Ride Alert
  activeRideAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3A1A',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  activeRideText: {
    flex: 1,
    marginLeft: 12,
  },
  activeRideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  activeRideSubtitle: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 2,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 12,
  },
  badge: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  // Scroll Content
  scrollContent: {
    paddingBottom: 40,
  },
  scrollContentDesktop: {
    paddingBottom: 40,
  },

  // Rides Grid
  ridesGrid: {
    gap: 16,
  },
  ridesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },

  // Ride Card
  rideCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#2C2C2C',
  },
  rideCardDesktop: {
    flex: 1,
    minWidth: 320,
    maxWidth: 400,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  rideHeaderInfo: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  priceBox: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: '#0A0A0A',
    fontWeight: '600',
    textAlign: 'center',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    textAlign: 'center',
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  locationConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#2C2C2C',
    marginLeft: 15,
    marginVertical: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#D32F2F',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },
});
