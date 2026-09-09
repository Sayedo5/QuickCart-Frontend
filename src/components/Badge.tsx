import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { radius, spacing, useTheme } from '@/theme';

interface BadgeProps {
  label: string;
  tone?: 'brand' | 'success' | 'neutral' | 'warning' | 'error' | 'dark';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}

export function Badge({ label, tone = 'neutral', icon, style, small }: BadgeProps) {
  const { colors, palette, isDark } = useTheme();
  // Every tone pairs a tinted background with a text colour that stays readable in both themes.
  const tones = {
    brand: { bg: colors.primarySoft, text: isDark ? '#FF8F5E' : palette.primaryPressed },
    success: { bg: colors.secondarySoft, text: colors.onSecondarySoft },
    neutral: { bg: colors.surfaceAlt, text: colors.textSecondary },
    warning: { bg: colors.warningSoft, text: colors.onWarningSoft },
    error: { bg: colors.errorSoft, text: isDark ? '#FF7B76' : palette.error },
    dark: { bg: 'rgba(0,0,0,0.65)', text: palette.white },
  };
  const t = tones[tone];
  return (
    <View style={[styles.base, { backgroundColor: t.bg, paddingVertical: small ? 2 : 4 }, style]}>
      {icon ? <Ionicons name={icon} size={small ? 10 : 12} color={t.text} style={styles.icon} /> : null}
      <AppText variant={small ? 'label' : 'captionMedium'} color={t.text} style={small ? styles.smallText : undefined} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export function RatingBadge({ rating, count, style }: { rating: number; count?: number; style?: StyleProp<ViewStyle> }) {
  const { palette, colors } = useTheme();
  return (
    <View style={[styles.rating, { backgroundColor: colors.surface }, style]}>
      <Ionicons name="star" size={12} color={palette.star} />
      <AppText variant="captionMedium" style={styles.ratingText}>
        {rating.toFixed(1)}
      </AppText>
      {count !== undefined ? (
        <AppText variant="caption" tone="tertiary">
          {' '}
          ({count > 999 ? `${(count / 1000).toFixed(1)}k` : count})
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  icon: { marginRight: 4 },
  smallText: { fontSize: 10, lineHeight: 14 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  ratingText: { marginLeft: 4 },
});
