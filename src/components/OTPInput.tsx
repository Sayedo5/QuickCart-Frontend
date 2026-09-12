import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { radius, spacing, useTheme } from '@/theme';

export interface OTPInputHandle {
  shake: () => void;
  clear: () => void;
  focus: () => void;
}

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Six-box OTP input. A single hidden TextInput drives all boxes, which gives
 * native auto-advance, paste support and reliable backspace behaviour.
 */
export const OTPInput = React.forwardRef<OTPInputHandle, OTPInputProps>(function OTPInput(
  { length = 6, value, onChange, error, disabled, autoFocus = true },
  ref,
) {
  const { colors, palette } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shakeX = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    shake: () => {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
    },
    clear: () => onChange(''),
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const digits = value.split('');
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable style={styles.row} onPress={() => inputRef.current?.focus()} accessibilityLabel="Enter verification code">
        {Array.from({ length }).map((_, i) => {
          const isActive = focused && i === activeIndex && !disabled;
          const borderColor = error ? palette.error : isActive ? palette.primary : digits[i] ? colors.text : colors.border;
          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  borderColor,
                  backgroundColor: error ? colors.errorSoft : colors.surface,
                  borderWidth: isActive || error ? 2 : 1.5,
                },
              ]}
            >
              <AppText variant="h2" color={error ? palette.error : colors.text}>
                {digits[i] ?? ''}
              </AppText>
              {isActive && !digits[i] ? <View style={[styles.caret, { backgroundColor: palette.primary }]} /> : null}
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        // iOS reads one-time codes from Mail as well as Messages. On Android
        // "sms-otp" would be wrong — the code arrives by email, so there is no
        // SMS for the autofill service to read and the hint only suppresses the
        // normal keyboard suggestions.
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        importantForAutofill="yes"
        maxLength={length}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hidden}
        caretHidden
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caret: { position: 'absolute', width: 2, height: 24, borderRadius: 1 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1, top: 0, left: spacing.md },
});
