import React from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { typography, TypographyVariant, useTheme } from '@/theme';

export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'error' | 'inverse';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

export const AppText = React.memo(function AppText({
  variant = 'body',
  tone = 'primary',
  color,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors, palette } = useTheme();
  const toneColor: Record<TextTone, string> = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    brand: palette.primary,
    success: palette.secondary,
    error: palette.error,
    inverse: palette.white,
  };
  return (
    <Text
      {...rest}
      style={[typography[variant], styles.base, { color: color ?? toneColor[tone], textAlign: align }, style]}
    >
      {children}
    </Text>
  );
});

const styles = StyleSheet.create({
  // Android adds extra vertical padding to Poppins/Inter; disabling it keeps text centred in buttons and rows.
  base: { includeFontPadding: false },
});
