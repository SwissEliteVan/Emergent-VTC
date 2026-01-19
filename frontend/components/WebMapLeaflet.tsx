import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

interface WebMapLeafletProps {
  currentLocation: { coords: { latitude: number; longitude: number } } | null;
}

export default function WebMapLeaflet({ currentLocation }: WebMapLeafletProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Import Leaflet dynamically (web only)
    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      // Fix Leaflet marker icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const lat = currentLocation?.coords.latitude || 46.5197;
      const lng = currentLocation?.coords.longitude || 6.6323;

      // Create map if not exists
      if (!mapRef.current && mapContainerRef.current) {
        mapRef.current = L.map('map-container').setView([lat, lng], 13);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Add marker
        if (currentLocation) {
          L.marker([lat, lng])
            .addTo(mapRef.current)
            .bindPopup('Votre position')
            .openPopup();
        }
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <div
        id="map-container"
        ref={mapContainerRef as any}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          borderRadius: '12px',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
});