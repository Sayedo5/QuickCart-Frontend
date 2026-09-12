import { Address, MenuCategory, Order, PaymentMethod, Product, Promo, Store, User } from '@/data/types';
import { WalletTransaction } from '@/store/useWalletStore';
import { del, get, patch, post } from './http';
import type {
  AddPaymentMethodInput,
  AppSettings,
  AuthResult,
  Banner,
  CartQuote,
  Category,
  Faq,
  InboxNotification,
  OtpSession,
  Paginated,
  QuickCartApi,
  ServiceCity,
  VerifyResult,
} from './api.types';

/**
 * Real backend implementation. Every path maps 1:1 to the QuickCart API
 * (`/api/v1/...`). Responses are unwrapped from the `{ success, data, message, error }`
 * envelope by the helpers in http.ts, which also handle token refresh.
 */
export const remoteApi: QuickCartApi = {
  // ── Auth ──
  sendOtp: (input) => post<OtpSession>('/auth/send-otp', input),
  verifyOtp: (input) => post<VerifyResult>('/auth/verify-otp', input),
  completeSignup: (input) => post<AuthResult>('/auth/signup', input),
  logout: (refreshToken) => post<null>('/auth/logout', { refreshToken }).then(() => undefined),
  getProfile: () => get<User>('/auth/me'),
  updateProfile: (body) => patch<User>('/users/me', body),
  registerPushToken: (token, platform) => post<null>('/users/me/push-token', { token, platform }).then(() => undefined),

  // ── Catalog ──
  getSettings: () => get<AppSettings>('/settings/public'),
  getBanners: () => get<Banner[]>('/banners'),
  getCategories: () => get<Category[]>('/categories'),
  getStores: (params) =>
    get<Paginated<Store>>('/stores', {
      params: { category: params?.category === 'all' ? undefined : params?.category, q: params?.query, page: params?.page ?? 1, perPage: 50, city: params?.city },
    }),
  getCities: () => get<ServiceCity[]>('/cities'),
  resolveCity: (location) =>
    get<{ city: ServiceCity | null; distanceKm: number | null; supported: boolean }>('/cities/resolve', {
      params: { latitude: location.latitude, longitude: location.longitude },
    }),
  getStore: (storeId) => get<Store>(`/stores/${storeId}`),
  getMenu: (storeId) => get<{ categories: MenuCategory[]; products: Product[] }>(`/stores/${storeId}/menu`),
  search: (query, city) => get<{ stores: Store[]; products: Array<Product & { store: Store }> }>('/search', { params: { q: query, city } }),
  getPromos: () => get<Promo[]>('/coupons'),
  validatePromo: (code, subtotal) => post<Promo>('/coupons/validate', { code, subtotal }),
  getFaqs: () => get<Faq[]>('/content/faqs'),

  // ── Account ──
  getAddresses: () => get<Address[]>('/addresses'),
  addAddress: (input) => post<Address>('/addresses', input),
  updateAddress: (id, body) => patch<Address>(`/addresses/${id}`, body),
  deleteAddress: (id) => del<null>(`/addresses/${id}`).then(() => undefined),
  getPaymentMethods: () => get<PaymentMethod[]>('/payment-methods'),
  addPaymentMethod: (input: AddPaymentMethodInput) => post<PaymentMethod>('/payment-methods', input),
  deletePaymentMethod: (id) => del<null>(`/payment-methods/${id}`).then(() => undefined),
  getFavourites: () => get<string[]>('/favourites'),
  setFavourite: (storeId, favourite) => (favourite ? post<null>(`/favourites/${storeId}`) : del<null>(`/favourites/${storeId}`)).then(() => undefined),
  getWallet: () => get<{ balance: number; transactions: WalletTransaction[] }>('/wallet'),
  topUpWallet: (amount, source) => post<{ balance: number; transaction: WalletTransaction }>('/wallet/top-up', { amount, source }),
  getNotifications: () => get<InboxNotification[]>('/notifications'),
  markNotificationsRead: () => post<null>('/notifications/read-all').then(() => undefined),

  // ── Cart & orders ──
  quoteCart: (input) => post<CartQuote>('/orders/quote', input),
  placeOrder: (input) => post<Order>('/orders', input),
  getOrders: () => get<Order[]>('/orders/my'),
  getOrder: (orderId) => get<Order>(`/orders/${orderId}`),
  cancelOrder: (orderId, reason) => post<Order>(`/orders/${orderId}/cancel`, { reason }),
  rateOrder: (orderId, rating) => post<Order>(`/orders/${orderId}/review`, rating),

  // ── Rider onboarding ──
  applyAsRider: (input) => post<{ status: string }>('/riders/apply', input),
};
