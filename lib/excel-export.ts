import {
  listGroups,
  listSubBudgetsByMonth,
  listTransactions,
  listIncomes,
} from './data';
import { formatCurrency, monthLabel, excelFileName } from './format';
import type { BudgetGroup, SubBudget, Transaction, IncomeEntry } from './types';

export async function exportToExcel(monthKeyStr: string): Promise<void> {
  const XLSX = await import('xlsx');
  const [groups, subBudgets, transactions, incomes] = await Promise.all([
    listGroups(monthKeyStr),
    listSubBudgetsByMonth(monthKeyStr),
    listTransactions(monthKeyStr),
    listIncomes(monthKeyStr),
  ]);

  const symbol = 'Rp';

  // Compute spending maps
  const groupSpending: Record<string, number> = {};
  const subSpending: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      if (t.groupId) groupSpending[t.groupId] = (groupSpending[t.groupId] || 0) + t.amount;
      if (t.subBudgetId) subSpending[t.subBudgetId] = (subSpending[t.subBudgetId] || 0) + t.amount;
    }
  }

  // Sheet 1: Budget Groups
  const groupRows = groups.map((g: BudgetGroup) => {
    const subs = subBudgets.filter((s: SubBudget) => s.groupId === g.id);
    const budget = subs.reduce((sum, s) => sum + s.budget, 0);
    const used = groupSpending[g.id] || 0;
    return {
      Name: g.name,
      Budget: formatCurrency(budget, symbol),
      Used: formatCurrency(used, symbol),
      Remaining: formatCurrency(budget - used, symbol),
    };
  });

  // Sheet 2: Sub Budgets
  const subRows = subBudgets.map((s: SubBudget) => {
    const group = groups.find((g) => g.id === s.groupId);
    const used = subSpending[s.id] || 0;
    return {
      'Budget Group': group?.name || '',
      Name: s.name,
      Budget: formatCurrency(s.budget, symbol),
      Used: formatCurrency(used, symbol),
      Remaining: formatCurrency(s.budget - used, symbol),
    };
  });

  // Sheet 3: Transactions
  const txRows = transactions.map((t: Transaction) => {
    const group = groups.find((g) => g.id === t.groupId);
    const sub = subBudgets.find((s) => s.id === t.subBudgetId);
    return {
      Date: t.date,
      'Budget Group': group?.name || '',
      'Sub Budget': sub?.name || '',
      Amount: formatCurrency(t.amount, symbol),
      'Payment Method': t.paymentMethod,
      Notes: t.notes || '',
    };
  });

  // Sheet 4: Monthly Summary
  const totalIncome = incomes.reduce((s: number, i: IncomeEntry) => s + i.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s: number, t: Transaction) => s + t.amount, 0);
  const totalSavings = totalIncome - totalExpense;
  const remainingBalance = totalSavings;

  const sortedGroups = groups
    .map((g) => ({
      name: g.name,
      used: groupSpending[g.id] || 0,
    }))
    .filter((g) => g.used > 0)
    .sort((a, b) => b.used - a.used);

  const largestCategory = sortedGroups[0]?.name || '-';
  const smallestCategory = sortedGroups[sortedGroups.length - 1]?.name || '-';

  const summaryRows = [
    { Metric: 'Total Income', Value: formatCurrency(totalIncome, symbol) },
    { Metric: 'Total Expense', Value: formatCurrency(totalExpense, symbol) },
    { Metric: 'Total Savings', Value: formatCurrency(totalSavings, symbol) },
    { Metric: 'Remaining Balance', Value: formatCurrency(remainingBalance, symbol) },
    { Metric: 'Largest Spending Category', Value: largestCategory },
    { Metric: 'Smallest Spending Category', Value: smallestCategory },
  ];

  // Sheet 5: Income Details
  const incomeRows = incomes.map((i: IncomeEntry) => ({
    Date: i.date,
    Amount: formatCurrency(i.amount, symbol),
    Source: i.source || '',
    Category: i.category || '',
    'Payment Method': i.account || '',
    Notes: i.notes || '',
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(groupRows);
  const ws2 = XLSX.utils.json_to_sheet(subRows);
  const ws3 = XLSX.utils.json_to_sheet(txRows);
  const ws4 = XLSX.utils.json_to_sheet(summaryRows);
  const ws5 = XLSX.utils.json_to_sheet(incomeRows);

  // Set column widths
  ws1['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  ws2['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  ws3['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 30 }];
  ws4['!cols'] = [{ wch: 30 }, { wch: 25 }];
  ws5['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(wb, ws1, 'Budget Groups');
  XLSX.utils.book_append_sheet(wb, ws2, 'Sub Budgets');
  XLSX.utils.book_append_sheet(wb, ws3, 'Transactions');
  XLSX.utils.book_append_sheet(wb, ws4, 'Monthly Summary');
  XLSX.utils.book_append_sheet(wb, ws5, 'Income Details');

  const fileName = excelFileName(monthKeyStr);
  XLSX.writeFile(wb, fileName);
}

export async function exportIncomeToExcel(monthKeyStr: string): Promise<void> {
  const XLSX = await import('xlsx');
  const incomes = await listIncomes(monthKeyStr);
  const symbol = 'Rp';

  const incomeRows = incomes.map((i: IncomeEntry) => ({
    Date: i.date,
    Amount: formatCurrency(i.amount, symbol),
    Source: i.source || '',
    Category: i.category || '',
    'Payment Method': i.account || '',
    Notes: i.notes || '',
  }));

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const summaryRows = [
    { Metric: 'Total Income', Value: formatCurrency(totalIncome, symbol) },
    { Metric: 'Number of Records', Value: String(incomes.length) },
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(incomeRows);
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws1['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 30 }];
  ws2['!cols'] = [{ wch: 25 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, ws1, 'Income Details');
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  const label = monthLabel(monthKeyStr);
  const parts = label.split(' ');
  const monthName = parts[0] || 'Month';
  const year = parts[1] || String(new Date().getFullYear());
  XLSX.writeFile(wb, `Income_Report_${monthName}_${year}.xlsx`);
}
