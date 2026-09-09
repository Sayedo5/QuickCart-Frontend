import React from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from './AppText';
import { spacing, useTheme } from '@/theme';

const logoSource = require('../../assets/brand/logo.png');

/** Native aspect ratio of the QC mark (916 × 600). */
export const LOGO_RATIO = 916 / 600;

interface LogoProps {
  /** Rendered height in dp; width follows the logo's aspect ratio. */
  height?: number;
  style?: StyleProp<ImageStyle>;
}

/** The QuickCart "QC" brand mark. */
export function Logo({ height = 40, style }: LogoProps) {
  return (
    <Image
      source={logoSource}
      style={[{ height, width: Math.round(height * LOGO_RATIO) }, style]}
      contentFit="contain"
      cachePolicy="memory"
      accessibilityLabel="QuickCart logo"
      accessible
    />
  );
}

interface BrandLockupProps {
  /** Mark height in dp. */
  height?: number;
  /** Show the "QuickCart" wordmark next to the mark. */
  wordmark?: boolean;
  tagline?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  align?: 'row' | 'column';
}

/** Mark + wordmark, used on auth and onboarding screens. */
export function BrandLockup({ height = 36, wordmark = true, tagline, color, style, align = 'row' }: BrandLockupProps) {
  const { colors } = useTheme();
  return (
    <View style={[align === 'row' ? styles.row : styles.column, style]}>
      <Logo height={height} />
      {wordmark ? (
        <View style={align === 'row' ? styles.textRow : styles.textColumn}>
          <AppText variant={height >= 48 ? 'h1' : 'h3'} color={color ?? colors.text} align={align === 'column' ? 'center' : undefined}>
            QuickCart
          </AppText>
          {tagline ? (
            <AppText variant="bodySm" tone="secondary" color={color ? `${color}CC` : undefined} align={align === 'column' ? 'center' : undefined}>
              {tagline}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { alignItems: 'center' },
  textRow: { marginLeft: spacing.sm },
  textColumn: { marginTop: spacing.md, alignItems: 'center' },
});
