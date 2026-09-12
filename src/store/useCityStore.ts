import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '@/services/api';
import type { ServiceCity } from '@/services/api.types';

/**
 * Which city the customer is shopping in.
 *
 * The home screen, search and the store list are all scoped to this city, so it
 * has to be settled before the first catalog request. The flow is:
 *   1. a persisted choice from a previous launch wins (zero friction on relaunch);
 *   2. otherwise try GPS, if the customer has already granted location;
 *   3. otherwise show the picker.
 *
 * `selected` staying null with `hydrated` true is the signal for "ask them".
 */

/** Offline fallback so the picker is never empty on a cold, offline first launch. */
const FALLBACK_CITIES: Array<Pick<ServiceCity, 'name' | 'slug' | 'province'>> = [
  { name: 'Lahore', slug: 'lahore', province: 'Punjab' },
  { name: 'Karachi', slug: 'karachi', province: 'Sindh' },
  { name: 'Islamabad', slug: 'islamabad', province: 'Islamabad Capital Territory' },
  { name: 'Rawalpindi', slug: 'rawalpindi', province: 'Punjab' },
  { name: 'Peshawar', slug: 'peshawar', province: 'Khyber Pakhtunkhwa' },
  { name: 'Quetta', slug: 'quetta', province: 'Balochistan' },
];

interface CityState {
  /** The city the customer is shopping in; null until they choose or GPS resolves. */
  selected: ServiceCity | null;
  /** Every live city, cached so the picker opens instantly and works offline. */
  cities: ServiceCity[];
  loading: boolean;
  /** True while a GPS fix is being resolved, so the picker can show a spinner. */
  detecting: boolean;
  error: string | null;
  hydrated: boolean;
  /** True once the customer has picked manually — stops GPS from overriding them. */
  chosenManually: boolean;
  loadCities: () => Promise<ServiceCity[]>;
  selectCity: (city: ServiceCity) => void;
  /** Resolves a GPS fix to a city. Returns null when outside every service area. */
  detectFromLocation: (location: { latitude: number; longitude: number }) => Promise<ServiceCity | null>;
  setHydrated: () => void;
  clear: () => void;
}

export const useCityStore = create<CityState>()(
  persist(
    (set, get) => ({
      selected: null,
      cities: [],
      loading: false,
      detecting: false,
      error: null,
      hydrated: false,
      chosenManually: false,

      loadCities: async () => {
        set({ loading: true, error: null });
        try {
          const cities = await api.getCities();
          if (cities.length > 0) {
            set({ cities });
            // Keep the active city's fees and radius fresh if the admin retuned them.
            const current = get().selected;
            if (current) {
              const updated = cities.find((c) => c.id === current.id || c.name === current.name);
              if (updated) set({ selected: updated });
              // The admin deactivated the city the customer was in — send them back to the picker.
              else set({ selected: null, chosenManually: false });
            }
          }
          return cities;
        } catch {
          set({ error: 'Could not load cities. Showing the default list.' });
          return get().cities;
        } finally {
          set({ loading: false });
        }
      },

      selectCity: (city) => set({ selected: city, chosenManually: true, error: null }),

      detectFromLocation: async (location) => {
        set({ detecting: true });
        try {
          const result = await api.resolveCity(location);
          if (result.city) {
            // A manual pick always beats GPS — someone ordering to another city
            // should not be dragged back to where their phone happens to be.
            if (!get().chosenManually) set({ selected: result.city });
            return result.city;
          }
          return null;
        } catch {
          return null;
        } finally {
          set({ detecting: false });
        }
      },

      setHydrated: () => set({ hydrated: true }),

      clear: () => set({ selected: null, chosenManually: false }),
    }),
    {
      name: 'quickcart.city.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ selected: s.selected, cities: s.cities, chosenManually: s.chosenManually }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.cities.length === 0) {
          // Placeholder rows so the picker renders before the first sync lands.
          useCityStore.setState({
            cities: FALLBACK_CITIES.map((c, i) => ({
              id: c.slug,
              name: c.name,
              slug: c.slug,
              province: c.province,
              location: { latitude: 0, longitude: 0 },
              radiusKm: 25,
              baseDeliveryFee: 99,
              perKmFee: 12,
              minOrderAmount: 300,
              etaBaseMin: 20,
              etaPerKmMin: 2.5,
              isActive: true,
              sortOrder: i,
            })),
          });
        }
        state.setHydrated();
        state.loadCities();
      },
    },
  ),
);

/** The city name to send to the API, or undefined to let the backend decide. */
export const selectCityName = (s: CityState): string | undefined => s.selected?.name;
