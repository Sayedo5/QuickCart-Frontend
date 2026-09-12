import * as Location from 'expo-location';

/**
 * Thin wrapper over expo-location.
 *
 * Every call fails soft: location is a convenience for picking the right city,
 * never a requirement. A denied permission, a disabled GPS radio or a slow fix
 * all resolve to `null` so the caller falls back to the manual city picker
 * instead of blocking the customer at the door.
 */

export type Coords = { latitude: number; longitude: number };

/** True when permission is already granted, without prompting the customer. */
export const hasLocationPermission = async (): Promise<boolean> => {
  try {
    const { granted } = await Location.getForegroundPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
};

/** Prompts for permission. Returns false on denial — never throws. */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
};

/**
 * A coarse fix, good enough to tell Lahore from Karachi and much faster than a
 * high-accuracy one. Capped so a phone that never gets a fix cannot hang the
 * first-launch flow.
 */
export const getCoarseLocation = async (timeoutMs = 8000): Promise<Coords | null> => {
  try {
    if (!(await hasLocationPermission())) return null;
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!position) return null;
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
};

/**
 * The last known fix, which the OS returns instantly when it has one. Tried
 * first on launch so a returning customer never waits on the GPS radio.
 */
export const getLastKnownLocation = async (): Promise<Coords | null> => {
  try {
    if (!(await hasLocationPermission())) return null;
    const position = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 });
    if (!position) return null;
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
};

/** Asks for permission, then returns a fix. Used by the "Use my location" button. */
export const requestAndGetLocation = async (): Promise<Coords | null> => {
  if (!(await requestLocationPermission())) return null;
  return (await getLastKnownLocation()) ?? (await getCoarseLocation());
};
