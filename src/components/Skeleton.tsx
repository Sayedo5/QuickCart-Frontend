import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing, useTheme } from '@/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: 0.55 + progress.value * 0.45,
  }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.skeleton }, animated, style]}
    />
  );
}

export function StoreCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.storeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Skeleton height={150} borderRadius={radius.card} />
      <View style={styles.storeBody}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="40%" height={12} style={{ marginTop: spacing.xs }} />
        <View style={styles.row}>
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={12} style={{ marginLeft: spacing.md }} />
        </View>
      </View>
    </View>
  );
}

export function ProductRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.productRow, { borderBottomColor: colors.divider }]}>
      <View style={{ flex: 1 }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="90%" height={12} style={{ marginTop: spacing.xs }} />
        <Skeleton width="30%" height={14} style={{ marginTop: spacing.sm }} />
      </View>
      <Skeleton width={84} height={84} borderRadius={radius.button} />
    </View>
  );
}

export function OrderCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <Skeleton width={52} height={52} borderRadius={radius.button} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="35%" height={12} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
      <Skeleton width="85%" height={12} style={{ marginTop: spacing.md }} />
      <Skeleton width="45%" height={12} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

const styles = StyleSheet.create({
  storeCard: {
    borderRadius: radius.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
  },
  storeBody: { padding: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  productRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  orderCard: {
    borderRadius: radius.card,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
