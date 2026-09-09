import React, { useState } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { fonts, radius, spacing, useTheme } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, hint, icon, right, containerStyle, style, onFocus, onBlur, ...rest }: InputProps) {
  const { colors, palette } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? palette.error : focused ? palette.primary : colors.border;
  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="bodySmMedium" tone="secondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          { backgroundColor: colors.inputBackground, borderColor, borderWidth: focused || error ? 1.5 : 1 },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={focused ? palette.primary : colors.textTertiary} style={styles.icon} /> : null}
        <TextInput
          {...rest}
          placeholderTextColor={colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }, style]}
        />
        {right}
      </View>
      {error ? (
        <AppText variant="caption" tone="error" style={styles.helper}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="tertiary" style={styles.helper}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    minHeight: 50,
  },
  icon: { marginRight: spacing.xs },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, paddingVertical: spacing.sm },
  helper: { marginTop: 6 },
});
