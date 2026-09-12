import {
  Address,
  MenuCategory,
  Order,
  PaymentMethod,
  Product,
  Promo,
  Store,
  StoreCategory,
  User,
} from '@/data/types';
import { WalletTransaction } from '@/store/useWalletStore';

/**
 * The single data contract the app talks to. Both implementations satisfy it:
 *   api.remote.ts — the real QuickCart backend (Express + Prisma + Neon)
 * Shapes here match the backend's serializers exactly (see backend src/utils/serialize.ts).
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export type OtpPurpose = 'login' | 'signup';

export interface OtpSession {
  /** The backend keys OTP sessions by email, so this is the email itself. */
  sessionId: string;
  /** Masked destination to show the user, e.g. "a****@gmail.com". */
  destination: string;
  channel: 'email';
  /** Seconds until the code expires. */
  expiresIn: number;
  /** True when no account exists yet, so verification leads to profile completion. */
  isNewUser: boolean;
  /** Only present in backend development mode without SMTP, so the flow stays testable. */
  devCode?: string;
}

/** Verifying a code either signs an existing user in or returns a token to finish signup. */
export type VerifyResult = ({ isNewUser: false } & AuthResult) | { isNewUser: true; signupToken: string };

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  label?: string;
  image?: string;
  target: { type: 'offers' | 'store' | 'category' | 'external'; value?: string };
  colors: [string, string];
  sortOrder: number;
}

/** One city QuickCart delivers in, as returned by GET /cities. */
export interface ServiceCity {
  id: string;
  name: string;
  slug: string;
  province?: string;
  location: { latitude: number; longitude: number };
  radiusKm: number;
  baseDeliveryFee: number;
  perKmFee: number;
  minOrderAmount: number;
  etaBaseMin: number;
  etaPerKmMin: number;
  isActive: boolean;
  sortOrder: number;
}

export interface AppSettings {
  currencySymbol: string;
  taxRate: number;
  taxPercent: number;
  taxLabel: string;
  platformFee: number;
  baseDeliveryFee: number;
  minOrderDefault: number;
  /** Fallback city for clients that have not picked one yet. */
  serviceCity: string;
  /** Every live city. Empty only when the backend predates multi-city support. */
  serviceCities: ServiceCity[];
  supportEmail: string;
  supportPhone: string;
  supportWhatsApp?: string;
  termsUrl?: string;
  privacyUrl?: string;
  announcement: { title: string; body: string } | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
}

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'promo' | 'wallet' | 'system';
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface QuoteItem {
  productId: string;
  quantity: number;
  /** Price the app showed, so the server can flag a change. */
  unitPrice?: number;
}

export interface CartQuoteInput {
  storeId: string;
  items: QuoteItem[];
  promoCode?: string | null;
  addressId?: string | null;
}

export interface QuoteIssue {
  productId: string;
  type: 'out_of_stock' | 'price_changed' | 'unavailable';
  newPrice?: number;
}

export interface CartQuote {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  taxLabel: string;
  minOrder: number;
  issues: QuoteIssue[];
  promo: Promo | null;
}

export interface PlaceOrderInput extends CartQuoteInput {
  addressId: string;
  paymentMethodId: string;
  note?: string | null;
}

export type AddPaymentMethodInput =
  | { type: 'card'; holder: string; number: string; expiry: string }
  | { type: 'jazzcash' | 'easypaisa'; mobileNumber: string };

export interface QuickCartApi {
  // ── Auth (email OTP) ──
  sendOtp(input: { email: string; purpose: OtpPurpose }): Promise<OtpSession>;
  verifyOtp(input: { email: string; code: string }): Promise<VerifyResult>;
  /** Name and phone are optional — a new customer can finish signup without them. */
  completeSignup(input: { signupToken: string; name?: string; phone?: string; dialCode?: string }): Promise<AuthResult>;
  logout(refreshToken?: string | null): Promise<void>;
  getProfile(): Promise<User>;
  updateProfile(patch: Partial<Pick<User, 'name' | 'email' | 'avatar' | 'phone'>>): Promise<User>;
  registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void>;

  // ── Catalog ──
  getSettings(): Promise<AppSettings>;
  getBanners(): Promise<Banner[]>;
  getCategories(): Promise<Category[]>;
  getStores(params?: { category?: StoreCategory | 'all'; query?: string; page?: number; city?: string }): Promise<Paginated<Store>>;
  getCities(): Promise<ServiceCity[]>;
  /** Maps a GPS fix to a service city; `city` is null outside every service area. */
  resolveCity(location: { latitude: number; longitude: number }): Promise<{ city: ServiceCity | null; distanceKm: number | null; supported: boolean }>;
  getStore(storeId: string): Promise<Store>;
  getMenu(storeId: string): Promise<{ categories: MenuCategory[]; products: Product[] }>;
  search(query: string, city?: string): Promise<{ stores: Store[]; products: Array<Product & { store: Store }> }>;
  getPromos(): Promise<Promo[]>;
  validatePromo(code: string, subtotal: number): Promise<Promo>;
  getFaqs(): Promise<Faq[]>;

  // ── Account ──
  getAddresses(): Promise<Address[]>;
  addAddress(input: Omit<Address, 'id'>): Promise<Address>;
  updateAddress(id: string, patch: Partial<Address>): Promise<Address>;
  deleteAddress(id: string): Promise<void>;
  getPaymentMethods(): Promise<PaymentMethod[]>;
  addPaymentMethod(input: AddPaymentMethodInput): Promise<PaymentMethod>;
  deletePaymentMethod(id: string): Promise<void>;
  getFavourites(): Promise<string[]>;
  setFavourite(storeId: string, favourite: boolean): Promise<void>;
  getWallet(): Promise<{ balance: number; transactions: WalletTransaction[] }>;
  topUpWallet(amount: number, source: string): Promise<{ balance: number; transaction: WalletTransaction }>;
  getNotifications(): Promise<InboxNotification[]>;
  markNotificationsRead(): Promise<void>;

  // ── Cart & orders ──
  quoteCart(input: CartQuoteInput): Promise<CartQuote>;
  placeOrder(input: PlaceOrderInput): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order>;
  cancelOrder(orderId: string, reason?: string): Promise<Order>;
  rateOrder(orderId: string, rating: { stars: number; comment?: string; tags?: string[]; tip?: number }): Promise<Order>;

  // ── Rider onboarding ──
  applyAsRider(input: { name: string; email: string; phone: string; vehicleType?: string; plateNumber?: string }): Promise<{ status: string }>;
}
