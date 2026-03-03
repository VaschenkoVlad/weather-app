import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GEOCODING_BASE } from '../constants/server';

interface SearchResult {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  admin1?: string;
}

const POPULAR_CITIES = ['Київ', 'Львів', 'Харків', 'Одеса', 'Дніпро', 'Запоріжжя'];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  backIcon: { fontSize: 20, color: '#333' },
  searchInputWrapper: { flex: 1, position: 'relative' },
  searchInput: {
    width: '100%', backgroundColor: '#f5f5f5', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 15, paddingLeft: 40, color: '#333', fontSize: 16,
  },
  searchIcon: { position: 'absolute', left: 15, top: 12, fontSize: 16, color: '#666' },
  recentSection: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  recentList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentTag: {
    backgroundColor: '#f0f0f0', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
  },
  recentTagText: { fontSize: 14, color: '#333' },
  resultsScroll: { flex: 1 },
  resultCard: {
    backgroundColor: '#f9f9f9', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8,
  },
  cityName: { fontSize: 16, fontWeight: '600', color: '#333' },
  cityDesc: { fontSize: 14, color: '#666', marginTop: 2 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: 'red', textAlign: 'center', margin: 20 },
});

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCities = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `${GEOCODING_BASE}/search?name=${encodeURIComponent(searchQuery)}&count=10&language=uk`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Помилка пошуку');
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        setResults([]);
        return;
      }

      const formattedResults: SearchResult[] = data.results.map((item: any) => ({
        name: item.name,
        lat: item.latitude,
        lon: item.longitude,
        country: item.country,
        admin1: item.admin1,
      }));

      setResults(formattedResults);
    } catch (e: any) {
      setError(e?.message || 'Помилка мережі');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCityPress = useCallback((city: SearchResult) => {
    router.push({
      pathname: '/weather',
      params: {
        lat: String(city.lat),
        lon: String(city.lon),
        city: city.name,
      },
    });
  }, [router]);

  const handlePopularCityPress = useCallback((cityName: string) => {
    searchCities(cityName);
  }, [searchCities]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <View style={styles.searchHeader}>
          <Pressable style={styles.backBtn} onPress={handleBackPress}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Пошук міста..."
              placeholderTextColor="#666"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                searchCities(text);
              }}
              autoFocus
            />
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
        </View>

        <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 10 }}>Пошук...</Text>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {!loading && !error && results.length === 0 && query.length === 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Популярні міста</Text>
              <View style={styles.recentList}>
                {POPULAR_CITIES.map((city) => (
                  <Pressable
                    key={city}
                    style={styles.recentTag}
                    onPress={() => handlePopularCityPress(city)}
                  >
                    <Text style={styles.recentTagText}>{city}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {!loading && !error && results.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Результати пошуку</Text>
              {results.map((city, index) => (
                <Pressable
                  key={`${city.lat}-${city.lon}-${index}`}
                  style={styles.resultCard}
                  onPress={() => handleCityPress(city)}
                >
                  <View>
                    <Text style={styles.cityName}>{city.name}</Text>
                    <Text style={styles.cityDesc}>
                      {city.admin1 && `${city.admin1}, `}{city.country}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {!loading && !error && query.length > 0 && results.length === 0 && (
            <View style={styles.loadingContainer}>
              <Text>Міста не знайдено</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
