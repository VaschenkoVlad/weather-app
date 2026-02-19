import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SERVER_BASE } from '../constants/server';

export default function IndexScreen() {
  const router = useRouter();

  const handleSearchPress = useCallback(() => {
    // Navigate to the search screen where user can type a city
    router.push('/search');
  }, [router]);

  const handleFindMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Store an error marker and navigate anyway so search screen can show it
        await AsyncStorage.setItem('preload_error', 'Location permission denied');
        router.push('/search');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!pos?.coords) {
        await AsyncStorage.setItem('preload_error', 'Unable to determine location');
        router.push('/search');
        return;
      }

      // Fetch weather from local server and save it to AsyncStorage so
      // the search screen can display it immediately after navigation.
      const res = await fetch(`${SERVER_BASE}/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json) {
        await AsyncStorage.setItem('preloadedWeather', JSON.stringify(json));
      } else {
        await AsyncStorage.setItem('preload_error', json?.error || 'Server error');
      }

      router.push('/search');
    } catch (e: any) {
      await AsyncStorage.setItem('preload_error', e?.message || 'Network error');
      router.push('/search');
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <View style={styles.logoPlaceholder} />
        <Text style={styles.title}>Weather app</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={handleFindMyLocation}>
          <Text style={styles.buttonText}>Find my location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={handleSearchPress}>
          <Text style={styles.buttonText}>Search location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoPlaceholder: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#e5e7eb' },
  title: { marginTop: 18, fontSize: 24, fontWeight: '700', color: '#111' },
  buttons: { width: '80%', alignItems: 'center' },
  button: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#6b7280' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
