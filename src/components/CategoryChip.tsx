import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { radius, spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const CategoryChip = React.memo(function CategoryChip({ label, active, onPress, icon }: CategoryChipProps) {
  const { colors, palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={() => {
        haptic.selection();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? palette.primary : colors.surface,
          borderColor: active ? palette.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={active ? palette.white : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <AppText variant="bodySmMedium" color={active ? palette.white : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  icon: { marginRight: 6 },
});
