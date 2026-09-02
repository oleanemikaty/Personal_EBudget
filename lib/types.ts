export type TransactionType = 'expense' | 'income';

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'bank'
  | 'ewallet'
  | 'other';

export interface BudgetMonth {
  id: string; // "YYYY-MM" or "template"
  isTemplate: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface BudgetGroup {
  id: string;
  monthId: string;
  name: string;
  icon: string; // emoji
  color: string; // tailwind color key from COLORS
  order: number;
  createdAt: number;
}

export interface SubBudget {
  id: string;
  groupId: string;
  monthId: string;
  name: string;
  icon: string; // emoji
  order: number;
  budget: number; // planned amount
  createdAt: number;
}

export interface Transaction {
  id: string;
  monthId: string;
  type: TransactionType;
  groupId?: string;
  subBudgetId?: string;
  amount: number;
  date: string; // ISO date string
  paymentMethod: PaymentMethod;
  notes: string;
  attachment?: string; // base64 data URL
  createdAt: number;
}

export interface IncomeEntry {
  id: string;
  monthId: string;
  date: string;
  amount: number;
  source: string;
  category: string;
  account: string;
  notes: string;
  recurringId?: string;
  createdAt: number;
  updatedAt: number;
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  category: string;
  source: string;
  account: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  startDate: string;
  enabled: boolean;
  lastGeneratedMonth?: string;
  createdAt: number;
  updatedAt: number;
}

export interface IncomeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom: boolean;
  createdAt: number;
}

export interface IncomeAccount {
  id: string;
  name: string;
  icon: string;
  isCustom: boolean;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  createdAt: number;
}

export interface Setting {
  key: string;
  value: string;
}

export type BudgetStatus = 'normal' | 'warning' | 'danger' | 'exceeded';

export interface BudgetSummary {
  budget: number;
  used: number;
  remaining: number;
  progress: number; // 0-100
  status: BudgetStatus;
}
