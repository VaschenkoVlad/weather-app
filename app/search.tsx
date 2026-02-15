import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { AppThemeColors } from '@/constants/themeColors';

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

