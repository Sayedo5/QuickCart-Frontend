import { Country } from './types';

/**
 * Static presentation content that is not business data: dial codes for the
 * phone-number field and the onboarding carousel copy. Everything an admin can
 * change (products, stores, prices, banners, FAQs, fees) comes from the API.
 */

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
