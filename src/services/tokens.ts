import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Auth tokens live in the device keychain / keystore via expo-secure-store,
 * never in AsyncStorage. On web (unsupported by SecureStore) we fall back to
 * an in-memory map so the code path still works during development.
 */

const ACCESS_KEY = 'quickcart.accessToken';
const REFRESH_KEY = 'quickcart.refreshToken';

const memory = new Map<string, string>();
const canUseSecureStore = Platform.OS !== 'web';

const getItem = async (key: string): Promise<string | null> => {
  if (!canUseSecureStore) return memory.get(key) ?? null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const setItem = async (key: string, value: string | null): Promise<void> => {
  if (!canUseSecureStore) {
    if (value === null) memory.delete(key);
    else memory.set(key, value);
    return;
  }
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
  } catch {
    // Keychain unavailable (e.g. locked device on cold start). Fail closed: caller will re-login.
  }
};

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Small in-process cache so request interceptors do not hit the keychain on every call.
let cached: TokenPair | null | undefined;

export const tokenStorage = {
  async get(): Promise<TokenPair | null> {
    if (cached !== undefined) return cached;
    const [accessToken, refreshToken] = await Promise.all([getItem(ACCESS_KEY), getItem(REFRESH_KEY)]);
    cached = accessToken && refreshToken ? { accessToken, refreshToken } : null;
    return cached;
  },
  async set(tokens: TokenPair): Promise<void> {
    cached = tokens;
    await Promise.all([setItem(ACCESS_KEY, tokens.accessToken), setItem(REFRESH_KEY, tokens.refreshToken)]);
  },
  async clear(): Promise<void> {
    cached = null;
    await Promise.all([setItem(ACCESS_KEY, null), setItem(REFRESH_KEY, null)]);
  },
};
