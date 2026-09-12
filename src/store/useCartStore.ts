import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CartItem, Product, Promo, Store } from '@/data/types';
import { useAppConfigStore } from './useAppConfigStore';



export interface CartStoreInfo {
  id: string;
  name: string;
  image: string;
  deliveryFee: number;
  minOrder: number;
  location: { latitude: number; longitude: number };
}

export interface CartTotals {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
}

interface CartState {
  store: CartStoreInfo | null;
  items: CartItem[];
  promo: Promo | null;
  /** Returns 'conflict' when the cart already holds items from another store. */
  addItem: (product: Product, store: Store | CartStoreInfo) => 'added' | 'conflict';
  replaceCart: (items: CartItem[], store: CartStoreInfo) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  applyPromo: (promo: Promo) => void;
  removePromo: () => void;
  clear: () => void;
}

export const toCartStoreInfo = (store: Store | CartStoreInfo): CartStoreInfo => ({
  id: store.id,
  name: store.name,
  image: store.image,
  deliveryFee: store.deliveryFee,
  minOrder: store.minOrder,
  location: store.location,
});

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Local estimate shown while the user edits the cart. The authoritative figures
 * always come from POST /orders/quote — this only uses the same admin-controlled
 * platform fee and tax rate so the preview matches what the server will charge.
 */
export const computeTotals = (items: CartItem[], promo: Promo | null, deliveryFee: number): CartTotals => {
  const { platformFee, taxRate } = useAppConfigStore.getState().settings;
  const subtotal = round2(items.reduce((sum, i) => sum + i.product.price * i.quantity, 0));
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  if (itemCount === 0) {
    return { subtotal: 0, deliveryFee: 0, serviceFee: 0, tax: 0, discount: 0, total: 0, itemCount: 0 };
  }
  let discount = 0;
  let effectiveDelivery = deliveryFee;
  if (promo) {
    if (promo.type === 'percent') {
      discount = round2(Math.min(subtotal * (promo.value / 100), promo.maxDiscount ?? Infinity));
    } else if (promo.type === 'fixed') {
      discount = round2(Math.min(promo.value, subtotal));
    } else if (promo.type === 'free_delivery') {
      effectiveDelivery = 0;
    }
  }
  const tax = round2((subtotal - discount) * taxRate);
  const total = round2(subtotal - discount + effectiveDelivery + platformFee + tax);
  return {
    subtotal,
    deliveryFee: effectiveDelivery,
    serviceFee: platformFee,
    tax,
    discount,
    total,
    itemCount,
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      store: null,
      items: [],
      promo: null,
      addItem: (product, store) => {
        const state = get();
        if (state.store && state.store.id !== store.id && state.items.length > 0) {
          return 'conflict';
        }
        const existing = state.items.find((i) => i.product.id === product.id);
        const items = existing
          ? state.items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...state.items, { product, quantity: 1 }];
        set({ items, store: toCartStoreInfo(store) });
        return 'added';
      },
      replaceCart: (items, store) => set({ items, store, promo: null }),
      increment: (productId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        })),
      decrement: (productId) =>
        set((state) => {
          const items = state.items
            .map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0);
          return items.length === 0 ? { items, store: null, promo: null } : { items };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((i) => i.product.id !== productId)
              : state.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
          return items.length === 0 ? { items, store: null, promo: null } : { items };
        }),
      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((i) => i.product.id !== productId);
          return items.length === 0 ? { items, store: null, promo: null } : { items };
        }),
      applyPromo: (promo) => set({ promo }),
      removePromo: () => set({ promo: null }),
      clear: () => set({ items: [], store: null, promo: null }),
    }),
    {
      name: 'quickcart.cart.v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const selectItemCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectQuantity = (productId: string) => (state: CartState) =>
  state.items.find((i) => i.product.id === productId)?.quantity ?? 0;
