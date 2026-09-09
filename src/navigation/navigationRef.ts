import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

/**
 * Lets non-React code (push notification handlers, deep links) navigate.
 * Calls before the container mounts are safely ignored.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigate = <T extends keyof RootStackParamList>(name: T, params?: RootStackParamList[T]) => {
  if (navigationRef.isReady()) {
    // @ts-expect-error the generic params union is correct at each call site
    navigationRef.navigate(name, params);
  }
};
