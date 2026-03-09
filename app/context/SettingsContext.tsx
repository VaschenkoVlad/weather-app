import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsState {
  temperatureUnit: 'C' | 'F';
  windUnit: 'kmh' | 'ms';
  language: 'ua' | 'en';
  pushNotifications: boolean;
  rainAlerts: boolean;
}

interface SettingsContextType {
  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => void;
  toggleTemperatureUnit: () => void;
  toggleWindUnit: () => void;
  toggleLanguage: () => void;
  togglePushNotifications: () => void;
  toggleRainAlerts: () => void;
  convertTemperature: (celsius: number) => number;
  getTemperatureUnit: () => string;
  getWindUnit: () => string;
}

const STORAGE_KEY = 'weather-app-settings';

const defaultSettings: SettingsState = {
  temperatureUnit: 'C',
  windUnit: 'kmh',
  language: 'ua',
  pushNotifications: true,
  rainAlerts: false,
};

const translations = {
  ua: {
    welcome: 'Weather App',
    tagline: 'Почнемо? Оберіть, як нам знайти прогноз для вас',
    findLocation: 'Знайти мою локацію',
    selectCity: 'Вибрати місто вручну',
    currentLocation: 'Поточне місцезнаходження',
    searchPlaceholder: 'Пошук міста...',
    popularCities: 'Популярні міста',
    myLocation: 'Моє місцезнаходження',
    settings: 'Налаштування',
    back: '←',
    temperature: 'Температура',
    wind: 'Вітер',
    humidity: 'Вологість',
    feelsLike: 'Відчувається',
    pressure: 'Тиск',
    next24Hours: 'Наступні 24 години',
    scrollHint: 'Гортайте ⮕',
    weeklyForecast: 'Прогноз на тиждень',
    units: 'Одиниці вимірювання',
    notifications: 'Сповіщення',
    additional: 'Додатково',
    pushNotifications: 'Push-повідомлення',
    rainAlerts: 'Попередження про дощ',
    language: 'Мова',
    dataSource: 'Джерело даних',
    ukrainian: 'Українська',
    english: 'English',
    openMeteo: 'Open-Meteo',
    version: 'Weather Pro v2.4.0 (Build 742)',
    developed: 'Розроблено спеціально для вашого комфорту',
    loading: 'Завантаження погоди...',
    retry: 'Спробувати знову',
    searchCity: 'Пошук міста',
    noData: 'No data available',
    weatherDescriptions: {
      0: 'Ясно', 1: 'Майже ясно', 2: 'Частково хмарно', 3: 'Похмуро',
      45: 'Туман', 48: 'Туман з інеєм', 51: 'Легка мжичка', 53: 'Помірна мжичка',
      55: 'Щільна мжичка', 56: 'Легка замерзаюча мжичка', 57: 'Щільна замерзаюча мжичка',
      61: 'Легкий дощ', 63: 'Помірний дощ', 65: 'Сильний дощ', 66: 'Легкий замерзаючий дощ',
      67: 'Сильний замерзаючий дощ', 71: 'Легкий сніг', 73: 'Помірний сніг', 75: 'Сильний сніг',
      77: 'Снігові зерна', 80: 'Легкі зливи', 81: 'Помірні зливи', 82: 'Сильні зливи',
      85: 'Легкі снігові зливи', 86: 'Сильні снігові зливи', 95: 'Легка гроза',
      96: 'Гроза з градом', 99: 'Сильна гроза з градом',
    },
    weekdays: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  },
  en: {
    welcome: 'Weather App',
    tagline: 'Let\'s start? Choose how we find the forecast for you',
    findLocation: 'Find my location',
    selectCity: 'Select city manually',
    currentLocation: 'Current location',
    searchPlaceholder: 'Search city...',
    popularCities: 'Popular cities',
    myLocation: 'My location',
    settings: 'Settings',
    back: '←',
    temperature: 'Temperature',
    wind: 'Wind',
    humidity: 'Humidity',
    feelsLike: 'Feels like',
    pressure: 'Pressure',
    next24Hours: 'Next 24 hours',
    scrollHint: 'Scroll ⮕',
    weeklyForecast: 'Weekly forecast',
    units: 'Units',
    notifications: 'Notifications',
    additional: 'Additional',
    pushNotifications: 'Push notifications',
    rainAlerts: 'Rain alerts',
    language: 'Language',
    dataSource: 'Data source',
    ukrainian: 'Ukrainian',
    english: 'English',
    openMeteo: 'Open-Meteo',
    version: 'Weather Pro v2.4.0 (Build 742)',
    developed: 'Developed specially for your comfort',
    loading: 'Loading weather...',
    retry: 'Try again',
    searchCity: 'Search city',
    noData: 'No data available',
    weatherDescriptions: {
      0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Fog with depositing rime', 51: 'Light drizzle', 53: 'Moderate drizzle',
      55: 'Dense drizzle', 56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
      61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Light freezing rain',
      67: 'Heavy freezing rain', 71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow',
      77: 'Snow grains', 80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers',
      85: 'Light snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm',
      96: 'Thunderstorm with hail', 99: 'Severe thunderstorm with hail',
    },
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: SettingsState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const toggleTemperatureUnit = () => {
    updateSettings({
      temperatureUnit: settings.temperatureUnit === 'C' ? 'F' : 'C'
    });
  };

  const toggleWindUnit = () => {
    updateSettings({
      windUnit: settings.windUnit === 'kmh' ? 'ms' : 'kmh'
    });
  };

  const toggleLanguage = () => {
    updateSettings({
      language: settings.language === 'ua' ? 'en' : 'ua'
    });
  };

  const togglePushNotifications = () => {
    // Перевіряємо чи додаток запущений в Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      console.log('Push notifications are not available in Expo Go - only local notifications work');
      // В Expo Go можна показати повідомлення користувачу
      updateSettings({
        pushNotifications: false // Примусово вимикаємо в Expo Go
      });
    } else {
      updateSettings({
        pushNotifications: !settings.pushNotifications
      });
    }
  };

  const toggleRainAlerts = () => {
    updateSettings({
      rainAlerts: !settings.rainAlerts
    });
  };

  const convertTemperature = (celsius: number): number => {
    if (settings.temperatureUnit === 'F') {
      return Math.round(celsius * 9/5 + 32);
    }
    return Math.round(celsius);
  };

  const getTemperatureUnit = (): string => {
    return settings.temperatureUnit === 'F' ? '°F' : '°C';
  };

  const getWindUnit = (): string => {
    return settings.windUnit === 'ms' ? 'м/с' : 'км/г';
  };

  const t = (key: keyof typeof translations.ua) => {
    const value = translations[settings.language][key];
    return Array.isArray(value) ? value.join(', ') : String(value);
  };

  const getWeatherDescription = (code: number): string => {
    const descriptions = translations[settings.language].weatherDescriptions;
    return descriptions[code as keyof typeof descriptions] || 'Unknown';
  };

  const getWeekdayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const weekdays = translations[settings.language].weekdays;
    return weekdays[date.getDay()];
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        toggleTemperatureUnit,
        toggleWindUnit,
        toggleLanguage,
        togglePushNotifications,
        toggleRainAlerts,
        convertTemperature,
        getTemperatureUnit,
        getWindUnit,
      }}
    >
      <SettingsTranslationContext.Provider
        value={{
          t,
          getWeatherDescription,
          getWeekdayName,
        }}
      >
        {children}
      </SettingsTranslationContext.Provider>
    </SettingsContext.Provider>
  );
}

const SettingsTranslationContext = createContext<{
  t: (key: keyof typeof translations.ua) => string;
  getWeatherDescription: (code: number) => string;
  getWeekdayName: (dateStr: string) => string;
}>({
  t: (key) => key,
  getWeatherDescription: () => 'Unknown',
  getWeekdayName: () => '',
});

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

export function useTranslations() {
  const context = useContext(SettingsTranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within SettingsProvider');
  }
  return context;
}
