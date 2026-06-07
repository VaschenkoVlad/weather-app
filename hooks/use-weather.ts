import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWeather, buildWeatherData, WeatherData } from '../services/weather';

interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWeather(lat: number, lng: number, city = 'Unknown', country = ''): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const raw = await fetchWeather(lat, lng);
        if (!cancelledRef.current) {
          setData(buildWeatherData(raw, city, country));
        }
      } catch (e: unknown) {
        if (!cancelledRef.current) {
          setError(e instanceof Error ? e.message : 'Failed to load weather');
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    }

    load();
    return () => { cancelledRef.current = true; };
  }, [lat, lng, city, country]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const raw = await fetchWeather(lat, lng);
      if (!cancelledRef.current) {
        setData(buildWeatherData(raw, city, country));
      }
    } catch (e: unknown) {
      if (!cancelledRef.current) {
        setError(e instanceof Error ? e.message : 'Failed to load weather');
      }
    }
  }, [lat, lng, city, country]);

  return { data, loading, error, refresh };
}
