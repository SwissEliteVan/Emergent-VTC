import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WebMapLeafletProps {
  currentLocation: { coords: { latitude: number; longitude: number } } | null;
}

// Simple placeholder map for web
// In production, you would use a proper map solution like Google Maps iframe
export default function WebMapLeaflet({ currentLocation }: WebMapLeafletProps) {
  const lat = currentLocation?.coords.latitude?.toFixed(4) || '46.5197';
  const lng = currentLocation?.coords.longitude?.toFixed(4) || '6.6323';

  // Use OpenStreetMap iframe embed for simple display
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          title="map"
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: 12 }}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng)-0.02},${Number(lat)-0.02},${Number(lng)+0.02},${Number(lat)+0.02}&layer=mapnik&marker=${lat},${lng}`}
        />
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={16} color="#FFFFFF" />
          <Text style={styles.locationText}>
            {lat}, {lng}
          </Text>
        </View>
      </View>
    );
  }

  // Fallback for non-web
  return (
    <View style={styles.mapPlaceholder}>
      <Ionicons name="map" size={64} color="#D4AF37" />
      <Text style={styles.placeholderText}>Carte</Text>
      <Text style={styles.coordsText}>
        {lat}, {lng}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
    backgroundColor: '#1A1A1A',
    position: 'relative',
  },
  locationBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  mapPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  coordsText: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 8,
  },
});
