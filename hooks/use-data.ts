'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import {
  listGroups,
  listSubBudgetsByMonth,
  listTransactions,
  listIncomes,
  listGoals,
  listRecurringIncomes,
  listIncomeCategories,
  listIncomeAccounts,
} from '@/lib/data';
import type {
  BudgetGroup,
  SubBudget,
  Transaction,
  IncomeEntry,
  SavingsGoal,
  RecurringIncome,
  IncomeCategory,
  IncomeAccount,
} from '@/lib/types';

export function useGroups(monthId: string): BudgetGroup[] | undefined {
  return useLiveQuery(
    async () => (typeof window === 'undefined' || !monthId ? undefined : listGroups(monthId)),
    [monthId],
    undefined
  ) as BudgetGroup[] | undefined;
}

export function useSubBudgetsByMonth(monthId: string): SubBudget[] | undefined {
  return useLiveQuery(
    async () => (typeof window === 'undefined' || !monthId ? undefined : listSubBudgetsByMonth(monthId)),
    [monthId],
    undefined
  ) as SubBudget[] | undefined;
}

export function useTransactions(monthId: string): Transaction[] | undefined {
  return useLiveQuery(
    async () => (typeof window === 'undefined' || !monthId ? undefined : listTransactions(monthId)),
    [monthId],
    undefined
  ) as Transaction[] | undefined;
}

export function useIncomes(monthId: string): IncomeEntry[] | undefined {
  return useLiveQuery(
    async () => {
      if (typeof window === 'undefined' || !monthId) return undefined;
      try {
        return await listIncomes(monthId);
      } catch (error) {
        console.error('[v0] Failed to load incomes:', error);
        return [];
      }
    },
    [monthId],
    undefined
  ) as IncomeEntry[] | undefined;
}

export function useGoals(): SavingsGoal[] | undefined {
  return useLiveQuery(
    async () => (typeof window === 'undefined' ? undefined : listGoals()),
    [],
    undefined
  ) as SavingsGoal[] | undefined;
}

export function useRecurringIncomes(): RecurringIncome[] | undefined {
  return useLiveQuery(
    async () => {
      if (typeof window === 'undefined') return undefined;
      try {
        return await listRecurringIncomes();
      } catch (error) {
        console.error('[v0] Failed to load recurring incomes:', error);
        return [];
      }
    },
    [],
    undefined
  ) as RecurringIncome[] | undefined;
}

export function useIncomeCategories(): IncomeCategory[] | undefined {
  return useLiveQuery(
    async () => {
      if (typeof window === 'undefined') return undefined;
      try {
        return await listIncomeCategories();
      } catch (error) {
        console.error('[v0] Failed to load income categories:', error);
        return [];
      }
    },
    [],
    undefined
  ) as IncomeCategory[] | undefined;
}

export function useIncomeAccounts(): IncomeAccount[] | undefined {
  return useLiveQuery(
    async () => {
      if (typeof window === 'undefined') return undefined;
      try {
        return await listIncomeAccounts();
      } catch (error) {
        console.error('[v0] Failed to load income accounts:', error);
        return [];
      }
    },
    [],
    undefined
  ) as IncomeAccount[] | undefined;
}

export function useMonthCount(): number {
  const count = useLiveQuery(
    async () => {
      if (typeof window === 'undefined') return 0;
      const { getDBAsync } = await import('@/lib/db');
      const db = await getDBAsync();
      return db.months.count();
    },
    [],
    0
  );
  return count ?? 0;
}
