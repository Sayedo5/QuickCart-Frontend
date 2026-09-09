import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { env } from '@/config/env';
import { api } from '@/services/api';

interface FavouritesState {
  storeIds: string[];
  /** Optimistic toggle; returns the new "is favourite" value. Reverts if the API call fails. */
  toggle: (storeId: string) => boolean;
  isFavourite: (storeId: string) => boolean;
  sync: () => Promise<void>;
  clear: () => void;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      storeIds: env.useMockApi ? ['st_biryani_express', 'st_chai_khana'] : [],
      toggle: (storeId) => {
        const exists = get().storeIds.includes(storeId);
        const next = !exists;
        set((state) => ({ storeIds: exists ? state.storeIds.filter((id) => id !== storeId) : [storeId, ...state.storeIds] }));
        api.setFavourite(storeId, next).catch(() => {
          // Revert the optimistic update on failure.
          set((state) => ({ storeIds: next ? state.storeIds.filter((id) => id !== storeId) : [storeId, ...state.storeIds] }));
        });
        return next;
      },
      isFavourite: (storeId) => get().storeIds.includes(storeId),
      sync: async () => {
        if (env.useMockApi) return;
        try {
          set({ storeIds: await api.getFavourites() });
        } catch {
          // Offline: keep cached favourites.
        }
      },
      clear: () => set({ storeIds: [] }),
    }),
    {
      name: 'quickcart.favourites.v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ storeIds: state.storeIds }),
      onRehydrateStorage: () => (state) => {
        state?.sync();
      },
    },
  ),
);
