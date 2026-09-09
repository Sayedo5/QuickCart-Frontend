import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { radius, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

interface RadioCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  badge?: string;
}

export const RadioCard = React.memo(function RadioCard({
  title,
  subtitle,
  selected,
  onPress,
  icon,
  iconColor,
  right,
  style,
  badge,
}: RadioCardProps) {
  const { colors, palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? palette.primary : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: selected ? palette.primary : colors.surfaceAlt }]}>
          <Ionicons name={icon} size={20} color={selected ? palette.white : (iconColor ?? colors.textSecondary)} />
        </View>
      ) : null}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="bodySemiBold" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.secondarySoft }]}>
              <AppText variant="label" color={colors.onSecondarySoft}>
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <AppText variant="bodySm" tone="secondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      <View
        style={[
          styles.radio,
          { borderColor: selected ? palette.primary : colors.border, backgroundColor: colors.surface },
        ]}
      >
        {selected ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  body: { flex: 1, marginRight: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flexShrink: 1 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginLeft: spacing.xs },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
});
