'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createIncome, updateIncome } from '@/lib/data';
import { todayISO } from '@/lib/format';
import { INCOME_SOURCE_SUGGESTIONS } from '@/lib/income';
import { useIncomeCategories, useIncomeAccounts } from '@/hooks/use-data';
import type { IncomeEntry } from '@/lib/types';
import { toast } from 'sonner';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncomeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthId: string;
  editingIncome?: IncomeEntry | null;
  onSaved?: () => void;
}

export function IncomeFormDialog({
  open,
  onOpenChange,
  monthId,
  editingIncome,
  onSaved,
}: IncomeFormDialogProps) {
  const categories = useIncomeCategories();
  const accounts = useIncomeAccounts();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (open && editingIncome) {
      setAmount(String(editingIncome.amount));
      setDate(editingIncome.date);
      setSource(editingIncome.source || '');
      setCategory(editingIncome.category || '');
      setAccount(editingIncome.account || '');
      setNotes(editingIncome.notes || '');
    } else if (open && !editingIncome) {
      setAmount('');
      setDate(todayISO());
      setSource('');
      setCategory(categories?.[0]?.name || 'Salary');
      setAccount(accounts?.[0]?.name || 'Cash');
      setNotes('');
    }
  }, [open, editingIncome, categories, accounts]);

  const canSave = useMemo(() => {
    const amt = parseInt(amount, 10);
    return amt > 0 && !!source.trim() && !!category && !!account;
  }, [amount, source, category, account]);

  const handleSave = async () => {
    const amt = parseInt(amount, 10);
    if (!Number.isFinite(amt) || amt <= 0) {
      setValidationError('Enter an amount greater than 0.');
      return;
    }
    if (!source.trim()) {
      setValidationError('Income Source is required.');
      return;
    }
    if (!category) {
      setValidationError('Select an Income Category.');
      return;
    }
    if (!account) {
      setValidationError('Select a Payment Method / Account.');
      return;
    }
    if (!monthId) return;
    setValidationError('');
    setSaving(true);
    try {
      if (editingIncome) {
        await updateIncome(editingIncome.id, {
          amount: amt,
          date,
          source: source.trim(),
          category,
          account,
          notes: notes.trim(),
        });
        toast.success('Income updated');
      } else {
        await createIncome({
          monthId,
          date,
          amount: amt,
          source: source.trim(),
          category,
          account,
          notes: notes.trim(),
        });
        toast.success('Income added');
      }
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error('Failed to save income');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingIncome ? 'Edit Income' : 'Add Income'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <Label>Amount</Label>
            <div className="mt-2 glass-card p-4 text-center">
              <CurrencyInput
                value={amount}
                onChange={(raw) => setAmount(raw)}
                large
                autoFocus
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Income Source */}
          <div className="relative">
            <Label>Income Source</Label>
            <Input
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setShowSourceSuggestions(true);
              }}
              onFocus={() => setShowSourceSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSourceSuggestions(false), 200)}
              placeholder="e.g. Main Salary"
              className="mt-2"
            />
            {showSourceSuggestions && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md">
                {INCOME_SOURCE_SUGGESTIONS
                  .filter((s) => s.toLowerCase().includes(source.toLowerCase()))
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSource(s);
                        setShowSourceSuggestions(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <Label>Income Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select category" />
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

          {/* Payment Method / Account */}
          <div>
            <Label>Payment Method / Account</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select account" />
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

          {/* Notes */}
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

        {validationError && (
          <p className="text-sm text-destructive" role="alert">{validationError}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
            <Check className="h-4 w-4" />
            {saving ? 'Saving...' : editingIncome ? 'Update' : 'Add Income'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
