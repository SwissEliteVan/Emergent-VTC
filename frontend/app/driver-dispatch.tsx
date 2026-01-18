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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Constants from 'expo-constants';

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
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/');
      return;
    }
    
    fetchPendingRides();
    fetchActiveRide();
    
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingRides();
    await fetchActiveRide();
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
      
      Alert.alert('Succès', 'Course acceptée!', [
        { text: 'OK', onPress: () => {
          fetchPendingRides();
          fetchActiveRide();
          router.push({
            pathname: '/driver-active',
            params: { rideId }
          });
        }}
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'accepter la course');
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
      Alert.alert('Erreur', 'Impossible de refuser la course');
    }
  };

  const handleSwitchToPassenger = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/user/toggle-role`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      router.replace('/map');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de changer de mode');
    }
  };

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'eco': return '🚗';
      case 'berline': return '🚙';
      case 'van': return '🚐';
      default: return '🚗';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Mode Chauffeur</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
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
      </View>

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

      {/* Pending Rides List */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nouvelles demandes</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingRides.length}</Text>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
            />
          }
        >
          {pendingRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time" size={64} color="#666666" />
              <Text style={styles.emptyStateText}>Aucune course disponible</Text>
              <Text style={styles.emptyStateSubtext}>Tirez pour actualiser</Text>
            </View>
          ) : (
            pendingRides.map((ride) => (
              <View key={ride.ride_id} style={styles.rideCard}>
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
                    <Ionicons name="close-circle" size={24} color="#FFFFFF" />
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
                        <Ionicons name="checkmark-circle" size={24} color="#0A0A0A" />
                        <Text style={styles.acceptButtonText}>ACCEPTER</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
    paddingTop: 60,
    paddingBottom: 16,
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
  activeRideAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3A1A',
    marginHorizontal: 24,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
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
  rideCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2C2C2C',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
});