'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMonth } from '@/hooks/use-month';
import {
  useGroups,
  useSubBudgetsByMonth,
  useTransactions,
  useIncomes,
} from '@/hooks/use-data';
import { useSettings } from '@/hooks/use-settings';
import {
  exportAllData,
  listMonths,
  listTransactions,
  listIncomes,
} from '@/lib/data';
import { exportToExcel } from '@/lib/excel-export';
import { getCurrencySymbol, formatCurrency, formatCompact, monthLabel, shortMonthLabel, previousMonthKey } from '@/lib/format';
import { getColor } from '@/lib/colors';
import { computeSummary } from '@/lib/budget';
import { PageHeader } from '@/components/page-header';
import { MonthSelector } from '@/components/month-selector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Download,
  Sparkles,
  Award,
  AlertCircle,
  Lightbulb,
  FileSpreadsheet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction, IncomeEntry } from '@/lib/types';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function ReportsPage() {
  const { currentMonth } = useMonth();
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);
  const groups = useGroups(currentMonth);
  const subBudgets = useSubBudgetsByMonth(currentMonth);
  const transactions = useTransactions(currentMonth);
  const incomes = useIncomes(currentMonth);

  const [period, setPeriod] = useState<Period>('monthly');

  const report = useMemo(() => {
    if (!groups || !subBudgets || !transactions || !incomes) return null;

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const remaining = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;

    const groupSpending: Record<string, number> = {};
    const subSpending: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense') {
        if (t.groupId) groupSpending[t.groupId] = (groupSpending[t.groupId] || 0) + t.amount;
        if (t.subBudgetId) subSpending[t.subBudgetId] = (subSpending[t.subBudgetId] || 0) + t.amount;
      }
    }

    const groupData = groups
      .map((g) => {
        const subs = subBudgets.filter((s) => s.groupId === g.id);
        const budget = subs.reduce((sum, s) => sum + s.budget, 0);
        const used = groupSpending[g.id] || 0;
        return {
          id: g.id,
          name: g.name,
          icon: g.icon,
          color: getColor(g.color).hex,
          budget,
          used,
          summary: computeSummary(budget, used),
        };
      })
      .filter((d) => d.budget > 0 || d.used > 0);

    const subData = subBudgets
      .map((s) => {
        const group = groups.find((g) => g.id === s.groupId);
        return {
          name: s.name,
          value: subSpending[s.id] || 0,
          color: getColor(group?.color || 'slate').hex,
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    const budgetSuccess = groupData.filter((g) => g.summary.status === 'normal').length;
    const budgetTotal = groupData.length;
    const budgetSuccessRate = budgetTotal > 0 ? (budgetSuccess / budgetTotal) * 100 : 100;

    const sortedBySpending = [...groupData].sort((a, b) => b.used - a.used);
    const largestCategory = sortedBySpending[0];
    const smallestCategory = [...sortedBySpending].filter((g) => g.used > 0).pop();

    const insights: { icon: string; text: string; type: 'success' | 'info' | 'warning' }[] = [];
    if (savingsRate > 0) {
      insights.push({
        icon: '💰',
        text: `You successfully saved ${savingsRate.toFixed(0)}% of your income.`,
        type: 'success',
      });
    }
    if (largestCategory && largestCategory.used > 0) {
      insights.push({
        icon: largestCategory.icon,
        text: `${largestCategory.name} was your largest spending category at ${formatCurrency(largestCategory.used, symbol)}.`,
        type: 'info',
      });
    }
    const exceeded = groupData.filter((g) => g.summary.status === 'exceeded');
    if (exceeded.length > 0) {
      insights.push({
        icon: '⚠️',
        text: `${exceeded.length} budget ${exceeded.length === 1 ? 'group was' : 'groups were'} exceeded this month.`,
        type: 'warning',
      });
    }
    const onTrack = groupData.filter((g) => g.summary.status === 'normal' && g.budget > 0);
    if (onTrack.length > 0) {
      insights.push({
        icon: '✅',
        text: `${onTrack.length} ${onTrack.length === 1 ? 'budget stayed' : 'budgets stayed'} within limit.`,
        type: 'success',
      });
    }

    return {
      totalIncome,
      totalExpense,
      remaining,
      savingsRate,
      groupData,
      subData,
      budgetSuccessRate,
      largestCategory,
      smallestCategory,
      insights,
    };
  }, [groups, subBudgets, transactions, incomes, symbol]);

  // Previous month comparison
  const [prevData, setPrevData] = useState<{ income: number; expense: number } | null>(null);

  useEffect(() => {
    if (!currentMonth || typeof window === 'undefined') return;
    const prevKey = previousMonthKey(currentMonth);
    Promise.all([listTransactions(prevKey), listIncomes(prevKey)]).then(([prevTxns, prevInc]) => {
      const income = prevInc.reduce((s, i) => s + i.amount, 0);
      const expense = prevTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      setPrevData({ income, expense });
    });
  }, [currentMonth]);

  const handleExport = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(currentMonth);
      toast.success('Excel report exported');
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return (
      <div>
        <PageHeader title="Reports" right={<MonthSelector />} />
        <div className="px-5">
          <div className="glass-card h-40 animate-pulse" />
        </div>
      </div>
    );
  }

  const expenseTrend = prevData ? ((report.totalExpense - prevData.expense) / (prevData.expense || 1)) * 100 : 0;
  const incomeTrend = prevData ? ((report.totalIncome - prevData.income) / (prevData.income || 1)) * 100 : 0;

  return (
    <div className="pb-4">
      <PageHeader
        title="Reports"
        subtitle={monthLabel(currentMonth)}
        right={<MonthSelector />}
      />

      <div className="px-5">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="w-full">
            <TabsTrigger value="daily" className="flex-1">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="flex-1">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-3 px-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <p className="mt-2 text-lg font-bold">{formatCurrency(report.totalIncome, symbol)}</p>
          {prevData && prevData.income > 0 && (
            <p className={cn('text-xs', incomeTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {incomeTrend >= 0 ? '+' : ''}{incomeTrend.toFixed(0)}% vs last month
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-muted-foreground">Expense</span>
          </div>
          <p className="mt-2 text-lg font-bold">{formatCurrency(report.totalExpense, symbol)}</p>
          {prevData && prevData.expense > 0 && (
            <p className={cn('text-xs', expenseTrend <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {expenseTrend >= 0 ? '+' : ''}{expenseTrend.toFixed(0)}% vs last month
            </p>
          )}
        </motion.div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 px-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <PiggyBank className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Remaining</span>
          </div>
          <p className="mt-2 text-lg font-bold">{formatCurrency(report.remaining, symbol)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs text-muted-foreground">Budget Success</span>
          </div>
          <p className="mt-2 text-lg font-bold">{report.budgetSuccessRate.toFixed(0)}%</p>
        </motion.div>
      </div>

      {/* Spending by Group Pie */}
      {report.groupData.some((g) => g.used > 0) && (
        <div className="mt-4 px-5">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Spending by Budget Group</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.groupData.filter((g) => g.used > 0).map((g) => ({ name: g.name, value: g.used, color: g.color }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {report.groupData.filter((g) => g.used > 0).map((g) => (
                      <Cell key={g.id} fill={g.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, symbol)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Budget Performance Bar Chart */}
      {report.groupData.length > 0 && (
        <div className="mt-4 px-5">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Budget Performance</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.groupData.map((g) => ({ name: g.name, Budget: g.budget, Spent: g.used }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => formatCompact(v, symbol)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, symbol)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--popover))',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Budget" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Review */}
      <div className="mt-4 px-5">
        <div className="glass-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Monthly Review</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Savings Rate</span>
              <span className="font-semibold">{report.savingsRate.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Success Rate</span>
              <span className="font-semibold">{report.budgetSuccessRate.toFixed(0)}%</span>
            </div>
            {report.largestCategory && report.largestCategory.used > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Largest Category</span>
                <span className="font-semibold">
                  {report.largestCategory.icon} {report.largestCategory.name}
                </span>
              </div>
            )}
            {report.smallestCategory && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Smallest Category</span>
                <span className="font-semibold">
                  {report.smallestCategory.icon} {report.smallestCategory.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      {report.insights.length > 0 && (
        <div className="mt-4 space-y-2 px-5">
          {report.insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'glass-card flex items-start gap-3 p-3',
                insight.type === 'success' && 'border-l-2 border-l-emerald-500',
                insight.type === 'warning' && 'border-l-2 border-l-amber-500',
                insight.type === 'info' && 'border-l-2 border-l-primary'
              )}
            >
              <span className="text-lg">{insight.icon}</span>
              <p className="flex-1 text-sm">{insight.text}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Export */}
      <div className="mt-6 px-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
