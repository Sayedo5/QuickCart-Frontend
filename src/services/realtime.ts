import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { OrderStatus } from '@/data/types';
import { tokenStorage } from './tokens';
import { addBreadcrumb } from './monitoring';

/**
 * Socket.io client for live order updates and rider GPS. Connects lazily when a
 * screen subscribes, authenticates with the access token, and reconnects
 * automatically. In mock mode (no socket URL) every method is a harmless no-op.
 */

export interface OrderStatusEvent {
  orderId: string;
  status: OrderStatus;
  at: string;
  estimatedDeliveryAt?: string;
}

export interface RiderLocationEvent {
  orderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  at: string;
}

type Listener<T> = (payload: T) => void;

let socket: Socket | null = null;
const statusListeners = new Set<Listener<OrderStatusEvent>>();
const locationListeners = new Set<Listener<RiderLocationEvent>>();
const joinedOrders = new Set<string>();

export const realtimeEnabled = !env.useMockApi && !!env.socketUrl;

const ensureSocket = async (): Promise<Socket | null> => {
  if (!realtimeEnabled) return null;
  if (socket) return socket;
  const tokens = await tokenStorage.get();
  socket = io(env.socketUrl, {
    transports: ['websocket'],
    auth: { token: tokens?.accessToken },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  });
  socket.on('connect', () => {
    addBreadcrumb('socket', 'connected');
    joinedOrders.forEach((id) => socket?.emit('order:join', { orderId: id }));
  });
  socket.on('order:status', (payload: OrderStatusEvent) => statusListeners.forEach((l) => l(payload)));
  socket.on('rider:location', (payload: RiderLocationEvent) => locationListeners.forEach((l) => l(payload)));
  socket.on('connect_error', (err) => addBreadcrumb('socket', 'connect_error', { message: err.message }));
  return socket;
};

export const realtime = {
  /** Re-authenticate after login/logout so the server can authorize order rooms. */
  async refreshAuth() {
    if (!socket) return;
    const tokens = await tokenStorage.get();
    socket.auth = { token: tokens?.accessToken };
    socket.disconnect().connect();
  },

  async joinOrder(orderId: string) {
    joinedOrders.add(orderId);
    const s = await ensureSocket();
    s?.emit('order:join', { orderId });
  },

  leaveOrder(orderId: string) {
    joinedOrders.delete(orderId);
    socket?.emit('order:leave', { orderId });
  },

  onOrderStatus(listener: Listener<OrderStatusEvent>) {
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  },

  onRiderLocation(listener: Listener<RiderLocationEvent>) {
    locationListeners.add(listener);
    return () => locationListeners.delete(listener);
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
    joinedOrders.clear();
  },
};
