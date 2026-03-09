import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GEOCODING_BASE, OPEN_METEO_BASE } from '../constants/server';
import { useSettings, useTranslations } from './context/SettingsContext';

interface SearchResult {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  admin1?: string;
  temperature?: number;
  weathercode?: number;
  timezone?: string;
}

const POPULAR_CITIES = ['Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків'];

const weatherIcons: { [key: number]: string } = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️',
  55: '🌧️', 56: '🌧️', 57: '🌧️', 61: '🌧️',
  63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '🌧️', 85: '🌨️',
  86: '🌨️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function getWeatherIcon(code: number): string {
  return weatherIcons[code] || '❓';
}

function getLocalTime(timezone?: string): string {
  if (!timezone) return new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  try {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: timezone 
    });
  } catch {
    return new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  }
}

export default function SearchScreen() {
  const router = useRouter();
  const { convertTemperature, getTemperatureUnit } = useSettings();
  const { getWeatherDescription, t } = useTranslations();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  const fetchWeatherForCity = useCallback(async (lat: number, lon: number) => {
    try {
      const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok && data.current_weather) {
        return {
          temperature: data.current_weather.temperature,
          weathercode: data.current_weather.weathercode,
          timezone: data.timezone,
        };
      }
      return null;
    } catch (e) {
      console.error('Weather fetch error:', e);
      return null;
    }
  }, []);

  const searchCities = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(searchQuery)}&count=10&language=uk`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error('Помилка пошуку міст');
      }

      if (data.results && data.results.length > 0) {
        // Отримуємо погоду для кожного міста
        const citiesWithWeather = await Promise.all(
          data.results.map(async (city: any) => {
            const weather = await fetchWeatherForCity(city.latitude, city.longitude);
            return {
              name: city.name,
              lat: city.latitude,
              lon: city.longitude,
              country: city.country,
              admin1: city.admin1,
              temperature: weather?.temperature,
              weathercode: weather?.weathercode,
              timezone: weather?.timezone,
            };
          })
        );

        setResults(citiesWithWeather);
      } else {
        setResults([]);
      }
    } catch (e: any) {
      console.error('Search error:', e);
      setError(e?.message || 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  }, [fetchWeatherForCity]);

  const handleFindMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!pos?.coords) {
        console.log('No coordinates available');
        return;
      }

      // Отримуємо назву міста через reverse geocoding
      const reverseUrl = `${GEOCODING_BASE}/reverse?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&limit=1`;
      const reverseRes = await fetch(reverseUrl);
      const reverseData = await reverseRes.json();

      const cityName = reverseData.results?.[0]?.name || t('currentLocation');

      // Переходимо на головний екран погоди з координатами
      router.replace({
        pathname: '/',
        params: {
          lat: String(pos.coords.latitude),
          lon: String(pos.coords.longitude),
          city: cityName,
        },
      });
    } catch (e) {
      console.error('Location error:', e);
    }
  }, [router, t]);

  const handleCityPress = useCallback((city: SearchResult) => {
    // Переходимо на головний екран погоди з координатами
    router.replace({
      pathname: '/',
      params: {
        lat: String(city.lat),
        lon: String(city.lon),
        city: city.name,
      },
    });
  }, [router]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      searchCities(query);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [query, searchCities]);

  // Load popular cities on mount
  useEffect(() => {
    const loadPopularCities = async () => {
      setLoading(true);
      try {
        const citiesWithWeather = await Promise.all(
          POPULAR_CITIES.map(async (cityName) => {
            const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(cityName)}&count=1&language=uk`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
              const city = data.results[0];
              const weather = await fetchWeatherForCity(city.latitude, city.longitude);
              return {
                name: city.name,
                lat: city.latitude,
                lon: city.longitude,
                country: city.country,
                admin1: city.admin1,
                temperature: weather?.temperature,
                weathercode: weather?.weathercode,
                timezone: weather?.timezone,
              };
            }
            return null;
          })
        );

        setResults(citiesWithWeather.filter(Boolean) as SearchResult[]);
      } catch (e) {
        console.error('Error loading popular cities:', e);
      } finally {
        setLoading(false);
      }
    };

    loadPopularCities();
  }, [fetchWeatherForCity]);

  return (
    <View style={styles.container}>
      {/* Шапка */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBackPress}>
          <Text style={styles.backText}>{t('back')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('searchCity')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Пошуковий рядок */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Кнопка "Моє місцезнаходження" */}
      <Pressable style={styles.locationBtn} onPress={handleFindMyLocation}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>{t('myLocation')}</Text>
      </Pressable>

      {/* Популярні міста */}
      <Text style={styles.sectionTitle}>{t('popularCities')}</Text>

      {/* Результати пошуку */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#38bdf8" />
          <Text style={styles.loadingText}>Пошук...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
          {results.map((city, index) => (
            <Pressable key={index} style={styles.cityCard} onPress={() => handleCityPress(city)}>
              <View style={styles.cityInfo}>
                <Text style={styles.cityName}>{city.name}</Text>
                <Text style={styles.cityDetails}>
                  {city.admin1 && `${city.admin1}, `}{city.country}
                </Text>
              </View>
              <View style={styles.weatherInfo}>
                {city.temperature !== undefined && city.weathercode !== undefined ? (
                  <>
                    <Text style={styles.temperature}>
                      {convertTemperature(city.temperature)}{getTemperatureUnit()}
                    </Text>
                    <Text style={styles.weatherIcon}>
                      {getWeatherIcon(city.weathercode)}
                    </Text>
                    <Text style={styles.localTime}>
                      {getLocalTime(city.timezone)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.noWeatherData}>—</Text>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  // Шапка
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 20,
    color: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  placeholder: {
    width: 44,
  },
  // Пошук
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  // Кнопка локації
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  // Секції
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  // Результати
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#94a3b8',
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  cityDetails: {
    fontSize: 14,
    color: '#94a3b8',
  },
  weatherInfo: {
    alignItems: 'flex-end',
  },
  temperature: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  weatherIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  localTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  noWeatherData: {
    fontSize: 16,
    color: '#94a3b8',
  },
});
