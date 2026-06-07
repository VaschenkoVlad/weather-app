import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useWeather } from '@/hooks/use-weather';
import { useLocation } from '@/constants/location-context';

function WindDirectionIcon(deg: number): string {
  if (deg < 22.5 || deg >= 337.5) return '↑';
  if (deg < 67.5) return '↗';
  if (deg < 112.5) return '→';
  if (deg < 157.5) return '↘';
  if (deg < 202.5) return '↓';
  if (deg < 247.5) return '↙';
  if (deg < 292.5) return '←';
  return '↖';
}

export default function WeatherScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { location } = useLocation();
  const { data, loading, error, refresh } = useWeather(location.lat, location.lng, location.city, location.country);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (refresh) await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (loading && !data) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ color: '#666', fontSize: 16 }}>{error}</Text>
        <Pressable onPress={onRefresh} style={{ marginTop: 16 }}>
          <Text style={{ color: '#2196f3', fontSize: 16 }}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) return null;

  const { current, hourly, daily } = data;
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196f3" />
      }
    >
      {/* Top buttons */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/(tabs)/search')} accessibilityLabel="Open search">
          <Text style={styles.icon}>🔍</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(tabs)/settings')} accessibilityLabel="Open settings">
          <Text style={styles.icon}>⚙️</Text>
        </Pressable>
      </View>

      {/* City */}
      <Text style={styles.city}>{data.city}</Text>
      <Text style={styles.date}>
        {dayNames[now.getDay()]}, {now.getDate()} {monthNames[now.getMonth()]}
      </Text>
      <Text style={styles.status}>{current.condition}</Text>

      {/* Temperature */}
      <Text style={styles.temp}>{current.temperature}°</Text>

      {/* Details row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{current.humidity}%</Text>
          <Text style={styles.detailLabel}>Humidity</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{WindDirectionIcon(current.windDirection)} {current.windSpeed} km/h</Text>
          <Text style={styles.detailLabel}>Wind</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{current.pressure} hPa</Text>
          <Text style={styles.detailLabel}>Pressure</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{current.visibility} km</Text>
          <Text style={styles.detailLabel}>Visibility</Text>
        </View>
      </View>

      {/* Hourly forecast */}
      <Text style={styles.sectionTitle}>Hourly</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourly}>
        {hourly.map((h, i) => (
          <View key={i} style={styles.hourCard}>
            <Text style={styles.hour}>{h.hour}</Text>
            <Text style={styles.hourIcon}>{h.condition}</Text>
            <Text style={styles.hourTemp}>{h.temp}°</Text>
          </View>
        ))}
      </ScrollView>

      {/* 7-day forecast */}
      <Text style={styles.sectionTitle}>7-Days forecast</Text>
      {daily.map((d, i) => (
        <Pressable key={i} style={styles.dayRow}>
          <Text style={styles.day}>{d.day}</Text>
          <Text>{d.condition}</Text>
          <Text>{d.tempMax}° / {d.tempMin}°</Text>
          <Text>{d.date}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf2ff',
    paddingTop: 60,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  icon: {
    fontSize: 22,
  },
  city: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  date: {
    backgroundColor: '#2196f3',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  temp: {
    fontSize: 96,
    fontWeight: '300',
    textAlign: 'center',
    marginVertical: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailLabel: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 24,
    marginBottom: 10,
    color: '#333',
  },
  hourly: {
    paddingLeft: 24,
    marginBottom: 20,
  },
  hourCard: {
    width: 70,
    height: 100,
    backgroundColor: '#2196f3',
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hour: {
    color: '#fff',
    fontSize: 12,
  },
  hourIcon: {
    fontSize: 20,
    marginVertical: 6,
  },
  hourTemp: {
    color: '#fff',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 24,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  day: {
    fontWeight: '500',
    width: 40,
  },
});
