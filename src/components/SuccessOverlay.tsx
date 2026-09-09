import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { AppText } from './AppText';
import { spacing, useTheme } from '@/theme';
import { haptic } from '@/utils/haptics';

interface SuccessOverlayProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onDone?: () => void;
  durationMs?: number;
}

const successAnimation = require('@/assets/lottie/success.json');

export function SuccessOverlay({ visible, title, subtitle, onDone, durationMs = 2200 }: SuccessOverlayProps) {
  const { colors } = useTheme();

  useEffect(() => {
    if (!visible) return;
    haptic.success();
    const t = setTimeout(() => onDone?.(), durationMs);
    return () => clearTimeout(t);
  }, [visible, durationMs, onDone]);

  if (!visible) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="fade">
      <Animated.View entering={FadeIn.duration(200)} style={[styles.root, { backgroundColor: colors.background }]}>
        <LottieView source={successAnimation} autoPlay loop={false} style={styles.lottie} />
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.textWrap}>
          <AppText variant="h2" align="center">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="body" tone="secondary" align="center" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  lottie: { width: 200, height: 200 },
  textWrap: { marginTop: spacing.md, alignItems: 'center' },
  subtitle: { marginTop: spacing.xs },
});

export default SuccessOverlay;
