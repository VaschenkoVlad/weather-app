import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OPEN_METEO_BASE } from '../constants/server';

interface WeatherData {
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
  city?: string;
}

const weatherCodes: { [key: number]: { day: string; night: string } } = {
  0: { day: 'Ясно', night: 'Ясно' },
  1: { day: 'Майже ясно', night: 'Майже ясно' },
  2: { day: 'Частково хмарно', night: 'Частково хмарно' },
  3: { day: 'Похмуро', night: 'Похмуро' },
  45: { day: 'Туман', night: 'Туман' },
  48: { day: 'Туман з інеєм', night: 'Туман з інеєм' },
  51: { day: 'Легка мжичка', night: 'Легка мжичка' },
  53: { day: 'Помірна мжичка', night: 'Помірна мжичка' },
  55: { day: 'Щільна мжичка', night: 'Щільна мжичка' },
  56: { day: 'Легка замерзаюча мжичка', night: 'Легка замерзаюча мжичка' },
  57: { day: 'Щільна замерзаюча мжичка', night: 'Щільна замерзаюча мжичка' },
  61: { day: 'Легкий дощ', night: 'Легкий дощ' },
  63: { day: 'Помірний дощ', night: 'Помірний дощ' },
  65: { day: 'Сильний дощ', night: 'Сильний дощ' },
  66: { day: 'Легкий замерзаючий дощ', night: 'Легкий замерзаючий дощ' },
  67: { day: 'Сильний замерзаючий дощ', night: 'Сильний замерзаючий дощ' },
  71: { day: 'Легкий сніг', night: 'Легкий сніг' },
  73: { day: 'Помірний сніг', night: 'Помірний сніг' },
  75: { day: 'Сильний сніг', night: 'Сильний сніг' },
  77: { day: 'Снігові зерна', night: 'Снігові зерна' },
  80: { day: 'Легкі зливи', night: 'Легкі зливи' },
  81: { day: 'Помірні зливи', night: 'Помірні зливи' },
  82: { day: 'Сильні зливи', night: 'Сильні зливи' },
  85: { day: 'Легкі снігові зливи', night: 'Легкі снігові зливи' },
  86: { day: 'Сильні снігові зливи', night: 'Сильні снігові зливи' },
  95: { day: 'Легка гроза', night: 'Легка гроза' },
  96: { day: 'Гроза з градом', night: 'Гроза з градом' },
  99: { day: 'Сильна гроза з градом', night: 'Сильна гроза з градом' },
};

function getWeatherDescription(code: number): string {
  const weather = weatherCodes[code] || { day: 'Невідомо', night: 'Невідомо' };
  return weather.day;
}

export default function WeatherScreen() {
  const params = useLocalSearchParams();
  const lat = params.lat as string | undefined;
  const lon = params.lon as string | undefined;
  const city = params.city as string | undefined;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!lat || !lon || hasFetched.current) {
      if (!lat || !lon) {
        setError('Відсутні координати');
        setLoading(false);
      }
      return;
    }

    hasFetched.current = true;
    const fetchWeather = async () => {
      try {
        const url = `${OPEN_METEO_BASE}/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('Open-Meteo API response:', data);
        
        if (!res.ok) {
          throw new Error('Помилка отримання даних');
        }

        // Перевіряємо структуру відповіді
        if (!data) {
          throw new Error('Порожня відповідь від сервера');
        }

        // Формуємо об'єкт з даними, перевіряючи наявність властивостей
        const weatherData: WeatherData = {
          current_weather: data.current_weather || undefined,
          daily: data.daily || undefined,
          city: city || undefined
        };

        setWeather(weatherData);
      } catch (e: any) {
        console.error('Weather fetch error:', e);
        setError(e?.message || 'Помилка мережі');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lon, city]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Завантаження погоди...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // No data state
  if (!weather || !weather.current_weather) {
    return (
      <View style={styles.center}>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const currentTemp = Math.round(weather.current_weather?.temperature ?? 0);
  const description = getWeatherDescription(weather.current_weather?.weathercode ?? 0);
  const windSpeed = weather.current_weather?.windspeed ?? 0;
  const windDirection = weather.current_weather?.winddirection ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.city}>
        {weather.city || 'Поточне місцезнаходження'}
      </Text>
      
      <Text style={styles.temp}>{currentTemp}°C</Text>
      <Text style={styles.desc}>{description}</Text>

      <View style={styles.details}>
        <Text>Вітер: {windSpeed} м/с</Text>
        <Text>Напрямок вітру: {windDirection}°</Text>
      </View>

      {/* 7-денний прогноз - рендеримо тільки якщо є дані */}
      {weather.daily && 
       weather.daily.time && 
       weather.daily.time.length > 0 && 
       weather.daily.temperature_2m_max && 
       weather.daily.temperature_2m_min && 
       weather.daily.weathercode && (
        <View style={styles.forecast}>
          <Text style={styles.sectionTitle}>7-денний прогноз</Text>
          {weather.daily.time.slice(0, 7).map((time: string, index: number) => {
            // Перевіряємо наявність всіх необхідних даних для кожного дня
            if (
              !weather.daily?.temperature_2m_max?.[index] !== undefined &&
              !weather.daily?.temperature_2m_min?.[index] !== undefined &&
              !weather.daily?.weathercode?.[index] !== undefined
            ) {
              return null;
            }

            const date = new Date(time);
            const maxTemp = Math.round(weather.daily?.temperature_2m_max?.[index] ?? 0);
            const minTemp = Math.round(weather.daily?.temperature_2m_min?.[index] ?? 0);
            const weatherCode = weather.daily?.weathercode?.[index] ?? 0;
            const dayDescription = getWeatherDescription(weatherCode);

            return (
              <View key={time} style={styles.dayRow}>
                <Text style={styles.dayDate}>
                  {date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.dayDesc}>{dayDescription}</Text>
                <Text style={styles.dayTemp}>{minTemp}° / {maxTemp}°</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  city: { fontSize: 22, fontWeight: '700' },
  temp: { fontSize: 40, marginTop: 6 },
  desc: { marginTop: 6, color: '#444' },
  details: { marginTop: 12, alignItems: 'flex-start', width: '100%' },
  forecast: { width: '100%', marginTop: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 8, fontSize: 16 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  dayDate: { flex: 1, fontWeight: '500' },
  dayDesc: { flex: 2, textAlign: 'center' },
  dayTemp: { flex: 1, textAlign: 'right' },
  error: { color: 'red', textAlign: 'center', fontSize: 16 },
  noData: { color: '#666', textAlign: 'center', fontSize: 16 },
});
