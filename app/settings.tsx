import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettings, useTranslations } from './context/SettingsContext';

const RAIN_HOURS = [1, 2, 3, 6, 12, 24];

function formatTimeDisplay(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const ctx = useSettings();
  const { t } = useTranslations();
  const { settings, colors, updateSettings } = ctx;
  const {
    toggleTemperatureUnit, toggleWindUnit, toggleLanguage,
    togglePushNotifications, toggleRainAlerts, setRainAlertHours,
    addNotificationTime, removeNotificationTime,
  } = ctx;

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | undefined>(undefined);

  const openTimePicker = (index?: number) => {
    if (index !== undefined) {
      const [h, m] = settings.notificationTimes[index].split(':').map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      setTempTime(d);
      setEditingTimeIndex(index);
    } else {
      const d = new Date(); d.setHours(10, 0, 0, 0);
      setTempTime(d);
      setEditingTimeIndex(undefined);
    }
    setShowTimePicker(true);
  };

  const handleTimeChange = (_: any, selected?: Date) => {
    setShowTimePicker(false);
    if (!selected) return;
    const h = selected.getHours();
    const m = selected.getMinutes();
    const ts = formatTimeDisplay(h, m);
    if (editingTimeIndex === undefined) {
      addNotificationTime(ts);
    } else {
      const newTimes = [...settings.notificationTimes];
      newTimes[editingTimeIndex] = ts;
      updateSettings({ notificationTimes: newTimes });
    }
  };

  const handleBack = () => router.back();

  const st = createStyles(colors);

  return (
    <View style={st.container}>
      <View style={st.header}>
        <Pressable style={st.backBtn} onPress={handleBack}>
          <Text style={st.backIcon}>←</Text>
        </Pressable>
        <Text style={st.headerTitle}>{t('settings')}</Text>
      </View>

      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Units */}
        <Text style={st.sectionLabel}>{t('units')}</Text>
        <View style={st.card}>
          <View style={st.row}>
            <View style={st.itemInfo}>
              <Text style={st.itemIcon}>🌡️</Text>
              <Text style={st.itemText}>{t('temperature')}</Text>
            </View>
            <View style={st.segment}>
              <Pressable style={[st.segOpt, settings.temperatureUnit === 'C' && st.segOptActive]} onPress={toggleTemperatureUnit}>
                <Text style={[st.segText, settings.temperatureUnit === 'C' && st.segTextActive]}>°C</Text>
              </Pressable>
              <Pressable style={[st.segOpt, settings.temperatureUnit === 'F' && st.segOptActive]} onPress={toggleTemperatureUnit}>
                <Text style={[st.segText, settings.temperatureUnit === 'F' && st.segTextActive]}>°F</Text>
              </Pressable>
            </View>
          </View>
          <View style={st.divider} />
          <View style={st.row}>
            <View style={st.itemInfo}>
              <Text style={st.itemIcon}>🌬️</Text>
              <Text style={st.itemText}>{t('wind')}</Text>
            </View>
            <View style={st.segment}>
              <Pressable style={[st.segOpt, settings.windUnit === 'kmh' && st.segOptActive]} onPress={toggleWindUnit}>
                <Text style={[st.segText, settings.windUnit === 'kmh' && st.segTextActive]}>км/г</Text>
              </Pressable>
              <Pressable style={[st.segOpt, settings.windUnit === 'ms' && st.segOptActive]} onPress={toggleWindUnit}>
                <Text style={[st.segText, settings.windUnit === 'ms' && st.segTextActive]}>м/с</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <Text style={st.sectionLabel}>{t('additional')}</Text>
        <View style={st.card}>
          <View style={st.themeRow}>
            <View style={st.itemInfo}>
              <Text style={st.itemIcon}>🎨</Text>
              <Text style={st.itemText}>{t('theme')}</Text>
            </View>
            <View style={st.themeSelector}>
              <Pressable
                style={[st.themeOpt, settings.theme === 'dark' && st.themeOptActive]}
                onPress={() => updateSettings({ theme: 'dark' })}
              >
                <Text style={st.themeOptIcon}>🌙</Text>
                <Text style={[st.themeOptLabel, settings.theme === 'dark' && st.themeOptLabelActive]}>{t('darkTheme')}</Text>
              </Pressable>
              <Pressable
                style={[st.themeOpt, settings.theme === 'light' && st.themeOptActive]}
                onPress={() => updateSettings({ theme: 'light' })}
              >
                <Text style={st.themeOptIcon}>☀️</Text>
                <Text style={[st.themeOptLabel, settings.theme === 'light' && st.themeOptLabelActive]}>{t('lightTheme')}</Text>
              </Pressable>
            </View>
          </View>
          <View style={st.divider} />
          <Pressable style={st.row} onPress={toggleLanguage}>
            <View style={st.itemInfo}>
              <Text style={st.itemIcon}>🌐</Text>
              <Text style={st.itemText}>{t('language')}</Text>
            </View>
            <Text style={st.hint}>{settings.language === 'ua' ? t('ukrainian') : t('english')} ›</Text>
          </Pressable>
        </View>

        {/* Notifications */}
        <Text style={st.sectionLabel}>{t('notifications')}</Text>
        <View style={st.card}>
          <View style={st.row}>
            <View style={st.itemInfo}>
              <Text style={st.itemIcon}>🔔</Text>
              <Text style={st.itemText}>{t('pushNotifications')}</Text>
            </View>
            <Pressable style={[st.toggle, settings.pushNotifications && st.toggleOn]} onPress={togglePushNotifications}>
              <View style={[st.toggleThumb, settings.pushNotifications && st.toggleThumbOn]} />
            </Pressable>
          </View>

          <View style={st.divider} />

          <View style={st.row}>
            <View style={st.itemInfo}>
              <Text style={st.itemIcon}>☔</Text>
              <Text style={st.itemText}>{t('rainAlerts')}</Text>
            </View>
            <Pressable style={[st.toggle, settings.rainAlerts && st.toggleOn]} onPress={toggleRainAlerts}>
              <View style={[st.toggleThumb, settings.rainAlerts && st.toggleThumbOn]} />
            </Pressable>
          </View>

          {settings.rainAlerts && (
            <View style={st.rainHoursSection}>
              <Text style={st.rainHoursLabel}>Попередити за:</Text>
              <View style={st.rainHoursRow}>
                {RAIN_HOURS.map(h => (
                  <Pressable
                    key={h}
                    style={[st.hourChip, settings.rainAlertHours === h && st.hourChipActive]}
                    onPress={() => setRainAlertHours(h)}
                  >
                    <Text style={[st.hourChipText, settings.rainAlertHours === h && st.hourChipTextActive]}>
                      {h} год
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Notification times */}
        <Text style={st.sectionLabel}>{t('notificationTime')}</Text>
        <View style={st.card}>
          {settings.notificationTimes.map((time, i) => (
            <View key={i}>
              {i > 0 && <View style={st.divider} />}
              <View style={st.row}>
                <View style={st.itemInfo}>
                  <Text style={st.itemIcon}>⏰</Text>
                  <Text style={st.itemText}>{time}</Text>
                </View>
                <View style={st.timeActions}>
                  <Pressable style={st.timeEditBtn} onPress={() => openTimePicker(i)}>
                    <Text style={st.timeEditText}>✏️</Text>
                  </Pressable>
                  <Pressable style={st.timeDelBtn} onPress={() => removeNotificationTime(i)}>
                    <Text style={st.timeDelText}>🗑️</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
          <View style={st.divider} />
          <Pressable style={st.addTimeRow} onPress={() => openTimePicker(undefined)}>
            <Text style={st.addTimeIcon}>➕</Text>
            <Text style={st.addTimeText}>Додати час</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={st.footer}>
          <Text style={st.footerText}>{t('version')}</Text>
          <Text style={st.footerText}>{t('developed')}</Text>
        </View>
      </ScrollView>

      {showTimePicker && (
        <DateTimePicker value={tempTime} mode="time" display="default" onChange={handleTimeChange} />
      )}
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenBg, padding: 24 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10, marginBottom: 30 },
    backBtn: {
      backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border,
      width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: 22, color: colors.backIcon },
    headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text, margin: 0 },
    scroll: { flex: 1 },
    sectionLabel: {
      fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.4,
      marginBottom: 12, fontWeight: '700', paddingLeft: 5, color: colors.text,
    },
    card: { backgroundColor: colors.cardBg, borderRadius: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 25 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingHorizontal: 20 },
    themeRow: { padding: 18, paddingHorizontal: 20 },
    themeSelector: { flexDirection: 'row', gap: 10, marginTop: 14 },
    themeOpt: {
      flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
      backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border,
    },
    themeOptActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    themeOptIcon: { fontSize: 22, marginBottom: 4 },
    themeOptLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
    themeOptLabelActive: { color: colors.hourActiveText },
    divider: { height: 1, backgroundColor: colors.border },
    itemInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemIcon: { fontSize: 18, opacity: 0.7 },
    itemText: { fontSize: 15, color: colors.text },
    hint: { fontSize: 15, opacity: 0.5, color: colors.text },
    segment: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', padding: 3, borderRadius: 10 },
    segOpt: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
    segOptActive: { backgroundColor: colors.text },
    segText: { fontSize: 12, fontWeight: '600', color: colors.text },
    segTextActive: { color: colors.screenBg },
    toggle: { width: 48, height: 26, backgroundColor: colors.toggleBg, borderRadius: 20, padding: 3, justifyContent: 'center' },
    toggleOn: { backgroundColor: colors.toggleOnBg },
    toggleThumb: {
      width: 20, height: 20, backgroundColor: colors.toggleThumb, borderRadius: 10,
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    },
    toggleThumbOn: { alignSelf: 'flex-end' },
    rainHoursSection: { paddingHorizontal: 20, paddingBottom: 18 },
    rainHoursLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 10, fontWeight: '600' },
    rainHoursRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    hourChip: {
      backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    },
    hourChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    hourChipText: { fontSize: 13, fontWeight: '600', color: colors.text },
    hourChipTextActive: { color: '#0f172a' },
    timeActions: { flexDirection: 'row', gap: 8 },
    timeEditBtn: { padding: 4 },
    timeEditText: { fontSize: 16 },
    timeDelBtn: { padding: 4 },
    timeDelText: { fontSize: 16 },
    addTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 18, paddingHorizontal: 20 },
    addTimeIcon: { fontSize: 16 },
    addTimeText: { fontSize: 15, color: colors.accent, fontWeight: '600' },
    footer: { marginTop: 8, marginBottom: 20, alignItems: 'center' },
    footerText: { fontSize: 11, lineHeight: 16, color: colors.footerText },
  });
}
