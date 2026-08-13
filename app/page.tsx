'use client';

import { useMemo } from 'react';
import { useMonth } from '@/hooks/use-month';
import { useGroups, useSubBudgetsByMonth, useTransactions, useIncomes } from '@/hooks/use-data';
import { useSettings } from '@/hooks/use-settings';
import { getCurrencySymbol, formatCurrency, formatCompact, monthLabel } from '@/lib/format';
import { SummaryCard } from '@/components/summary-card';
import { BudgetWidget } from '@/components/budget-widget';
import { TransactionItem } from '@/components/transaction-item';
import { PageHeader } from '@/components/page-header';
import { MonthSelector } from '@/components/month-selector';
import { EmptyState } from '@/components/empty-state';
import { computeSummary } from '@/lib/budget';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Receipt, Sparkles, ChevronRight, Plus, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkButton } from '@/components/link-button';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportToExcel } from '@/lib/excel-export';
import { getColor } from '@/lib/colors';

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#84cc16', '#ec4899', '#0ea5e9', '#f97316'];

export default function DashboardPage() {
  const { currentMonth, ready } = useMonth();
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);

  const groups = useGroups(currentMonth);
  const subBudgets = useSubBudgetsByMonth(currentMonth);
  const transactions = useTransactions(currentMonth);
  const incomes = useIncomes(currentMonth);

  const isLoading = !ready || !currentMonth || !groups || !subBudgets || !transactions || !incomes;

  const data = useMemo(() => {
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
      if (t.type === 'expense' && t.groupId) {
        groupSpending[t.groupId] = (groupSpending[t.groupId] || 0) + t.amount;
        if (t.subBudgetId) {
          subSpending[t.subBudgetId] = (subSpending[t.subBudgetId] || 0) + t.amount;
        }
      }
    }

    const dailyMap: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense') {
        dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;
      }
    }
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
      return {
        day: String(day),
        amount: dailyMap[dateStr] || 0,
      };
    });

    const pieData = groups.map((g) => ({
      id: g.id,
      name: g.name,
      value: groupSpending[g.id] || 0,
      color: getColor(g.color).hex,
    })).filter((d) => d.value > 0);

    const subPieData = subBudgets.map((s) => ({
      name: s.name,
      value: subSpending[s.id] || 0,
    })).filter((d) => d.value > 0);

    const groupBudgets = groups.map((g) => {
      const groupSubs = subBudgets.filter((s) => s.groupId === g.id);
      const budget = groupSubs.reduce((sum, s) => sum + s.budget, 0);
      const used = groupSpending[g.id] || 0;
      return { group: g, summary: computeSummary(budget, used) };
    });

    return {
      totalIncome,
      totalExpense,
      remaining,
      savingsRate,
      pieData,
      subPieData,
      dailyData,
      groupBudgets,
    };
  }, [groups, subBudgets, transactions, incomes, currentMonth]);

  if (isLoading) {
    return (
      <div className="space-y-4 px-5 pt-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data || (groups!.length === 0 && transactions!.length === 0)) {
    return (
      <div>
        <PageHeader title="Dashboard" right={<MonthSelector />} />
        <EmptyState
          icon={Sparkles}
          title="Welcome to your budget"
          description="Start by creating budget groups and adding your first transaction."
          action={
            <div className="flex gap-2">
              <LinkButton href="/budgets" size="sm">
                Create Budget
              </LinkButton>
              <LinkButton href="/quick-add" size="sm" variant="outline">
                Add Transaction
              </LinkButton>
            </div>
          }
        />
      </div>
    );
  }

  const recentTransactions = [...transactions!]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="pb-4">
      <PageHeader
        title="Dashboard"
        right={<MonthSelector />}
      />

      {/* Balance Hero */}
      <div className="px-5">
        <div className="glass-card relative overflow-hidden p-5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {formatCurrency(data.remaining, symbol)}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Income</p>
                  <p className="text-xs font-semibold">
                    {formatCurrency(data.totalIncome, symbol)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
                  <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Expense</p>
                  <p className="text-xs font-semibold">
                    {formatCurrency(data.totalExpense, symbol)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <PiggyBank className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Saved</p>
                  <p className="text-xs font-semibold">
                    {data.savingsRate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 px-5">
        <SummaryCard
          label="Monthly Income"
          value={formatCurrency(data.totalIncome, symbol)}
          icon={TrendingUp}
          accent="success"
          delay={0.05}
        />
        <SummaryCard
          label="Monthly Expense"
          value={formatCurrency(data.totalExpense, symbol)}
          icon={TrendingDown}
          accent="destructive"
          delay={0.1}
        />
      </div>

      {/* Charts */}
      {data.pieData.length > 0 && (
        <div className="mt-4 px-5">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Spending by Budget Group</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data.pieData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
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
            <div className="mt-3 flex flex-wrap gap-2">
              {data.pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data.dailyData.some((d) => d.amount > 0) && (
        <div className="mt-4 px-5">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Daily Spending</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={4} />
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
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Budget Widgets */}
      <div className="mt-4 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Budgets</h3>
          <LinkButton href="/budgets" variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </LinkButton>
        </div>
        <div className="space-y-3">
          {data.groupBudgets.map((gb, i) => (
            <BudgetWidget
              key={gb.group.id}
              name={gb.group.name}
              icon={gb.group.icon}
              color={gb.group.color}
              budget={gb.summary.budget}
              used={gb.summary.used}
              symbol={symbol}
              delay={i * 0.05}
            />
          ))}
          <LinkButton
            href="/budgets"
            variant="outline"
            size="sm"
            className="w-full gap-2 border-dashed text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Budget Group
          </LinkButton>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
            onClick={async () => {
              try {
                await exportToExcel(currentMonth);
                toast.success('Excel report exported');
              } catch {
                toast.error('Failed to export Excel');
              }
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between px-5">
          <h3 className="text-sm font-semibold">Recent Transactions</h3>
          <LinkButton href="/transactions" variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </LinkButton>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="glass-card mx-5 overflow-hidden">
            {recentTransactions.map((t, i) => {
              const group = groups!.find((g) => g.id === t.groupId);
              const sub = subBudgets!.find((s) => s.id === t.subBudgetId);
              return (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  group={group}
                  subBudget={sub}
                  symbol={symbol}
                  index={i}
                />
              );
            })}
          </div>
        ) : (
          <div className="px-5">
            <div className="glass-card">
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Tap the + button to add your first expense."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
