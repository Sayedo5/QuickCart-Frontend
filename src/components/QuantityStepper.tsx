import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { radius, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md';
  max?: number;
}

export const QuantityStepper = React.memo(function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  size = 'sm',
  max = 20,
}: QuantityStepperProps) {
  const { colors, palette } = useTheme();
  const h = size === 'sm' ? 32 : 40;
  const iconSize = size === 'sm' ? 16 : 18;
  const atMax = quantity >= max;
  return (
    <View style={[styles.container, { height: h, backgroundColor: palette.primary, borderRadius: radius.button }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        hitSlop={6}
        onPress={() => {
          haptic.selection();
          onDecrement();
        }}
        style={({ pressed }) => [styles.btn, { width: h, opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name={quantity <= 1 ? 'trash-outline' : 'remove'} size={iconSize} color={palette.white} />
      </Pressable>
      <View style={[styles.value, { minWidth: size === 'sm' ? 24 : 32 }]}>
        <AppText variant={size === 'sm' ? 'bodySmSemiBold' : 'bodySemiBold'} color={palette.white} align="center">
          {quantity}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        hitSlop={6}
        disabled={atMax}
        onPress={() => {
          haptic.selection();
          onIncrement();
        }}
        style={({ pressed }) => [styles.btn, { width: h, opacity: atMax ? 0.4 : pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="add" size={iconSize} color={atMax ? colors.disabled : palette.white} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  btn: { height: '100%', alignItems: 'center', justifyContent: 'center' },
  value: { alignItems: 'center', justifyContent: 'center' },
});
