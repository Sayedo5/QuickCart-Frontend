import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { env } from '@/config/env';
import { paymentMethodsResponse } from '@/data/misc';
import { PaymentMethod } from '@/data/types';
import { api } from '@/services/api';
import { MobileWalletProvider } from '@/utils/validation';

interface PaymentState {
  methods: PaymentMethod[];
  selectedMethodId: string | null;
  syncing: boolean;
  /** Adds a card. Caller must validate (Luhn, expiry, CVV) first via utils/validation. */
  addCard: (input: { holder: string; number: string; expiry: string }) => Promise<PaymentMethod>;
  /** Links a JazzCash / Easypaisa account by mobile number (validated by the API). */
  addMobileWallet: (provider: MobileWalletProvider, mobile: string) => Promise<PaymentMethod>;
  removeMethod: (id: string) => Promise<void>;
  selectMethod: (id: string) => void;
  setDefault: (id: string) => void;
  sync: () => Promise<void>;
}

const seed = env.useMockApi ? paymentMethodsResponse.data.methods : [];
const seedDefault = seed.find((m) => m.isDefault)?.id ?? seed[0]?.id ?? null;

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      methods: seed,
      selectedMethodId: seedDefault,
      syncing: false,
      addCard: async ({ holder, number, expiry }) => {
        const method = await api.addPaymentMethod({ type: 'card', holder, number, expiry });
        set((state) => ({ methods: [method, ...state.methods.filter((m) => m.id !== method.id)] }));
        return method;
      },
      addMobileWallet: async (provider, mobile) => {
        const existing = get().methods.find((m) => m.type === provider && m.mobileNumber && mobile.replace(/\D/g, '').endsWith(m.mobileNumber.slice(1)));
        if (existing) return existing;
        const method = await api.addPaymentMethod({ type: provider, mobileNumber: mobile });
        set((state) => ({ methods: [method, ...state.methods.filter((m) => m.id !== method.id)] }));
        return method;
      },
      removeMethod: async (id) => {
        await api.deletePaymentMethod(id);
        set((state) => {
          const methods = state.methods.filter((m) => m.id !== id);
          const selectedMethodId = state.selectedMethodId === id ? (methods[0]?.id ?? null) : state.selectedMethodId;
          return { methods, selectedMethodId };
        });
      },
      selectMethod: (id) => set({ selectedMethodId: id }),
      setDefault: (id) => set((state) => ({ methods: state.methods.map((m) => ({ ...m, isDefault: m.id === id })) })),
      sync: async () => {
        if (env.useMockApi) return;
        set({ syncing: true });
        try {
          const methods = await api.getPaymentMethods();
          set((state) => ({
            methods,
            selectedMethodId:
              state.selectedMethodId && methods.some((m) => m.id === state.selectedMethodId)
                ? state.selectedMethodId
                : (methods.find((m) => m.isDefault)?.id ?? methods[0]?.id ?? null),
          }));
        } catch {
          // Offline: keep cached methods.
        } finally {
          set({ syncing: false });
        }
      },
    }),
    {
      name: 'quickcart.payments.v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ methods: state.methods, selectedMethodId: state.selectedMethodId }),
      onRehydrateStorage: () => (state) => {
        state?.sync();
      },
    },
  ),
);

export const selectSelectedMethod = (state: PaymentState): PaymentMethod | null =>
  state.methods.find((m) => m.id === state.selectedMethodId) ?? null;
