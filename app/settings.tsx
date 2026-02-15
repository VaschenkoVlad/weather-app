import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.phoneContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backBtn}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            >
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          {/* Units */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Units</Text>

            <View style={styles.card}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🌡️</Text>
                  <Text style={styles.itemText}>Temperature</Text>
                </View>
                <View style={styles.segment}>
                  <View style={[styles.segmentOption, styles.segmentOptionActive]}>
                    <Text style={[styles.segmentText, styles.segmentTextActive]}>°C</Text>
                  </View>
                  <View style={styles.segmentOption}>
                    <Text style={styles.segmentText}>°F</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🌬️</Text>
                  <Text style={styles.itemText}>Wind speed</Text>
                </View>
                <View style={styles.segment}>
                  <View style={[styles.segmentOption, styles.segmentOptionActive]}>
                    <Text style={[styles.segmentText, styles.segmentTextActive]}>km/h</Text>
                  </View>
                  <View style={styles.segmentOption}>
                    <Text style={styles.segmentText}>m/s</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notifications</Text>

            <View style={styles.card}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🔔</Text>
                  <Text style={styles.itemText}>Important alerts</Text>
                </View>
                <View style={[styles.toggle, styles.toggleOn]}>
                  <View style={[styles.toggleThumb, styles.toggleThumbOn]} />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>☔</Text>
                  <Text style={styles.itemText}>Precipitation probability</Text>
                </View>
                <View style={styles.toggle}>
                  <View style={styles.toggleThumb} />
                </View>
              </View>
            </View>
          </View>

          {/* App */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>App</Text>

            <View style={styles.card}>
              <Pressable style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🗺️</Text>
                  <Text style={styles.itemText}>Interface language</Text>
                </View>
                <Text style={styles.itemHint}>English ›</Text>
              </Pressable>

              <View style={styles.divider} />

              <Pressable style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>⭐</Text>
                  <Text style={styles.itemText}>Rate the app</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Weather App v2.4.0</Text>
          <Text style={styles.footerText}>© 2026 All rights reserved</Text>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 24 },
    elevation: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 15,
    marginBottom: 32,
    marginTop: 10,
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
    fontSize: 22,
    color: '#f9fafb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingLeft: 5,
    fontWeight: '700',
    color: 'rgba(249, 250, 251, 0.5)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  itemIcon: {
    fontSize: 18,
    color: 'rgba(249, 250, 251, 0.9)',
  },
  itemText: {
    fontSize: 15,
    color: '#f9fafb',
  },
  itemHint: {
    fontSize: 14,
    color: 'rgba(249, 250, 251, 0.6)',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    padding: 3,
  },
  segmentOption: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  segmentOptionActive: {
    backgroundColor: '#f9fafb',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  segmentTextActive: {
    color: '#0f172a',
  },
  toggle: {
    width: 48,
    height: 26,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 3,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: '#38bdf8',
    justifyContent: 'flex-end',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  toggleThumbOn: {},
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(249, 250, 251, 0.3)',
  },
});

