import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface NotificationPrefs {
  orderUpdates: boolean;
  promotions: boolean;
  reminders: boolean;
  emailDigest: boolean;
}

interface SettingsState {
  themeMode: ThemeMode;
  notifications: NotificationPrefs;
  setThemeMode: (mode: ThemeMode) => void;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      notifications: {
        orderUpdates: true,
        promotions: true,
        reminders: false,
        emailDigest: false,
      },
      setThemeMode: (themeMode) => set({ themeMode }),
      setNotification: (key, value) =>
        set((state) => ({ notifications: { ...state.notifications, [key]: value } })),
    }),
    {
      name: 'quickcart.settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
