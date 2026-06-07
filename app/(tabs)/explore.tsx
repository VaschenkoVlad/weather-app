import { useWeather } from '@/hooks/use-weather';
import { useLocation } from '@/constants/location-context';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ExploreTabScreen() {
  const { location } = useLocation();
  const { data, loading, error } = useWeather(
    location.lat, location.lng, location.city, location.country,
  );

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data) return null;

  const { current } = data;

  const cards = [
    { label: 'Temperature', value: `${current.temperature}°C`, icon: '🌡️' },
    { label: 'Humidity', value: `${current.humidity}%`, icon: '💧' },
    { label: 'Cloud Cover', value: `${current.cloudCover}%`, icon: '☁️' },
    { label: 'Wind Speed', value: `${current.windSpeed} km/h`, icon: '💨' },
    { label: 'Wind Direction', value: `${current.windDirection}°`, icon: '🧭' },
    { label: 'Precipitation', value: `${current.precipitation} mm`, icon: '🌧️' },
    { label: 'Pressure', value: `${current.pressure} hPa`, icon: '🔽' },
    { label: 'Visibility', value: `${current.visibility} km`, icon: '👁️' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Weather Details</Text>
      <Text style={styles.subtitle}>{location.city}, {location.country}</Text>

      <View style={styles.grid}>
        {cards.map((card, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf2ff' },
  content: { padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eaf2ff' },
  errorText: { color: '#666', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardValue: { fontSize: 18, fontWeight: '700', color: '#333' },
  cardLabel: { fontSize: 12, color: '#888', marginTop: 4 },
});
