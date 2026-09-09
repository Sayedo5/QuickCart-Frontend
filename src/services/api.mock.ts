import { APP_CONFIG } from '@/data/config';
import { addressesResponse, faqs, offerHighlights, paymentMethodsResponse, promosResponse, riders, userResponse } from '@/data/misc';
import { ordersResponse } from '@/data/orders';
import { menuResponse } from '@/data/products';
import { storesResponse } from '@/data/stores';
import { Address, Order, PaymentMethod, User } from '@/data/types';
import { computeTotals } from '@/store/useCartStore';
import { ORDER_TIMINGS } from '@/store/useOrderStore';
import { generateId } from '@/utils/format';
import { cardBrandLabel, detectCardBrand, digitsOnly, isValidEmail, luhnCheck, maskMobile, validatePkMobile } from '@/utils/validation';
import { ApiError } from './http';
import type { AuthResult, OtpPurpose, QuickCartApi, VerifyResult } from './api.types';

/**
 * In-repo mock backend used when EXPO_PUBLIC_API_URL is not set. It enforces the
 * same validation rules as the real API so demos behave identically, and keeps
 * OTP sessions in memory. Account state lives in the Zustand stores in this mode.
 */

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const DEMO_OTP = '123456';

interface OtpRecord {
  purpose: OtpPurpose;
  email: string;
  createdAt: number;
}

const otpSessions = new Map<string, OtpRecord>();
const knownUsers = new Set<string>([userResponse.data.user.email]);

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(2, Math.min(6, name.length - 1)))}@${domain}`;
};

const tokens = (): AuthResult['tokens'] => ({ accessToken: generateId('mock_access'), refreshToken: generateId('mock_refresh') });

const userFor = (email: string): User => ({ ...userResponse.data.user, email });

export const mockApi: QuickCartApi = {
  // ── Auth ──
  async sendOtp({ email, purpose }) {
    await delay(1000);
    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) throw new ApiError('VALIDATION', 'Enter a valid email address.', 422);
    otpSessions.set(clean, { purpose, email: clean, createdAt: Date.now() });
    return {
      sessionId: clean,
      destination: maskEmail(clean),
      channel: 'email',
      expiresIn: 300,
      isNewUser: !knownUsers.has(clean),
      devCode: DEMO_OTP,
    };
  },

  async verifyOtp({ email, code }): Promise<VerifyResult> {
    await delay(900);
    const clean = email.trim().toLowerCase();
    const session = otpSessions.get(clean);
    if (!session) throw new ApiError('SESSION_EXPIRED', 'Your session expired. Please request a new code.', 400);
    if (Date.now() - session.createdAt > 300_000) {
      otpSessions.delete(clean);
      throw new ApiError('OTP_EXPIRED', 'This code has expired. Please request a new one.', 400);
    }
    if (code !== DEMO_OTP) throw new ApiError('INVALID_OTP', 'Incorrect code. Please try again.', 400);
    otpSessions.delete(clean);
    if (!knownUsers.has(clean)) return { isNewUser: true, signupToken: `mock_signup_${clean}` };
    return { isNewUser: false, user: userFor(clean), tokens: tokens() };
  },

  async completeSignup({ signupToken, name, phone, dialCode }) {
    await delay(900);
    const email = signupToken.replace('mock_signup_', '');
    if (name.trim().length < 2) throw new ApiError('VALIDATION', 'Enter your full name.', 422);
    if (dialCode === '+92' && !validatePkMobile(phone).valid) throw new ApiError('VALIDATION', 'Enter a valid Pakistani mobile number.', 422);
    knownUsers.add(email);
    return { user: { ...userFor(email), name: name.trim(), phone: digitsOnly(phone).replace(/^0/, ''), dialCode, memberSince: new Date().toISOString() }, tokens: tokens() };
  },

  async logout() {
    await delay(150);
  },

  async getProfile() {
    await delay(300);
    return userResponse.data.user;
  },

  async updateProfile(patch) {
    await delay(600);
    if (patch.email && !isValidEmail(patch.email)) throw new ApiError('VALIDATION', 'Enter a valid email address.', 422);
    return { ...userResponse.data.user, ...patch };
  },

  async registerPushToken() {
    await delay(100);
  },

  // ── Catalog ──
  async getSettings() {
    await delay(250);
    return {
      currencySymbol: APP_CONFIG.currencySymbol,
      taxRate: APP_CONFIG.taxRate,
      taxPercent: APP_CONFIG.taxRate * 100,
      taxLabel: APP_CONFIG.taxLabel,
      platformFee: APP_CONFIG.platformFee,
      baseDeliveryFee: 99,
      minOrderDefault: 300,
      serviceCity: APP_CONFIG.city,
      supportEmail: APP_CONFIG.supportEmail,
      supportPhone: APP_CONFIG.supportPhone,
      supportWhatsApp: '+923001112233',
      announcement: null,
    };
  },

  async getBanners() {
    await delay(250);
    return [
      {
        id: 'bn_welcome',
        label: 'LIMITED OFFER · LAHORE',
        title: '20% off your first order',
        subtitle: 'Code WELCOME20 · up to Rs 300 · Tap to see all offers',
        target: { type: 'offers' },
        colors: ['#FF6B35', '#FF8F5E'],
        sortOrder: 0,
      },
    ];
  },

  async getCategories() {
    await delay(200);
    return [
      { id: 'c1', name: 'Restaurants', slug: 'restaurants', icon: 'restaurant-outline', sortOrder: 1 },
      { id: 'c2', name: 'Grocery', slug: 'grocery', icon: 'basket-outline', sortOrder: 2 },
      { id: 'c3', name: 'Pharmacy', slug: 'pharmacy', icon: 'medkit-outline', sortOrder: 3 },
    ];
  },

  async getStores(params) {
    await delay(800);
    let stores = storesResponse.data.stores;
    if (params?.category && params.category !== 'all') stores = stores.filter((s) => s.category === params.category);
    if (params?.query) {
      const q = params.query.trim().toLowerCase();
      stores = stores.filter((s) => s.name.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)));
    }
    return { items: stores, page: 1, perPage: 50, total: stores.length, totalPages: 1 };
  },

  async getStore(storeId) {
    await delay(350);
    const store = storesResponse.data.stores.find((s) => s.id === storeId);
    if (!store) throw new ApiError('STORE_NOT_FOUND', 'We could not find that store.', 404);
    return store;
  },

  async getMenu(storeId) {
    await delay(600);
    const categories = menuResponse.data.categories.filter((c) => c.storeId === storeId).sort((a, b) => a.sortOrder - b.sortOrder);
    const products = menuResponse.data.products.filter((p) => p.storeId === storeId);
    return { categories, products };
  },

  async search(query) {
    await delay(450);
    const q = query.trim().toLowerCase();
    if (!q) return { stores: [], products: [] };
    const stores = storesResponse.data.stores.filter((s) => s.name.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)));
    const products = menuResponse.data.products
      .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .slice(0, 20)
      .map((p) => ({ ...p, store: storesResponse.data.stores.find((s) => s.id === p.storeId)! }));
    return { stores, products };
  },

  async getPromos() {
    await delay(350);
    return promosResponse.data.promos;
  },

  async validatePromo(code, subtotal) {
    await delay(700);
    const promo = promosResponse.data.promos.find((p) => p.code === code.trim().toUpperCase());
    if (!promo) throw new ApiError('PROMO_INVALID', 'This promo code is not valid.', 404);
    if (promo.minOrder && subtotal < promo.minOrder) {
      throw new ApiError('PROMO_MIN_ORDER', `Add ${APP_CONFIG.currencySymbol} ${Math.ceil(promo.minOrder - subtotal)} more to use this code.`, 422);
    }
    return promo;
  },

  async getFaqs() {
    await delay(250);
    return faqs;
  },

  // ── Account (stateless: the Zustand stores own this state in mock mode) ──
  async getAddresses() {
    await delay(250);
    return addressesResponse.data.addresses;
  },
  async addAddress(input) {
    await delay(600);
    if (input.street.trim().length < 4) throw new ApiError('VALIDATION', 'Enter a valid street address.', 422);
    return { ...input, id: generateId('addr') } as Address;
  },
  async updateAddress(id, patch) {
    await delay(400);
    return { ...(addressesResponse.data.addresses[0] as Address), ...patch, id };
  },
  async deleteAddress() {
    await delay(300);
  },
  async getPaymentMethods() {
    await delay(250);
    return paymentMethodsResponse.data.methods;
  },
  async addPaymentMethod(input) {
    await delay(800);
    if (input.type === 'card') {
      if (!luhnCheck(input.number)) throw new ApiError('INVALID_CARD', 'This card number is not valid.', 422);
      const digits = digitsOnly(input.number);
      const brand = detectCardBrand(digits);
      return {
        id: generateId('pm'),
        type: 'card',
        label: cardBrandLabel[brand],
        subtitle: `•••• ${digits.slice(-4)}`,
        brand: brand === 'visa' || brand === 'mastercard' || brand === 'amex' ? brand : undefined,
        last4: digits.slice(-4),
        expiry: input.expiry,
      } satisfies PaymentMethod;
    }
    const check = validatePkMobile(input.mobileNumber);
    if (!check.valid || !check.normalized) throw new ApiError('VALIDATION', check.error ?? 'Invalid mobile number.', 422);
    return {
      id: generateId('pm'),
      type: input.type,
      label: input.type === 'jazzcash' ? 'JazzCash' : 'Easypaisa',
      subtitle: maskMobile(check.normalized),
      mobileNumber: check.normalized,
    } satisfies PaymentMethod;
  },
  async deletePaymentMethod() {
    await delay(300);
  },
  async getFavourites() {
    await delay(200);
    return ['st_biryani_express', 'st_chai_khana'];
  },
  async setFavourite() {
    await delay(120);
  },
  async getWallet() {
    await delay(250);
    return { balance: 1250, transactions: [] };
  },
  async topUpWallet(amount, source) {
    await delay(1100);
    if (amount < 100) throw new ApiError('VALIDATION', 'Minimum top-up is Rs 100.', 422);
    return { balance: amount, transaction: { id: generateId('wtx'), type: 'topup', amount, title: `Top-up via ${source}`, createdAt: new Date().toISOString() } };
  },
  async getNotifications() {
    await delay(350);
    return Object.entries(offerHighlights)
      .slice(0, 2)
      .map(([code, meta], i) => ({
        id: `ntf_${code}`,
        title: meta.title,
        body: `Use code ${code} at checkout.`,
        type: 'promo' as const,
        read: i > 0,
        createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
      }));
  },
  async markNotificationsRead() {
    await delay(150);
  },

  // ── Cart & orders ──
  async quoteCart({ storeId, items, promoCode }) {
    await delay(450);
    const store = storesResponse.data.stores.find((s) => s.id === storeId);
    if (!store) throw new ApiError('STORE_NOT_FOUND', 'Store not found.', 404);
    const resolved = items
      .map((i) => ({ product: menuResponse.data.products.find((p) => p.id === i.productId), quantity: i.quantity }))
      .filter((i): i is { product: NonNullable<typeof i.product>; quantity: number } => !!i.product);
    const promo = promoCode ? (promosResponse.data.promos.find((p) => p.code === promoCode) ?? null) : null;
    const totals = computeTotals(resolved, promo, store.deliveryFee);
    return { ...totals, taxLabel: APP_CONFIG.taxLabel, minOrder: store.minOrder, issues: [], promo };
  },

  async placeOrder(input) {
    await delay(1500);
    const store = storesResponse.data.stores.find((s) => s.id === input.storeId);
    if (!store) throw new ApiError('STORE_NOT_FOUND', 'Store not found.', 404);
    if (!store.isOpen) throw new ApiError('STORE_CLOSED', `${store.name} is closed right now.`, 409);
    const items = input.items
      .map((i) => ({ product: menuResponse.data.products.find((p) => p.id === i.productId)!, quantity: i.quantity }))
      .filter((i) => !!i.product);
    if (items.length === 0) throw new ApiError('EMPTY_CART', 'Your cart is empty.', 422);
    const promo = input.promoCode ? (promosResponse.data.promos.find((p) => p.code === input.promoCode) ?? null) : null;
    const totals = computeTotals(items, promo, store.deliveryFee);
    if (totals.subtotal < store.minOrder) throw new ApiError('MIN_ORDER', `Minimum order for ${store.name} is Rs ${store.minOrder}.`, 422);
    const address = addressesResponse.data.addresses.find((a) => a.id === input.addressId) ?? addressesResponse.data.addresses[0];
    const method = paymentMethodsResponse.data.methods.find((m) => m.id === input.paymentMethodId) ?? paymentMethodsResponse.data.methods[0];
    const now = new Date();
    return {
      id: generateId('ord'),
      orderNumber: `QC-${Math.floor(10000 + Math.random() * 89999)}`,
      storeId: store.id,
      storeName: store.name,
      storeImage: store.image,
      storeLocation: store.location,
      items,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      serviceFee: totals.serviceFee,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      promoCode: promo?.code,
      paymentMethod: method,
      address,
      status: 'placed',
      createdAt: now.toISOString(),
      timeline: { placedAt: now.toISOString() },
      estimatedDeliveryAt: new Date(now.getTime() + ORDER_TIMINGS.delivered).toISOString(),
      rider: riders[Math.floor(Math.random() * riders.length)],
    } satisfies Order;
  },

  async getOrders() {
    await delay(500);
    return ordersResponse.data.orders;
  },

  async getOrder(orderId) {
    await delay(300);
    const order = ordersResponse.data.orders.find((o) => o.id === orderId);
    if (!order) throw new ApiError('ORDER_NOT_FOUND', 'Order not found.', 404);
    return order;
  },

  async cancelOrder(orderId) {
    await delay(500);
    const order = ordersResponse.data.orders.find((o) => o.id === orderId) ?? ordersResponse.data.orders[0];
    return { ...order, id: orderId, status: 'cancelled' };
  },

  async rateOrder(orderId, rating) {
    await delay(600);
    const order = ordersResponse.data.orders.find((o) => o.id === orderId) ?? ordersResponse.data.orders[0];
    return { ...order, id: orderId, rating: { stars: rating.stars, comment: rating.comment, tip: rating.tip } };
  },

  async applyAsRider() {
    await delay(900);
    return { status: 'pending' };
  },
};
