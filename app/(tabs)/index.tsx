import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = [
  { day: 'Mon', temp: 3, date: '28 Dec' },
  { day: 'Tue', temp: 3, date: '29 Dec' },
  { day: 'Wed', temp: 3, date: '30 Dec' },
  { day: 'Thu', temp: 2, date: '31 Dec' },
  { day: 'Fri', temp: 1, date: '1 Jan' },
  { day: 'Sat', temp: 2, date: '2 Jan' },
  { day: 'Sun', temp: 3, date: '3 Jan' },
];

export default function WeatherScreen() {
  const sheetY = useRef(new Animated.Value(height - 220)).current;
  const router = useRouter();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        sheetY.setValue(Math.max(120, g.moveY));
      },
      onPanResponderRelease: (_, g) => {
        Animated.spring(sheetY, {
          toValue: g.moveY < height / 2 ? 120 : height - 220,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
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
      <Text style={styles.city}>New York</Text>
      <Text style={styles.date}>Saturday, 28 December</Text>
      <Text style={styles.status}>Sunny</Text>

      {/* Temperature */}
      <Text style={styles.temp}>5°</Text>

      {/* Hourly forecast */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourly}>
        {HOURS.map((h) => (
          <View key={h} style={styles.hourCard}>
            <Text style={styles.hour}>{h}:00</Text>
            <Text style={styles.hourIcon}>☁️</Text>
            <Text style={styles.hourTemp}>3°</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { top: sheetY }]} {...panResponder.panHandlers}>
        <View style={styles.dragHandle} />
        <Text style={styles.sheetTitle}>7-Days forecast</Text>

        {DAYS.map((d) => (
          <Pressable key={d.day} style={styles.dayRow}>
            <Text style={styles.day}>{d.day}</Text>
            <Text>☁️</Text>
            <Text>{d.temp}°</Text>
            <Text>{d.date}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    paddingTop: 60,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  icon: {
    fontSize: 22,
  },
  city: {
    fontSize: 28,
    fontWeight: '600',
  },
  date: {
    backgroundColor: '#2196f3',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  status: {
    marginTop: 10,
    fontSize: 16,
  },
  temp: {
    fontSize: 96,
    fontWeight: '300',
    marginVertical: 10,
  },
  hourly: {
    marginTop: 20,
  },
  hourCard: {
    width: 70,
    height: 100,
    backgroundColor: '#2196f3',
    borderRadius: 16,
    marginHorizontal: 6,
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
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    marginVertical: 6,
  },
  day: {
    fontWeight: '500',
  },
});
