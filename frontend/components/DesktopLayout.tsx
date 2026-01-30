import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';

const VEHICLES = [
  {
    id: 'eco',
    name: 'Éco',
    capacity: '1-3',
    luggage: '2',
    price: 42,
    tagline: 'Le meilleur prix',
  },
  {
    id: 'berline',
    name: 'Berline',
    capacity: '1-4',
    luggage: '3',
    price: 68,
    tagline: 'Confort premium',
  },
  {
    id: 'van',
    name: 'Van',
    capacity: '5-7',
    luggage: '6',
    price: 96,
    tagline: 'Groupes & bagages',
  },
];

export default function DesktopLayout() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>('berline');

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>R</Text>
          </View>
          <Text style={styles.logoText}>ROMUO</Text>
        </View>

        <View style={styles.formSection}>
          <Pressable style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Départ</Text>
            <Text style={styles.fieldValue}>Rue du Rhône 10, Genève</Text>
          </Pressable>
          <Pressable style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Arrivée</Text>
            <Text style={styles.fieldPlaceholder}>Où allez-vous ?</Text>
          </Pressable>
          <Pressable style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={styles.fieldValue}>Aujourd'hui • 18:30</Text>
          </Pressable>
        </View>

        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleTitle}>Véhicules disponibles</Text>
          <Text style={styles.vehicleSubtitle}>Service premium, chauffeurs vérifiés</Text>
        </View>

        <ScrollView
          style={styles.vehicleList}
          contentContainerStyle={styles.vehicleListContent}
          showsVerticalScrollIndicator={false}
        >
          {VEHICLES.map((vehicle) => {
            const isSelected = selectedVehicle === vehicle.id;
            return (
              <Pressable
                key={vehicle.id}
                onPress={() => setSelectedVehicle(vehicle.id)}
                style={({ hovered, pressed }) => [
                  styles.vehicleCard,
                  hovered && styles.vehicleCardHover,
                  pressed && styles.vehicleCardPressed,
                  isSelected && styles.vehicleCardSelected,
                ]}
              >
                <View style={styles.vehicleImage}>
                  <Text style={styles.vehicleImageText}>{vehicle.name}</Text>
                </View>

                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehicleTagline}>{vehicle.tagline}</Text>
                  <View style={styles.vehicleMetaRow}>
                    <Text style={styles.vehicleMeta}>👤 {vehicle.capacity}</Text>
                    <Text style={styles.vehicleMeta}>🧳 {vehicle.luggage}</Text>
                  </View>
                </View>

                <View style={styles.vehicleAction}>
                  <Text style={styles.vehiclePrice}>{vehicle.price} CHF</Text>
                  <Pressable style={styles.reserveButton}>
                    <Text style={styles.reserveButtonText}>Réserver</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.mapArea}>
        <View style={styles.mapSurface}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Carte en temps réel</Text>
            <Text style={styles.mapSubtitle}>Vue premium type Blacklane</Text>
          </View>
          <View style={styles.mapCanvas}>
            <View style={styles.mapGlow} />
            <View style={styles.mapPin} />
            <View style={styles.mapRoadVertical} />
            <View style={styles.mapRoadHorizontal} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EEF1F5',
  },
  sidebar: {
    width: '35%',
    minWidth: 450,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 6, height: 0 },
    elevation: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoMarkText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#0B1220',
  },
  formSection: {
    gap: 14,
    marginBottom: 24,
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667085',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101828',
  },
  fieldPlaceholder: {
    fontSize: 16,
    color: '#98A2B3',
  },
  vehicleHeader: {
    marginBottom: 16,
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#667085',
    marginTop: 4,
  },
  vehicleList: {
    flex: 1,
  },
  vehicleListContent: {
    paddingBottom: 24,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  vehicleCardHover: {
    backgroundColor: '#F8FAFC',
  },
  vehicleCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  vehicleCardSelected: {
    borderColor: '#0B1220',
  },
  vehicleImage: {
    width: 90,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleImageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 4,
  },
  vehicleTagline: {
    fontSize: 13,
    color: '#667085',
    marginBottom: 8,
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleMeta: {
    fontSize: 13,
    color: '#475467',
  },
  vehicleAction: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    marginBottom: 10,
  },
  reserveButton: {
    backgroundColor: '#0B1220',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  mapArea: {
    flex: 1,
    padding: 24,
  },
  mapSurface: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 26,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
  },
  mapHeader: {
    marginBottom: 18,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#D0D5DD',
    marginTop: 6,
  },
  mapCanvas: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    position: 'relative',
  },
  mapGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    top: 40,
    right: 60,
  },
  mapPin: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FBBF24',
    top: 140,
    left: 120,
  },
  mapRoadVertical: {
    position: 'absolute',
    width: 4,
    height: '70%',
    backgroundColor: '#1F2937',
    left: '50%',
    top: 30,
    borderRadius: 2,
  },
  mapRoadHorizontal: {
    position: 'absolute',
    height: 4,
    width: '70%',
    backgroundColor: '#1F2937',
    left: 40,
    top: '55%',
    borderRadius: 2,
  },
});
