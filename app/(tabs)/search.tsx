import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SearchScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
      </Pressable>

      {/* Location card */}
      <View style={styles.locationCard}>
        <Text style={styles.city}>New York</Text>
        <Text style={styles.country}>USA</Text>
      </View>

      {/* Bottom buttons */}
      <Pressable style={styles.gpsBtn}>
        <Text style={styles.gpsIcon}>📍</Text>
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
