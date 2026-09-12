import Constants, { ExecutionEnvironment } from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/**
 * The one place `expo-notifications` is loaded.
 *
 * Importing that package has an unavoidable side effect: its `index` re-exports
 * `DevicePushTokenAutoRegistration.fx`, and that side-effect module calls
 * `addPushTokenListener()` at the top level. `addPushTokenListener` starts with
 * `warnOfExpoGoPushUsage()`, which on Android inside Expo Go does a hard
 * `throw new Error(...)` — the SDK 53+ "push was removed from Expo Go" message.
 *
 * That throw happens while the module is being evaluated, so no guard placed
 * inside our own functions can prevent it, and there is no config-plugin option
 * to disable the auto-registration (the SDK 57 plugin accepts only `icon`,
 * `color` and `defaultChannel`). The only fix is to never evaluate the module in
 * Expo Go, which is what the deferred `require` below does: Metro still bundles
 * it, but the module body runs on first `require()` rather than at import time.
 *
 * Consequence: inside Expo Go there are no notifications at all, local ones
 * included. Use a development build to exercise them.
 */

/** Type-only import — erased at compile time, so it triggers no module evaluation. */
type NotificationsModule = typeof import('expo-notifications');

/**
 * True when running inside the Expo Go client, where the push module throws.
 * Several signals are checked because no single one is reliable across the
 * store client, dev builds and release builds.
 */
export const isExpoGoEnvironment = (): boolean =>
  isRunningInExpoGo() ||
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Only Android throws on import. iOS merely warns, so notifications stay usable
 * there even inside Expo Go.
 */
const moduleWouldThrow = (): boolean => Platform.OS === 'android' && isExpoGoEnvironment();

let cached: NotificationsModule | null | undefined;

/**
 * The `expo-notifications` module, or `null` where loading it would crash.
 * Every caller must handle `null` rather than assuming the module is present.
 */
export const getNotifications = (): NotificationsModule | null => {
  if (cached !== undefined) return cached;
  if (moduleWouldThrow()) {
    cached = null;
    return null;
  }
  try {
    // Deferred on purpose — see the file comment. A static `import` here would
    // reintroduce the crash, because Metro hoists and evaluates those eagerly.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    // A future SDK could start throwing on another platform too; degrade to
    // "no notifications" rather than taking the whole app down.
    cached = null;
  }
  return cached;
};

/** True when notification APIs can actually be called on this runtime. */
export const notificationsAvailable = (): boolean => getNotifications() !== null;
