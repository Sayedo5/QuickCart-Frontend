import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '@/services/api';

export type WalletTxType = 'topup' | 'payment' | 'refund' | 'cashback';

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amount: number;
  title: string;
  subtitle?: string;
  createdAt: string;
}

interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
  syncing: boolean;
  topUp: (amount: number, source: string) => Promise<void>;
  sync: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      syncing: false,
      topUp: async (amount, source) => {
        const result = await api.topUpWallet(amount, source);
        set((state) => ({
          balance: result.balance,
          transactions: [result.transaction, ...state.transactions],
        }));
      },
      sync: async () => {
        set({ syncing: true });
        try {
          const wallet = await api.getWallet();
          set({ balance: wallet.balance, transactions: wallet.transactions });
        } catch {
          // Offline: keep cached balance.
        } finally {
          set({ syncing: false });
        }
      },
    }),
    {
      name: 'quickcart.wallet.v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ balance: state.balance, transactions: state.transactions }),
      onRehydrateStorage: () => (state) => {
        state?.sync();
      },
    },
  ),
);
