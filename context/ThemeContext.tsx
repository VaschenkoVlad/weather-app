import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, type AppThemeColors } from '@/constants/themeColors';

const STORAGE_KEY = '@weather_app_dark_mode';

type ThemeContextType = {
  isDark: boolean;
  setDarkMode: (value: boolean) => void;
  colors: AppThemeColors;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'false') setIsDark(false);
      else if (stored === 'true') setIsDark(true);
    });
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setIsDark(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, setDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
