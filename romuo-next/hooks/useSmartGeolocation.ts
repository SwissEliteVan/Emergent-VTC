'use client';

import { useEffect, useState } from 'react';

export interface GeoPosition {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  source: 'browser' | 'ip' | 'manual';
}

export function useSmartGeolocation() {
  const [position, setPosition] = useState<GeoPosition>({ source: 'manual' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handlePosition = (coords: GeolocationPosition) => {
      if (!mounted) return;
      setPosition({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
        source: 'browser',
      });
      setLoading(false);
    };

    const handleFallback = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (!mounted) return;
        setPosition({
          city: data.city,
          region: data.region,
          country: data.country_name,
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip',
        });
      } catch (error) {
        if (!mounted) return;
        setPosition({ source: 'manual' });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      handleFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(handlePosition, handleFallback, {
      enableHighAccuracy: true,
      timeout: 4000,
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { position, loading };
}
