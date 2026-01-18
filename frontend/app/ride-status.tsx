import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRideStore } from '../store/rideStore';

export default function RideStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { rideId } = params;
  const { resetRide } = useRideStore();
  const [estimatedTime, setEstimatedTime] = useState(5);

  useEffect(() => {
    // Simulate driver approaching
    const timer = setInterval(() => {
      setEstimatedTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Decrease every minute

    return () => clearInterval(timer);
  }, []);

  const handleBackToHome = () => {
    resetRide();
    router.replace('/map');
  };

  return (
    <View style={styles.container}>
      {/* Status Card */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
        </View>

        {/* Status Text */}
        <Text style={styles.title}>Réservation confirmée!</Text>
        <Text style={styles.subtitle}>Votre chauffeur est en route</Text>

        {/* Ride ID */}
        <View style={styles.rideIdCard}>
          <Text style={styles.rideIdLabel}>ID de course</Text>
          <Text style={styles.rideIdValue}>{rideId}</Text>
        </View>

        {/* Driver Info Card */}
        <View style={styles.card}>
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={32} color="#D4AF37" />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>Chauffeur assigné</Text>
              <Text style={styles.driverStatus}>En route vers vous</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ETA */}
          <View style={styles.etaContainer}>
            <Ionicons name="time" size={32} color="#D4AF37" />
            <View style={styles.etaInfo}>
              <Text style={styles.etaLabel}>Temps d'arrivée estimé</Text>
              <Text style={styles.etaValue}>{estimatedTime} minutes</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#D4AF37" />
          <Text style={styles.infoText}>
            Nous vous enverrons une notification lorsque votre chauffeur sera arrivé
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={handleBackToHome}
        >
          <Ionicons name="home" size={24} color="#0A0A0A" />
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 32,
  },
  rideIdCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  rideIdLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  rideIdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  driverStatus: {
    fontSize: 14,
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginVertical: 20,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  etaInfo: {
    marginLeft: 16,
  },
  etaLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2C',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#A0A0A0',
    marginLeft: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  homeButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    marginLeft: 8,
  },
});