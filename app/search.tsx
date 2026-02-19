import type { AppThemeColors } from '@/constants/themeColors';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { default as React, default as React, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SERVER_BASE } from '../constants/server';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<any | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const pre = await AsyncStorage.getItem('preloadedWeather');
        const perr = await AsyncStorage.getItem('preload_error');
        if (perr) {
          setError(perr);
          await AsyncStorage.removeItem('preload_error');
        }
        if (pre) {
          setWeather(JSON.parse(pre));
          await AsyncStorage.removeItem('preloadedWeather');
        }

        const rec = await AsyncStorage.getItem('recentCities');
        if (rec) setRecent(JSON.parse(rec));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const saveRecent = useCallback(async (c: string) => {
    try {
      const next = [c, ...recent.filter(r => r !== c)].slice(0, 6);
      setRecent(next);
      await AsyncStorage.setItem('recentCities', JSON.stringify(next));
      await AsyncStorage.setItem('lastCity', c);
    } catch (e) {
      // ignore
    }
  }, [recent]);

  const fetchWeather = useCallback(async (q: string) => {
    if (!q) return;
    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const res = await fetch(`${SERVER_BASE}/weather?city=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) setError(json?.error || 'Server error');
      else {
        setWeather(json);
        saveRecent(q);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [saveRecent]);

  const fetchByCoords = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    setWeather(null);
    try {
      const res = await fetch(`${SERVER_BASE}/weather?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (!res.ok) setError(json?.error || 'Server error');
      else {
        setWeather(json);
        if (json?.city) saveRecent(json.city);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [saveRecent]);

  const handleSearch = useCallback(() => {
    if (query.trim()) fetchWeather(query.trim());
  }, [fetchWeather, query]);

  const handleMyLocation = useCallback(async () => {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (pos?.coords) {
        fetchByCoords(pos.coords.latitude, pos.coords.longitude);
      } else {
        setError('Unable to determine location');
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to get location');
    }
  }, [fetchByCoords]);

  const renderDay = useCallback((d: any) => (
    <View key={d.dt} style={styles.dayRow}>
      <Text>{new Date(d.dt * 1000).toLocaleDateString()}</Text>
      <Text>{d.weather?.description || ''}</Text>
      <Text>{d.temp?.day ? `${d.temp.day}°C` : ''}</Text>
    </View>
  ), []);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Search location</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter city"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />

      <View style={styles.rowButtons}>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={handleMyLocation}>
          <Text style={styles.buttonText}>My location</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" />}
      {error && <Text style={styles.error}>{error}</Text>}

      {weather && (
        <View style={styles.resultWrap}>
          <Text style={styles.resultCity}>{weather.city}</Text>
          <Text style={styles.resultTemp}>{weather.temperature}°C</Text>
          <Text style={styles.resultDesc}>{weather.description}</Text>
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
              {weather.daily.map((d: any) => renderDay(d))}
            </View>
          )}
        </View>
      )}

      {recent.length > 0 && (
        <View style={styles.recentWrap}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <View style={styles.chips}>
            {recent.map((r) => (
              <TouchableOpacity key={r} style={styles.chip} onPress={() => { setQuery(r); fetchWeather(r); }}>
                <Text>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#6b7280' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: 'red', textAlign: 'center', marginVertical: 8 },
  resultWrap: { alignItems: 'center', marginTop: 12 },
  resultCity: { fontSize: 20, fontWeight: '700' },
  resultTemp: { fontSize: 32, marginTop: 6 },
  resultDesc: { marginTop: 6, color: '#444' },
  icon: { width: 80, height: 80, marginTop: 8 },
  details: { marginTop: 8, alignItems: 'flex-start' },
  forecast: { width: '100%', marginTop: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  recentWrap: { marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 20, marginRight: 8, marginBottom: 8 },
});

const RECENT_CITIES = ['Kyiv', 'Lviv', 'London', 'Tokyo'];

function createStyles(colors: AppThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rootBg },
    phoneContainer: {
      width: 375, maxWidth: '100%', height: 812, maxHeight: '100%', backgroundColor: colors.screenBg,
      borderRadius: 44, borderWidth: 8, borderColor: colors.borderStrong, padding: 24, paddingBottom: 24,
      shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 24 }, elevation: 16,
    },
    searchHeader: { flexDirection: 'row', alignItems: 'center', columnGap: 12, marginTop: 10, marginBottom: 25 },
    backBtn: {
      width: 44, height: 44, borderRadius: 14, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: 20, color: colors.backIcon },
    searchInputWrapper: { flex: 1, position: 'relative', justifyContent: 'center' },
    searchInput: {
      width: '100%', backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, borderRadius: 14,
      paddingVertical: 10, paddingHorizontal: 15, paddingLeft: 40, color: colors.text, fontSize: 14,
    },
    searchIconInner: { position: 'absolute', left: 15, fontSize: 14, color: colors.inputPlaceholder },
    locationBtn: {
      backgroundColor: colors.metricIconBg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent,
      borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 8, marginBottom: 20,
    },
    locationEmoji: { fontSize: 16 },
    locationText: { fontSize: 14, fontWeight: '600', color: colors.accent },
    resultsScroll: { flex: 1 },
    resultsContent: { paddingBottom: 12 },
    sectionTitleWhite: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 12, color: colors.text },
    recentList: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 10, marginBottom: 24 },
    recentTag: {
      backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14,
    },
    recentTagText: { fontSize: 14, color: colors.text },
    resultCard: {
      backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: 20,
      paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
    },
    resultCardDimmed: { opacity: 0.7 },
    cityName: { fontSize: 18, fontWeight: '700', color: colors.text },
    cityDesc: { marginTop: 2, fontSize: 12, color: colors.textMuted },
    cityRight: { flexDirection: 'row', alignItems: 'center' },
    cityWeatherIcon: { fontSize: 24, marginRight: 10 },
    cityTemp: { fontSize: 24, fontWeight: '300', color: colors.text },
  });
}

const POPULAR_CITIES = [
  { id: 'kyiv', name: 'Kyiv', countryKey: 'countryUkraine' as const, time: '14:20', icon: '☀️', temp: '-2°' },
  { id: 'paris', name: 'Paris', countryKey: 'countryFrance' as const, time: '13:20', icon: '☁️', temp: '8°' },
  { id: 'ny', name: 'New York', countryKey: 'countryUSA' as const, time: '07:20', icon: '🌧️', temp: '5°' },
  { id: 'berlin', name: 'Berlin', countryKey: 'countryGermany' as const, time: '13:20', icon: '❄️', temp: '1°', dimmed: true },
];

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
              placeholder={t('search.placeholder')}
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
        </View>

        {/* Location button */}
        <Pressable style={styles.locationBtn}>
          <Text style={styles.locationEmoji}>📍</Text>
          <Text style={styles.locationText}>{t('search.useMyLocation')}</Text>
        </Pressable>

        {/* Content */}
        <ScrollView
          style={styles.resultsScroll}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent */}
          <Text style={styles.sectionTitleWhite}>{t('search.recent')}</Text>
          <View style={styles.recentList}>
            {RECENT_CITIES.map((city) => (
              <Pressable key={city} style={styles.recentTag}>
                <Text style={styles.recentTagText}>{city}</Text>
              </Pressable>
            ))}
          </View>

          {/* Popular cities */}
          <Text style={styles.sectionTitleWhite}>{t('search.popularCities')}</Text>
          <View>
            {POPULAR_CITIES.map((city) => (
              <Pressable
                key={city.id}
                style={[styles.resultCard, city.dimmed && styles.resultCardDimmed]}
              >
                <View>
                  <Text style={styles.cityName}>{city.name}</Text>
                  <Text style={styles.cityDesc}>
                    {t(`search.${city.countryKey}`)}, {city.time}
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

