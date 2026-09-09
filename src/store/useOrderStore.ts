import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ordersResponse } from '@/data/orders';
import { Order, OrderStatus } from '@/data/types';
import { env } from '@/config/env';
import { api } from '@/services/api';
import { notifyLocally } from '@/services/notifications';
import { realtime, realtimeEnabled } from '@/services/realtime';

/** Milliseconds after order creation at which each status is reached (mock mode only). */
export const ORDER_TIMINGS = {
  preparing: 6_000,
  picked_up: 16_000,
  delivered: 56_000,
} as const;

export const RIDE_DURATION_MS = ORDER_TIMINGS.delivered - ORDER_TIMINGS.picked_up;

export interface RiderPosition {
  latitude: number;
  longitude: number;
  heading?: number;
  at: string;
}

interface OrderState {
  orders: Order[];
  /** Latest rider GPS fix per active order (remote mode). */
  riderPositions: Record<string, RiderPosition>;
  seeded: boolean;
  hydrated: boolean;
  syncing: boolean;
  addOrder: (order: Order) => void;
  setStatus: (orderId: string, status: OrderStatus, at?: string, estimatedDeliveryAt?: string) => void;
  rateOrder: (orderId: string, rating: NonNullable<Order['rating']>) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  /** Pulls the order list from the backend (remote mode) or seeds demo orders (mock mode). */
  sync: () => Promise<void>;
  setRiderPosition: (orderId: string, position: RiderPosition) => void;
  setHydrated: () => void;
}

const timers = new Map<string, ReturnType<typeof setTimeout>[]>();

const clearTimers = (orderId: string) => {
  timers.get(orderId)?.forEach(clearTimeout);
  timers.delete(orderId);
};

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
        if (realtimeEnabled) realtime.joinOrder(order.id);
        else scheduleOrderProgress(order.id);
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
          clearTimers(orderId);
          realtime.leaveOrder(orderId);
        }
      },
      rateOrder: async (orderId, rating) => {
        await api.rateOrder(orderId, rating);
        set((state) => ({ orders: state.orders.map((o) => (o.id === orderId ? { ...o, rating } : o)) }));
      },
      cancelOrder: async (orderId) => {
        await api.cancelOrder(orderId);
        clearTimers(orderId);
        get().setStatus(orderId, 'cancelled');
      },
      sync: async () => {
        if (env.useMockApi) {
          if (!get().seeded) set({ orders: ordersResponse.data.orders, seeded: true });
          return;
        }
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
        if (!realtimeEnabled) state.orders.forEach((o) => scheduleOrderProgress(o.id));
      },
    },
  ),
);

// Live updates from the backend (no-ops in mock mode).
realtime.onOrderStatus((e) => useOrderStore.getState().setStatus(e.orderId, e.status, e.at, e.estimatedDeliveryAt));
realtime.onRiderLocation((e) => useOrderStore.getState().setRiderPosition(e.orderId, { latitude: e.latitude, longitude: e.longitude, heading: e.heading, at: e.at }));

/**
 * Mock mode only: drives a placed order through Preparing → Picked Up → Delivered
 * on a fixed schedule relative to its creation time. Safe to call repeatedly.
 */
export function scheduleOrderProgress(orderId: string) {
  if (realtimeEnabled) return;
  const order = useOrderStore.getState().orders.find((o) => o.id === orderId);
  if (!order || order.status === 'delivered' || order.status === 'cancelled') return;
  if (timers.has(orderId)) return;

  const createdAt = new Date(order.createdAt).getTime();
  const now = Date.now();
  const steps: Array<{ status: OrderStatus; at: number }> = [
    { status: 'preparing', at: createdAt + ORDER_TIMINGS.preparing },
    { status: 'picked_up', at: createdAt + ORDER_TIMINGS.picked_up },
    { status: 'delivered', at: createdAt + ORDER_TIMINGS.delivered },
  ];

  const handles = steps.map((step) =>
    setTimeout(() => {
      const current = useOrderStore.getState().orders.find((o) => o.id === orderId);
      if (!current || current.status === 'cancelled') return;
      useOrderStore.getState().setStatus(orderId, step.status, new Date(step.at).toISOString());
    }, Math.max(0, step.at - now)),
  );
  timers.set(orderId, handles);
}

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
