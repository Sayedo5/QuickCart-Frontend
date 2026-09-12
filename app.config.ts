import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo app config. Public runtime values come from EXPO_PUBLIC_* env vars (see .env.example);
 * build-only values (Google Maps key, EAS project id) are read here at config time.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  // Accept the unprefixed name too: EAS "secret"-type env vars are conventionally
  // unprefixed, and a key sitting under the wrong name is the single easiest way
  // to ship a blank map.
  const googleMapsAndroidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY || process.env.GOOGLE_MAPS_ANDROID_KEY;
  // The EAS project id is not a secret and must resolve even when .env is absent
  // — EAS build servers evaluate this config without the local .env file, and an
  // undefined id there silently disables OTA updates and push tokens.
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '1c73dbc4-add0-4c1b-a6a6-89e49764b7ca';
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
  const isProd = appEnv === 'production';

  return {
    ...config,
    name: isProd ? 'QuickCart' : `QuickCart (${appEnv})`,
    slug: 'quickcart',
    owner: 'sayedo5',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'quickcart',
    userInterfaceStyle: 'automatic',
    runtimeVersion: { policy: 'appVersion' },
    updates: easProjectId ? { url: `https://u.expo.dev/${easProjectId}` } : undefined,
    ios: {
      supportsTablet: false,
      bundleIdentifier: isProd ? 'pk.quickcart.app' : `pk.quickcart.app.${appEnv}`,
      buildNumber: '1',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'QuickCart uses your location to show stores near you and to track your delivery on the map.',
        NSCameraUsageDescription: 'QuickCart uses the camera so you can take a profile photo.',
        NSPhotoLibraryUsageDescription: 'QuickCart accesses your photos so you can choose a profile picture.',
        ITSAppUsesNonExemptEncryption: false,
      },
      config: { usesNonExemptEncryption: false },
    },
    android: {
      package: isProd ? 'pk.quickcart.app' : `pk.quickcart.app.${appEnv}`,
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#FFFFFF',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'pan',
      // Only permissions the app actually uses. Everything else is blocked explicitly.
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'POST_NOTIFICATIONS', 'VIBRATE', 'INTERNET'],
      blockedPermissions: ['READ_PHONE_STATE', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
      config: googleMapsAndroidKey ? { googleMaps: { apiKey: googleMapsAndroidKey } } : undefined,
    },
    web: { favicon: './assets/favicon.png' },
    plugins: [
      'expo-font',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'QuickCart uses your location to detect your city and show stores that deliver to you.',
          locationWhenInUsePermission:
            'QuickCart uses your location to detect your city and show stores that deliver to you.',
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        'expo-splash-screen',
        { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#FFFFFF' },
      ],
      [
        'expo-notifications',
        { icon: './assets/android-icon-monochrome.png', color: '#FF6B35', defaultChannel: 'orders' },
      ],
      [
        '@sentry/react-native/expo',
        {
          // Set SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN in the EAS environment to upload source maps.
          organization: process.env.SENTRY_ORG ?? 'quickcart',
          project: process.env.SENTRY_PROJECT ?? 'quickcart-mobile',
        },
      ],
    ],
    extra: {
      appEnv,
      // The map can only render when a Maps SDK for Android key was baked in at
      // build time. Surfacing the fact (never the key itself) lets the tracking
      // screen show its text fallback immediately instead of a blank grey grid.
      mapsConfigured: !!googleMapsAndroidKey,
      eas: easProjectId ? { projectId: easProjectId } : undefined,
    },
  };
};
