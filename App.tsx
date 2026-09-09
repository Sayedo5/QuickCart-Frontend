import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ErrorBoundary, OfflineBanner } from '@/components';
import { navigate } from '@/navigation/navigationRef';
import { RootNavigator } from '@/navigation/RootNavigator';
import { initMonitoring, wrapRoot } from '@/services/monitoring';
import { ensureNotificationChannel, payloadFromResponse } from '@/services/notifications';
import { useAppConfigStore } from '@/store/useAppConfigStore';
import { useTheme } from '@/theme';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});
initMonitoring();

function ThemedApp({ fontsReady }: { fontsReady: boolean }) {
  const { colors, isDark } = useTheme();
  const syncConfig = useAppConfigStore((s) => s.sync);
  const notificationHandled = useRef(false);

  const onReady = useCallback(async () => {
    if (fontsReady) await ExpoSplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useEffect(() => {
    syncConfig();
    ensureNotificationChannel().catch(() => undefined);
  }, [syncConfig]);

  // Tapping an order notification opens that order's tracking screen.
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      const payload = payloadFromResponse(response);
      if (payload.orderId) navigate('OrderTracking', { orderId: payload.orderId });
      else if (payload.type === 'promo') navigate('Offers');
    };
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && !notificationHandled.current) {
        notificationHandled.current = true;
        setTimeout(() => open(response), 800);
      }
    });
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  if (!fontsReady) return <View style={[styles.root, { backgroundColor: '#FFFFFF' }]} />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
      <OfflineBanner />
    </View>
  );
}

function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemedApp fontsReady={fontsLoaded || !!fontError} />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default wrapRoot(App);
