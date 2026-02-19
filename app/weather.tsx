import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useSearchParams } from 'expo-router';
import { SERVER_BASE } from '../constants/server';

export default function WeatherScreen() {
  const params = useSearchParams();
  const lat = params.lat as string | undefined;
  const lon = params.lon as string | undefined;
  const city = params.city as string | undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '';
        if (lat && lon) {
          url = `${SERVER_BASE}/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
        } else if (city) {
          url = `${SERVER_BASE}/weather?city=${encodeURIComponent(city)}`;
        } else {
          setError('Missing coordinates or city');
          setLoading(false);
          return;
        }

        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || 'Server error');
        }
        if (!mounted) return;
        setWeather(json);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Network error');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [lat, lon, city]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!weather) return <View style={styles.center}><Text>No data</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.city}>{weather.city}</Text>
      <Text style={styles.temp}>{weather.temperature}°C</Text>
      <Text style={styles.desc}>{weather.description}</Text>
      {weather.icon && <Image source={{ uri: weather.icon }} style={styles.icon} />}

      <View style={styles.details}>
        <Text>Wind: {weather.wind} m/s</Text>
        <Text>Humidity: {weather.humidity}%</Text>
        <Text>Pressure: {weather.pressure} hPa</Text>
        <Text>UV Index: {weather.uvi}</Text>
      </View>

      {weather.daily && weather.daily.length > 0 && (
        <View style={styles.forecast}>
          <Text style={styles.sectionTitle}>7-day forecast</Text>
          {weather.daily.map((d: any) => (
            <View key={d.dt} style={styles.dayRow}>
              <Text>{new Date(d.dt * 1000).toLocaleDateString()}</Text>
              <Text>{d.weather?.description || ''}</Text>
              <Text>{d.temp?.day ? `${d.temp.day}°C` : ''}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  city: { fontSize: 22, fontWeight: '700' },
  temp: { fontSize: 40, marginTop: 6 },
  desc: { marginTop: 6, color: '#444' },
  icon: { width: 80, height: 80, marginTop: 8 },
  details: { marginTop: 12, alignItems: 'flex-start' },
  forecast: { width: '100%', marginTop: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  error: { color: 'red' },
});
