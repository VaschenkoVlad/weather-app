import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocation } from '@/constants/location-context';
import { useCurrentLocation } from '@/hooks/use-current-location';

export default function SearchScreen() {
  const router = useRouter();
  const { location, setLocation } = useLocation();
  const { getLocation, loading: gpsLoading, error: gpsError } = useCurrentLocation();

  async function handleGPS() {
    const loc = await getLocation();
    if (loc) {
      setLocation(loc);
      router.back();
    }
  }

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
      </Pressable>

      {/* Location card */}
      <View style={styles.locationCard}>
        <Text style={styles.city}>{location.city}</Text>
        <Text style={styles.country}>{location.country}</Text>
      </View>

      {/* GPS error */}
      {gpsError ? <Text style={styles.gpsError}>{gpsError}</Text> : null}

      {/* Bottom buttons */}
      <Pressable style={styles.gpsBtn} onPress={handleGPS} disabled={gpsLoading}>
        {gpsLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.gpsIcon}>📍</Text>
        )}
      </Pressable>

      <Pressable style={styles.addBtn} onPress={() => router.push('/(tabs)/add-location')} accessibilityLabel="Add location">
        <Text style={styles.addText}>ADD LOCATION</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf2ff',
    paddingTop: 60,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  locationCard: {
    marginTop: 40,
    width: '85%',
    backgroundColor: '#2196f3',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  city: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  country: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  gpsBtn: {
    position: 'absolute',
    bottom: 120,
    left: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsIcon: {
    fontSize: 22,
    color: '#fff',
  },
  gpsError: {
    marginTop: 10,
    color: '#d32f2f',
    fontSize: 13,
    textAlign: 'center',
  },
  addBtn: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addText: {
    color: '#fff',
    fontWeight: '500',
  },
});
