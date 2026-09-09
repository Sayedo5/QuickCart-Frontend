import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { spacing, useTheme } from '@/theme';
import { OrderStatus } from '@/data/types';
import { STATUS_STEPS, statusIndex } from '@/store/useOrderStore';

const ICONS: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
  placed: 'receipt',
  preparing: 'restaurant',
  picked_up: 'bicycle',
  delivered: 'checkmark-done',
  cancelled: 'close',
};

const CIRCLE = 36;
const LINE = 4;

/** A half-width connector line that animates its fill from one side. */
function Segment({ side, filled }: { side: 'left' | 'right'; filled: boolean }) {
  const { colors, palette } = useTheme();
  const progress = useSharedValue(filled ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [filled, progress]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View style={[styles.segment, side === 'left' ? styles.segmentLeft : styles.segmentRight, { backgroundColor: colors.border }]}>
      <Animated.View style={[styles.segmentFill, { backgroundColor: palette.secondary, alignSelf: side === 'left' ? 'flex-end' : 'flex-start' }, fillStyle]} />
    </View>
  );
}

function Circle({ status, state }: { status: OrderStatus; state: 'done' | 'active' | 'todo' }) {
  const { colors, palette } = useTheme();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (state === 'active') {
      scale.value = withTiming(1.12, { duration: 250 }, () => {
        scale.value = withTiming(1, { duration: 250 });
      });
    }
  }, [state, scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = state === 'todo' ? colors.surfaceAlt : state === 'done' ? palette.secondary : palette.primary;
  const fg = state === 'todo' ? colors.textTertiary : palette.white;
  return (
    <Animated.View style={[styles.circle, { backgroundColor: bg }, animated]}>
      <Ionicons name={state === 'done' ? 'checkmark' : ICONS[status]} size={16} color={fg} />
    </Animated.View>
  );
}

/**
 * Horizontal order-status stepper. Each step owns a column; connector segments
 * live inside the columns so labels always sit centred under their circle.
 */
export function StatusStepper({ status }: { status: OrderStatus }) {
  const { colors, palette } = useTheme();
  const current = status === 'cancelled' ? -1 : statusIndex(status);
  const last = STATUS_STEPS.length - 1;
  return (
    <View style={styles.row}>
      {STATUS_STEPS.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <View key={step.key} style={styles.column}>
            <View style={styles.track}>
              {i > 0 ? <Segment side="left" filled={i <= current} /> : null}
              {i < last ? <Segment side="right" filled={i < current} /> : null}
              <Circle status={step.key} state={state} />
            </View>
            <AppText
              variant="captionMedium"
              align="center"
              numberOfLines={1}
              color={i === current ? palette.primary : i < current ? colors.text : colors.textTertiary}
              style={styles.label}
            >
              {step.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  column: { flex: 1, alignItems: 'center' },
  track: { height: CIRCLE, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  circle: { width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, alignItems: 'center', justifyContent: 'center' },
  segment: { position: 'absolute', top: CIRCLE / 2 - LINE / 2, height: LINE, width: '50%', overflow: 'hidden' },
  segmentLeft: { left: 0 },
  segmentRight: { right: 0 },
  segmentFill: { height: '100%' },
  label: { marginTop: spacing.xs },
});
