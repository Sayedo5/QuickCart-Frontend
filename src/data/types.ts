export type StoreCategory = 'restaurants' | 'grocery' | 'pharmacy';

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  image: string;
  coverImage: string;
  rating: number;
  ratingCount: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  minOrder: number;
  distanceKm: number;
  tags: string[];
  isOpen: boolean;
  promoLabel?: string;
  /** Neighbourhood shown on cards, e.g. "DHA Phase 5". */
  area: string;
  address: string;
  location: { latitude: number; longitude: number };
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  isVeg?: boolean;
  isPopular?: boolean;
  unit?: string;
}

export interface MenuCategory {
  id: string;
  storeId: string;
  name: string;
  sortOrder: number;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  street: string;
  apartment?: string;
  city: string;
  instructions?: string;
  isDefault?: boolean;
  location: { latitude: number; longitude: number };
}

export type PaymentType = 'card' | 'cash' | 'wallet' | 'jazzcash' | 'easypaisa';

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  label: string;
  subtitle: string;
  brand?: 'visa' | 'mastercard' | 'amex';
  /** Linked mobile wallet number for JazzCash / Easypaisa. */
  mobileNumber?: string;
  last4?: string;
  expiry?: string;
  isDefault?: boolean;
}

export interface Promo {
  code: string;
  description: string;
  type: 'percent' | 'fixed' | 'free_delivery';
  value: number;
  maxDiscount?: number;
  minOrder?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'placed' | 'preparing' | 'picked_up' | 'delivered' | 'cancelled';

export interface Rider {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  vehicle: string;
  plate: string;
}

export interface OrderTimeline {
  placedAt: string;
  preparingAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  storeImage: string;
  storeLocation: { latitude: number; longitude: number };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  promoCode?: string;
  paymentMethod: PaymentMethod;
  address: Address;
  status: OrderStatus;
  createdAt: string;
  timeline: OrderTimeline;
  estimatedDeliveryAt: string;
  rider: Rider;
  rating?: { stars: number; comment?: string; tip?: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  dialCode: string;
  avatar: string;
  memberSince: string;
}

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

/** Generic mock API envelope, shaped like a real backend response. */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    page?: number;
    perPage?: number;
    total?: number;
  };
  error?: { code: string; message: string };
}
