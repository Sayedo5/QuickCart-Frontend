/** App-wide business configuration for the Pakistan market. */
export const APP_CONFIG = {
  country: 'Pakistan',
  city: 'Lahore',
  currency: 'PKR',
  currencySymbol: 'Rs',
  defaultDialCode: '+92',
  /** Punjab GST applied to the discounted subtotal. */
  taxRate: 0.16,
  taxLabel: 'GST (16%)',
  /** Flat platform fee per order, in PKR. */
  platformFee: 29,
  supportPhone: '+92 42 111 000 123',
  supportEmail: 'support@quickcart.pk',
  /** Center of Lahore for map defaults. */
  mapCenter: { latitude: 31.4907, longitude: 74.3436 },
} as const;
