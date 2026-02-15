import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const WEEK_DAYS = [
  { key: 'mon', label: 'Mon', icon: '🌤️', max: 4, min: -1 },
  { key: 'tue', label: 'Tue', icon: '🌧️', max: 3, min: 0 },
  { key: 'wed', label: 'Wed', icon: '❄️', max: -2, min: -6 },
  { key: 'thu', label: 'Thu', icon: '☀️', max: 2, min: -2 },
  { key: 'fri', label: 'Fri', icon: '☁️', max: 5, min: 2 },
];

export default function WeatherScreen() {
  const router = useRouter();
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
              <Text style={styles.locationTitle}>New York</Text>
              <Text style={styles.locationSubtitle}>Saturday, 28 Dec</Text>
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
            <Text style={styles.heroStatus}>Cloudy</Text>
          </View>

          {/* Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🌬️</Text>
              <View>
                <Text style={styles.metricLabel}>Wind</Text>
                <Text style={styles.metricValue}>18 km/h</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>💧</Text>
              <View>
                <Text style={styles.metricLabel}>Humidity</Text>
                <Text style={styles.metricValue}>64%</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>☀️</Text>
              <View>
                <Text style={styles.metricLabel}>UV Index</Text>
                <Text style={styles.metricValue}>Low 1</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🌡️</Text>
              <View>
                <Text style={styles.metricLabel}>Pressure</Text>
                <Text style={styles.metricValue}>1012 hPa</Text>
              </View>
            </View>
          </View>

          {/* Next 24 hours */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next 24 Hours</Text>
            <Text style={styles.sectionLink}>Full Day</Text>
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
            <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          </View>

          <View style={styles.weeklyList}>
            {WEEK_DAYS.map((day) => (
              <View key={day.key} style={styles.dayButton}>
                <View style={styles.dayMain}>
                  <Text style={styles.dayName}>{day.label}</Text>
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 24 },
    elevation: 16,
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 50,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
  },
  locationSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(249, 250, 251, 0.6)',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  tempWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainTemp: {
    fontSize: 100,
    fontWeight: '300',
    color: '#f9fafb',
  },
  mainTempDegree: {
    fontSize: 40,
    color: '#38bdf8',
    marginTop: 10,
    marginLeft: 2,
  },
  heroStatus: {
    marginTop: 8,
    color: '#38bdf8',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  metricsGrid: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIcon: {
    fontSize: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: 8,
    borderRadius: 12,
  },
  metricLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: 'rgba(249, 250, 251, 0.5)',
  },
  metricValue: {
    fontSize: 15,
    color: '#f9fafb',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#38bdf8',
  },
  hourlyScroll: {
    marginBottom: 20,
  },
  hourCard: {
    minWidth: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 10,
  },
  hourCardActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  hourTime: {
    fontSize: 11,
    marginBottom: 6,
    color: 'rgba(249, 250, 251, 0.6)',
  },
  hourIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  hourTemp: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f9fafb',
  },
  hourActiveText: {
    color: '#0f172a',
  },
  weeklyList: {
    marginTop: 4,
    marginBottom: 12,
    rowGap: 10,
  },
  dayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayMain: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 15,
  },
  dayName: {
    width: 40,
    fontWeight: '600',
    color: '#f9fafb',
  },
  dayIcon: {
    fontSize: 18,
  },
  dayRange: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f9fafb',
  },
  dayRangeMin: {
    fontWeight: '400',
    opacity: 0.6,
  },
});
