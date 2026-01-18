import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Ride {
  ride_id: string;
  user_id: string;
  driver_id: string;
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

export default function DriverActiveRideScreen() {
  const { sessionToken } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { rideId } = params;
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const [navigationStarted, setNavigationStarted] = useState(false);

  useEffect(() => {
    fetchRideDetails();
  }, [rideId]);

  const fetchRideDetails = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/rides/${rideId}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setRide(response.data);
      setNavigationStarted(response.data.status === 'in_progress');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les détails de la course');
    }
  };

  const handleNavigate = async () => {
    if (!ride) return;

    // Start the ride status first
    if (ride.status === 'accepted') {
      try {
        await axios.post(
          `${BACKEND_URL}/api/rides/${rideId}/start`,
          {},
          { headers: { Authorization: `Bearer ${sessionToken}` } }
        );
        setNavigationStarted(true);
        fetchRideDetails();
      } catch (error) {
        console.error('Failed to start ride:', error);
      }
    }

    // Open navigation app
    const { latitude, longitude, address } = ride.destination;
    const destination = `${latitude},${longitude}`;
    
    const wazeUrl = `waze://?ll=${destination}&navigate=yes`;
    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${destination}&directionsmode=driving`,
      android: `google.navigation:q=${destination}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    });

    try {
      const canOpenWaze = await Linking.canOpenURL(wazeUrl);
      if (canOpenWaze) {
        await Linking.openURL(wazeUrl);
      } else {
        await Linking.openURL(googleMapsUrl as string);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application de navigation');
    }
  };

  const handleCompleteRide = () => {
    Alert.alert(
      'Terminer la course',
      'Confirmez-vous que le client est arrivé à destination ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'default',
          onPress: completeRide 
        }
      ]
    );
  };

  const completeRide = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/rides/${rideId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      
      Alert.alert(
        'Bravo!',
        `Course terminée. Vous avez gagné ${response.data.earnings.toFixed(2)} CHF`,
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/driver-dispatch')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de terminer la course');
    } finally {
      setLoading(false);
    }
  };

  if (!ride) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Active</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: ride.status === 'in_progress' ? '#4CAF50' : '#D4AF37' }
          ]} />
          <Text style={styles.statusText}>
            {ride.status === 'accepted' ? 'En attente de navigation' : 'En route vers la destination'}
          </Text>
        </View>

        {/* Vehicle Info */}
        <View style={styles.card}>
          <View style={styles.vehicleHeader}>
            <Text style={styles.vehicleIcon}>{getVehicleIcon(ride.vehicle_type)}</Text>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleType}>{ride.vehicle_type.toUpperCase()}</Text>
              <Text style={styles.distance}>{ride.distance_km.toFixed(1)} km</Text>
            </View>
            <View style={styles.earningsBox}>
              <Text style={styles.earningsLabel}>Gain</Text>
              <Text style={styles.earningsValue}>{ride.price.toFixed(2)} CHF</Text>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails du trajet</Text>
          
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Point de départ</Text>
              <Text style={styles.locationAddress}>{ride.pickup.address}</Text>
            </View>
          </View>

          <View style={styles.locationConnector} />

          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#D4AF37' }]}>
              <Ionicons name="flag" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationAddress}>{ride.destination.address}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!navigationStarted ? (
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={handleNavigate}
            >
              <Ionicons name="navigate" size={28} color="#0A0A0A" />
              <Text style={styles.navigateButtonText}>Démarrer la navigation</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleNavigate}
              >
                <Ionicons name="navigate" size={24} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>Ouvrir la navigation</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.completeButton}
                onPress={handleCompleteRide}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0A0A0A" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={28} color="#0A0A0A" />
                    <Text style={styles.completeButtonText}>Terminer la course</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#D4AF37" />
          <Text style={styles.infoText}>
            La navigation s'ouvrira dans Waze ou Google Maps
          </Text>
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
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  earningsBox: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  earningsLabel: {
    fontSize: 10,
    color: '#0A0A0A',
    fontWeight: '600',
    textAlign: 'center',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  locationConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#2C2C2C',
    marginLeft: 19,
    marginBottom: 12,
  },
  actions: {
    gap: 12,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 12,
  },
  navigateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2C',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 12,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#A0A0A0',
    marginLeft: 12,
  },
});
