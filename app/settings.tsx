import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettings, useTranslations } from './context/SettingsContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, toggleTemperatureUnit, toggleWindUnit, toggleLanguage, togglePushNotifications, toggleRainAlerts } = useSettings();
  const { t } = useTranslations();

  const handleBackPress = () => {
    router.back();
  };

  const handleLanguagePress = () => {
    toggleLanguage();
  };

  const handleDataSourcePress = () => {
    // TODO: Реалізувати вибір джерела даних
    console.log('Data source selector');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.settingsHeader}>
        <Pressable style={styles.backBtn} onPress={handleBackPress}>
          <Text style={styles.backText}>{t('back')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Одиниці вимірювання */}
        <Text style={styles.sectionLabel}>{t('units')}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingsItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>🌡️</Text>
              <Text style={styles.itemText}>{t('temperature')}</Text>
            </View>
            <View style={styles.unitSelector}>
              <Pressable
                style={[
                  styles.unitOpt,
                  settings.temperatureUnit === 'C' && styles.unitOptActive
                ]}
                onPress={toggleTemperatureUnit}
              >
                <Text style={[
                  styles.unitOptText,
                  settings.temperatureUnit === 'C' && styles.unitOptTextActive
                ]}>°C</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.unitOpt,
                  settings.temperatureUnit === 'F' && styles.unitOptActive
                ]}
                onPress={toggleTemperatureUnit}
              >
                <Text style={[
                  styles.unitOptText,
                  settings.temperatureUnit === 'F' && styles.unitOptTextActive
                ]}>°F</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.settingsItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>🌬️</Text>
              <Text style={styles.itemText}>{t('wind')}</Text>
            </View>
            <View style={styles.unitSelector}>
              <Pressable
                style={[
                  styles.unitOpt,
                  settings.windUnit === 'kmh' && styles.unitOptActive
                ]}
                onPress={toggleWindUnit}
              >
                <Text style={[
                  styles.unitOptText,
                  settings.windUnit === 'kmh' && styles.unitOptTextActive
                ]}>км/г</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.unitOpt,
                  settings.windUnit === 'ms' && styles.unitOptActive
                ]}
                onPress={toggleWindUnit}
              >
                <Text style={[
                  styles.unitOptText,
                  settings.windUnit === 'ms' && styles.unitOptTextActive
                ]}>м/с</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Сповіщення */}
        <Text style={styles.sectionLabel}>{t('notifications')}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingsItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>🔔</Text>
              <Text style={styles.itemText}>{t('pushNotifications')}</Text>
            </View>
            <Pressable
              style={[styles.toggle, settings.pushNotifications && styles.toggleOn]}
              onPress={togglePushNotifications}
            >
              <View style={styles.toggleThumb} />
            </Pressable>
          </View>
          <View style={styles.settingsItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>☔</Text>
              <Text style={styles.itemText}>{t('rainAlerts')}</Text>
            </View>
            <Pressable
              style={[styles.toggle, settings.rainAlerts && styles.toggleOn]}
              onPress={toggleRainAlerts}
            >
              <View style={styles.toggleThumb} />
            </Pressable>
          </View>
        </View>

        {/* Додатково */}
        <Text style={styles.sectionLabel}>{t('additional')}</Text>
        <View style={styles.settingsCard}>
          <Pressable style={styles.settingsItem} onPress={handleLanguagePress}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>🌐</Text>
              <Text style={styles.itemText}>{t('language')}</Text>
            </View>
            <Text style={styles.itemHint}>
              {settings.language === 'ua' ? t('ukrainian') : t('english')} ›
            </Text>
          </Pressable>
          <Pressable style={styles.settingsItem} onPress={handleDataSourcePress}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemIcon}>🛠️</Text>
              <Text style={styles.itemText}>{t('dataSource')}</Text>
            </View>
            <Text style={styles.itemHint}>{t('openMeteo')} ›</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>{t('version')}</Text>
          <Text style={styles.footerText}>{t('developed')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 24,
  },
  // Header
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
    marginBottom: 30,
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: 'white',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    margin: 0,
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  // Sections
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.4,
    marginBottom: 12,
    fontWeight: '700',
    paddingLeft: 5,
    color: 'white',
  },
  // Settings Card
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 25,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIcon: {
    fontSize: 18,
    opacity: 0.7,
  },
  itemText: {
    fontSize: 15,
    color: 'white',
  },
  itemHint: {
    fontSize: 15,
    opacity: 0.5,
    color: 'white',
  },
  // Toggle Switch
  toggle: {
    width: 48,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    position: 'relative',
  },
  toggleOn: {
    backgroundColor: '#38bdf8',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    position: 'absolute',
    top: 3,
    left: 3,
  },
  // Unit Selector
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 3,
    borderRadius: 10,
  },
  unitOpt: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  unitOptActive: {
    backgroundColor: 'white',
  },
  unitOptText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  unitOptTextActive: {
    color: '#0f172a',
  },
  // Footer
  footerInfo: {
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 10,
    opacity: 0.3,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    lineHeight: 16,
    color: 'white',
  },
});
