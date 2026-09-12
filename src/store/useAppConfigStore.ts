import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '@/services/api';
import type { AppSettings, Banner, Faq } from '@/services/api.types';
import { setCurrencySymbol } from '@/utils/format';

/**
 * Backend-controlled app configuration: tax rate, fees, support contacts,
 * home banners and FAQs. Everything an admin can change without a release.
 * Cached so the app still renders correctly when offline.
 */

/**
 * Offline fallback only. Every value here is overwritten by GET /settings/public
 * on the first successful sync and then cached, so the admin panel stays the
 * single source of truth for fees, tax and support contacts.
 */
const DEFAULTS: AppSettings = {
  currencySymbol: 'Rs',
  taxRate: 0.16,
  taxPercent: 16,
  taxLabel: 'GST (16%)',
  platformFee: 29,
  baseDeliveryFee: 99,
  minOrderDefault: 300,
  serviceCity: 'Lahore',
  serviceCities: [],
  supportEmail: 'support@quickcart.pk',
  supportPhone: '042 111 000 123',
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
