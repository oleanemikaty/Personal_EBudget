'use client';

import { useState, useMemo } from 'react';
import { useMonth } from '@/hooks/use-month';
import { useGroups, useSubBudgetsByMonth, useTransactions, useIncomes } from '@/hooks/use-data';
import { useSettings } from '@/hooks/use-settings';
import { deleteTransaction, createIncome, deleteIncome } from '@/lib/data';
import { getCurrencySymbol, formatCurrency, formatDateShort, todayISO, monthKey } from '@/lib/format';
import { getColor } from '@/lib/colors';
import type { Transaction } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { TransactionItem } from '@/components/transaction-item';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Receipt, Calendar as CalendarIcon, List, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { currentMonth } = useMonth();
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);
  const groups = useGroups(currentMonth);
  const subBudgets = useSubBudgetsByMonth(currentMonth);
  const transactions = useTransactions(currentMonth);
  const incomes = useIncomes(currentMonth);

  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    let result = [...transactions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const sub = subBudgets?.find((s) => s.id === t.subBudgetId);
        const grp = groups?.find((g) => g.id === t.groupId);
        return (
          t.notes?.toLowerCase().includes(q) ||
          String(t.amount).includes(q) ||
          t.date.includes(q) ||
          sub?.name.toLowerCase().includes(q) ||
          grp?.name.toLowerCase().includes(q)
        );
      });
    }
    if (filterGroup !== 'all') {
      result = result.filter((t) => t.groupId === filterGroup);
    }
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [transactions, search, filterGroup, subBudgets, groups]);

  const groupedByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const t of filtered) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const calendarDays = useMemo(() => {
    if (!currentMonth) return [];
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${currentMonth}-${String(d).padStart(2, '0')}`);
    }
    return days;
  }, [currentMonth]);

  const spendingByDate = useMemo(() => {
    if (!transactions) return {};
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense') {
        map[t.date] = (map[t.date] || 0) + t.amount;
      }
    }
    return map;
  }, [transactions]);

  if (!groups || !subBudgets || !transactions) {
    return (
      <div>
        <PageHeader title="Transactions" />
        <div className="px-5">
          <div className="glass-card h-20 animate-pulse" />
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    toast.success('Transaction deleted');
  };

  const selectedDateTransactions = selectedDate
    ? transactions.filter((t) => t.date === selectedDate)
    : [];

  return (
    <div className="pb-4">
      <PageHeader title="Transactions" subtitle={`${filtered.length} items`} />

      <div className="px-5">
        <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
          <TabsList className="w-full">
            <TabsTrigger value="list" className="flex-1 gap-1.5">
              <List className="h-3.5 w-3.5" /> List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" /> Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'list' ? (
        <>
          <div className="mt-3 space-y-2 px-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="pl-9"
              />
            </div>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.icon} {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No transactions found"
                description="Adjust your search or add a new transaction."
              />
            ) : (
              groupedByDate.map(([date, items]) => (
                <div key={date} className="mb-3">
                  <p className="px-5 py-1 text-xs font-medium text-muted-foreground">
                    {formatDateShort(date)}
                  </p>
                  <div className="glass-card mx-5 overflow-hidden">
                    {items.map((t, i) => {
                      const group = groups.find((g) => g.id === t.groupId);
                      const sub = subBudgets.find((s) => s.id === t.subBudgetId);
                      return (
                        <TransactionItem
                          key={t.id}
                          transaction={t}
                          group={group}
                          subBudget={sub}
                          symbol={symbol}
                          index={i}
                          onDelete={handleDelete}
                        />
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="mt-3 px-5">
          <div className="glass-card p-4">
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const dayNum = parseInt(day.split('-')[2]);
                const spent = spendingByDate[day] || 0;
                const isSelected = selectedDate === day;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : spent > 0
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {dayNum}
                    {spent > 0 && !isSelected && (
                      <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Sheet
            open={!!selectedDate}
            onOpenChange={(v) => !v && setSelectedDate(null)}
          >
            <SheetContent side="bottom" className="max-h-[70vh]">
              <SheetHeader>
                <SheetTitle>
                  {selectedDate ? formatDateShort(selectedDate) : ''}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="mt-4 max-h-[50vh]">
                {selectedDateTransactions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No transactions on this day
                  </p>
                ) : (
                  <div className="divide-y divide-border/50">
                    {selectedDateTransactions.map((t, i) => {
                      const group = groups.find((g) => g.id === t.groupId);
                      const sub = subBudgets.find((s) => s.id === t.subBudgetId);
                      return (
                        <TransactionItem
                          key={t.id}
                          transaction={t}
                          group={group}
                          subBudget={sub}
                          symbol={symbol}
                          index={i}
                          onDelete={handleDelete}
                        />
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
