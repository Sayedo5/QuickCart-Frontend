import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { AppText, Logo } from '@/components';
import { palette, spacing } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { RootScreenProps } from '@/navigation/types';

const SPLASH_DURATION = 1500;

export function SplashScreen({ navigation }: RootScreenProps<'Splash'>) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(12);
  const glow = useSharedValue(0.9);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.6)) });
    opacity.value = withTiming(1, { duration: 500 });
    textOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
    textY.value = withDelay(350, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    glow.value = withRepeat(withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [scale, opacity, textOpacity, textY, glow]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      const next = !hasOnboarded ? 'Onboarding' : !isAuthenticated ? 'Login' : 'Main';
      navigation.reset({ index: 0, routes: [{ name: next }] });
    }, SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, [hydrated, hasOnboarded, isAuthenticated, navigation]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.9,
    transform: [{ scale: glow.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.blob, styles.blobA]} />
      <View style={[styles.blob, styles.blobB]} />
      <View style={styles.center}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Animated.View style={logoStyle}>
          <Logo height={132} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.textWrap, textStyle]}>
        <AppText variant="display" color="#1A1A1A">
          QuickCart
        </AppText>
        <AppText variant="bodyMedium" tone="secondary">
          Food · Grocery · Pharmacy, delivered fast in Lahore
        </AppText>
      </Animated.View>
      <View style={styles.footer}>
        <View style={[styles.dot, { backgroundColor: palette.primary }]} />
        <View style={[styles.dot, { backgroundColor: palette.secondary }]} />
        <View style={[styles.dot, { backgroundColor: palette.star }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: { width: 340, height: 340, top: -120, right: -140, backgroundColor: 'rgba(255,107,53,0.08)' },
  blobB: { width: 280, height: 280, bottom: -90, left: -120, backgroundColor: 'rgba(46,196,182,0.10)' },
  center: { alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,107,53,0.07)',
  },
  textWrap: { alignItems: 'center', marginTop: spacing.xl },
  footer: { position: 'absolute', bottom: 48, flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
