'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { getTemplate, listGroups, listSubBudgetsByMonth } from '@/lib/data';
import type { BudgetGroup, BudgetMonth, SubBudget } from '@/lib/types';

export interface MonthlyTemplateState {
  month: BudgetMonth | undefined;
  groups: BudgetGroup[];
  subBudgets: SubBudget[];
  totalBudget: number;
  updatedAt: number | undefined;
}

export function useMonthlyTemplate(): MonthlyTemplateState | undefined {
  return useLiveQuery(async () => {
    if (typeof window === 'undefined') return undefined;
    const month = await getTemplate();
    if (!month) return { month, groups: [], subBudgets: [], totalBudget: 0, updatedAt: undefined };
    const groups = await listGroups('template');
    const subBudgets = await listSubBudgetsByMonth('template');
    return {
      month,
      groups,
      subBudgets,
      totalBudget: subBudgets.reduce((sum, item) => sum + item.budget, 0),
      updatedAt: month.updatedAt ?? month.createdAt,
    };
  }, [], undefined);
}
