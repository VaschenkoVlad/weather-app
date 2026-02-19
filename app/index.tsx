import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();

  const handleSearchPress = useCallback(() => {
    // Navigate to the search screen where user can type a city
    router.push('/search');
  }, [router]);

  const handleFindMyLocation = useCallback(async () => {
    // Request foreground permissions and navigate to dedicated weather screen
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!pos?.coords) return;

      // Navigate to the dynamic weather route using bracketed pathname for type-safe navigation
      router.push({ pathname: '/weather/[lat]/[lon]', params: { lat: String(pos.coords.latitude), lon: String(pos.coords.longitude) } });
    } catch (e) {
      // ignore — user can open Search
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
