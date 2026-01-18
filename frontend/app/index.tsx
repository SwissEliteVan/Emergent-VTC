import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/map');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="car-sport" size={60} color="#D4AF37" />
          </View>
          <Text style={styles.title}>Romuo.ch</Text>
          <Text style={styles.subtitle}>VTC Premium Suisse</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={24} color="#D4AF37" />
            <Text style={styles.featureText}>Service sécurisé</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="star" size={24} color="#D4AF37" />
            <Text style={styles.featureText}>Qualité premium</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="time" size={24} color="#D4AF37" />
            <Text style={styles.featureText}>Disponible 24/7</Text>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={login}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="logo-google" size={24} color="#0A0A0A" />
            <Text style={styles.loginButtonText}>Connexion avec Google</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          En continuant, vous acceptez nos conditions d'utilisation
        </Text>
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
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
    marginLeft: 12,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});