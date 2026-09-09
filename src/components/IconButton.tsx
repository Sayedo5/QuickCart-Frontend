import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  variant?: 'filled' | 'soft' | 'plain' | 'brand';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  size = 40,
  iconSize = 20,
  color,
  backgroundColor,
  variant = 'filled',
  style,
  accessibilityLabel,
  disabled,
}: IconButtonProps) {
  const { colors, palette } = useTheme();
  const bg =
    backgroundColor ??
    (variant === 'filled'
      ? colors.surface
      : variant === 'soft'
        ? colors.surfaceAlt
        : variant === 'brand'
          ? palette.primary
          : 'transparent');
  const iconColor = color ?? (variant === 'brand' ? palette.white : colors.text);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
      disabled={disabled}
      onPress={() => {
        haptic.selection();
        onPress?.();
      }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: variant === 'plain' ? radius.button : size / 2,
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
