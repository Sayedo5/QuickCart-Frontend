import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { palette, spacing } from '@/theme';
import { haptic } from '@/utils/haptics';

/**
 * Slides in from the top whenever the device loses internet access and offers a
 * manual retry that re-checks connectivity. Screens keep working with cached state.
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      setOffline(isOffline);
    });
    return unsubscribe;
  }, []);

  const retry = useCallback(async () => {
    setChecking(true);
    haptic.selection();
    const state = await NetInfo.fetch();
    setOffline(state.isConnected === false || state.isInternetReachable === false);
    setChecking(false);
  }, []);

  if (!offline) return null;

  return (
    <Animated.View entering={FadeInUp.duration(250)} exiting={FadeOutUp.duration(200)} style={[styles.wrap, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
      <View style={styles.banner} accessibilityLiveRegion="polite" accessibilityRole="alert">
        <Ionicons name="cloud-offline" size={18} color={palette.white} />
        <AppText variant="bodySmMedium" color={palette.white} style={styles.text} numberOfLines={2}>
          You are offline. Showing saved data — some actions will wait until you reconnect.
        </AppText>
        <Pressable onPress={retry} disabled={checking} style={({ pressed }) => [styles.retry, { opacity: pressed || checking ? 0.6 : 1 }]} accessibilityRole="button" accessibilityLabel="Retry connection">
          <AppText variant="bodySmSemiBold" color={palette.white}>
            {checking ? 'Checking…' : 'Retry'}
          </AppText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingHorizontal: spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  text: { flex: 1, marginHorizontal: spacing.xs },
  retry: { backgroundColor: palette.primary, borderRadius: 10, paddingHorizontal: spacing.sm, paddingVertical: 6 },
});
