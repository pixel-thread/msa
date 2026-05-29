export interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const formatCurrency = (
  amount: number | string,
  {
    currency = 'INR',
    locale,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  }: FormatCurrencyOptions = {},
) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number(amount));

export const formatOrderId = (orderId: string) => `#${orderId.trim().slice(-6).toUpperCase()}`;

export const formatOrderNumber = (orderId: string) => `#${orderId.trim().slice(-6).toUpperCase()}`;

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return formatter.format(d);
};

export const formattedAmount = (amount: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};
