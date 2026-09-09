import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { radius, shadow, spacing, useTheme } from '@/theme';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ padded = true, elevated = true, style, children, ...rest }: CardProps) {
  const { colors, isDark } = useTheme();
  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
        },
        elevated && !isDark ? shadow.soft : null,
        padded ? styles.padded : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.card },
  padded: { padding: spacing.md },
});
