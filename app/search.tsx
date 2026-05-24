import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GEOCODING_BASE, OPEN_METEO_BASE } from '../constants/server';
import type { AppThemeColors } from '../constants/themeColors';
import { useSettings, useTranslations } from './context/SettingsContext';

const FETCH_TIMEOUT = 10000;

const fetchWithTimeout = async (url: string, timeoutMs = FETCH_TIMEOUT) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
};

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
  const { convertTemperature, getTemperatureUnit, colors } = useSettings();
  const { getWeatherDescription, t } = useTranslations();

  const st = useMemo(() => createStyles(colors), [colors]);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  const fetchWeatherForCity = useCallback(async (lat: number, lon: number) => {
    try {
      const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const res = await fetchWithTimeout(url);
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
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(normalizedQuery)}&count=10&language=uk`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error('Помилка пошуку міст');
      }

      if (data.results && data.results.length > 0) {
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

  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<string> => {
    try {
      console.log('Search page: Starting reverse geocoding for:', latitude, longitude);
      
      // Використовуємо Open-Meteo Geocoding API як основний метод
      const url = `${GEOCODING_BASE}/reverse?latitude=${latitude}&longitude=${longitude}&limit=1`;
      console.log('Search page: Fetching from Open-Meteo:', url);
      
      const res = await fetchWithTimeout(url);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        // Пріоритет полів: name > town > village > city > admin1 > county
        const cityName = result.name || 
                        result.town || 
                        result.village || 
                        result.city || 
                        result.admin1 || 
                        result.county;
        
        if (cityName) {
          console.log('Search page: Found city name via Open-Meteo API:', cityName);
          return cityName;
        }
      }
      
      // Якщо Open-Meteo не спрацював, пробуємо expo-location
      try {
        const locationResults = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (locationResults && locationResults.length > 0) {
          const location = locationResults[0];
          // Пріоритет полів: city > town > village > district > subregion > region
          const cityName = location.city || 
                          location.town || 
                          location.village || 
                          location.district || 
                          location.subregion || 
                          location.region ||
                          location.admin1;
          
          if (cityName) {
            console.log('Search page: Found city name via expo-location:', cityName);
            return cityName;
          }
        }
      } catch (exploreError) {
        console.log('Search page: Expo reverse geocoding failed');
      }
      
      console.log('Search page: No city name found, using fallback');
      return t('currentLocation');
    } catch (e) {
      console.error('Search page: Reverse geocoding error:', e);
      return t('currentLocation');
    }
  }, [t]);

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

      // Отримуємо назву міста через покращений reverse geocoding
      const cityName = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      console.log('Search page: Final city name:', cityName);

      // Зберігаємо місто в AsyncStorage
      try {
        await AsyncStorage.multiSet([
          ['savedCityName', cityName],
          ['savedLatitude', pos.coords.latitude.toString()],
          ['savedLongitude', pos.coords.longitude.toString()]
        ]);
        console.log('City saved from search page:', cityName);
      } catch (error) {
        console.error('Error saving city from search page:', error);
      }

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
  }, [router, reverseGeocode]);

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
            const res = await fetchWithTimeout(url);
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
    <View style={st.container}>
      {/* Шапка */}
      <View style={st.header}>
        <Pressable style={st.backBtn} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={20} color="white" />
        </Pressable>
        <Text style={st.headerTitle}>{t('searchCity')}</Text>
        <View style={st.placeholder} />
      </View>

      {/* Пошуковий рядок */}
      <View style={st.searchContainer}>
        <Text style={st.searchIcon}>🔍</Text>
        <TextInput
          style={st.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Кнопка "Моє місцезнаходження" */}
      <Pressable style={st.locationBtn} onPress={handleFindMyLocation}>
        <Text style={st.locationIcon}>📍</Text>
        <Text style={st.locationText}>{t('myLocation')}</Text>
      </Pressable>

      {/* Популярні міста */}
      <Text style={st.sectionTitle}>{t('popularCities')}</Text>

      {/* Результати пошуку */}
      {loading ? (
        <View style={st.loadingContainer}>
          <ActivityIndicator size="small" color="#38bdf8" />
          <Text style={st.loadingText}>Пошук...</Text>
        </View>
      ) : error ? (
        <View style={st.errorContainer}>
          <Text style={st.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={st.resultsList} showsVerticalScrollIndicator={false}>
          {results.map((city, index) => (
            <Pressable key={index} style={st.cityCard} onPress={() => handleCityPress(city)}>
              <View style={st.cityInfo}>
                <Text style={st.cityName}>{city.name}</Text>
                <Text style={st.cityDetails}>
                  {city.admin1 && `${city.admin1}, `}{city.country}
                </Text>
              </View>
              {city.temperature !== undefined && (
                <View style={st.weatherInfo}>
                  <Text style={st.temperature}>{convertTemperature(city.temperature)}{getTemperatureUnit()}</Text>
                  <Text style={st.weatherIcon}>{getWeatherIcon(city.weathercode ?? 0)}</Text>
                  <Text style={st.localTime}>{getLocalTime(city.timezone)}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(colors: AppThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
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
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  // Пошук
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    color: colors.text,
  },
  // Кнопка локації
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
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
    color: colors.hourActiveText,
  },
  // Секції
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.textMuted,
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
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 4,
  },
  cityDetails: {
    fontSize: 14,
    color: colors.textMuted,
  },
  weatherInfo: {
    alignItems: 'flex-end',
  },
  temperature: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  weatherIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  localTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  noWeatherData: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
}
