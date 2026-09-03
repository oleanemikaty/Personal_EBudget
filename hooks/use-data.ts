'use client';

import { useLiveQuery } from '@/hooks/use-live-query';
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
  return useLiveQuery<BudgetGroup[]>(
    () => (typeof window === 'undefined' || !monthId ? undefined : listGroups(monthId)),
    [monthId],
    undefined
  );
}

export function useSubBudgetsByMonth(monthId: string): SubBudget[] | undefined {
  return useLiveQuery<SubBudget[]>(
    () => (typeof window === 'undefined' || !monthId ? undefined : listSubBudgetsByMonth(monthId)),
    [monthId],
    undefined
  );
}

export function useTransactions(monthId: string): Transaction[] | undefined {
  return useLiveQuery<Transaction[]>(
    () => (typeof window === 'undefined' || !monthId ? undefined : listTransactions(monthId)),
    [monthId],
    undefined
  );
}

export function useIncomes(monthId: string): IncomeEntry[] | undefined {
  return useLiveQuery<IncomeEntry[]>(
    () => (typeof window === 'undefined' || !monthId ? undefined : listIncomes(monthId)),
    [monthId],
    undefined
  );
}

export function useGoals(): SavingsGoal[] | undefined {
  return useLiveQuery<SavingsGoal[]>(
    () => (typeof window === 'undefined' ? undefined : listGoals()),
    [],
    undefined
  );
}

export function useRecurringIncomes(): RecurringIncome[] | undefined {
  return useLiveQuery<RecurringIncome[]>(
    () => (typeof window === 'undefined' ? undefined : listRecurringIncomes()),
    [],
    undefined
  );
}

export function useIncomeCategories(): IncomeCategory[] | undefined {
  return useLiveQuery<IncomeCategory[]>(
    () => (typeof window === 'undefined' ? undefined : listIncomeCategories()),
    [],
    undefined
  );
}

export function useIncomeAccounts(): IncomeAccount[] | undefined {
  return useLiveQuery<IncomeAccount[]>(
    () => (typeof window === 'undefined' ? undefined : listIncomeAccounts()),
    [],
    undefined
  );
}

export function useMonthCount(): number {
  const count = useLiveQuery<number>(
    async (db) => {
      if (typeof window === 'undefined') return 0;
      return db.months.count();
    },
    [],
    0
  );
  return count ?? 0;
}
