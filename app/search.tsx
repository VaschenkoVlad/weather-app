import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';

const RECENT_CITIES = ['Kyiv', 'Lviv', 'London', 'Tokyo'];

const POPULAR_CITIES = [
  { id: 'kyiv', name: 'Kyiv', country: 'Ukraine', time: '14:20', icon: '☀️', temp: '-2°' },
  { id: 'paris', name: 'Paris', country: 'France', time: '13:20', icon: '☁️', temp: '8°' },
  { id: 'ny', name: 'New York', country: 'USA', time: '07:20', icon: '🌧️', temp: '5°' },
  { id: 'berlin', name: 'Berlin', country: 'Germany', time: '13:20', icon: '❄️', temp: '1°', dimmed: true },
];

export default function SearchScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.phoneContainer}>
        {/* Header with search input */}
        <View style={styles.searchHeader}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>

          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIconInner}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city..."
              placeholderTextColor="rgba(249, 250, 251, 0.6)"
            />
          </View>
        </View>

        {/* Location button */}
        <Pressable style={styles.locationBtn}>
          <Text style={styles.locationEmoji}>📍</Text>
          <Text style={styles.locationText}>Use my location</Text>
        </Pressable>

        {/* Content */}
        <ScrollView
          style={styles.resultsScroll}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent */}
          <Text style={styles.sectionTitle}>Recent</Text>
          <View style={styles.recentList}>
            {RECENT_CITIES.map((city) => (
              <Pressable key={city} style={styles.recentTag}>
                <Text style={styles.recentTagText}>{city}</Text>
              </Pressable>
            ))}
          </View>

          {/* Popular cities */}
          <Text style={styles.sectionTitle}>Popular cities</Text>
          <View>
            {POPULAR_CITIES.map((city) => (
              <Pressable
                key={city.id}
                style={[styles.resultCard, city.dimmed && styles.resultCardDimmed]}
              >
                <View>
                  <Text style={styles.cityName}>{city.name}</Text>
                  <Text style={styles.cityDesc}>
                    {city.country}, {city.time}
                  </Text>
                </View>
                <View style={styles.cityRight}>
                  <Text style={styles.cityWeatherIcon}>{city.icon}</Text>
                  <Text style={styles.cityTemp}>{city.temp}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cbd5e1',
  },
  phoneContainer: {
    width: 375,
    maxWidth: '100%',
    height: 812,
    maxHeight: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 44,
    borderWidth: 8,
    borderColor: '#111827',
    padding: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 24 },
    elevation: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    marginTop: 10,
    marginBottom: 25,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#f9fafb',
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 15,
    paddingLeft: 40,
    color: '#f9fafb',
    fontSize: 14,
  },
  searchIconInner: {
    position: 'absolute',
    left: 15,
    fontSize: 14,
    color: 'rgba(249, 250, 251, 0.5)',
  },
  locationBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#38bdf8',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    marginBottom: 20,
  },
  locationEmoji: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38bdf8',
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.5,
    fontWeight: '700',
    marginBottom: 12,
  },
  recentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
    marginBottom: 24,
  },
  recentTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  recentTagText: {
    fontSize: 14,
    color: '#f9fafb',
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultCardDimmed: {
    opacity: 0.7,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f9fafb',
  },
  cityDesc: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(249, 250, 251, 0.5)',
  },
  cityRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityWeatherIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cityTemp: {
    fontSize: 24,
    fontWeight: '300',
    color: '#f9fafb',
  },
});

