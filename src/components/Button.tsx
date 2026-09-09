import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { absoluteFill, radius, spacing, typography, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HEIGHTS: Record<Size, number> = { sm: 40, md: 48, lg: 56 };

/**
 * Primary CTA button with all four states:
 *  - default: solid brand color, white text
 *  - pressed: 10% darker + scale 0.97 + haptic
 *  - disabled: gray background, muted text
 *  - loading: spinner replaces text, same size (no layout shift)
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  icon,
  iconPosition = 'left',
  style,
  hapticFeedback = true,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, palette } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const isInactive = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: pressed.value }));

  const onPressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 90 });
    pressed.value = withTiming(1, { duration: 90 });
  }, [scale, pressed]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 140 });
    pressed.value = withTiming(0, { duration: 140 });
  }, [scale, pressed]);

  const handlePress = useCallback(() => {
    if (isInactive) return;
    if (hapticFeedback) haptic.light();
    onPress?.();
  }, [isInactive, hapticFeedback, onPress]);

  const palettes: Record<
    Variant,
    { bg: string; text: string; border: string; pressedOverlay: string; spinner: string }
  > = {
    primary: {
      bg: palette.primary,
      text: palette.white,
      border: 'transparent',
      pressedOverlay: 'rgba(0,0,0,0.10)',
      spinner: palette.white,
    },
    secondary: {
      bg: palette.secondary,
      text: palette.white,
      border: 'transparent',
      pressedOverlay: 'rgba(0,0,0,0.10)',
      spinner: palette.white,
    },
    outline: {
      bg: 'transparent',
      text: palette.primary,
      border: palette.primary,
      pressedOverlay: 'rgba(255,107,53,0.10)',
      spinner: palette.primary,
    },
    ghost: {
      bg: colors.surfaceAlt,
      text: colors.text,
      border: 'transparent',
      pressedOverlay: 'rgba(0,0,0,0.06)',
      spinner: colors.text,
    },
    danger: {
      bg: palette.error,
      text: palette.white,
      border: 'transparent',
      pressedOverlay: 'rgba(0,0,0,0.10)',
      spinner: palette.white,
    },
  };

  const p = palettes[variant];
  const bg = disabled ? colors.disabled : p.bg;
  const textColor = disabled ? colors.disabledText : p.text;
  const borderColor = disabled ? 'transparent' : p.border;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      onPress={handlePress}
      onPressIn={isInactive ? undefined : onPressIn}
      onPressOut={isInactive ? undefined : onPressOut}
      disabled={isInactive}
      style={[
        styles.base,
        {
          height: HEIGHTS[size],
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
        },
        animatedStyle,
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: p.pressedOverlay, borderRadius: radius.button }, overlayStyle]}
      />
      <View style={[styles.content, { opacity: loading ? 0 : 1 }]}>
        {icon && iconPosition === 'left' ? (
          <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={textColor} style={styles.iconLeft} />
        ) : null}
        <AppText
          variant="button"
          color={textColor}
          style={size === 'sm' ? styles.smText : undefined}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {icon && iconPosition === 'right' ? (
          <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={textColor} style={styles.iconRight} />
        ) : null}
      </View>
      {loading ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator color={p.spinner} size="small" />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: spacing.xs },
  iconRight: { marginLeft: spacing.xs },
  smText: { fontSize: typography.bodySm.fontSize },
  spinner: {
    ...absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
