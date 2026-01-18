import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminDashboard() {
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = async () => {
    if (!adminPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le mot de passe admin');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
        params: { admin_password: adminPassword }
      });
      setStats(response.data);
      setAuthenticated(true);
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Mot de passe admin incorrect');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [usersRes, ridesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/users`, { params: { admin_password: adminPassword } }),
        axios.get(`${BACKEND_URL}/api/admin/rides`, { params: { admin_password: adminPassword } })
      ]);
      setUsers(usersRes.data.users);
      setRides(ridesRes.data.rides);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  };

  const handleAssignDriver = async (rideId: string) => {
    const drivers = users.filter(u => u.role === 'driver');
    if (drivers.length === 0) {
      Alert.alert('Erreur', 'Aucun chauffeur disponible');
      return;
    }

    // For simplicity, assign first available driver
    const driverId = drivers[0].user_id;

    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/rides/${rideId}/assign`,
        {},
        { params: { admin_password: adminPassword, driver_id: driverId } }
      );
      Alert.alert('Succès', 'Chauffeur assigné avec succès');
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'assigner le chauffeur');
    }
  };

  if (!authenticated) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.loginHeader}>
            <Ionicons name="shield-checkmark" size={64} color="#D4AF37" />
            <Text style={styles.loginTitle}>Admin Dashboard</Text>
            <Text style={styles.loginSubtitle}>Romuo.ch</Text>
          </View>

          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe admin"
            placeholderTextColor="#666"
            secureTextEntry
            value={adminPassword}
            onChangeText={setAdminPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text style={styles.loginButtonText}>Connexion</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={() => setAuthenticated(false)}>
          <Ionicons name="log-out" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Aperçu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Utilisateurs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rides' && styles.tabActive]}
          onPress={() => setActiveTab('rides')}
        >
          <Text style={[styles.tabText, activeTab === 'rides' && styles.tabTextActive]}>
            Courses
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'overview' && stats && (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={32} color="#D4AF37" />
                <Text style={styles.statValue}>{stats.users.total}</Text>
                <Text style={styles.statLabel}>Utilisateurs</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="car-sport" size={32} color="#4CAF50" />
                <Text style={styles.statValue}>{stats.users.drivers}</Text>
                <Text style={styles.statLabel}>Chauffeurs</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="briefcase" size={32} color="#2196F3" />
                <Text style={styles.statValue}>{stats.rides.completed}</Text>
                <Text style={styles.statLabel}>Courses complétées</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cash" size={32} color="#FF9800" />
                <Text style={styles.statValue}>{stats.revenue.total.toFixed(2)} CHF</Text>
                <Text style={styles.statLabel}>Revenu total</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'users' && (
          <View>
            {users.map((user) => (
              <View key={user.user_id} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <Text style={styles.listCardTitle}>{user.name}</Text>
                  <View style={[styles.badge, user.role === 'driver' ? styles.badgeDriver : styles.badgePassenger]}>
                    <Text style={styles.badgeText}>{user.role === 'driver' ? 'Chauffeur' : 'Passager'}</Text>
                  </View>
                </View>
                <Text style={styles.listCardSubtitle}>{user.email}</Text>
                {user.account_type === 'business' && (
                  <View style={styles.businessInfo}>
                    <Ionicons name="business" size={16} color="#D4AF37" />
                    <Text style={styles.businessText}>
                      {user.company_name} - TVA: {user.vat_number}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'rides' && (
          <View>
            {rides.map((ride) => (
              <View key={ride.ride_id} style={styles.listCard}>
                <View style={styles.listCardHeader}>
                  <Text style={styles.listCardTitle}>Course #{ride.ride_id.slice(-8)}</Text>
                  <View style={[
                    styles.badge,
                    ride.status === 'completed' ? styles.badgeSuccess :
                    ride.status === 'pending' ? styles.badgeWarning :
                    styles.badgePrimary
                  ]}>
                    <Text style={styles.badgeText}>{ride.status}</Text>
                  </View>
                </View>
                <View style={styles.rideDetails}>
                  <Text style={styles.rideText}>🚗 {ride.vehicle_type.toUpperCase()}</Text>
                  <Text style={styles.rideText}>📍 {ride.pickup.address}</Text>
                  <Text style={styles.rideText}>🏁 {ride.destination.address}</Text>
                  <Text style={styles.ridePrice}>{ride.price.toFixed(2)} CHF</Text>
                </View>
                {ride.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => handleAssignDriver(ride.ride_id)}
                  >
                    <Ionicons name="person-add" size={20} color="#FFFFFF" />
                    <Text style={styles.assignButtonText}>Assigner Chauffeur</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 8,
  },
  passwordInput: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
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
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  tabText: {
    fontSize: 16,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#D4AF37',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 4,
  },
  listCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listCardSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDriver: {
    backgroundColor: '#4CAF50',
  },
  badgePassenger: {
    backgroundColor: '#2196F3',
  },
  badgeSuccess: {
    backgroundColor: '#4CAF50',
  },
  badgeWarning: {
    backgroundColor: '#FF9800',
  },
  badgePrimary: {
    backgroundColor: '#2196F3',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  businessText: {
    fontSize: 12,
    color: '#D4AF37',
  },
  rideDetails: {
    marginTop: 12,
  },
  rideText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ridePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    marginTop: 8,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
