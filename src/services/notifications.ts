import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { env } from '@/config/env';
import { addBreadcrumb, captureException } from './monitoring';

/**
 * Push notification registration. Remote push is not available inside Expo Go
 * (SDK 53+), so registration is skipped there; local notifications still work.
 * The Expo push token is sent to the backend by the auth store after login.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Returns true if running inside the Expo Go client environment. */
export const isExpoGoEnvironment = (): boolean =>
  env.isExpoGo ||
  isRunningInExpoGo() ||
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.executionEnvironment !== ExecutionEnvironment.Standalone;

export const pushSupported = Device.isDevice && !isExpoGoEnvironment();

export const ensureNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('promos', {
      name: 'Offers & promotions',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (error) {
    captureException(error, { where: 'ensureNotificationChannel' });
  }
};

/** Asks for permission and returns the Expo push token, or null when unavailable. */
export const getExpoPushToken = async (): Promise<string | null> => {
  if (!pushSupported || isExpoGoEnvironment()) {
    addBreadcrumb('push', 'skipped', { reason: isExpoGoEnvironment() ? 'expo-go' : 'not-a-device' });
    return null;
  }
  try {
    await ensureNotificationChannel();
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;
    const token = await Notifications.getExpoPushTokenAsync(env.easProjectId ? { projectId: env.easProjectId } : undefined);
    return token.data;
  } catch (error) {
    captureException(error, { where: 'getExpoPushToken' });
    return null;
  }
};

export interface NotificationPayload {
  type?: 'order' | 'promo' | 'wallet';
  orderId?: string;
  storeId?: string;
  screen?: string;
}

/** Reads the deep-link style payload from a notification response. */
export const payloadFromResponse = (response: Notifications.NotificationResponse): NotificationPayload =>
  (response.notification.request.content.data ?? {}) as NotificationPayload;

/** Fires a local notification — used for order status changes when the app is foregrounded. */
export const notifyLocally = async (title: string, body: string, data?: NotificationPayload) => {
  try {
    await ensureNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data as Record<string, unknown>, sound: 'default' },
      trigger: null,
    });
  } catch (error) {
    captureException(error, { where: 'notifyLocally' });
  }
};
