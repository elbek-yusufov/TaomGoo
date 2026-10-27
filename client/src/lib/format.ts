/**
 * Formatting utilities for TaomGo (Uzbek Latin and Asia/Tashkent standards)
 */

const uzCurrencyFormatter = new Intl.NumberFormat('uz-UZ', {
  style: 'decimal',
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === undefined || num === null || isNaN(num)) {
    return "0 so'm";
  }
  return `${uzCurrencyFormatter.format(Math.round(num))} so'm`;
}

export function formatDate(dateString?: string | Date): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatTime(dateString?: string | Date): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDateTime(dateString?: string | Date): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Formats a raw phone string into +998 XX XXX XX XX
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const clean = digits.startsWith('998') ? digits.slice(3) : digits;
  const part1 = clean.slice(0, 2);
  const part2 = clean.slice(2, 5);
  const part3 = clean.slice(5, 7);
  const part4 = clean.slice(7, 9);

  let formatted = '+998';
  if (part1) formatted += ` ${part1}`;
  if (part2) formatted += ` ${part2}`;
  if (part3) formatted += ` ${part3}`;
  if (part4) formatted += ` ${part4}`;
  return formatted;
}

/**
 * Calculates elapsed time for an order in the kitchen and returns alert levels:
 * - normal (< 5 mins)
 * - warning (>= 5 mins, yellow)
 * - danger (>= 10 mins, red pulse)
 */
export function getOrderElapsedTime(createdAt: string): {
  text: string;
  minutes: number;
  isWarning: boolean;
  isDanger: boolean;
} {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - created);
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const text = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return {
    text,
    minutes,
    isWarning: minutes >= 5 && minutes < 10,
    isDanger: minutes >= 10,
  };
}
