import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Address } from '@/data/types';
import { api } from '@/services/api';

interface AddressState {
  addresses: Address[];
  selectedAddressId: string | null;
  syncing: boolean;
  addAddress: (address: Omit<Address, 'id' | 'location'> & { location?: Address['location'] }) => Promise<Address>;
  updateAddress: (id: string, patch: Partial<Address>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  selectAddress: (id: string) => void;
  setDefault: (id: string) => Promise<void>;
  /** Pull the list from the backend. */
  sync: () => Promise<void>;
}



/** Fallback pin near central Lahore when the device has not shared a precise location. */
const fallbackLocation = (): Address['location'] => ({
  latitude: 31.479 + (Math.random() - 0.5) * 0.02,
  longitude: 74.438 + (Math.random() - 0.5) * 0.02,
});

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,
      syncing: false,
      addAddress: async (input) => {
        const created = await api.addAddress({ ...input, location: input.location ?? fallbackLocation() });
        set((state) => {
          const addresses = created.isDefault
            ? [...state.addresses.map((a) => ({ ...a, isDefault: false })), created]
            : [...state.addresses, created];
          return { addresses, selectedAddressId: state.selectedAddressId ?? created.id };
        });
        return created;
      },
      updateAddress: async (id, patch) => {
        await api.updateAddress(id, patch);
        set((state) => ({ addresses: state.addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
      },
      removeAddress: async (id) => {
        await api.deleteAddress(id);
        set((state) => {
          const addresses = state.addresses.filter((a) => a.id !== id);
          const selectedAddressId = state.selectedAddressId === id ? (addresses[0]?.id ?? null) : state.selectedAddressId;
          return { addresses, selectedAddressId };
        });
      },
      selectAddress: (id) => set({ selectedAddressId: id }),
      setDefault: async (id) => {
        await api.updateAddress(id, { isDefault: true });
        set((state) => ({ addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === id })) }));
      },
      sync: async () => {
        set({ syncing: true });
        try {
          const addresses = await api.getAddresses();
          set((state) => ({
            addresses,
            selectedAddressId:
              state.selectedAddressId && addresses.some((a) => a.id === state.selectedAddressId)
                ? state.selectedAddressId
                : (addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null),
          }));
        } catch {
          // Offline: keep cached addresses.
        } finally {
          set({ syncing: false });
        }
      },
    }),
    {
      name: 'quickcart.addresses.v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ addresses: state.addresses, selectedAddressId: state.selectedAddressId }),
      onRehydrateStorage: () => (state) => {
        state?.sync();
      },
    },
  ),
);

export const selectSelectedAddress = (state: AddressState): Address | null =>
  state.addresses.find((a) => a.id === state.selectedAddressId) ?? null;
