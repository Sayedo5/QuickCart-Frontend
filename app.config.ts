import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo app config. Public runtime values come from EXPO_PUBLIC_* env vars (see .env.example);
 * build-only values (Google Maps key, EAS project id) are read here at config time.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsAndroidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY;
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
  const isProd = appEnv === 'production';

  return {
    ...config,
    name: isProd ? 'QuickCart' : `QuickCart (${appEnv})`,
    slug: 'quickcart',
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
      eas: easProjectId ? { projectId: easProjectId } : undefined,
    },
  };
};
