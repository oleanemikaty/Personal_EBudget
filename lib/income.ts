import type {
  IncomeCategory,
  IncomeAccount,
  RecurringFrequency,
} from './types';

export const DEFAULT_INCOME_CATEGORIES: Omit<IncomeCategory, 'id' | 'createdAt'>[] = [
  { name: 'Salary', icon: '💼', color: 'emerald', isCustom: false },
  { name: 'Bonus', icon: '🎁', color: 'amber', isCustom: false },
  { name: 'Freelance', icon: '💻', color: 'blue', isCustom: false },
  { name: 'Business', icon: '🏪', color: 'cyan', isCustom: false },
  { name: 'Investment', icon: '📈', color: 'teal', isCustom: false },
  { name: 'Gift', icon: '🎀', color: 'pink', isCustom: false },
  { name: 'Allowance', icon: '🧧', color: 'rose', isCustom: false },
  { name: 'Other Income', icon: '💰', color: 'slate', isCustom: false },
];

export const DEFAULT_INCOME_ACCOUNTS: Omit<IncomeAccount, 'id' | 'createdAt'>[] = [
  { name: 'BCA', icon: '🏦', isCustom: false },
  { name: 'Mandiri', icon: '🏦', isCustom: false },
  { name: 'BNI', icon: '🏦', isCustom: false },
  { name: 'Cash', icon: '💵', isCustom: false },
  { name: 'GoPay', icon: '📱', isCustom: false },
  { name: 'OVO', icon: '📱', isCustom: false },
  { name: 'DANA', icon: '📱', isCustom: false },
  { name: 'Other', icon: '💳', isCustom: false },
];

export const INCOME_SOURCE_SUGGESTIONS = [
  'Main Salary',
  'Part-time Job',
  'Freelance Client',
  'Family',
  'Investment',
  'Other',
];

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function getCategoryColor(name: string): string {
  const map: Record<string, string> = {
    Salary: '#10b981',
    Bonus: '#f59e0b',
    Freelance: '#3b82f6',
    Business: '#06b6d4',
    Investment: '#14b8a6',
    Gift: '#ec4899',
    Allowance: '#f43f5e',
    'Other Income': '#64748b',
  };
  return map[name] || '#64748b';
}

export interface IncomeSummary {
  total: number;
  count: number;
  average: number;
  highest: number;
}

export function computeIncomeSummary(incomes: { amount: number }[]): IncomeSummary {
  if (incomes.length === 0) {
    return { total: 0, count: 0, average: 0, highest: 0 };
  }
  const total = incomes.reduce((s, i) => s + i.amount, 0);
  const highest = Math.max(...incomes.map((i) => i.amount));
  return {
    total,
    count: incomes.length,
    average: Math.round(total / incomes.length),
    highest,
  };
}

export interface IncomeBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export function computeIncomeBreakdown(
  incomes: { amount: number; category: string }[]
): IncomeBreakdownItem[] {
  const total = incomes.reduce((s, i) => s + i.amount, 0);
  if (total === 0) return [];
  const byCategory: Record<string, number> = {};
  for (const inc of incomes) {
    byCategory[inc.category] = (byCategory[inc.category] || 0) + inc.amount;
  }
  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / total) * 100),
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.amount - a.amount);
}
