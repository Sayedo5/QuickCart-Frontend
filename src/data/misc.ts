import { Address, ApiResponse, Country, PaymentMethod, Promo, Rider, User } from './types';

export const countries: Country[] = [
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'TR', name: 'Türkiye', dialCode: '+90', flag: '🇹🇷' },
];

export const userResponse: ApiResponse<{ user: User }> = {
  status: 'success',
  meta: { requestId: 'req_user_001', timestamp: '2026-09-07T09:00:00.000Z' },
  data: {
    user: {
      id: 'usr_001',
      name: 'Ahmed Raza',
      email: 'ahmed.raza@example.com',
      phone: '3001234567',
      dialCode: '+92',
      avatar: 'https://i.pravatar.cc/200?img=12',
      memberSince: '2025-03-14T00:00:00.000Z',
    },
  },
};

export const addressesResponse: ApiResponse<{ addresses: Address[] }> = {
  status: 'success',
  meta: { requestId: 'req_addr_001', timestamp: '2026-09-07T09:00:00.000Z' },
  data: {
    addresses: [
      {
        id: 'addr_home',
        label: 'Home',
        street: 'House 12, Street 5, Sector A',
        apartment: 'DHA Phase 6',
        city: 'Lahore, Punjab',
        instructions: 'Ring the bell twice. Gate is on the left side.',
        isDefault: true,
        location: { latitude: 31.479, longitude: 74.438 },
      },
      {
        id: 'addr_work',
        label: 'Work',
        street: 'Arfa Software Technology Park, Ferozepur Road',
        apartment: '9th Floor, Reception',
        city: 'Lahore, Punjab',
        location: { latitude: 31.475, longitude: 74.318 },
      },
    ],
  },
};

export const paymentMethodsResponse: ApiResponse<{ methods: PaymentMethod[] }> = {
  status: 'success',
  meta: { requestId: 'req_pay_001', timestamp: '2026-09-07T09:00:00.000Z' },
  data: {
    methods: [
      {
        id: 'pm_cash',
        type: 'cash',
        label: 'Cash on Delivery',
        subtitle: 'Pay the rider when your order arrives',
        isDefault: true,
      },
      {
        id: 'pm_jazzcash',
        type: 'jazzcash',
        label: 'JazzCash',
        subtitle: '0300 •••• 567',
        mobileNumber: '03001234567',
      },
      {
        id: 'pm_easypaisa',
        type: 'easypaisa',
        label: 'Easypaisa',
        subtitle: '0345 •••• 890',
        mobileNumber: '03451234890',
      },
      {
        id: 'pm_wallet',
        type: 'wallet',
        label: 'QuickCart Wallet',
        subtitle: 'Pay instantly from your balance',
      },
      {
        id: 'pm_visa',
        type: 'card',
        label: 'Visa Debit',
        subtitle: '•••• 4242',
        brand: 'visa',
        last4: '4242',
        expiry: '08/28',
      },
    ],
  },
};

export const promosResponse: ApiResponse<{ promos: Promo[] }> = {
  status: 'success',
  meta: { requestId: 'req_promo_001', timestamp: '2026-09-07T09:00:00.000Z' },
  data: {
    promos: [
      {
        code: 'WELCOME20',
        description: '20% off your first order (up to Rs 300)',
        type: 'percent',
        value: 20,
        maxDiscount: 300,
      },
      {
        code: 'FREESHIP',
        description: 'Free delivery on this order',
        type: 'free_delivery',
        value: 0,
      },
      {
        code: 'SAVE100',
        description: 'Rs 100 off orders over Rs 800',
        type: 'fixed',
        value: 100,
        minOrder: 800,
      },
      {
        code: 'BIRYANI50',
        description: 'Rs 50 off any order over Rs 400',
        type: 'fixed',
        value: 50,
        minOrder: 400,
      },
      {
        code: 'JAZZ15',
        description: '15% off (up to Rs 250) — for JazzCash users',
        type: 'percent',
        value: 15,
        maxDiscount: 250,
      },
    ],
  },
};

/** Marketing copy shown on the Offers screen alongside each promo code. */
export const offerHighlights: Record<string, { title: string; icon: 'gift' | 'bicycle' | 'wallet' | 'restaurant' | 'phone-portrait'; accent: string; validUntil: string }> = {
  WELCOME20: { title: 'Welcome to QuickCart', icon: 'gift', accent: '#FF6B35', validUntil: '30 Sep 2026' },
  FREESHIP: { title: 'Free delivery, any store', icon: 'bicycle', accent: '#2EC4B6', validUntil: '15 Sep 2026' },
  SAVE100: { title: 'Big basket bonus', icon: 'wallet', accent: '#7C5CFF', validUntil: '31 Oct 2026' },
  BIRYANI50: { title: 'Weekend biryani treat', icon: 'restaurant', accent: '#E53935', validUntil: '14 Sep 2026' },
  JAZZ15: { title: 'Pay with JazzCash', icon: 'phone-portrait', accent: '#C8102E', validUntil: '31 Dec 2026' },
};

export const riders: Rider[] = [
  {
    id: 'rid_001',
    name: 'Muhammad Bilal',
    avatar: 'https://i.pravatar.cc/200?img=59',
    phone: '+923001112233',
    rating: 4.9,
    vehicle: 'Honda CD 70',
    plate: 'LEB 4521',
  },
  {
    id: 'rid_002',
    name: 'Usman Ali',
    avatar: 'https://i.pravatar.cc/200?img=68',
    phone: '+923214445566',
    rating: 4.8,
    vehicle: 'Suzuki GS 150',
    plate: 'LEA 8830',
  },
  {
    id: 'rid_003',
    name: 'Hamza Sheikh',
    avatar: 'https://i.pravatar.cc/200?img=33',
    phone: '+923337778899',
    rating: 5.0,
    vehicle: 'Yamaha YBR 125',
    plate: 'LED 2207',
  },
];

export const onboardingSlides = [
  {
    id: 'slide_1',
    icon: 'restaurant' as const,
    accent: '#FF6B35',
    title: 'Lahore ka khana, aap ke ghar',
    subtitle: 'Karahi, biryani, groceries and medicines from the best places in Lahore, delivered to your doorstep.',
  },
  {
    id: 'slide_2',
    icon: 'bicycle' as const,
    accent: '#2EC4B6',
    title: 'Track your rider live',
    subtitle: 'Watch your rider move across the city on the map with an accurate ETA down to the minute.',
  },
  {
    id: 'slide_3',
    icon: 'wallet' as const,
    accent: '#7C5CFF',
    title: 'Pay the way you like',
    subtitle: 'Cash on delivery, JazzCash, Easypaisa, cards or your QuickCart Wallet — checkout in two taps.',
  },
];

export const faqs = [
  {
    id: 'faq_1',
    question: 'How do I track my order?',
    answer:
      'Open the Orders tab and tap your active order. You will see a live map with your rider, the current status and an ETA countdown.',
  },
  {
    id: 'faq_2',
    question: 'Can I cancel an order?',
    answer:
      'Orders can be cancelled free of charge until the restaurant or store starts preparing them. After that, please contact support and we will do our best to help.',
  },
  {
    id: 'faq_3',
    question: 'Which payment methods are accepted?',
    answer:
      'We accept Cash on Delivery, JazzCash, Easypaisa, Visa and Mastercard debit or credit cards, and your QuickCart Wallet balance.',
  },
  {
    id: 'faq_4',
    question: 'How do promo codes work?',
    answer:
      'Enter your promo code in the cart before checkout, or tap "Apply" on the Offers screen. Discounts are applied instantly and shown in the price breakdown.',
  },
  {
    id: 'faq_5',
    question: 'What is GST on my bill?',
    answer:
      'Punjab Revenue Authority sales tax is applied to food and service orders as required by law. The exact amount is always shown before you place the order.',
  },
  {
    id: 'faq_6',
    question: 'My order arrived damaged or incomplete',
    answer:
      'We are sorry about that. Go to the order details, tap "Need help with this order?" or contact support and we will issue a refund to your wallet or a replacement.',
  },
  {
    id: 'faq_7',
    question: 'Which areas of Lahore do you deliver to?',
    answer:
      'We currently deliver across DHA, Gulberg, Model Town, Johar Town, Cavalry Ground, Wapda Town, Bahria Town and the old city. More areas are being added every month.',
  },
];
