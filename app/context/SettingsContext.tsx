import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsState {
  temperatureUnit: 'C' | 'F';
  windUnit: 'kmh' | 'ms';
  language: 'ua' | 'en';
  pushNotifications: boolean;
  rainAlerts: boolean;
  theme: 'dark' | 'light';
  notificationTime: string; // формат "HH:MM"
}

interface SettingsContextType {
  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => void;
  toggleTemperatureUnit: () => void;
  toggleWindUnit: () => void;
  toggleLanguage: () => void;
  togglePushNotifications: () => void;
  toggleRainAlerts: () => void;
  toggleTheme: () => void;
  setNotificationTime: (time: string) => void;
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
  theme: 'dark',
  notificationTime: '10:00',
};

const translations = {
  ua: {
    welcome: 'raindji',
    tagline: 'Почнемо? Оберіть, як нам знайти прогноз для вас',
    findLocation: 'Знайти мою локацію',
    selectCity: 'Вибрати місто вручну',
    currentLocation: 'Поточне місцезнаходження',
    searchPlaceholder: 'Пошук міста...',
    popularCities: 'Популярні міста',
    myLocation: 'Моя локація',
    settings: 'Налаштування',
    back: 'Назад',
    temperature: 'Температура',
    wind: 'Вітер',
    humidity: 'Вологість',
    pressure: 'Тиск',
    feelsLike: 'Відчувається як',
    hourly: 'Погодинно',
    weekly: 'Щотижня',
    units: 'Одиниці вимірювання',
    notifications: 'Сповіщення',
    additional: 'Додатково',
    celsius: 'Цельсій',
    fahrenheit: 'Фаренгейт',
    kmh: 'км/год',
    ms: 'м/с',
    ukrainian: 'Українська',
    english: 'Англійська',
    pushNotifications: 'Push сповіщення',
    rainAlerts: 'Попередження про дощ',
    theme: 'Тема',
    darkTheme: 'Темна',
    lightTheme: 'Світла',
    notificationTime: 'Час сповіщення',
    loading: 'Завантаження...',
    retry: 'Спробувати знову',
    searchCity: 'Пошук міста',
    noData: 'Немає даних',
    next24Hours: 'Наступні 24 години',
    scrollHint: 'Прокрутити ⮕',
    weeklyForecast: 'Щотижневий прогноз',
    language: 'Мова',
    dataSource: 'Джерело даних',
    openMeteo: 'Open-Meteo',
    version: 'Версія',
    developed: 'Розроблено',
    weekdays: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    weatherDescriptions: {
      0: 'Ясно', 1: 'Переважно ясно', 2: 'Переважно ясно', 3: 'Хмарно',
      45: 'Туман', 48: 'Туман з кригою', 51: 'Легкий дощ', 53: 'Помірний дощ',
      55: 'Сильний дощ', 56: 'Легкий град', 57: 'Сильний град', 61: 'Сильний дощ',
      63: 'Сильний дощ', 65: 'Сильний дощ', 66: 'Легкий град', 67: 'Сильний град',
      71: 'Легкий сніг', 73: 'Помірний сніг', 75: 'Сильний сніг', 77: 'Зернистий сніг',
      80: 'Легкий дощ', 81: 'Помірний дощ', 82: 'Сильний дощ', 85: 'Сильний дощ',
      95: 'Легка гроза',
      96: 'Гроза з градом', 99: 'Сильна гроза з градом',
    },
  },
  en: {
    welcome: 'raindji',
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
    hourly: 'Hourly',
    weekly: 'Weekly',
    next24Hours: 'Next 24 hours',
    scrollHint: 'Scroll ⮕',
    weeklyForecast: 'Weekly forecast',
    units: 'Units',
    notifications: 'Notifications',
    additional: 'Additional',
    celsius: 'Celsius',
    fahrenheit: 'Fahrenheit',
    kmh: 'km/h',
    ms: 'm/s',
    ukrainian: 'Ukrainian',
    english: 'English',
    pushNotifications: 'Push notifications',
    rainAlerts: 'Rain alerts',
    theme: 'Theme',
    darkTheme: 'Dark',
    lightTheme: 'Light',
    notificationTime: 'Notification time',
    loading: 'Loading...',
    retry: 'Retry',
    searchCity: 'Search city',
    noData: 'No data',
    language: 'Language',
    dataSource: 'Data source',
    openMeteo: 'Open-Meteo',
    version: 'Version',
    developed: 'Developed',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weatherDescriptions: {
      0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Fog with ice', 51: 'Light drizzle', 53: 'Moderate drizzle',
      55: 'Heavy drizzle', 56: 'Light freezing drizzle', 57: 'Heavy freezing drizzle', 61: 'Light rain',
      63: 'Moderate rain', 65: 'Heavy rain', 66: 'Light freezing rain', 67: 'Heavy freezing rain',
      71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
      80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers', 85: 'Heavy showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm with hail',
    },
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

  const toggleTheme = () => {
    updateSettings({
      theme: settings.theme === 'dark' ? 'light' : 'dark'
    });
  };

  const setNotificationTime = (time: string) => {
    updateSettings({
      notificationTime: time
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
        toggleTheme,
        setNotificationTime,
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
