import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User } from '@/data/types';
import { api, AuthResult } from '@/services/api';
import { setForceLogoutHandler } from '@/services/http';
import { setMonitoringUser } from '@/services/monitoring';
import { getExpoPushToken, pushSupported } from '@/services/notifications';
import { realtime } from '@/services/realtime';
import { tokenStorage } from '@/services/tokens';

interface AuthState {
  hasOnboarded: boolean;
  isAuthenticated: boolean;
  user: User | null;
  hydrated: boolean;
  /** Set when the backend invalidated the session; Splash/Login show a hint. */
  sessionExpired: boolean;
  completeOnboarding: () => void;
  /** Persists tokens to the keychain, stores the profile and registers push + sockets. */
  signIn: (result: AuthResult) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'email' | 'avatar' | 'phone'>>) => Promise<void>;
  /** Re-fetches the profile from the backend (no-op in mock mode). */
  refreshProfile: () => Promise<void>;
  setHydrated: () => void;
  forceLogout: () => void;
}

const registerPush = async () => {
  if (!pushSupported) return;
  const token = await getExpoPushToken();
  if (token) {
    await api.registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android').catch(() => {});
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hasOnboarded: false,
      isAuthenticated: false,
      user: null,
      hydrated: false,
      sessionExpired: false,
      completeOnboarding: () => set({ hasOnboarded: true }),
      signIn: async ({ user, tokens }) => {
        await tokenStorage.set(tokens);
        set({ isAuthenticated: true, user, sessionExpired: false });
        setMonitoringUser({ id: user.id, email: user.email });
        realtime.refreshAuth().catch(() => {});
        registerPush().catch(() => {});
      },
      signOut: async () => {
        await api.logout().catch(() => {});
        await tokenStorage.clear();
        realtime.disconnect();
        setMonitoringUser(null);
        set({ isAuthenticated: false, user: null });
      },
      updateProfile: async (patch) => {
        const updated = await api.updateProfile(patch);
        set((state) => ({ user: state.user ? { ...state.user, ...updated, ...patch } : updated }));
      },
      refreshProfile: async () => {
        if (!get().isAuthenticated) return;
        try {
          const user = await api.getProfile();
          set({ user });
        } catch {
          // Offline or token refresh in progress — keep the cached profile.
        }
      },
      setHydrated: () => set({ hydrated: true }),
      forceLogout: () => {
        tokenStorage.clear();
        realtime.disconnect();
        setMonitoringUser(null);
        set({ isAuthenticated: false, user: null, sessionExpired: true });
      },
    }),
    {
      name: 'quickcart.auth.v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      onRehydrateStorage: () => async (state) => {
        if (!state) return;
        // A persisted "authenticated" flag without tokens in the keychain means the
        // keychain was wiped (reinstall, device restore) — treat as logged out.
        if (state.isAuthenticated) {
          const tokens = await tokenStorage.get();
          if (!tokens) state.forceLogout();
          else {
            setMonitoringUser(state.user ? { id: state.user.id, email: state.user.email } : null);
            state.refreshProfile();
            registerPush().catch(() => {});
          }
        }
        state.setHydrated();
      },
    },
  ),
);

// Let the HTTP layer reset the session when a token refresh fails.
setForceLogoutHandler(() => useAuthStore.getState().forceLogout());
