/**
 * Client-side validation helpers. Pure functions, unit-testable, no React.
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'unionpay' | 'unknown';

/** Strips everything except digits. */
export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/**
 * Luhn (mod 10) checksum used by every major card scheme.
 * Returns false for non-numeric input or fewer than 12 digits.
 */
export const luhnCheck = (cardNumber: string): boolean => {
  const digits = digitsOnly(cardNumber);
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

/** Detects the card scheme from the leading digits (IIN ranges). */
export const detectCardBrand = (cardNumber: string): CardBrand => {
  const d = digitsOnly(cardNumber);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  if (/^62/.test(d)) return 'unionpay';
  return 'unknown';
};

export const cardBrandLabel: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  unionpay: 'UnionPay',
  unknown: 'Card',
};

/** Expected PAN length per scheme (Amex is 15, most others 16). */
export const expectedCardLength = (brand: CardBrand): number[] => {
  switch (brand) {
    case 'amex':
      return [15];
    case 'unionpay':
      return [16, 17, 18, 19];
    default:
      return [16];
  }
};

export interface CardValidation {
  valid: boolean;
  brand: CardBrand;
  error?: string;
}

/** Full card-number validation: length for the scheme + Luhn checksum. */
export const validateCardNumber = (cardNumber: string): CardValidation => {
  const d = digitsOnly(cardNumber);
  const brand = detectCardBrand(d);
  if (d.length === 0) return { valid: false, brand, error: 'Enter your card number.' };
  if (brand === 'unknown') return { valid: false, brand, error: 'We accept Visa, Mastercard, American Express and UnionPay.' };
  if (!expectedCardLength(brand).includes(d.length)) {
    return { valid: false, brand, error: `${cardBrandLabel[brand]} numbers are ${expectedCardLength(brand).join(' or ')} digits.` };
  }
  if (!luhnCheck(d)) return { valid: false, brand, error: 'This card number is not valid. Please check the digits.' };
  return { valid: true, brand };
};

/** Validates MM/YY and rejects cards that have already expired. */
export const validateExpiry = (expiry: string, now = new Date()): string | undefined => {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry.trim());
  if (!match) return 'Use MM/YY format.';
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return 'Month must be between 01 and 12.';
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  if (endOfMonth < now) return 'This card has expired.';
  if (year > now.getFullYear() + 20) return 'Expiry year looks wrong.';
  return undefined;
};

export const validateCvv = (cvv: string, brand: CardBrand): string | undefined => {
  const d = digitsOnly(cvv);
  const needed = brand === 'amex' ? 4 : 3;
  if (d.length !== needed) return `Enter the ${needed}-digit security code.`;
  return undefined;
};

// ───────────────────────── Pakistani mobile numbers ─────────────────────────

export type PkNetwork = 'jazz' | 'telenor' | 'zong' | 'ufone' | 'scom' | 'unknown';

/** Second/third digits after the leading 03 map to operators (PTA numbering plan). */
const NETWORK_PREFIXES: Array<{ network: PkNetwork; test: RegExp }> = [
  { network: 'jazz', test: /^03(0\d|2\d)/ }, // 0300-0309 (Jazz), 0320-0329 (ex-Warid, now Jazz)
  { network: 'zong', test: /^031\d/ },
  { network: 'ufone', test: /^033\d/ },
  { network: 'telenor', test: /^034\d/ },
  { network: 'scom', test: /^0355/ },
];

export const networkLabel: Record<PkNetwork, string> = {
  jazz: 'Jazz',
  telenor: 'Telenor',
  zong: 'Zong',
  ufone: 'Ufone',
  scom: 'SCOM',
  unknown: 'Unknown network',
};

export interface PkMobileValidation {
  valid: boolean;
  /** Local format "03XXXXXXXXX" when valid. */
  normalized?: string;
  /** International format "+923XXXXXXXXX" when valid. */
  e164?: string;
  network: PkNetwork;
  error?: string;
}

/**
 * Accepts 03XXXXXXXXX, 3XXXXXXXXX, 923XXXXXXXXX, +923XXXXXXXXX or 00923XXXXXXXXX
 * with spaces/dashes and normalizes to the local 11-digit form.
 */
export const validatePkMobile = (input: string): PkMobileValidation => {
  let d = digitsOnly(input);
  if (d.startsWith('0092')) d = d.slice(4);
  if (d.startsWith('92') && d.length === 12) d = d.slice(2);
  if (d.length === 10 && d.startsWith('3')) d = `0${d}`;
  if (d.length === 0) return { valid: false, network: 'unknown', error: 'Enter a mobile number.' };
  if (!/^03\d{9}$/.test(d)) {
    return { valid: false, network: 'unknown', error: 'Enter a valid Pakistani mobile number, e.g. 0300 1234567.' };
  }
  const network = NETWORK_PREFIXES.find((n) => n.test.test(d))?.network ?? 'unknown';
  if (network === 'unknown') {
    return { valid: false, network, error: 'This prefix is not a Pakistani mobile network.' };
  }
  return { valid: true, normalized: d, e164: `+92${d.slice(1)}`, network };
};

export type MobileWalletProvider = 'jazzcash' | 'easypaisa';

/**
 * Wallet accounts are usually tied to the operator that runs them (JazzCash → Jazz,
 * Easypaisa → Telenor), but both now allow other networks. We validate the number
 * strictly and only *warn* on an unexpected network so genuine users are not blocked.
 */
export const validateMobileWallet = (
  provider: MobileWalletProvider,
  input: string,
): PkMobileValidation & { warning?: string } => {
  const result = validatePkMobile(input);
  if (!result.valid) return result;
  const expected: PkNetwork = provider === 'jazzcash' ? 'jazz' : 'telenor';
  if (result.network !== expected) {
    const providerName = provider === 'jazzcash' ? 'JazzCash' : 'Easypaisa';
    return {
      ...result,
      warning: `${result.normalized} is a ${networkLabel[result.network]} number. Most ${providerName} accounts use ${networkLabel[expected]} numbers — double-check this is the number registered with ${providerName}.`,
    };
  }
  return result;
};

/** Masks a local mobile number as "0300 •••• 567". */
export const maskMobile = (local: string): string => {
  const d = digitsOnly(local);
  if (d.length !== 11) return local;
  return `${d.slice(0, 4)} •••• ${d.slice(8)}`;
};

// ───────────────────────── Generic ─────────────────────────

export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export const validatePassword = (value: string): string | undefined => {
  if (value.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number.';
  return undefined;
};
