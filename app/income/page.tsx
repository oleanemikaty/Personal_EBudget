'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMonth } from '@/hooks/use-month';
import { useIncomes, useRecurringIncomes } from '@/hooks/use-data';
import { useSettings } from '@/hooks/use-settings';
import { deleteIncome, updateRecurringIncome, processRecurringIncomes } from '@/lib/data';
import { exportIncomeToExcel } from '@/lib/excel-export';
import {
  getCurrencySymbol,
  formatCurrency,
  formatDate,
  monthLabel,
  previousMonthKey,
  nextMonthKey,
} from '@/lib/format';
import {
  computeIncomeSummary,
  computeIncomeBreakdown,
  getCategoryColor,
  FREQUENCY_LABELS,
} from '@/lib/income';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { IncomeFormDialog } from '@/components/income-form-dialog';
import {
  RecurringIncomeDialog,
  RecurringIncomeList,
} from '@/components/recurring-income-dialog';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  Plus,
  Repeat,
  Search,
  Pencil,
  Trash2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { IncomeEntry, RecurringIncome } from '@/lib/types';

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | 'today' | 'week' | 'month' | 'lastmonth';

export default function IncomePage() {
  const { currentMonth, setCurrentMonth, ready } = useMonth();
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);
  const incomes = useIncomes(currentMonth);
  const recurringIncomes = useRecurringIncomes();

  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [showRecurring, setShowRecurring] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringIncome | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Process recurring incomes when month changes
  useEffect(() => {
    if (currentMonth && ready) {
      processRecurringIncomes(currentMonth).catch(() => {
        // Ignore — recurring processing is best-effort
      });
    }
  }, [currentMonth, ready]);

  const summary = useMemo(() => {
    if (!incomes) return { total: 0, count: 0, average: 0, highest: 0 };
    return computeIncomeSummary(incomes);
  }, [incomes]);

  const breakdown = useMemo(() => {
    if (!incomes) return [];
    return computeIncomeBreakdown(incomes);
  }, [incomes]);

  const filteredIncomes = useMemo(() => {
    if (!incomes) return [];
    let result = [...incomes];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.source?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.account?.toLowerCase().includes(q) ||
          i.notes?.toLowerCase().includes(q)
      );
    }

    // Filter by date
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const thisMonth = currentMonth || '';
    const lastMonth = currentMonth ? previousMonthKey(currentMonth) : '';

    if (filterBy === 'today') {
      result = result.filter((i) => i.date === today);
    } else if (filterBy === 'week') {
      result = result.filter((i) => i.date >= startOfWeekStr && i.date <= today);
    } else if (filterBy === 'month') {
      result = result.filter((i) => i.monthId === thisMonth);
    } else if (filterBy === 'lastmonth') {
      result = result.filter((i) => i.monthId === lastMonth);
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    } else if (sortBy === 'highest') {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.amount - b.amount);
    }

    return result;
  }, [incomes, search, sortBy, filterBy, currentMonth]);

  const handleEdit = (income: IncomeEntry) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingIncome(null);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteIncome(deleteId);
      toast.success('Income deleted');
    } catch {
      toast.error('Failed to delete income');
    }
    setDeleteId(null);
  };

  const handleRecurringToggle = async (id: string, enabled: boolean) => {
    try {
      await updateRecurringIncome(id, { enabled });
      toast.success(enabled ? 'Recurring income enabled' : 'Recurring income disabled');
    } catch {
      toast.error('Failed to update recurring income');
    }
  };

  const handleEditRecurring = (r: RecurringIncome) => {
    setEditingRecurring(r);
    setShowRecurring(true);
  };

  const handleNewRecurring = () => {
    setEditingRecurring(null);
    setShowRecurring(true);
  };

  const handleExportExcel = async () => {
    if (!currentMonth) return;
    try {
      await exportIncomeToExcel(currentMonth);
      toast.success('Income report exported');
    } catch {
      toast.error('Failed to export income report');
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth) setCurrentMonth(previousMonthKey(currentMonth));
  };

  const handleNextMonth = () => {
    if (currentMonth) setCurrentMonth(nextMonthKey(currentMonth));
  };

  const isLoading = !ready || !currentMonth || !incomes;

  if (isLoading) {
    return (
      <div className="space-y-4 px-5 pt-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-28 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-48 w-full animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const enabledRecurring = recurringIncomes?.filter((r) => r.enabled) || [];

  return (
    <div className="pb-4">
      <PageHeader
        title="Income"
        subtitle="Manage your income records"
        right={
          <Button size="sm" onClick={handleAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
      />

      {/* Month Navigator */}
      <div className="px-5">
        <div className="glass-card flex items-center justify-between p-3">
          <button
            onClick={handlePrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">{monthLabel(currentMonth)}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.total, symbol)} total
            </p>
          </div>
          <button
            onClick={handleNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 px-5">
        <SummaryCard
          label="Total Income"
          value={formatCurrency(summary.total, symbol)}
          icon={TrendingUp}
          accent="success"
          delay={0.05}
        />
        <SummaryCard
          label="Records"
          value={String(summary.count)}
          icon={Calendar}
          accent="primary"
          delay={0.1}
        />
        <SummaryCard
          label="Average"
          value={formatCurrency(summary.average, symbol)}
          icon={ArrowDownCircle}
          accent="primary"
          delay={0.15}
        />
        <SummaryCard
          label="Highest"
          value={formatCurrency(summary.highest, symbol)}
          icon={ArrowUpCircle}
          accent="success"
          delay={0.2}
        />
      </div>

      {/* Income vs Expense context */}
      <div className="mt-3 px-5">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Income Overview</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Income</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.total, symbol)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recurring Active</span>
              <span className="font-semibold">
                {enabledRecurring.length} {enabledRecurring.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Chart */}
      {breakdown.length > 0 && (
        <div className="mt-4 px-5">
          <div className="glass-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Income Breakdown</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {breakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
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
            <div className="mt-3 space-y-2">
              {breakdown.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span>{d.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatCurrency(d.amount, symbol)}
                    </span>
                    <span className="text-xs text-muted-foreground">{d.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recurring Income Section */}
      <div className="mt-4 px-5">
        <div className="glass-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Recurring Income</h3>
            </div>
            <Button size="sm" variant="outline" onClick={handleNewRecurring} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
          {recurringIncomes && recurringIncomes.length > 0 ? (
            <RecurringIncomeList
              recurringIncomes={recurringIncomes}
              onEdit={handleEditRecurring}
              onToggle={handleRecurringToggle}
            />
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No recurring income set up. Create one to auto-generate income each month.
            </p>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mt-4 space-y-3 px-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search income..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="lastmonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest Amount</SelectItem>
              <SelectItem value="lowest">Lowest Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Income History */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between px-5">
          <h3 className="text-sm font-semibold">Income History</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1 text-muted-foreground"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        {filteredIncomes.length === 0 ? (
          <div className="px-5">
            <div className="glass-card">
              <EmptyState
                icon={Banknote}
                title={search || filterBy !== 'all' ? 'No matching income' : 'No income yet'}
                description={
                  search || filterBy !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Tap Add to record your first income.'
                }
                action={
                  !search && filterBy === 'all' ? (
                    <Button size="sm" onClick={handleAdd} className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      Add Income
                    </Button>
                  ) : undefined
                }
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 px-5">
            <AnimatePresence>
              {filteredIncomes.map((income, i) => {
                const color = getCategoryColor(income.category);
                return (
                  <motion.div
                    key={income.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}1a` }}
                      >
                        <Banknote className="h-5 w-5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {income.category}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(income.date)}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(income.amount, symbol)}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {income.source && (
                            <span className="truncate">{income.source}</span>
                          )}
                          {income.account && (
                            <>
                              <span>·</span>
                              <span className="truncate">{income.account}</span>
                            </>
                          )}
                          {income.recurringId && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Repeat className="h-3 w-3" />
                                Auto
                              </span>
                            </>
                          )}
                        </div>
                        {income.notes && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {income.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          onClick={() => handleEdit(income)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setDeleteId(income.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-500/10"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Income Form Dialog */}
      <IncomeFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        monthId={currentMonth}
        editingIncome={editingIncome}
      />

      {/* Recurring Income Dialog */}
      <RecurringIncomeDialog
        open={showRecurring}
        onOpenChange={setShowRecurring}
        recurringIncomes={recurringIncomes}
        editing={editingRecurring}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
