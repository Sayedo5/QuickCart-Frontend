import { useColorScheme } from 'react-native';
import { darkColors, lightColors, palette, ThemeColors } from './colors';
import { useSettingsStore } from '@/store/useSettingsStore';

export { palette } from './colors';
export type { ThemeColors } from './colors';
export { fonts, typography } from './typography';
export type { TypographyVariant } from './typography';
export { spacing, radius, shadow, absoluteFill } from './spacing';

export type Theme = {
  colors: ThemeColors;
  palette: typeof palette;
  isDark: boolean;
};

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  return {
    colors: isDark ? darkColors : lightColors,
    palette,
    isDark,
  };
}
