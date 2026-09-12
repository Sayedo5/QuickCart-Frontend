const withThousands = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Overridden from the backend's app settings so an admin can change the currency. */
let currencySymbol = 'Rs';
export const setCurrencySymbol = (symbol: string) => {
  if (symbol && symbol.trim()) currencySymbol = symbol.trim();
};

/** Formats PKR amounts the way Pakistani apps show them: "Rs 1,250" (no decimals). */
export const formatCurrency = (value: number): string => {
  const rounded = Math.round(Math.abs(value));
  return `${value < 0 ? '-' : ''}${currencySymbol} ${withThousands(rounded)}`;
};

export const formatCountdown = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatTime = (iso: string): string => {
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const formatDateLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  const year = d.getFullYear() === today.getFullYear() ? '' : `, ${d.getFullYear()}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
};

export const formatDateTime = (iso: string): string => `${formatDateLabel(iso)} · ${formatTime(iso)}`;

export const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;

export const generateId = (prefix = 'id'): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const maskCard = (last4: string): string => `•••• •••• •••• ${last4}`;

/** Formats a Pakistani mobile number as "3XX XXXXXXX". */
export const formatPkPhone = (digits: string): string => {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)} ${d.slice(3)}`;
};
