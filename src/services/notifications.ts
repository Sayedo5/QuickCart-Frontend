import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { env } from '@/config/env';
import { addBreadcrumb, captureException } from './monitoring';
import { getNotifications, isExpoGoEnvironment, notificationsAvailable } from './expoNotifications';

/**
 * Notifications, wrapped so the rest of the app never imports
 * `expo-notifications` directly.
 *
 * That matters because the package throws during module evaluation on Android
 * inside Expo Go (see expoNotifications.ts for the mechanism). Everything here
 * goes through the deferred accessor and degrades to a no-op when the module is
 * unavailable, so Expo Go runs without a red screen while a development build
 * gets the full behaviour.
 */

/** Type-only — erased at compile time, so it evaluates nothing. */
type NotificationResponse = import('expo-notifications').NotificationResponse;
type Subscription = { remove: () => void };

const NOOP_SUBSCRIPTION: Subscription = { remove: () => {} };

export { isExpoGoEnvironment };

/** Remote push needs a real device AND a runtime where the module loads. */
export const pushSupported = Device.isDevice && notificationsAvailable();

/**
 * Foreground presentation. Installed lazily the first time notifications are
 * touched — doing it at module scope would defeat the deferred import.
 */
let handlerInstalled = false;
const installHandler = () => {
  if (handlerInstalled) return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const ensureNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  const Notifications = getNotifications();
  if (!Notifications) return;
  installHandler();
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
  const Notifications = getNotifications();
  if (!Notifications || !pushSupported) {
    addBreadcrumb('push', 'skipped', {
      reason: !Notifications ? 'module-unavailable' : 'not-a-device',
    });
    return null;
  }
  try {
    installHandler();
    await ensureNotificationChannel();
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;
    const token = await Notifications.getExpoPushTokenAsync(
      env.easProjectId ? { projectId: env.easProjectId } : undefined,
    );
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
export const payloadFromResponse = (response: NotificationResponse): NotificationPayload =>
  (response.notification.request.content.data ?? {}) as NotificationPayload;

/** Fires a local notification — used for order status changes when the app is foregrounded. */
export const notifyLocally = async (title: string, body: string, data?: NotificationPayload) => {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    installHandler();
    await ensureNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data as Record<string, unknown>, sound: 'default' },
      trigger: null,
    });
  } catch (error) {
    captureException(error, { where: 'notifyLocally' });
  }
};

/**
 * The notification that cold-started the app, if any. Returns null where
 * notifications are unavailable, so callers need no environment checks.
 */
export const getLastNotificationResponse = async (): Promise<NotificationResponse | null> => {
  const Notifications = getNotifications();
  if (!Notifications) return null;
  try {
    installHandler();
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
};

/** Subscribes to notification taps. The returned subscription is always safe to remove. */
export const addNotificationResponseListener = (
  listener: (response: NotificationResponse) => void,
): Subscription => {
  const Notifications = getNotifications();
  if (!Notifications) return NOOP_SUBSCRIPTION;
  try {
    installHandler();
    return Notifications.addNotificationResponseReceivedListener(listener);
  } catch {
    return NOOP_SUBSCRIPTION;
  }
};
