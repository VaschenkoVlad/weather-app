import { useState } from 'react';
import * as Location from 'expo-location';
import { reverseGeocode } from '../services/weather';

interface CurrentLocationResult {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getLocation(): Promise<CurrentLocationResult | null> {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lng } = pos.coords;

      const geo = await reverseGeocode(lat, lng);
      const city = geo?.city ?? geo?.town ?? geo?.village ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      const country = geo?.country ?? '';

      return { lat, lng, city, country };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get location';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { getLocation, loading, error };
}
