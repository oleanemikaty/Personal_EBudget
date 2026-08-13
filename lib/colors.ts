export interface ColorOption {
  key: string;
  label: string;
  bg: string;
  text: string;
  bar: string;
  ring: string;
  solid: string;
  dot: string;
  hex: string;
}

export const COLORS: ColorOption[] = [
  { key: 'red', label: 'Red', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', ring: 'ring-red-500/20', solid: 'bg-red-500', dot: 'bg-red-500', hex: '#ef4444' },
  { key: 'orange', label: 'Orange', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500', ring: 'ring-orange-500/20', solid: 'bg-orange-500', dot: 'bg-orange-500', hex: '#f97316' },
  { key: 'amber', label: 'Amber', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', ring: 'ring-amber-500/20', solid: 'bg-amber-500', dot: 'bg-amber-500', hex: '#f59e0b' },
  { key: 'yellow', label: 'Yellow', bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-500', ring: 'ring-yellow-500/20', solid: 'bg-yellow-500', dot: 'bg-yellow-500', hex: '#eab308' },
  { key: 'lime', label: 'Lime', bg: 'bg-lime-500/10', text: 'text-lime-600 dark:text-lime-400', bar: 'bg-lime-500', ring: 'ring-lime-500/20', solid: 'bg-lime-500', dot: 'bg-lime-500', hex: '#84cc16' },
  { key: 'green', label: 'Green', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500', ring: 'ring-green-500/20', solid: 'bg-green-500', dot: 'bg-green-500', hex: '#22c55e' },
  { key: 'emerald', label: 'Emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', ring: 'ring-emerald-500/20', solid: 'bg-emerald-500', dot: 'bg-emerald-500', hex: '#10b981' },
  { key: 'teal', label: 'Teal', bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500', ring: 'ring-teal-500/20', solid: 'bg-teal-500', dot: 'bg-teal-500', hex: '#14b8a6' },
  { key: 'cyan', label: 'Cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', bar: 'bg-cyan-500', ring: 'ring-cyan-500/20', solid: 'bg-cyan-500', dot: 'bg-cyan-500', hex: '#06b6d4' },
  { key: 'sky', label: 'Sky', bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500', ring: 'ring-sky-500/20', solid: 'bg-sky-500', dot: 'bg-sky-500', hex: '#0ea5e9' },
  { key: 'blue', label: 'Blue', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500', ring: 'ring-blue-500/20', solid: 'bg-blue-500', dot: 'bg-blue-500', hex: '#3b82f6' },
  { key: 'indigo', label: 'Indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500', ring: 'ring-indigo-500/20', solid: 'bg-indigo-500', dot: 'bg-indigo-500', hex: '#6366f1' },
  { key: 'violet', label: 'Violet', bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500', ring: 'ring-violet-500/20', solid: 'bg-violet-500', dot: 'bg-violet-500', hex: '#8b5cf6' },
  { key: 'purple', label: 'Purple', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500', ring: 'ring-purple-500/20', solid: 'bg-purple-500', dot: 'bg-purple-500', hex: '#a855f7' },
  { key: 'pink', label: 'Pink', bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500', ring: 'ring-pink-500/20', solid: 'bg-pink-500', dot: 'bg-pink-500', hex: '#ec4899' },
  { key: 'rose', label: 'Rose', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500', ring: 'ring-rose-500/20', solid: 'bg-rose-500', dot: 'bg-rose-500', hex: '#f43f5e' },
  { key: 'brown', label: 'Brown', bg: 'bg-amber-700/10', text: 'text-amber-700 dark:text-amber-500', bar: 'bg-amber-700', ring: 'ring-amber-700/20', solid: 'bg-amber-700', dot: 'bg-amber-700', hex: '#92400e' },
  { key: 'gray', label: 'Gray', bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', bar: 'bg-gray-500', ring: 'ring-gray-500/20', solid: 'bg-gray-500', dot: 'bg-gray-500', hex: '#6b7280' },
  { key: 'slate', label: 'Slate', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', bar: 'bg-slate-500', ring: 'ring-slate-500/20', solid: 'bg-slate-500', dot: 'bg-slate-500', hex: '#64748b' },
  { key: 'black', label: 'Black', bg: 'bg-black/10', text: 'text-black dark:text-white', bar: 'bg-black', ring: 'ring-black/20', solid: 'bg-black', dot: 'bg-black', hex: '#000000' },
];

export const DEFAULT_COLOR = '#3b82f6';

export function normalizeHex(value: string | undefined, fallback = DEFAULT_COLOR): string {
  const raw = (value || '').trim();
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (/^#[0-9a-f]{3}$/i.test(withHash)) {
    return `#${withHash.slice(1).split('').map((c) => c + c).join('')}`.toLowerCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(withHash)) return withHash.toLowerCase();
  return fallback;
}

export function isHexColor(value: string | undefined): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value || '');
}

export function normalizeGroupColor(value: string | undefined): string {
  if (COLORS.some((color) => color.key === value)) return value as string;
  return normalizeHex(value, DEFAULT_COLOR);
}

export function getColor(key: string | undefined): ColorOption {
  const found = COLORS.find((c) => c.key === key);
  if (found) return found;
  const hex = normalizeHex(key);
  return {
    key: hex,
    label: 'Custom',
    bg: '', text: '', bar: '', ring: '', solid: '', dot: '', hex,
  };
}

export function colorStyle(key: string | undefined, type: 'bg' | 'bar' | 'text' | 'solid'): React.CSSProperties {
  const color = getColor(key);
  if (type === 'bg') return { backgroundColor: `${color.hex}1a` };
  if (type === 'text') return { color: color.hex };
  return { backgroundColor: color.hex };
}
