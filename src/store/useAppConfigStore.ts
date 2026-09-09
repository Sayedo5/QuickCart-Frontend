import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { APP_CONFIG } from '@/data/config';
import { api } from '@/services/api';
import type { AppSettings, Banner, Faq } from '@/services/api.types';
import { setCurrencySymbol } from '@/utils/format';

/**
 * Backend-controlled app configuration: tax rate, fees, support contacts,
 * home banners and FAQs. Everything an admin can change without a release.
 * Cached so the app still renders correctly when offline.
 */

const DEFAULTS: AppSettings = {
  currencySymbol: APP_CONFIG.currencySymbol,
  taxRate: APP_CONFIG.taxRate,
  taxPercent: APP_CONFIG.taxRate * 100,
  taxLabel: APP_CONFIG.taxLabel,
  platformFee: APP_CONFIG.platformFee,
  baseDeliveryFee: 99,
  minOrderDefault: 300,
  serviceCity: APP_CONFIG.city,
  supportEmail: APP_CONFIG.supportEmail,
  supportPhone: APP_CONFIG.supportPhone,
  supportWhatsApp: undefined,
  announcement: null,
};

interface AppConfigState {
  settings: AppSettings;
  banners: Banner[];
  faqs: Faq[];
  loaded: boolean;
  syncing: boolean;
  error: string | null;
  sync: () => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>()(
  persist(
    (set) => ({
      settings: DEFAULTS,
      banners: [],
      faqs: [],
      loaded: false,
      syncing: false,
      error: null,
      sync: async () => {
        set({ syncing: true, error: null });
        try {
          const [settings, banners, faqs] = await Promise.all([
            api.getSettings(),
            api.getBanners().catch(() => [] as Banner[]),
            api.getFaqs().catch(() => [] as Faq[]),
          ]);
          setCurrencySymbol(settings.currencySymbol);
          set({ settings, banners, faqs, loaded: true, error: null });
        } catch {
          // Offline or backend down: keep the cached values so the app still works.
          set({ error: 'Could not refresh app settings.' });
        } finally {
          set({ syncing: false });
        }
      },
    }),
    {
      name: 'quickcart.appconfig.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ settings: s.settings, banners: s.banners, faqs: s.faqs, loaded: s.loaded }),
      onRehydrateStorage: () => (state) => {
        if (state) setCurrencySymbol(state.settings.currencySymbol);
        state?.sync();
      },
    },
  ),
);

export const selectTaxLabel = (s: AppConfigState) => s.settings.taxLabel;
