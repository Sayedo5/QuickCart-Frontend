import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Order, OrderStatus } from '@/data/types';
import { api } from '@/services/api';
import { notifyLocally } from '@/services/notifications';
import { realtime } from '@/services/realtime';

export interface RiderPosition {
  latitude: number;
  longitude: number;
  heading?: number;
  at: string;
}

interface OrderState {
  orders: Order[];
  /** Latest rider GPS fix per active order, pushed over the socket. */
  riderPositions: Record<string, RiderPosition>;
  seeded: boolean;
  hydrated: boolean;
  syncing: boolean;
  addOrder: (order: Order) => void;
  setStatus: (orderId: string, status: OrderStatus, at?: string, estimatedDeliveryAt?: string) => void;
  rateOrder: (orderId: string, rating: NonNullable<Order['rating']>) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  /** Pulls the order list from the backend. */
  sync: () => Promise<void>;
  setRiderPosition: (orderId: string, position: RiderPosition) => void;
  setHydrated: () => void;
}

const STATUS_TITLES: Record<OrderStatus, string> = {
  placed: 'Order placed',
  preparing: 'Your order is being prepared',
  picked_up: 'Your rider is on the way',
  delivered: 'Delivered — enjoy!',
  cancelled: 'Order cancelled',
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      riderPositions: {},
      seeded: false,
      hydrated: false,
      syncing: false,
      addOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders.filter((o) => o.id !== order.id)] }));
        realtime.joinOrder(order.id);
      },
      setStatus: (orderId, status, at = new Date().toISOString(), estimatedDeliveryAt) => {
        const previous = get().orders.find((o) => o.id === orderId);
        if (!previous || previous.status === status) return;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;
            const timeline = { ...o.timeline };
            if (status === 'preparing') timeline.preparingAt = at;
            if (status === 'picked_up') timeline.pickedUpAt = at;
            if (status === 'delivered') timeline.deliveredAt = at;
            return { ...o, status, timeline, estimatedDeliveryAt: estimatedDeliveryAt ?? o.estimatedDeliveryAt };
          }),
        }));
        if (status !== 'placed') {
          notifyLocally(STATUS_TITLES[status], `${previous.storeName} · Order ${previous.orderNumber}`, { type: 'order', orderId });
        }
        if (status === 'delivered' || status === 'cancelled') {
          realtime.leaveOrder(orderId);
        }
      },
      rateOrder: async (orderId, rating) => {
        await api.rateOrder(orderId, rating);
        set((state) => ({ orders: state.orders.map((o) => (o.id === orderId ? { ...o, rating } : o)) }));
      },
      cancelOrder: async (orderId) => {
        await api.cancelOrder(orderId);
        get().setStatus(orderId, 'cancelled');
      },
      sync: async () => {
        set({ syncing: true });
        try {
          const orders = await api.getOrders();
          set({ orders, seeded: true });
          orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').forEach((o) => realtime.joinOrder(o.id));
        } catch {
          // Offline: keep the cached list.
        } finally {
          set({ syncing: false });
        }
      },
      setRiderPosition: (orderId, position) => set((state) => ({ riderPositions: { ...state.riderPositions, [orderId]: position } })),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'quickcart.orders.v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ orders: state.orders, seeded: state.seeded }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.setHydrated();
        state.sync();
      },
    },
  ),
);

// Live updates from the backend.
realtime.onOrderStatus((e) => useOrderStore.getState().setStatus(e.orderId, e.status, e.at, e.estimatedDeliveryAt));
realtime.onRiderLocation((e) => useOrderStore.getState().setRiderPosition(e.orderId, { latitude: e.latitude, longitude: e.longitude, heading: e.heading, at: e.at }));

export const selectActiveOrder = (state: OrderState): Order | undefined =>
  state.orders.find((o) => o.status !== 'delivered' && o.status !== 'cancelled');

export const STATUS_STEPS: Array<{ key: OrderStatus; label: string; description: string }> = [
  { key: 'placed', label: 'Placed', description: 'We have received your order.' },
  { key: 'preparing', label: 'Preparing', description: 'The store is preparing your items.' },
  { key: 'picked_up', label: 'Picked Up', description: 'Your rider is on the way.' },
  { key: 'delivered', label: 'Delivered', description: 'Enjoy! Your order has arrived.' },
];

export const statusIndex = (status: OrderStatus): number =>
  Math.max(0, STATUS_STEPS.findIndex((s) => s.key === status));
