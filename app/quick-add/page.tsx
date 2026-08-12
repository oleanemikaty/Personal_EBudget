'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMonth } from '@/hooks/use-month';
import { useGroups, useSubBudgetsByMonth, useIncomeCategories, useIncomeAccounts } from '@/hooks/use-data';
import { useSettings } from '@/hooks/use-settings';
import { createTransaction, createIncome } from '@/lib/data';
import { getCurrencySymbol, formatCurrency, todayISO } from '@/lib/format';
import { getColor } from '@/lib/colors';
import type { TransactionType, PaymentMethod } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Check, Wallet, CreditCard, Landmark, Smartphone, Coins, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CurrencyInput } from '@/components/currency-input';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'bank', label: 'Bank', icon: Landmark },
  { value: 'ewallet', label: 'E-Wallet', icon: Smartphone },
  { value: 'other', label: 'Other', icon: Coins },
];

export default function QuickAddPage() {
  const router = useRouter();
  const { currentMonth, ready } = useMonth();
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);
  const groups = useGroups(currentMonth);
  const subBudgets = useSubBudgetsByMonth(currentMonth);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('Salary');
  const [incomeAccount, setIncomeAccount] = useState('Cash');
  const incomeCategories = useIncomeCategories();
  const incomeAccounts = useIncomeAccounts();

  const availableSubs = useMemo(() => {
    if (!subBudgets || !selectedGroup) return [];
    return subBudgets.filter((s) => s.groupId === selectedGroup);
  }, [subBudgets, selectedGroup]);

  // Auto-select first sub when group changes
  useEffect(() => {
    if (availableSubs.length > 0 && !availableSubs.find((s) => s.id === selectedSub)) {
      setSelectedSub(availableSubs[0].id);
    }
  }, [availableSubs, selectedSub]);

  const canSave = useMemo(() => {
    if (!amount || parseInt(amount, 10) <= 0) return false;
    if (type === 'expense') return !!selectedGroup && !!selectedSub;
    return !!incomeSource.trim() && !!incomeCategory && !!incomeAccount;
  }, [amount, type, selectedGroup, selectedSub, incomeSource, incomeCategory, incomeAccount]);

  const handleSave = async () => {
    if (!canSave || !currentMonth) return;
    setSaving(true);
    const amt = parseInt(amount, 10);

    if (type === 'income') {
      await createIncome({
        monthId: currentMonth,
        date,
        amount: amt,
        source: incomeSource.trim(),
        category: incomeCategory,
        account: incomeAccount,
        notes,
      });
    } else {
      await createTransaction({
        monthId: currentMonth,
        type,
        groupId: selectedGroup,
        subBudgetId: selectedSub,
        amount: amt,
        date,
        paymentMethod,
        notes,
      });
    }

    toast.success(type === 'income' ? 'Income added' : 'Transaction added');
    setSaving(false);
    router.push('/');
  };

  if (!ready || !groups || !subBudgets) {
    return (
      <div>
        <PageHeader title="Quick Add" />
        <div className="px-5">
          <div className="glass-card h-40 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <button
          onClick={() => router.push('/')}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold">Quick Add</h1>
        <div className="w-9" />
      </div>

      {/* Type Toggle */}
      <div className="px-5">
        <div className="flex gap-2">
          <button
            onClick={() => setType('expense')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors',
              type === 'expense'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            Expense
          </button>
          <button
            onClick={() => setType('income')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors',
              type === 'income'
                ? 'bg-emerald-500 text-white'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Income
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mt-6 px-5">
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Amount</p>
          <div className="mt-2">
            <CurrencyInput
              value={amount}
              onChange={(raw) => setAmount(raw)}
              large
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Income Fields */}
      {type === 'income' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 space-y-4 px-5"
        >
          <div>
            <Label>Income Source</Label>
            <Input
              value={incomeSource}
              onChange={(e) => setIncomeSource(e.target.value)}
              placeholder="e.g. Main Salary"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={incomeCategory} onValueChange={setIncomeCategory}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {incomeCategories?.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Method / Account</Label>
            <Select value={incomeAccount} onValueChange={setIncomeAccount}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {incomeAccounts?.map((a) => (
                  <SelectItem key={a.id} value={a.name}>
                    {a.icon} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}

      {/* Expense Fields */}
      {type === 'expense' && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-4 px-5"
          >
            {groups.length === 0 ? (
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No budget groups yet. Create one in the Budgets tab first.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label>Budget Group</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {groups.map((g) => {
                      const c = getColor(g.color);
                      return (
                        <button
                          key={g.id}
                          onClick={() => {
                            setSelectedGroup(g.id);
                            setSelectedSub('');
                          }}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all',
                            selectedGroup === g.id
                              ? cn('border-primary', c.bg, 'ring-2 ring-primary/20')
                              : 'border-border bg-muted/50'
                          )}
                        >
                          <span className="text-xl">{g.icon}</span>
                          <span className="truncate text-[10px] font-medium">
                            {g.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {availableSubs.length > 0 && (
                  <div>
                    <Label>Sub-Budget</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableSubs.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSub(s.id)}
                          className={cn(
                            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                            selectedSub === s.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-muted/50 text-muted-foreground'
                          )}
                        >
                          <span>{s.icon}</span>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Payment Method</Label>
                  <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-none">
                    {PAYMENT_METHODS.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.value}
                          onClick={() => setPaymentMethod(m.value)}
                          className={cn(
                            'flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 transition-all',
                            paymentMethod === m.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-muted/50 text-muted-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px]">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Date & Notes */}
      <div className="mt-4 space-y-4 px-5">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            className="mt-2"
            rows={2}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center px-5">
        <div className="w-full max-w-md">
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            size="lg"
            className="w-full gap-2 shadow-lg"
          >
            <Check className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
