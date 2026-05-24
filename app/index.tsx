import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GEOCODING_BASE, OPEN_METEO_BASE } from '../constants/server';
import type { AppThemeColors } from '../constants/themeColors';
import { useSettings, useTranslations } from './context/SettingsContext';

const Logo = require('../assets/raindji.png');

// Функції для роботи зі збереженим містом
const saveCityToStorage = async (cityName: string, latitude: number, longitude: number) => {
  try {
    await AsyncStorage.multiSet([
      ['savedCityName', cityName],
      ['savedLatitude', latitude.toString()],
      ['savedLongitude', longitude.toString()]
    ]);
    console.log('City saved to storage:', cityName);
  } catch (error) {
    console.error('Error saving city to storage:', error);
  }
};

const loadCityFromStorage = async () => {
  try {
    const values = await AsyncStorage.multiGet(['savedCityName', 'savedLatitude', 'savedLongitude']);
    const cityName = values[0]?.[1];
    const latitude = values[1]?.[1];
    const longitude = values[2]?.[1];
    
    if (cityName && latitude && longitude) {
      console.log('City loaded from storage:', cityName);
      return {
        cityName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading city from storage:', error);
    return null;
  }
};

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
    relativehumidity_2m?: number[];
    pressure_msl?: number[];
    apparent_temperature?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
  city?: string;
  current?: {
    apparent_temperature: number;
  };
}

const FETCH_TIMEOUT = 15000;

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

const CACHE_KEY = 'cached_weather';
const CACHE_META_KEY = 'cached_weather_meta';

const saveWeatherCache = async (data: WeatherData, lat: string, lon: string) => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(CACHE_META_KEY, JSON.stringify({ lat, lon, time: Date.now() }));
  } catch (e) {
    console.error('Cache save error:', e);
  }
};

const loadWeatherCache = async (lat: string, lon: string): Promise<WeatherData | null> => {
  try {
    const meta = await AsyncStorage.getItem(CACHE_META_KEY);
    if (!meta) return null;
    const parsed = JSON.parse(meta);
    if (parsed.lat !== lat || parsed.lon !== lon) return null;
    if (Date.now() - parsed.time > 30 * 60 * 1000) return null;
    const data = await AsyncStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

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

function convertWindSpeed(kmh: number, unit: 'kmh' | 'ms'): number {
  if (unit === 'ms') {
    return Math.round(kmh / 3.6);
  }
  return Math.round(kmh);
}

export default function WeatherScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lat = params.lat as string | undefined;
  const lon = params.lon as string | undefined;
  const city = params.city as string | undefined;

  const { convertTemperature, getTemperatureUnit, getWindUnit, settings, colors } = useSettings();
  const { getWeatherDescription, getWeekdayName, t } = useTranslations();

  const st = useMemo(() => createStyles(colors), [colors]);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const hasFetched = useRef(false);
  const hourlyScrollRef = useRef<ScrollView>(null);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<string> => {
    try {
      console.log('Starting reverse geocoding for:', latitude, longitude);
      
      // Використовуємо Open-Meteo Geocoding API як основний метод
      const url = `${GEOCODING_BASE}/reverse?latitude=${latitude}&longitude=${longitude}&limit=1`;
      console.log('Fetching from Open-Meteo:', url);
      
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
          console.log('Found city name via Open-Meteo API:', cityName);
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
            console.log('Found city name via expo-location:', cityName);
            return cityName;
          }
        }
      } catch (exploreError) {
        console.log('Expo reverse geocoding failed');
      }
      
      console.log('No city name found, using fallback');
      return t('currentLocation');
    } catch (e) {
      console.error('Reverse geocoding error:', e);
      return t('currentLocation');
    }
  }, [t]);

  const fetchWeather = useCallback(async (latitude: string, longitude: string, cityName?: string) => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      // Завжди виконуємо reverse geocoding якщо немає назви міста
      let finalCityName = cityName;
      if (!finalCityName) {
        console.log('No city name provided, performing reverse geocoding');
        finalCityName = await reverseGeocode(parseFloat(latitude), parseFloat(longitude));
      }

      const url = `${OPEN_METEO_BASE}/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current_weather=true&hourly=temperature_2m,weathercode,relativehumidity_2m,pressure_msl,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weathercode&current=apparent_temperature&timezone=auto`;
      
      const res = await fetchWithTimeout(url);
      const data = await res.json();
      
      console.log('Open-Meteo API response:', data);
      console.log('Hourly data structure:', {
        time: data.hourly?.time?.slice(0, 5),
        temperature: data.hourly?.temperature_2m?.slice(0, 5),
        humidity: data.hourly?.relativehumidity_2m?.slice(0, 5),
        pressure: data.hourly?.pressure_msl?.slice(0, 5),
        weathercode: data.hourly?.weathercode?.slice(0, 5)
      });
      console.log('Daily data structure:', {
        time: data.daily?.time?.slice(0, 7),
        maxTemp: data.daily?.temperature_2m_max?.slice(0, 7),
        minTemp: data.daily?.temperature_2m_min?.slice(0, 7),
        weathercode: data.daily?.weathercode?.slice(0, 7)
      });
      
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
        city: finalCityName || undefined,
        current: data.current || undefined,
      };

      console.log('Setting weather data with city:', finalCityName);
      setWeather(weatherData);
      saveWeatherCache(weatherData, latitude, longitude);
    } catch (e: any) {
      console.error('Weather fetch error:', e);
      const cached = await loadWeatherCache(latitude, longitude);
      if (cached) {
        console.log('Using cached weather data');
        setWeather(cached);
        return;
      }
      setError(e?.message || 'Помилка мережі');
    } finally {
      setLoading(false);
    }
  }, [reverseGeocode]);

  // Скидаємо hasFetched при зміні локації
  useEffect(() => {
    hasFetched.current = false;
  }, [lat, lon]);

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
        // Зберігаємо місто якщо воно передано через параметри
        saveCityToStorage(city, parseFloat(lat), parseFloat(lon));
        fetchWeather(lat, lon, city);
      }
    } else {
      // Якщо немає координат, показуємо welcome екран
      console.log('No coordinates provided, showing welcome screen');
      setLoading(false);
      return;
    }
  }, [lat, lon, city, fetchWeather, reverseGeocode, t]);

  // Скидаємо selectedDayIndex при зміні локації
  useEffect(() => {
    setSelectedDayIndex(0);
  }, [lat, lon]);

  // Функція для вибору дня
  const selectDay = useCallback((dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
  }, []);

  // Завантаження збереженого міста при старті додатку
  useEffect(() => {
    const loadSavedCity = async () => {
      if (!lat && !lon) {
        const savedCity = await loadCityFromStorage();
        if (savedCity) {
          router.replace({
            pathname: '/',
            params: {
              lat: savedCity.latitude.toString(),
              lon: savedCity.longitude.toString(),
              city: savedCity.cityName
            }
          });
        }
      }
    };
    
    loadSavedCity();
  }, [lat, lon, router]);

  // Запит дозволу на сповіщення (один раз при монтуванні)
  useEffect(() => {
    Notifications.requestPermissionsAsync().then(({ status }) => {
      console.log('Notification permission status:', status);
    });
  }, []);

  // Планування щоденних сповіщень
  useEffect(() => {
    const scheduleNotifications = async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!settings.pushNotifications) return;

      try {
        for (const timeStr of settings.notificationTimes) {
          const [h, m] = timeStr.split(':').map(Number);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Raindji Weather ☁️",
              body: "Час перевірити прогноз на сьогодні!",
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: h,
              minute: m,
            },
          });
          console.log('Daily notification scheduled for', timeStr);
        }
      } catch (error) {
        console.error('Error scheduling notifications:', error);
      }
    };

    scheduleNotifications();
  }, [settings.pushNotifications, settings.notificationTimes.join(',')]);

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

      // Зберігаємо місто в AsyncStorage
      await saveCityToStorage(cityName, pos.coords.latitude, pos.coords.longitude);

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

  // Визначаємо стан рендеру після всіх hooks
  const shouldShowWelcome = !lat && !lon && !loading && !error;
  const shouldShowLoading = loading;
  const shouldShowError = error;
  const shouldShowNoData = !weather || !weather.current_weather;

  // Обробка даних погоди тільки якщо weather існує
  const currentTemp = weather ? convertTemperature(weather.current_weather?.temperature ?? 0) : 0;
  const description = weather ? getWeatherDescription(weather.current_weather?.weathercode ?? 0) : '';
  const windSpeed = weather ? convertWindSpeed(weather.current_weather?.windspeed ?? 0, settings.windUnit) : 0;
  const windDirection = weather ? weather.current_weather?.winddirection : undefined;
  
  // Відчувається як — з current.apparent_temperature або поточної години
  const feelsLike = useMemo(() => {
    if (weather?.current?.apparent_temperature !== undefined) {
      return convertTemperature(weather.current.apparent_temperature);
    }
    if (weather?.hourly?.apparent_temperature && weather.hourly.time) {
      const now = new Date();
      const currentHourStr = now.getHours().toString().padStart(2, '0') + ':00';
      const idx = weather.hourly.time.findIndex(t => t.includes(currentHourStr));
      if (idx !== -1 && weather.hourly.apparent_temperature[idx] !== undefined) {
        return convertTemperature(weather.hourly.apparent_temperature[idx]);
      }
    }
    return currentTemp - 2;
  }, [weather, currentTemp, convertTemperature]);

  // Отримуємо вологість та тиск для поточної години вибраного дня
  const getHourlyDataForSelectedDay = () => {
    if (!weather?.hourly?.time) return { humidity: undefined, pressure: undefined };
    
    const today = new Date();
    const selectedDate = new Date(today);
    selectedDate.setDate(today.getDate() + selectedDayIndex);
    const currentHour = new Date().getHours();
    
    // Знаходимо індекс години для вибраного дня
    const hourIndex = weather.hourly.time.findIndex(time => {
      const hourDate = new Date(time);
      return hourDate.getHours() === currentHour && 
             hourDate.toDateString() === selectedDate.toDateString();
    });
    
    if (hourIndex !== -1) {
      return {
        humidity: weather.hourly.relativehumidity_2m?.[hourIndex],
        pressure: weather.hourly.pressure_msl?.[hourIndex]
      };
    }
    
    // Якщо поточну годину не знайдено, беремо першу годину дня
    const dayStartIndex = weather.hourly.time.findIndex(time => {
      const hourDate = new Date(time);
      return hourDate.toDateString() === selectedDate.toDateString();
    });
    
    if (dayStartIndex !== -1) {
      return {
        humidity: weather.hourly.relativehumidity_2m?.[dayStartIndex],
        pressure: weather.hourly.pressure_msl?.[dayStartIndex]
      };
    }
    
    return { humidity: undefined, pressure: undefined };
  };
  
  const { humidity, pressure } = getHourlyDataForSelectedDay();
  
  console.log('Selected day index:', selectedDayIndex, 'Hourly data:', { humidity, pressure });

  // Функція для отримання температури для вибраного дня
  const getSelectedDayTemperature = useCallback(() => {
    if (!weather?.hourly?.time || !weather?.daily?.time) return currentTemp;
    
    if (selectedDayIndex === 0) {
      // Для сьогоднішнього дня - поточна температура
      return currentTemp;
    }
    
    // Для майбутніх днів - температура о 12:00
    const selectedDate = new Date(weather.daily.time[selectedDayIndex]);
    selectedDate.setHours(12, 0, 0, 0); // 12:00 дня
    
    // Знаходимо індекс години найближчої до 12:00 для вибраного дня
    const targetHourIndex = weather.hourly.time.findIndex(time => {
      const hourDate = new Date(time);
      return hourDate.getHours() === 12 && 
             hourDate.toDateString() === selectedDate.toDateString();
    });
    
    if (targetHourIndex !== -1 && weather.hourly.temperature_2m?.[targetHourIndex] !== undefined) {
      return convertTemperature(weather.hourly.temperature_2m[targetHourIndex]);
    }
    
    // Fallback до максимальної температури дня
    return convertTemperature(weather.daily.temperature_2m_max?.[selectedDayIndex] ?? 0);
  }, [weather?.hourly, weather?.daily, selectedDayIndex, currentTemp, convertTemperature]);

  // Генерація даних для вибраного дня
  const selectedDay = weather ? {
    temp: getSelectedDayTemperature(),
    description: selectedDayIndex === 0 ? description : getWeatherDescription(weather.daily?.weathercode?.[selectedDayIndex] ?? 0),
    icon: selectedDayIndex === 0 ? getWeatherIcon(weather.current_weather?.weathercode ?? 0) : getWeatherIcon(weather.daily?.weathercode?.[selectedDayIndex] ?? 0)
  } : {
    temp: 0,
    description: '',
    icon: '☁️'
  };

  // Генерація погодинних даних для вибраного дня з правильним offset
  const hourlyData = useMemo(() => {
    if (!weather?.hourly?.time) return [];
    
    const today = new Date();
    const selectedDate = new Date(today);
    selectedDate.setDate(today.getDate() + selectedDayIndex);
    
    // Знаходимо початковий індекс для вибраного дня
    const dayStartIndex = weather.hourly.time.findIndex(time => {
      const hourDate = new Date(time);
      return hourDate.toDateString() === selectedDate.toDateString();
    });
    
    if (dayStartIndex === -1) return [];
    
    // Беремо 24 години для вибраного дня з правильним offset
    const dayHourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const dataIndex = dayStartIndex + hour;
      if (dataIndex < weather.hourly.time.length) {
        const time = weather.hourly.time[dataIndex];
        const hourDate = new Date(time);
        const currentHour = new Date().getHours();
        const isCurrentDay = selectedDayIndex === 0;
        
        dayHourlyData.push({
          time: formatTime(time),
          temp: convertTemperature(weather.hourly.temperature_2m?.[dataIndex] ?? 0),
          icon: getWeatherIcon(weather.hourly.weathercode?.[dataIndex] ?? 0),
          isActive: isCurrentDay && hourDate.getHours() === currentHour,
          isCurrentHour: hourDate.getHours() === currentHour
        });
      }
    }
    
    console.log('Selected day index:', selectedDayIndex, 'Day start index:', dayStartIndex, 'Hourly data count:', dayHourlyData.length);
    return dayHourlyData;
  }, [weather?.hourly, selectedDayIndex, convertTemperature, getWeatherIcon]);

  // Автоскрол до відповідної години
  useEffect(() => {
    if (hourlyData.length > 0 && hourlyScrollRef.current) {
      let targetIndex = -1;
      
      if (selectedDayIndex === 0) {
        // Для сьогоднішнього дня - скрол до поточної години
        targetIndex = hourlyData.findIndex(item => item.isCurrentHour);
      } else {
        // Для майбутніх днів - скрол до 12:00
        targetIndex = hourlyData.findIndex(item => item.time === '12:00');
      }
      
      if (targetIndex !== -1) {
        // Скрол до цільової години з невеликим зсувом для центрування
        setTimeout(() => {
          hourlyScrollRef.current?.scrollTo({
            x: Math.max(0, targetIndex * 75 - 150), // 75px ширина картки, 150px зсув для центрування
            y: 0,
            animated: true
          });
        }, 100);
      }
    }
  }, [hourlyData, selectedDayIndex]);

  // Генерація даних на тиждень з короткими назвами днів
  const weeklyData = weather?.daily?.time?.slice(0, 7).map((time, index) => ({
    dayName: getWeekdayName(time),
    icon: getWeatherIcon(weather?.daily?.weathercode?.[index] ?? 0),
    maxTemp: convertTemperature(weather?.daily?.temperature_2m_max?.[index] ?? 0),
    minTemp: convertTemperature(weather?.daily?.temperature_2m_min?.[index] ?? 0),
    isToday: index === 0,
    index: index
  })) || [];

  const currentDate = new Date().toLocaleDateString(settings.language === 'ua' ? 'uk-UA' : 'en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Умовні рендери в кінці компонента
  if (shouldShowWelcome) {
    return (
      <View style={st.welcomeContainer}>
        {/* Декоративний елемент фону */}
        <View style={st.sunGlow} />

        <View style={st.welcomeContent}>
          <Image source={Logo} style={st.appLogo} resizeMode="contain" />
          <Text style={st.appName}>raindji</Text>
          <Text style={st.appTagline}>
            {t('tagline')}
          </Text>

          <View style={st.btnGroup}>
            <TouchableOpacity 
              style={st.btnPrimary} 
              onPress={handleFindMyLocation}
              activeOpacity={0.8}
            >
              <Text style={st.btnIcon}>📍</Text>
              <Text style={st.btnText}>{t('findLocation')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={st.btnSecondary} 
              onPress={handleSearchPress}
              activeOpacity={0.8}
            >
              <Text style={st.btnIcon}>🔍</Text>
              <Text style={st.btnText}>{t('selectCity')}</Text>
            </TouchableOpacity>

                      </View>
        </View>
      </View>
    );
  }

  if (shouldShowLoading) {
    return (
      <View style={st.container}>
        <View style={st.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={st.loadingText}>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  if (shouldShowError) {
    return (
      <View style={st.container}>
        <View style={st.errorContainer}>
          <Text style={st.errorText}>{error}</Text>
          <TouchableOpacity style={st.retryButton} onPress={handleFindMyLocation}>
            <Text style={st.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.searchButton} onPress={handleSearchPress}>
            <Text style={st.searchButtonText}>{t('searchCity')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (shouldShowNoData) {
    return (
      <View style={st.container}>
        <View style={st.errorContainer}>
          <Text style={st.errorText}>{t('noData')}</Text>
          <TouchableOpacity style={st.retryButton} onPress={handleFindMyLocation}>
            <Text style={st.retryButtonText}>{t('findLocation')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.searchButton} onPress={handleSearchPress}>
            <Text style={st.searchButtonText}>{t('searchCity')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={st.container}>
      <ScrollView style={st.scrollWrapper} showsVerticalScrollIndicator={false}>
        {/* Шапка */}
        <View style={st.topBar}>
          <View style={st.locationInfo}>
            <Text style={st.locationName}>{weather?.city || t('currentLocation')}</Text>
            <Text style={st.locationDate}>{currentDate}</Text>
          </View>
          <View style={st.controls}>
            <TouchableOpacity style={st.iconBtn} onPress={handleSearchPress}>
              <Text style={st.iconText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.iconBtn} onPress={handleSettingsPress}>
              <Text style={st.iconText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Геро-блок (Температура) */}
        <View style={st.heroSection}>
          <Text style={st.mainTemp}>{selectedDay.temp}{getTemperatureUnit()}</Text>
          <Text style={st.weatherStatus}>{selectedDay.description}</Text>
          <Text style={st.dayLabel}>
            {selectedDayIndex === 0 ? 'Today' : getWeekdayName(weather?.daily?.time?.[selectedDayIndex] || '')} · {selectedDayIndex === 0 ? '' : '12:00 forecast'}
          </Text>
        </View>

        {/* Метрики */}
        <View style={st.metricsGrid}>
          <View style={st.metricCard}>
            <Text style={st.metricIcon}>🌬️</Text>
            <View style={st.metricInfo}>
              <Text style={st.metricLabel}>{t('wind')}</Text>
              <Text style={st.metricValue}>{windSpeed} {getWindUnit()}</Text>
            </View>
          </View>
          <View style={st.metricCard}>
            <Text style={st.metricIcon}>💧</Text>
            <View style={st.metricInfo}>
              <Text style={st.metricLabel}>{t('humidity')}</Text>
              <Text style={st.metricValue}>{humidity !== undefined ? `${humidity}%` : 'undefined'}</Text>
            </View>
          </View>
          <View style={st.metricCard}>
            <Text style={st.metricIcon}>🌡️</Text>
            <View style={st.metricInfo}>
              <Text style={st.metricLabel}>{t('feelsLike')}</Text>
              <Text style={st.metricValue}>{feelsLike}{getTemperatureUnit()}</Text>
            </View>
          </View>
          <View style={st.metricCard}>
            <Text style={st.metricIcon}>⏲️</Text>
            <View style={st.metricInfo}>
              <Text style={st.metricLabel}>{t('pressure')}</Text>
              <Text style={st.metricValue}>{pressure !== undefined ? `${pressure} hPa` : 'undefined'}</Text>
            </View>
          </View>
        </View>

        {/* Погодинний скрол */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>{t('next24Hours')}</Text>
          <Text style={st.scrollHint}>{t('scrollHint')}</Text>
        </View>
        <ScrollView 
          ref={hourlyScrollRef}
          horizontal 
          style={st.hourlyScroll} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.hourlyContent}
        >
          {hourlyData.map((hour, index) => (
            <View key={index} style={[st.hourCard, hour.isActive && st.activeHourCard]}>
              <Text style={[st.hourTime, hour.isActive && st.activeHourText]}>{hour.time}</Text>
              <Text style={[st.hourIcon, hour.isActive && st.activeHourText]}>{hour.icon}</Text>
              <Text style={[st.hourTemp, hour.isActive && st.activeHourText]}>{hour.temp}{getTemperatureUnit()}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Список днів */}
        <View style={st.sectionHeader}>
          <Text style={st.sectionTitle}>{t('weeklyForecast')}</Text>
        </View>
        <View style={st.weeklyList}>
          {weeklyData.map((day, index) => (
            <TouchableOpacity 
              key={index} 
              style={[st.dayButton, selectedDayIndex === day.index && st.selectedDayButton]}
              onPress={() => selectDay(day.index)}
            >
              <Text style={[st.dayName, selectedDayIndex === day.index && st.selectedDayText]}>{day.dayName}</Text>
              <Text style={[st.dayIcon, selectedDayIndex === day.index && st.selectedDayText]}>{day.icon}</Text>
              <View style={st.dayRange}>
                <View style={st.tempRange}>
                  <Text style={[st.tempLabel, selectedDayIndex === day.index && st.selectedDayText]}>↑</Text>
                  <Text style={[st.dayMaxTemp, selectedDayIndex === day.index && st.selectedDayText]}>{day.maxTemp}{getTemperatureUnit()}</Text>
                </View>
                <View style={st.tempRange}>
                  <Text style={[st.tempLabel, selectedDayIndex === day.index && st.selectedDayText]}>↓</Text>
                  <Text style={[st.dayMinTemp, selectedDayIndex === day.index && st.selectedDayText]}>{day.minTemp}{getTemperatureUnit()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: AppThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  // Welcome styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: colors.screenBg,
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
    shadowColor: colors.accent,
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
    width: 320,
    height: 320,
    marginBottom: 5,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 5,
    letterSpacing: -1,
    color: colors.text,
  },
  appTagline: {
    fontSize: 15,
    opacity: 0.6,
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.text,
  },
  btnGroup: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  btnSecondary: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.text,
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
    color: colors.textMuted,
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
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: colors.textMuted,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  searchButtonText: {
    color: colors.text,
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
    color: colors.text,
  },
  locationDate: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 14,
  },
  iconText: {
    fontSize: 16,
  },
  // Геро-блок
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  dayLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  mainTemp: {
    fontSize: 100,
    fontWeight: '300',
    color: colors.text,
  },
  weatherStatus: {
    color: colors.accent,
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
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
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
    color: colors.text,
  },
  scrollHint: {
    fontSize: 12,
    color: colors.textMuted,
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
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeHourCard: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  activeHourText: {
    color: colors.hourActiveText,
  },
  hourTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 8,
  },
  hourIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  hourTemp: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  // Список днів
  weeklyList: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 30,
  },
  dayButton: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontWeight: '600',
    color: colors.text,
    width: 45,
  },
  dayIcon: {
    fontSize: 20,
  },
  dayRange: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  dayMaxTemp: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  dayMinTemp: {
    fontWeight: '400',
    fontSize: 14,
    color: colors.textMuted,
  },
  selectedDayButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tempRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tempLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  selectedDayText: {
    color: colors.hourActiveText,
  },
});
}
