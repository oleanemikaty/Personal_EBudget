'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createRecurringIncome,
  updateRecurringIncome,
  deleteRecurringIncome,
} from '@/lib/data';
import { todayISO } from '@/lib/format';
import { FREQUENCY_OPTIONS } from '@/lib/income';
import { useIncomeCategories, useIncomeAccounts } from '@/hooks/use-data';
import type { RecurringIncome, RecurringFrequency } from '@/lib/types';
import { toast } from 'sonner';
import { Check, Trash2, Repeat, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RecurringIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringIncomes: RecurringIncome[] | undefined;
  editing?: RecurringIncome | null;
}

export function RecurringIncomeDialog({
  open,
  onOpenChange,
  recurringIncomes,
  editing,
}: RecurringIncomeDialogProps) {
  const categories = useIncomeCategories();
  const accounts = useIncomeAccounts();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('25');
  const [startDate, setStartDate] = useState(todayISO());
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (open && editing) {
      setName(editing.name);
      setAmount(String(editing.amount));
      setSource(editing.source);
      setCategory(editing.category);
      setAccount(editing.account);
      setFrequency(editing.frequency);
      setDayOfMonth(String(editing.dayOfMonth));
      setStartDate(editing.startDate);
      setEnabled(editing.enabled);
    } else if (open && !editing) {
      setName('');
      setAmount('');
      setSource('');
      setCategory(categories?.[0]?.name || 'Salary');
      setAccount(accounts?.[0]?.name || 'Cash');
      setFrequency('monthly');
      setDayOfMonth('25');
      setStartDate(todayISO());
      setEnabled(true);
    }
  }, [open, editing, categories, accounts]);

  const canSave = useMemo(() => {
    const amt = parseInt(amount, 10);
    return amt > 0 && !!name.trim() && !!category && !!account;
  }, [amount, name, category, account]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        amount: parseInt(amount, 10),
        source: source.trim(),
        category,
        account,
        frequency,
        dayOfMonth: parseInt(dayOfMonth, 10) || 25,
        startDate,
        enabled,
      };
      if (editing) {
        await updateRecurringIncome(editing.id, data);
        toast.success('Recurring income updated');
      } else {
        await createRecurringIncome(data);
        toast.success('Recurring income created');
      }
      onOpenChange(false);
    } catch {
      toast.error('Failed to save recurring income');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRecurringIncome(deleteId);
      toast.success('Recurring income deleted');
    } catch {
      toast.error('Failed to delete');
    }
    setDeleteId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              {editing ? 'Edit Recurring Income' : 'New Recurring Income'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly Salary"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Amount</Label>
              <div className="mt-2 glass-card p-4 text-center">
                <CurrencyInput
                  value={amount}
                  onChange={(raw) => setAmount(raw)}
                  large
                />
              </div>
            </div>

            <div>
              <Label>Income Source</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Main Salary"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account</Label>
                <Select value={account} onValueChange={setAccount}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((a) => (
                      <SelectItem key={a.id} value={a.name}>
                        {a.icon} {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as RecurringFrequency)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">
                  Auto-generate income each period
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {editing && (
              <Button
                variant="destructive"
                onClick={() => setDeleteId(editing.id)}
                className="mr-auto gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
              <Check className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Income?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop automatic income generation. Existing income records will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function RecurringIncomeList({
  recurringIncomes,
  onEdit,
  onToggle,
}: {
  recurringIncomes: RecurringIncome[];
  onEdit: (r: RecurringIncome) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {recurringIncomes.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card flex items-center gap-3 p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Repeat className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.frequency} · day {r.dayOfMonth}
                {!r.enabled && ' · Disabled'}
              </p>
            </div>
            <Switch
              checked={r.enabled}
              onCheckedChange={(v) => onToggle(r.id, v)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(r)}
              className="h-8 px-2"
            >
              Edit
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
