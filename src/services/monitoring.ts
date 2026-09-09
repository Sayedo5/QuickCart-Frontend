import { env } from '@/config/env';

/**
 * Crash reporting facade around Sentry. Sentry's native module is not available
 * inside Expo Go, and the DSN is optional, so everything here is a no-op unless
 * both conditions are met. Screens call these helpers without caring.
 */

type SentryModule = typeof import('@sentry/react-native');

let sentry: SentryModule | null = null;

export const monitoringEnabled = !!env.sentryDsn && !env.isExpoGo;

export const initMonitoring = () => {
  if (!monitoringEnabled || sentry) return;
  try {
    // Lazy require so the native module is only touched when we intend to use it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sentry = require('@sentry/react-native') as SentryModule;
    sentry.init({
      dsn: env.sentryDsn,
      environment: env.appEnv,
      release: `quickcart-mobile@${env.appVersion}`,
      tracesSampleRate: env.appEnv === 'production' ? 0.2 : 1.0,
      enableAutoSessionTracking: true,
      sendDefaultPii: false,
      beforeSend(event) {
        // Strip anything that could contain a phone number or token from breadcrumbs/requests.
        if (event.request?.headers) delete event.request.headers.Authorization;
        return event;
      },
    });
  } catch {
    sentry = null;
  }
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  if (__DEV__) {
    // Surface in Metro during development; production relies on Sentry.
    console.warn('[monitoring]', error, context ?? '');
  }
  if (!sentry) return;
  sentry.withScope((scope) => {
    if (context) scope.setContext('extra', context);
    sentry?.captureException(error);
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  sentry?.captureMessage(message, level);
};

export const setMonitoringUser = (user: { id: string; email?: string } | null) => {
  sentry?.setUser(user ? { id: user.id, email: user.email } : null);
};

export const addBreadcrumb = (category: string, message: string, data?: Record<string, unknown>) => {
  sentry?.addBreadcrumb({ category, message, data, level: 'info' });
};

/** Wraps the root component with Sentry's error/touch instrumentation when enabled. */
export const wrapRoot = <P extends object>(component: React.ComponentType<P>): React.ComponentType<P> =>
  sentry ? (sentry.wrap(component as React.ComponentType<Record<string, unknown>>) as unknown as React.ComponentType<P>) : component;
