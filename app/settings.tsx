import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import type { Locale } from '@/constants/translations';
import type { AppThemeColors } from '@/constants/themeColors';

function createStyles(colors: AppThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rootBg },
    phoneContainer: {
      width: 375, maxWidth: '100%', height: 812, maxHeight: '100%',
      backgroundColor: colors.screenBg, borderRadius: 44, borderWidth: 8, borderColor: colors.borderStrong,
      overflow: 'hidden', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
      shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 24 }, elevation: 16,
    },
    scroll: { flex: 1 },
    content: { paddingBottom: 16 },
    header: { flexDirection: 'row', alignItems: 'center', columnGap: 15, marginBottom: 32, marginTop: 10 },
    backBtn: {
      width: 44, height: 44, borderRadius: 14, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: 22, color: colors.backIcon },
    headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
    section: { marginBottom: 28 },
    sectionLabel: {
      fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingLeft: 5,
      fontWeight: '700', color: colors.textMuted,
    },
    card: { backgroundColor: colors.cardBg, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20 },
    divider: { height: 1, backgroundColor: colors.border },
    itemInfo: { flexDirection: 'row', alignItems: 'center', columnGap: 12 },
    itemIcon: { fontSize: 18, color: colors.itemIcon },
    itemText: { fontSize: 15, color: colors.text },
    itemHint: { fontSize: 14, color: colors.textSecondary },
    segment: { flexDirection: 'row', backgroundColor: colors.segmentBg, borderRadius: 12, padding: 3 },
    segmentOption: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 9 },
    segmentOptionActive: { backgroundColor: colors.segmentActiveBg },
    segmentText: { fontSize: 13, fontWeight: '600', color: colors.segmentText },
    segmentTextActive: { color: colors.segmentTextActive },
    toggle: {
      width: 48, height: 26, borderRadius: 20, backgroundColor: colors.toggleBg,
      paddingHorizontal: 3, paddingVertical: 3, flexDirection: 'row', alignItems: 'center',
    },
    toggleOn: { backgroundColor: colors.toggleOnBg, justifyContent: 'flex-end' },
    toggleThumb: {
      width: 20, height: 20, borderRadius: 10, backgroundColor: colors.toggleThumb,
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    },
    toggleThumbOn: {},
    footer: { marginTop: 8, alignItems: 'center' },
    footerText: { fontSize: 12, color: colors.footerText },
    modalOverlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: {
      width: '100%', maxWidth: 320, backgroundColor: colors.modalBg, borderRadius: 24, borderWidth: 1, borderColor: colors.modalBorder, padding: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16, textAlign: 'center' },
    modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 6 },
    modalOptionActive: { backgroundColor: colors.metricIconBg },
    modalOptionText: { fontSize: 16, color: colors.segmentText },
    modalOptionTextActive: { color: colors.text, fontWeight: '600' },
    modalOptionCheck: { fontSize: 16, color: colors.accent, fontWeight: '700' },
    modalCancel: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
    modalCancelText: { fontSize: 15, color: colors.textSecondary },
  });
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale, languageLabel } = useLanguage();
  const { colors, isDark, setDarkMode } = useTheme();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [tempUnit, setTempUnit] = useState<'c' | 'f'>('c');
  const [windUnit, setWindUnit] = useState<'km' | 'ms'>('km');
  const [importantAlerts, setImportantAlerts] = useState<boolean>(true);
  const [precipitationProbability, setPrecipitationProbability] = useState<boolean>(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSelectLanguage = (newLocale: Locale) => {
    setLocale(newLocale);
    setLanguageModalVisible(false);
  };

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
            <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          </View>

          {/* Units */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.units')}</Text>

            <View style={styles.card}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🌡️</Text>
                  <Text style={styles.itemText}>{t('settings.temperature')}</Text>
                </View>
                <View style={styles.segment}>
                  <Pressable
                    style={[styles.segmentOption, tempUnit === 'c' && styles.segmentOptionActive]}
                    onPress={() => setTempUnit('c')}
                  >
                    <Text style={[styles.segmentText, tempUnit === 'c' && styles.segmentTextActive]}>°C</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.segmentOption, tempUnit === 'f' && styles.segmentOptionActive]}
                    onPress={() => setTempUnit('f')}
                  >
                    <Text style={[styles.segmentText, tempUnit === 'f' && styles.segmentTextActive]}>°F</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🌬️</Text>
                  <Text style={styles.itemText}>{t('settings.windSpeed')}</Text>
                </View>
                <View style={styles.segment}>
                  <Pressable
                    style={[styles.segmentOption, windUnit === 'km' && styles.segmentOptionActive]}
                    onPress={() => setWindUnit('km')}
                  >
                    <Text style={[styles.segmentText, windUnit === 'km' && styles.segmentTextActive]}>km/h</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.segmentOption, windUnit === 'ms' && styles.segmentOptionActive]}
                    onPress={() => setWindUnit('ms')}
                  >
                    <Text style={[styles.segmentText, windUnit === 'ms' && styles.segmentTextActive]}>m/s</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.notifications')}</Text>

            <View style={styles.card}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🔔</Text>
                  <Text style={styles.itemText}>{t('settings.importantAlerts')}</Text>
                </View>
                <Pressable
                  style={[styles.toggle, importantAlerts && styles.toggleOn]}
                  onPress={() => setImportantAlerts(!importantAlerts)}
                >
                  <View style={[styles.toggleThumb, importantAlerts && styles.toggleThumbOn]} />
                </Pressable>
              </View>

              <View style={styles.divider} />

              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>☔</Text>
                  <Text style={styles.itemText}>{t('settings.precipitationProbability')}</Text>
                </View>
                <Pressable
                  style={[styles.toggle, precipitationProbability && styles.toggleOn]}
                  onPress={() => setPrecipitationProbability(!precipitationProbability)}
                >
                  <View style={[styles.toggleThumb, precipitationProbability && styles.toggleThumbOn]} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* NOTE: Appearance tab removed; dark mode moved into App section below */}

          {/* App */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('settings.app')}</Text>

            <View style={styles.card}>
              <Pressable
                style={styles.itemRow}
                onPress={() => setLanguageModalVisible(true)}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🗺️</Text>
                  <Text style={styles.itemText}>{t('settings.interfaceLanguage')}</Text>
                </View>
                <Text style={styles.itemHint}>{languageLabel} ›</Text>
              </Pressable>

              <View style={styles.divider} />

              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>🌙</Text>
                  <Text style={styles.itemText}>{t('settings.darkMode')}</Text>
                </View>
                <Pressable
                  style={[styles.toggle, isDark && styles.toggleOn]}
                  onPress={() => setDarkMode(!isDark)}
                >
                  <View style={[styles.toggleThumb, isDark && styles.toggleThumbOn]} />
                </Pressable>
              </View>

              <View style={styles.divider} />

              <Pressable style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>⭐</Text>
                  <Text style={styles.itemText}>{t('settings.rateApp')}</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('settings.version')}</Text>
          <Text style={styles.footerText}>{t('settings.rights')}</Text>
        </View>

        {/* Модальне вікно вибору мови */}
        <Modal
          visible={languageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setLanguageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('settings.interfaceLanguage')}</Text>
              <Pressable
                style={[styles.modalOption, locale === 'en' && styles.modalOptionActive]}
                onPress={() => handleSelectLanguage('en')}
              >
                <Text style={[styles.modalOptionText, locale === 'en' && styles.modalOptionTextActive]}>
                  {t('language.english')}
                </Text>
                {locale === 'en' && <Text style={styles.modalOptionCheck}>✓</Text>}
              </Pressable>
              <Pressable
                style={[styles.modalOption, locale === 'uk' && styles.modalOptionActive]}
                onPress={() => handleSelectLanguage('uk')}
              >
                <Text style={[styles.modalOptionText, locale === 'uk' && styles.modalOptionTextActive]}>
                  {t('language.ukrainian')}
                </Text>
                {locale === 'uk' && <Text style={styles.modalOptionCheck}>✓</Text>}
              </Pressable>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t('language.cancel')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </View>
  );
}

