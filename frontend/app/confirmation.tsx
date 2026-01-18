import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRideStore } from '../store/rideStore';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ConfirmationScreen() {
  const { sessionToken, isGuest, login } = useAuth();
  const router = useRouter();
  const { pickup, destination, selectedVehicle, distanceKm, price } = useRideStore();
  const [loading, setLoading] = useState(false);

  // Redirect to login if guest tries to access confirmation
  useEffect(() => {
    if (isGuest && (!pickup || !destination || !selectedVehicle)) {
      Alert.alert('Erreur', 'Veuillez d\'abord sélectionner une course', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    }
  }, [isGuest, pickup, destination, selectedVehicle]);

  const handleConfirmBooking = async () => {
    if (!pickup || !destination || !selectedVehicle) {
      Alert.alert('Erreur', 'Informations de course manquantes');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/rides`,
        {
          pickup,
          destination,
          vehicle_type: selectedVehicle.id,
          distance_km: distanceKm,
          price: price,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (response.data.ride_id) {
        router.push({
          pathname: '/ride-status',
          params: { rideId: response.data.ride_id },
        });
      }
    } catch (error) {
      console.error('Booking failed:', error);
      Alert.alert('Erreur', 'La réservation a échoué. Veuillez réessayer.');
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>Confirmation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Véhicule sélectionné</Text>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleIcon}>{selectedVehicle?.icon}</Text>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>{selectedVehicle?.name}</Text>
              <Text style={styles.vehicleDescription}>{selectedVehicle?.description}</Text>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails du trajet</Text>
          
          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="location" size={24} color="#4CAF50" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Départ</Text>
              <Text style={styles.locationAddress}>{pickup?.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="flag" size={24} color="#D4AF37" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationAddress}>{destination?.address}</Text>
            </View>
          </View>

          <View style={styles.tripStat}>
            <Ionicons name="navigate" size={20} color="#A0A0A0" />
            <Text style={styles.tripStatText}>{distanceKm.toFixed(1)} km</Text>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détail du prix</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Course de base</Text>
            <Text style={styles.priceValue}>{selectedVehicle?.base_fare.toFixed(2)} CHF</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Distance ({distanceKm.toFixed(1)} km)</Text>
            <Text style={styles.priceValue}>
              {((selectedVehicle?.rate_per_km || 0) * distanceKm).toFixed(2)} CHF
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{price.toFixed(2)} CHF</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Confirmer la réservation</Text>
              <Ionicons name="arrow-forward" size={24} color="#0A0A0A" />
            </>
          )}
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2C',
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
  divider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginVertical: 16,
  },
  tripStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tripStatText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  priceValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
  },
  footer: {
    padding: 24,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  confirmButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    marginRight: 8,
  },
});