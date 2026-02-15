import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { AppThemeColors } from '@/constants/themeColors';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function createStyles(colors: AppThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rootBg },
    phoneContainer: {
      width: 375, maxWidth: '100%', height: 812, maxHeight: '100%', backgroundColor: colors.screenBg,
      borderRadius: 44, borderWidth: 8, borderColor: colors.borderStrong, overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 24 }, elevation: 16,
    },
    scrollWrapper: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 50 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    locationTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
    locationSubtitle: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
    controls: { flexDirection: 'row', gap: 8 },
    iconBtn: {
      backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    iconBtnText: { fontSize: 16 },
    heroSection: { alignItems: 'center', paddingVertical: 20 },
    tempWrapper: { flexDirection: 'row', alignItems: 'flex-start' },
    mainTemp: { fontSize: 100, fontWeight: '300', color: colors.text },
    mainTempDegree: { fontSize: 40, color: colors.accent, marginTop: 10, marginLeft: 2 },
    heroStatus: { marginTop: 8, color: colors.accent, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontSize: 13 },
    metricsGrid: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
    metricCard: {
      width: '48%', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    metricIcon: { fontSize: 20, backgroundColor: colors.metricIconBg, padding: 8, borderRadius: 12 },
    metricLabel: { fontSize: 11, textTransform: 'uppercase', color: colors.textMuted },
    metricValue: { fontSize: 15, color: colors.text, marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
    sectionLink: { fontSize: 14, fontWeight: '500', color: colors.accent },
    hourlyScroll: { marginBottom: 20 },
    hourCard: {
      minWidth: 65, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 12, paddingHorizontal: 10, borderRadius: 20, alignItems: 'center', marginRight: 10,
    },
    hourCardActive: { backgroundColor: colors.hourCardActiveBg, borderColor: colors.hourCardActiveBg },
    hourTime: { fontSize: 11, marginBottom: 6, color: colors.textSecondary },
    hourIcon: { fontSize: 20, marginBottom: 6 },
    hourTemp: { fontSize: 15, fontWeight: '700', color: colors.text },
    hourActiveText: { color: colors.hourActiveText },
    weeklyList: { marginTop: 4, marginBottom: 12, rowGap: 10 },
    dayButton: {
      backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: 22,
      paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    dayMain: { flexDirection: 'row', alignItems: 'center', columnGap: 15 },
    dayName: { width: 40, fontWeight: '600', color: colors.text },
    dayIcon: { fontSize: 18 },
    dayRange: { fontSize: 14, fontWeight: '700', color: colors.text },
    dayRangeMin: { fontWeight: '400', opacity: 0.6 },
  });
}

const WEEK_DAYS = [
  { key: 'mon', labelKey: 'dayMon' as const, icon: '🌤️', max: 4, min: -1 },
  { key: 'tue', labelKey: 'dayTue' as const, icon: '🌧️', max: 3, min: 0 },
  { key: 'wed', labelKey: 'dayWed' as const, icon: '❄️', max: -2, min: -6 },
  { key: 'thu', labelKey: 'dayThu' as const, icon: '☀️', max: 2, min: -2 },
  { key: 'fri', labelKey: 'dayFri' as const, icon: '☁️', max: 5, min: 2 },
];

export default function WeatherScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hourlyData = useMemo(
    () =>
      HOURS.map((hour) => {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        const isNight = hour > 21 || hour < 6;
        const icons = ['☀️', '🌤️', '☁️', '🌧️'];
        const icon = isNight ? '🌙' : icons[hour % icons.length];
        const temp = 1 + ((hour * 3) % 6);

        return {
          hour,
          time,
          icon,
          temp,
          active: hour === 14,
        };
      }),
    []
  );

  return (
    <View style={styles.root}>
      <View style={styles.phoneContainer}>
        <ScrollView
          style={styles.scrollWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.locationTitle}>{t('home.location')}</Text>
              <Text style={styles.locationSubtitle}>{t('home.date')}</Text>
            </View>

            <View style={styles.controls}>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push('/search')}
                accessibilityLabel="Open search"
              >
                <Text style={styles.iconBtnText}>🔍</Text>
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={() => router.push('/settings')}
                accessibilityLabel="Open settings"
              >
                <Text style={styles.iconBtnText}>⚙️</Text>
              </Pressable>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.tempWrapper}>
              <Text style={styles.mainTemp}>5</Text>
              <Text style={styles.mainTempDegree}>°</Text>
            </View>
            <Text style={styles.heroStatus}>{t('home.cloudy')}</Text>
          </View>

          {/* Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🌬️</Text>
              <View>
                <Text style={styles.metricLabel}>{t('home.wind')}</Text>
                <Text style={styles.metricValue}>18 km/h</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>💧</Text>
              <View>
                <Text style={styles.metricLabel}>{t('home.humidity')}</Text>
                <Text style={styles.metricValue}>64%</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>☀️</Text>
              <View>
                <Text style={styles.metricLabel}>{t('home.uvIndex')}</Text>
                <Text style={styles.metricValue}>Low 1</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🌡️</Text>
              <View>
                <Text style={styles.metricLabel}>{t('home.pressure')}</Text>
                <Text style={styles.metricValue}>1012 hPa</Text>
              </View>
            </View>
          </View>

          {/* Next 24 hours */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.next24Hours')}</Text>
            <Text style={styles.sectionLink}>{t('home.fullDay')}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hourlyScroll}
          >
            {hourlyData.map((item) => (
              <View
                key={item.hour}
                style={[
                  styles.hourCard,
                  item.active && styles.hourCardActive,
                ]}
              >
                <Text
                  style={[
                    styles.hourTime,
                    item.active && styles.hourActiveText,
                  ]}
                >
                  {item.time}
                </Text>
                <Text
                  style={[
                    styles.hourIcon,
                    item.active && styles.hourActiveText,
                  ]}
                >
                  {item.icon}
                </Text>
                <Text
                  style={[
                    styles.hourTemp,
                    item.active && styles.hourActiveText,
                  ]}
                >
                  {item.temp}°
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* 7-day forecast */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.forecast7Day')}</Text>
          </View>

          <View style={styles.weeklyList}>
            {WEEK_DAYS.map((day) => (
              <View key={day.key} style={styles.dayButton}>
                <View style={styles.dayMain}>
                  <Text style={styles.dayName}>{t(`home.${day.labelKey}`)}</Text>
                  <Text style={styles.dayIcon}>{day.icon}</Text>
                </View>
                <Text style={styles.dayRange}>
                  {day.max}°
                  <Text style={styles.dayRangeMin}>  {day.min}°</Text>
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

