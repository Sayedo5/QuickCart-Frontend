import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Button } from './Button';
import { spacing, useTheme } from '@/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  accent?: string;
}

/** Illustration-style empty state built from layered shapes and an icon. */
export function EmptyState({ icon, title, subtitle, actionLabel, onAction, accent }: EmptyStateProps) {
  const { palette, colors } = useTheme();
  const color = accent ?? palette.primary;
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <View style={[styles.blobLg, { backgroundColor: `${color}14` }]} />
        <View style={[styles.blobMd, { backgroundColor: `${color}22` }]} />
        <View style={[styles.circle, { backgroundColor: colors.surface, shadowColor: color }]}>
          <Ionicons name={icon} size={44} color={color} />
        </View>
        <View style={[styles.dot, styles.dotA, { backgroundColor: palette.secondary }]} />
        <View style={[styles.dot, styles.dotB, { backgroundColor: color }]} />
        <View style={[styles.dot, styles.dotC, { backgroundColor: palette.star }]} />
      </View>
      <AppText variant="h3" align="center" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" tone="secondary" align="center" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  illustration: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  blobLg: { position: 'absolute', width: 180, height: 180, borderRadius: 90 },
  blobMd: { position: 'absolute', width: 130, height: 130, borderRadius: 65 },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  dot: { position: 'absolute', borderRadius: 99 },
  dotA: { width: 14, height: 14, top: 26, right: 30 },
  dotB: { width: 10, height: 10, bottom: 34, left: 28 },
  dotC: { width: 8, height: 8, top: 60, left: 18 },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  action: { paddingHorizontal: spacing.xl },
});
