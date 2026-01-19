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
import { useRouter } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';
import { useResponsive, responsive, safeAreaPadding } from '../utils/responsive';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminDashboard() {
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = async () => {
    if (!adminPassword.trim()) {
      const msg = 'Veuillez entrer le mot de passe admin';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erreur', msg);
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
      const msg = 'Mot de passe admin incorrect';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erreur', msg);
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
      const msg = 'Aucun chauffeur disponible';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erreur', msg);
      return;
    }

    const driverId = drivers[0].user_id;

    try {
      await axios.post(
        `${BACKEND_URL}/api/admin/rides/${rideId}/assign`,
        {},
        { params: { admin_password: adminPassword, driver_id: driverId } }
      );
      const msg = 'Chauffeur assigné avec succès';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Succès', msg);
      fetchData();
    } catch (error) {
      const msg = 'Impossible d\'assigner le chauffeur';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Erreur', msg);
    }
  };

  // Login Screen
  if (!authenticated) {
    return (
      <View style={styles.loginContainer}>
        <View style={[styles.loginCard, isDesktop && styles.loginCardDesktop]}>
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
            onSubmitEditing={handleLogin}
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

          <TouchableOpacity 
            style={styles.backLink}
            onPress={() => router.push('/')}
          >
            <Ionicons name="arrow-back" size={20} color="#A0A0A0" />
            <Text style={styles.backLinkText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Dashboard
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Romuo.ch</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={fetchData}
          >
            <Ionicons name="refresh" size={20} color="#D4AF37" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setAuthenticated(false)}
          >
            <Ionicons name="log-out" size={20} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Desktop layout: Sidebar + Content */}
      <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
        {/* Tabs / Sidebar */}
        <View style={[styles.tabs, isDesktop && styles.tabsDesktop]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive, isDesktop && styles.tabDesktop]}
            onPress={() => setActiveTab('overview')}
          >
            <Ionicons 
              name="stats-chart" 
              size={20} 
              color={activeTab === 'overview' ? '#D4AF37' : '#A0A0A0'} 
            />
            {(isDesktop || activeTab === 'overview') && (
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                Aperçu
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.tabActive, isDesktop && styles.tabDesktop]}
            onPress={() => setActiveTab('users')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeTab === 'users' ? '#D4AF37' : '#A0A0A0'} 
            />
            {(isDesktop || activeTab === 'users') && (
              <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
                Utilisateurs
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rides' && styles.tabActive, isDesktop && styles.tabDesktop]}
            onPress={() => setActiveTab('rides')}
          >
            <Ionicons 
              name="car-sport" 
              size={20} 
              color={activeTab === 'rides' ? '#D4AF37' : '#A0A0A0'} 
            />
            {(isDesktop || activeTab === 'rides') && (
              <Text style={[styles.tabText, activeTab === 'rides' && styles.tabTextActive]}>
                Courses
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <ScrollView 
          style={[styles.content, isDesktop && styles.contentDesktop]}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <View>
              <Text style={styles.sectionTitle}>Statistiques</Text>
              <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
                <View style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
                  <Ionicons name="people" size={32} color="#D4AF37" />
                  <Text style={styles.statValue}>{stats.users.total}</Text>
                  <Text style={styles.statLabel}>Utilisateurs</Text>
                </View>
                <View style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
                  <Ionicons name="car-sport" size={32} color="#4CAF50" />
                  <Text style={styles.statValue}>{stats.users.drivers}</Text>
                  <Text style={styles.statLabel}>Chauffeurs</Text>
                </View>
                <View style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
                  <Ionicons name="checkmark-circle" size={32} color="#2196F3" />
                  <Text style={styles.statValue}>{stats.rides.completed}</Text>
                  <Text style={styles.statLabel}>Courses complétées</Text>
                </View>
                <View style={[styles.statCard, isDesktop && styles.statCardDesktop]}>
                  <Ionicons name="time" size={32} color="#FF9800" />
                  <Text style={styles.statValue}>{stats.rides.pending}</Text>
                  <Text style={styles.statLabel}>En attente</Text>
                </View>
              </View>

              {/* Revenue Card */}
              <View style={styles.revenueCard}>
                <View style={styles.revenueHeader}>
                  <Ionicons name="cash" size={28} color="#D4AF37" />
                  <Text style={styles.revenueTitle}>Revenu Total</Text>
                </View>
                <Text style={styles.revenueValue}>
                  {stats.revenue.total.toFixed(2)} CHF
                </Text>
              </View>
            </View>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <View>
              <Text style={styles.sectionTitle}>
                Utilisateurs ({users.length})
              </Text>
              <View style={[styles.listGrid, isDesktop && styles.listGridDesktop]}>
                {users.map((user) => (
                  <View key={user.user_id} style={[styles.listCard, isDesktop && styles.listCardDesktop]}>
                    <View style={styles.listCardHeader}>
                      <View style={styles.userAvatar}>
                        <Ionicons name="person" size={24} color="#D4AF37" />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.listCardTitle}>{user.name}</Text>
                        <Text style={styles.listCardSubtitle}>{user.email}</Text>
                      </View>
                      <View style={[
                        styles.badge, 
                        user.role === 'driver' ? styles.badgeDriver : styles.badgePassenger
                      ]}>
                        <Text style={styles.badgeText}>
                          {user.role === 'driver' ? 'Chauffeur' : 'Passager'}
                        </Text>
                      </View>
                    </View>
                    {user.account_type === 'business' && (
                      <View style={styles.businessInfo}>
                        <Ionicons name="business" size={16} color="#D4AF37" />
                        <Text style={styles.businessText}>
                          {user.company_name} {user.vat_number ? `- TVA: ${user.vat_number}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rides Tab */}
          {activeTab === 'rides' && (
            <View>
              <Text style={styles.sectionTitle}>
                Courses ({rides.length})
              </Text>
              <View style={[styles.listGrid, isDesktop && styles.listGridDesktop]}>
                {rides.map((ride) => (
                  <View key={ride.ride_id} style={[styles.listCard, isDesktop && styles.listCardDesktop]}>
                    <View style={styles.listCardHeader}>
                      <View style={styles.rideIcon}>
                        <Text style={styles.rideIconText}>
                          {ride.vehicle_type === 'eco' ? '🚗' : 
                           ride.vehicle_type === 'berline' ? '🚙' : '🚌'}
                        </Text>
                      </View>
                      <View style={styles.rideInfo}>
                        <Text style={styles.listCardTitle}>
                          Course #{ride.ride_id.slice(-8)}
                        </Text>
                        <Text style={styles.rideType}>
                          {ride.vehicle_type.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[
                        styles.badge,
                        ride.status === 'completed' ? styles.badgeSuccess :
                        ride.status === 'pending' ? styles.badgeWarning :
                        ride.status === 'accepted' ? styles.badgePrimary :
                        styles.badgeDefault
                      ]}>
                        <Text style={styles.badgeText}>{ride.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.rideDetails}>
                      <View style={styles.locationItem}>
                        <Ionicons name="location" size={16} color="#4CAF50" />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {ride.pickup?.address || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.locationItem}>
                        <Ionicons name="flag" size={16} color="#D4AF37" />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {ride.destination?.address || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rideFooter}>
                      <Text style={styles.ridePrice}>{ride.price.toFixed(2)} CHF</Text>
                      <Text style={styles.rideDistance}>{ride.distance_km.toFixed(1)} km</Text>
                    </View>

                    {ride.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.assignButton}
                        onPress={() => handleAssignDriver(ride.ride_id)}
                      >
                        <Ionicons name="person-add" size={18} color="#FFFFFF" />
                        <Text style={styles.assignButtonText}>Assigner Chauffeur</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Login Screen
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
  loginCardDesktop: {
    padding: 48,
    maxWidth: 480,
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
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  backLinkText: {
    fontSize: 14,
    color: '#A0A0A0',
  },

  // Dashboard
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
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  headerDesktop: {
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#D4AF37',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  tabsDesktop: {
    flexDirection: 'column',
    width: 220,
    paddingHorizontal: 0,
    paddingTop: 16,
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#2C2C2C',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  tabDesktop: {
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  tabText: {
    fontSize: 14,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#D4AF37',
  },

  // Content
  content: {
    flex: 1,
  },
  contentDesktop: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statsGridDesktop: {
    gap: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statCardDesktop: {
    minWidth: 200,
    flex: 0,
    padding: 24,
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

  // Revenue Card
  revenueCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  revenueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D4AF37',
  },

  // List Grid
  listGrid: {
    gap: 16,
  },
  listGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // List Cards
  listCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
  },
  listCardDesktop: {
    flex: 1,
    minWidth: 340,
    maxWidth: 400,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listCardSubtitle: {
    fontSize: 13,
    color: '#A0A0A0',
    marginTop: 2,
  },

  // Badges
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
  badgeDefault: {
    backgroundColor: '#666',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },

  // Business Info
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    gap: 8,
  },
  businessText: {
    fontSize: 13,
    color: '#D4AF37',
  },

  // Ride Card specifics
  rideIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideIconText: {
    fontSize: 24,
  },
  rideInfo: {
    flex: 1,
  },
  rideType: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 2,
  },
  rideDetails: {
    marginTop: 16,
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  ridePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
  },
  rideDistance: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
