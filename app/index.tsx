import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GEOCODING_BASE, OPEN_METEO_BASE } from '../constants/server';
import { useSettings, useTranslations } from './context/SettingsContext';

interface WeatherData {
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weathercode: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
  city?: string;
}

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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.getHours().toString().padStart(2, '0') + ':00';
}

function convertWindSpeed(ms: number, unit: 'kmh' | 'ms'): number {
  if (unit === 'kmh') {
    return Math.round(ms * 3.6);
  }
  return Math.round(ms);
}

export default function WeatherScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lat = params.lat as string | undefined;
  const lon = params.lon as string | undefined;
  const city = params.city as string | undefined;

  const { convertTemperature, getTemperatureUnit, getWindUnit, settings } = useSettings();
  const { getWeatherDescription, getWeekdayName, t } = useTranslations();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchWeather = useCallback(async (latitude: string, longitude: string, cityName?: string) => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      const url = `${OPEN_METEO_BASE}/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current_weather=true&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log('Open-Meteo API response:', data);
      
      if (!res.ok) {
        throw new Error('Помилка отримання даних');
      }

      if (!data) {
        throw new Error('Порожня відповідь від сервера');
      }

      const weatherData: WeatherData = {
        current_weather: data.current_weather || undefined,
        hourly: data.hourly || undefined,
        daily: data.daily || undefined,
        city: cityName || undefined
      };

      setWeather(weatherData);
    } catch (e: any) {
      console.error('Weather fetch error:', e);
      setError(e?.message || 'Помилка мережі');
    } finally {
      setLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      // Спочатку пробуємо expo-location reverse geocoding
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
            console.log('Found city name via expo-location:', cityName);
            return cityName;
          }
        }
      } catch (exploreError) {
        console.log('Expo reverse geocoding failed, trying Open-Meteo API');
      }

      // Якщо expo-location не спрацював, використовуємо Open-Meteo Geocoding API
      const url = `${GEOCODING_BASE}/reverse?latitude=${latitude}&longitude=${longitude}&limit=1`;
      const res = await fetch(url);
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
        
        console.log('Found city name via Open-Meteo API:', cityName);
        return cityName || t('currentLocation');
      }
      
      console.log('No city name found, using fallback');
      return t('currentLocation');
    } catch (e) {
      console.error('Reverse geocoding error:', e);
      return t('currentLocation');
    }
  }, [t]);

  useEffect(() => {
    if (lat && lon) {
      console.log('Effect triggered with params:', { lat, lon, city });
      
      if (!city) {
        // Якщо місто не передано, спробувати отримати назву через reverse geocoding
        console.log('No city provided, performing reverse geocoding...');
        reverseGeocode(parseFloat(lat), parseFloat(lon)).then(cityName => {
          console.log('Reverse geocoding completed:', cityName);
          fetchWeather(lat, lon, cityName);
        }).catch(error => {
          console.error('Reverse geocoding failed:', error);
          fetchWeather(lat, lon, t('currentLocation'));
        });
      } else {
        console.log('Using provided city name:', city);
        fetchWeather(lat, lon, city);
      }
    } else {
      // Якщо немає координат, показуємо welcome екран
      console.log('No coordinates provided, showing welcome screen');
      setLoading(false);
      return;
    }
  }, [lat, lon, city, fetchWeather, reverseGeocode, t]);

  // Запит дозволу на сповіщення (працює і в Expo Go, і в build)
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Перевіряємо чи додаток запущений в Expo Go
        const isExpoGo = Constants.appOwnership === 'expo';
        
        if (isExpoGo) {
          console.log('Running in Expo Go - requesting local notification permissions only');
        } else {
          console.log('Running in build - requesting full notification permissions');
        }

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
        } else {
          console.log('Notification permissions granted');
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };

    requestPermissions();
  }, []);

  // Функція для миттєвого сповіщення (працює і в Expo Go, і в build)
  const sendInstantNotification = useCallback(async () => {
    try {
      // Перевіряємо чи додаток запущений в Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (isExpoGo) {
        console.log('Running in Expo Go - sending local notification only');
      } else {
        console.log('Running in build - sending notification with full features');
      }

      // Локальні сповіщення працюють і в Expo Go, і в build
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Йо, прогноз апдейтнувся 🌤️",
          body: "Бро, швидко глянь погоду — сьогодні вайбова температура 😎",
          sound: 'default',
          // В Expo Go priority може не працювати, але це не викличе помилку
          ...(isExpoGo ? {} : { priority: Notifications.AndroidNotificationPriority.HIGH }),
        },
        trigger: { seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL }, // Сповіщення через 1 секунду
      });
      
      console.log('Test notification scheduled successfully');
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }, []);

  const handleSearchPress = useCallback(() => {
    router.push('/search');
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    router.push('/settings');
  }, [router]);

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

      console.log('Got coordinates:', pos.coords.latitude, pos.coords.longitude);

      // Отримуємо назву міста через reverse geocoding
      const cityName = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      
      console.log('City name determined:', cityName);

      // Оновлюємо поточну сторінку з новими координатами та назвою міста
      router.replace({ 
        pathname: '/', 
        params: { 
          lat: String(pos.coords.latitude), 
          lon: String(pos.coords.longitude),
          city: cityName
        } 
      });
    } catch (e) {
      console.error('Location error:', e);
    }
  }, [router, reverseGeocode]);

  // Welcome screen state - показуємо якщо немає даних погоди
  if (!lat && !lon && !loading && !error) {
    return (
      <View style={styles.welcomeContainer}>
        {/* Декоративний елемент фону */}
        <View style={styles.sunGlow} />

        <View style={styles.welcomeContent}>
          <Text style={styles.appLogo}>☁️</Text>
          <Text style={styles.appName}>{t('welcome')}</Text>
          <Text style={styles.appTagline}>
            {t('tagline')}
          </Text>

          <View style={styles.btnGroup}>
            <TouchableOpacity 
              style={styles.btnPrimary} 
              onPress={handleFindMyLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.btnIcon}>📍</Text>
              <Text style={styles.btnText}>{t('findLocation')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnSecondary} 
              onPress={handleSearchPress}
              activeOpacity={0.8}
            >
              <Text style={styles.btnIcon}>🔍</Text>
              <Text style={styles.btnText}>{t('selectCity')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnNotification} 
              onPress={sendInstantNotification}
              activeOpacity={0.8}
            >
              <Text style={styles.btnIcon}>🔔</Text>
              <Text style={styles.btnText}>Test notification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleFindMyLocation}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <Text style={styles.searchButtonText}>{t('searchCity')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // No data state
  if (!weather || !weather.current_weather) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noData')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleFindMyLocation}>
            <Text style={styles.retryButtonText}>{t('findLocation')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <Text style={styles.searchButtonText}>{t('searchCity')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentTemp = convertTemperature(weather.current_weather?.temperature ?? 0);
  const description = getWeatherDescription(weather.current_weather?.weathercode ?? 0);
  const windSpeed = convertWindSpeed(weather.current_weather?.windspeed ?? 0, settings.windUnit);
  const windDirection = weather.current_weather?.winddirection ?? undefined;
  const humidity = undefined; // Open-Meteo не надає вологість в current_weather
  const pressure = undefined; // Open-Meteo не надає тиск в current_weather

  // Генерація погодинних даних
  const hourlyData = weather.hourly?.time?.slice(0, 24).map((time, index) => {
    const hour = new Date(time).getHours();
    const currentHour = new Date().getHours();
    return {
      time: formatTime(time),
      temp: convertTemperature(weather.hourly?.temperature_2m?.[index] ?? 0),
      icon: getWeatherIcon(weather.hourly?.weathercode?.[index] ?? 0),
      isActive: hour === currentHour // Підсвітка поточної години
    };
  }) || [];

  // Генерація даних на тиждень
  const weeklyData = weather.daily?.time?.slice(0, 7).map((time, index) => ({
    dayName: getWeekdayName(time),
    icon: getWeatherIcon(weather.daily?.weathercode?.[index] ?? 0),
    maxTemp: convertTemperature(weather.daily?.temperature_2m_max?.[index] ?? 0),
    minTemp: convertTemperature(weather.daily?.temperature_2m_min?.[index] ?? 0)
  })) || [];

  const currentDate = new Date().toLocaleDateString(settings.language === 'ua' ? 'uk-UA' : 'en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollWrapper} showsVerticalScrollIndicator={false}>
        {/* Шапка */}
        <View style={styles.topBar}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{weather.city || t('currentLocation')}</Text>
            <Text style={styles.locationDate}>{currentDate}</Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleSearchPress}>
              <Text style={styles.iconText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleSettingsPress}>
              <Text style={styles.iconText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Геро-блок (Температура) */}
        <View style={styles.heroSection}>
          <Text style={styles.mainTemp}>{currentTemp}{getTemperatureUnit()}</Text>
          <Text style={styles.weatherStatus}>{description}</Text>
        </View>

        {/* Метрики */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🌬️</Text>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>{t('wind')}</Text>
              <Text style={styles.metricValue}>{windSpeed} {getWindUnit()}</Text>
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>💧</Text>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>{t('humidity')}</Text>
              <Text style={styles.metricValue}>{humidity !== undefined ? `${humidity}%` : 'undefined'}</Text>
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🌡️</Text>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>{t('feelsLike')}</Text>
              <Text style={styles.metricValue}>{currentTemp - 2}{getTemperatureUnit()}</Text>
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⏲️</Text>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>{t('pressure')}</Text>
              <Text style={styles.metricValue}>{pressure !== undefined ? `${pressure} hPa` : 'undefined'}</Text>
            </View>
          </View>
        </View>

        {/* Погодинний скрол */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('next24Hours')}</Text>
          <Text style={styles.scrollHint}>{t('scrollHint')}</Text>
        </View>
        <ScrollView 
          horizontal 
          style={styles.hourlyScroll} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlyContent}
        >
          {hourlyData.map((hour, index) => (
            <View key={index} style={[styles.hourCard, hour.isActive && styles.activeHourCard]}>
              <Text style={styles.hourTime}>{hour.time}</Text>
              <Text style={styles.hourIcon}>{hour.icon}</Text>
              <Text style={styles.hourTemp}>{hour.temp}{getTemperatureUnit()}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Список днів */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('weeklyForecast')}</Text>
        </View>
        <View style={styles.weeklyList}>
          {weeklyData.map((day, index) => (
            <TouchableOpacity key={index} style={styles.dayButton}>
              <Text style={styles.dayName}>{day.dayName}</Text>
              <Text style={styles.dayIcon}>{day.icon}</Text>
              <View style={styles.dayRange}>
                <Text style={styles.dayMaxTemp}>{day.maxTemp}{getTemperatureUnit()}</Text>
                <Text style={styles.dayMinTemp}>{day.minTemp}{getTemperatureUnit()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  // Welcome styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    position: 'relative',
  },
  sunGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: 'transparent',
    borderRadius: 150,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 100,
    elevation: 0,
  },
  welcomeContent: {
    textAlign: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  appLogo: {
    fontSize: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -1,
    color: 'white',
  },
  appTagline: {
    fontSize: 15,
    opacity: 0.6,
    marginBottom: 50,
    lineHeight: 22,
    textAlign: 'center',
    color: 'white',
  },
  btnGroup: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: '#38bdf8',
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  btnIcon: {
    fontSize: 20,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  btnNotification: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  // Weather styles
  scrollWrapper: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#64748b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Шапка
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  locationDate: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    borderRadius: 14,
  },
  iconText: {
    fontSize: 16,
  },
  // Геро-блок
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  mainTemp: {
    fontSize: 100,
    fontWeight: '300',
    color: 'white',
  },
  weatherStatus: {
    color: '#38bdf8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontSize: 14,
    marginTop: 10,
  },
  // Метрики
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 25,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '48%',
  },
  metricIcon: {
    fontSize: 20,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  // Секції
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  scrollHint: {
    fontSize: 12,
    color: '#94a3b8',
  },
  // Погодинний скрол
  hourlyScroll: {
    marginBottom: 15,
  },
  hourlyContent: {
    gap: 10,
  },
  hourCard: {
    minWidth: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeHourCard: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  hourTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 8,
  },
  hourIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  hourTemp: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  // Список днів
  weeklyList: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 30,
  },
  dayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 18,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontWeight: '600',
    color: 'white',
    width: 45,
  },
  dayIcon: {
    fontSize: 20,
  },
  dayRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayMaxTemp: {
    fontWeight: '700',
    fontSize: 14,
    color: 'white',
  },
  dayMinTemp: {
    fontWeight: '400',
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 8,
  },
});
