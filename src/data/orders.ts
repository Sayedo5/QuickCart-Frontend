import { APP_CONFIG } from './config';
import { addressesResponse, paymentMethodsResponse, riders } from './misc';
import { menuResponse } from './products';
import { storesResponse } from './stores';
import { ApiResponse, CartItem, Order, Product } from './types';

const productById = (id: string): Product => {
  const product = menuResponse.data.products.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown mock product ${id}`);
  return product;
};

const storeById = (id: string) => {
  const store = storesResponse.data.stores.find((s) => s.id === id);
  if (!store) throw new Error(`Unknown mock store ${id}`);
  return store;
};

const daysAgo = (days: number, hour: number, minute: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

const buildPastOrder = (params: {
  id: string;
  orderNumber: string;
  storeId: string;
  items: Array<{ productId: string; quantity: number }>;
  placedAt: Date;
  riderIndex: number;
  paymentId: string;
  rating?: Order['rating'];
  promoCode?: string;
  discount?: number;
}): Order => {
  const store = storeById(params.storeId);
  const items: CartItem[] = params.items.map((i) => ({ product: productById(i.productId), quantity: i.quantity }));
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const deliveryFee = store.deliveryFee;
  const serviceFee = APP_CONFIG.platformFee;
  const discount = params.discount ?? 0;
  const tax = Math.round((subtotal - discount) * APP_CONFIG.taxRate);
  const total = subtotal + deliveryFee + serviceFee + tax - discount;
  const placedAt = params.placedAt;
  const paymentMethod = paymentMethodsResponse.data.methods.find((m) => m.id === params.paymentId) ?? paymentMethodsResponse.data.methods[0];
  return {
    id: params.id,
    orderNumber: params.orderNumber,
    storeId: store.id,
    storeName: store.name,
    storeImage: store.image,
    storeLocation: store.location,
    items,
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    discount,
    total,
    promoCode: params.promoCode,
    paymentMethod,
    address: addressesResponse.data.addresses[0],
    status: 'delivered',
    createdAt: placedAt.toISOString(),
    timeline: {
      placedAt: placedAt.toISOString(),
      preparingAt: addMinutes(placedAt, 3).toISOString(),
      pickedUpAt: addMinutes(placedAt, 18).toISOString(),
      deliveredAt: addMinutes(placedAt, 34).toISOString(),
    },
    estimatedDeliveryAt: addMinutes(placedAt, 35).toISOString(),
    rider: riders[params.riderIndex],
    rating: params.rating,
  };
};

export const ordersResponse: ApiResponse<{ orders: Order[] }> = {
  status: 'success',
  meta: { requestId: 'req_orders_001', timestamp: new Date().toISOString(), total: 5 },
  data: {
    orders: [
      buildPastOrder({
        id: 'ord_1001',
        orderNumber: 'QC-48213',
        storeId: 'st_biryani_express',
        items: [
          { productId: 'st_biryani_express__chicken_biryani', quantity: 2 },
          { productId: 'st_biryani_express__raita', quantity: 2 },
          { productId: 'st_biryani_express__coke', quantity: 1 },
        ],
        placedAt: daysAgo(1, 20, 12),
        riderIndex: 0,
        paymentId: 'pm_cash',
        rating: { stars: 5, comment: 'Hot & fresh, On time — Biryani was excellent!' },
      }),
      buildPastOrder({
        id: 'ord_1002',
        orderNumber: 'QC-47990',
        storeId: 'st_fresh_basket',
        items: [
          { productId: 'st_fresh_basket__milk', quantity: 2 },
          { productId: 'st_fresh_basket__eggs', quantity: 1 },
          { productId: 'st_fresh_basket__atta', quantity: 1 },
          { productId: 'st_fresh_basket__tea', quantity: 1 },
        ],
        placedAt: daysAgo(3, 11, 5),
        riderIndex: 1,
        paymentId: 'pm_jazzcash',
        promoCode: 'SAVE100',
        discount: 100,
        rating: { stars: 4 },
      }),
      buildPastOrder({
        id: 'ord_1003',
        orderNumber: 'QC-47412',
        storeId: 'st_karahi_point',
        items: [
          { productId: 'st_karahi_point__chicken_karahi_full', quantity: 1 },
          { productId: 'st_karahi_point__garlic_naan', quantity: 6 },
          { productId: 'st_karahi_point__mint_margarita', quantity: 2 },
        ],
        placedAt: daysAgo(3, 21, 30),
        riderIndex: 2,
        paymentId: 'pm_easypaisa',
      }),
      buildPastOrder({
        id: 'ord_1004',
        orderNumber: 'QC-46980',
        storeId: 'st_chai_khana',
        items: [
          { productId: 'st_chai_khana__halwa_puri', quantity: 2 },
          { productId: 'st_chai_khana__doodh_patti', quantity: 2 },
        ],
        placedAt: daysAgo(7, 9, 15),
        riderIndex: 0,
        paymentId: 'pm_wallet',
        rating: { stars: 5, comment: 'Perfect Sunday breakfast.' },
      }),
      buildPastOrder({
        id: 'ord_1005',
        orderNumber: 'QC-46108',
        storeId: 'st_careplus',
        items: [
          { productId: 'st_careplus__paracetamol', quantity: 2 },
          { productId: 'st_careplus__vitamin_c', quantity: 1 },
          { productId: 'st_careplus__ors', quantity: 1 },
        ],
        placedAt: daysAgo(12, 15, 40),
        riderIndex: 1,
        paymentId: 'pm_visa',
        rating: { stars: 5 },
      }),
    ],
  },
};
