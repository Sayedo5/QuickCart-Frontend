import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { env } from '@/config/env';
import { api } from '@/services/api';
import { generateId } from '@/utils/format';

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
  /**
   * Records a wallet payment locally (mock mode). In remote mode the backend debits the
   * wallet when the order is placed, and `sync()` refreshes the balance afterwards.
   */
  pay: (amount: number, title: string, subtitle?: string) => boolean;
  refund: (amount: number, title: string, subtitle?: string) => void;
  sync: () => Promise<void>;
}

const daysAgo = (days: number, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const seedTransactions: WalletTransaction[] = env.useMockApi
  ? [
      { id: 'wtx_1', type: 'cashback', amount: 75, title: 'Cashback', subtitle: 'JazzCash promo on QC-47990', createdAt: daysAgo(3, 11) },
      { id: 'wtx_2', type: 'payment', amount: -1132, title: 'Chai Khana', subtitle: 'Order QC-46980', createdAt: daysAgo(7, 9) },
      { id: 'wtx_3', type: 'topup', amount: 2000, title: 'Top-up via Easypaisa', createdAt: daysAgo(8, 18) },
      { id: 'wtx_4', type: 'refund', amount: 307, title: 'Refund', subtitle: 'Missing item on QC-45870', createdAt: daysAgo(15, 14) },
    ]
  : [];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: env.useMockApi ? 1250 : 0,
      transactions: seedTransactions,
      syncing: false,
      topUp: async (amount, source) => {
        const result = await api.topUpWallet(amount, source);
        set((state) => ({
          balance: env.useMockApi ? state.balance + amount : result.balance,
          transactions: [result.transaction, ...state.transactions],
        }));
      },
      pay: (amount, title, subtitle) => {
        if (get().balance < amount) return false;
        set((state) => ({
          balance: state.balance - amount,
          transactions: [{ id: generateId('wtx'), type: 'payment', amount: -amount, title, subtitle, createdAt: new Date().toISOString() }, ...state.transactions],
        }));
        return true;
      },
      refund: (amount, title, subtitle) =>
        set((state) => ({
          balance: state.balance + amount,
          transactions: [{ id: generateId('wtx'), type: 'refund', amount, title, subtitle, createdAt: new Date().toISOString() }, ...state.transactions],
        })),
      sync: async () => {
        if (env.useMockApi) return;
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
