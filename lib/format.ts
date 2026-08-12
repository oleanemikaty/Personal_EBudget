export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'IDR', symbol: 'Rp', label: 'Indonesian Rupiah' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'KRW', symbol: '₩', label: 'Korean Won' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || 'Rp';
}

// Format a number using Indonesian locale: thousand separator ".", no decimals
export function formatCurrency(amount: number, symbol = 'Rp'): string {
  const formatted = Math.abs(amount).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

export function formatCompact(amount: number, symbol = 'Rp'): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(1)}rb`;
  return formatCurrency(amount, symbol);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

// Format a raw number string with Indonesian thousand separators (".")
// e.g. "1500000" -> "1.500.000"
export function formatNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('id-ID');
}

// Parse a formatted string back to a number
// e.g. "1.500.000" -> 1500000
export function parseFormattedNumber(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0;
}

export function monthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export function shortMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'short' });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDaysInMonth(key: string): number {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function previousMonthKey(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return monthKey(date);
}

export function nextMonthKey(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month, 1);
  return monthKey(date);
}

// Generate Excel filename: Budget_Report_August_2026.xlsx
export function excelFileName(monthKeyStr: string): string {
  const label = monthLabel(monthKeyStr);
  // monthLabel returns e.g. "Agustus 2026" in id-ID
  const parts = label.split(' ');
  const monthName = parts[0] || 'Month';
  const year = parts[1] || String(new Date().getFullYear());
  return `Budget_Report_${monthName}_${year}.xlsx`;
}
