'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGoals } from '@/hooks/use-data';
import { useSettings } from '@/hooks/use-settings';
import { createGoal, updateGoal, deleteGoal } from '@/lib/data';
import { getCurrencySymbol, formatCurrency, formatDate } from '@/lib/format';
import { getColor, COLORS } from '@/lib/colors';
import { GOAL_ICONS } from '@/lib/icons';
import { CurrencyInput } from '@/components/currency-input';
import type { SavingsGoal } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Pencil, Trash2, Minus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function GoalsPage() {
  const goals = useGoals();
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);

  const [dialog, setDialog] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [contributeDialog, setContributeDialog] = useState<{
    open: boolean;
    goal?: SavingsGoal;
  }>({ open: false });

  if (!goals) {
    return (
      <div>
        <PageHeader title="Savings Goals" />
        <div className="px-5">
          <div className="glass-card h-20 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        title="Savings Goals"
        subtitle="Track your progress toward financial goals"
      />

      <div className="px-5">
        <Button
          onClick={() => setDialog({ open: true })}
          className="w-full"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      <div className="mt-4 space-y-3 px-5">
        <AnimatePresence>
          {goals.map((goal, i) => {
            const c = getColor(goal.color);
            const progress =
              goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const isComplete = progress >= 100;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl text-2xl',
                      c.bg
                    )}
                  >
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{goal.name}</p>
                      {isComplete && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" /> Complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(goal.currentAmount, symbol)} of{' '}
                      {formatCurrency(goal.targetAmount, symbol)}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDialog({ open: true, editId: goal.id })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-red-500"
                      onClick={async () => {
                        await deleteGoal(goal.id);
                        toast.success('Goal deleted');
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 + 0.1 }}
                    className={cn('h-full rounded-full', c.bar)}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {progress.toFixed(0)}% complete
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      isComplete
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    )}
                  >
                    {isComplete
                      ? 'Goal reached!'
                      : `${formatCurrency(remaining, symbol)} to go`}
                  </span>
                </div>

                {goal.targetDate && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Target: {formatDate(goal.targetDate)}
                  </p>
                )}

                {!isComplete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setContributeDialog({ open: true, goal })}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Funds
                  </Button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {goals.length === 0 && (
          <EmptyState
            icon={Target}
            title="No savings goals yet"
            description="Create a goal to start tracking your savings progress."
          />
        )}
      </div>

      <GoalDialog
        open={dialog.open}
        editId={dialog.editId}
        goals={goals}
        onClose={() => setDialog({ open: false })}
      />

      <ContributeDialog
        open={contributeDialog.open}
        goal={contributeDialog.goal}
        symbol={symbol}
        onClose={() => setContributeDialog({ open: false })}
      />
    </div>
  );
}

function GoalDialog({
  open,
  editId,
  goals,
  onClose,
}: {
  open: boolean;
  editId?: string;
  goals: SavingsGoal[];
  onClose: () => void;
}) {
  const editing = editId ? goals.find((g) => g.id === editId) : undefined;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('blue');
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setIcon(editing?.icon || '🎯');
      if (editing?.color.startsWith('#')) {
        setColor('custom');
        setCustomColor(editing.color);
      } else {
        setColor(editing?.color || 'blue');
      }
      setTargetAmount(editing?.targetAmount ? String(editing.targetAmount) : '');
      setCurrentAmount(editing?.currentAmount ? String(editing.currentAmount) : '');
      setTargetDate(editing?.targetDate || '');
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim() || !targetAmount) return;
    const target = parseInt(targetAmount, 10) || 0;
    const current = parseInt(currentAmount, 10) || 0;
    const colorValue = color === 'custom' ? customColor : color;
    if (editId) {
      await updateGoal(editId, {
        name,
        icon,
        color: colorValue,
        targetAmount: target,
        currentAmount: current,
        targetDate: targetDate || undefined,
      });
      toast.success('Goal updated');
    } else {
      await createGoal({
        name,
        icon,
        color: colorValue,
        targetAmount: target,
        currentAmount: current,
        targetDate: targetDate || undefined,
      });
      toast.success('Goal created');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit Goal' : 'New Savings Goal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Icon</Label>
            <ScrollArea className="h-20 w-full whitespace-nowrap rounded-md">
              <div className="flex gap-1 p-1">
                {GOAL_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors',
                      icon === ic
                        ? 'bg-primary/15 ring-2 ring-primary'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setColor(c.key)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-transform',
                    c.solid,
                    color === c.key && 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                  )}
                  aria-label={c.label}
                />
              ))}
              {/* Custom color picker */}
              <div className="relative h-8 w-8">
                <button
                  onClick={() => setColor('custom')}
                  className={cn(
                    'h-8 w-8 rounded-full transition-transform ring-offset-2 ring-offset-background',
                    color === 'custom' && 'ring-2 ring-foreground'
                  )}
                  style={{ backgroundColor: customColor }}
                  aria-label="Custom color"
                />
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setColor('custom');
                  }}
                  className="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Goal Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target Amount</Label>
              <CurrencyInput
                value={targetAmount}
                onChange={(raw) => setTargetAmount(raw)}
                placeholder="0"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Current Amount</Label>
              <CurrencyInput
                value={currentAmount}
                onChange={(raw) => setCurrentAmount(raw)}
                placeholder="0"
                className="mt-2"
              />
            </div>
          </div>
          <div>
            <Label>Target Date (optional)</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !targetAmount}>
            {editId ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContributeDialog({
  open,
  goal,
  symbol,
  onClose,
}: {
  open: boolean;
  goal?: SavingsGoal;
  symbol: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) setAmount('');
  }, [open]);

  const handleAdd = async (isWithdraw: boolean) => {
    if (!goal || !amount) return;
    const amt = parseInt(amount, 10) || 0;
    const newAmount = isWithdraw
      ? Math.max(0, goal.currentAmount - amt)
      : goal.currentAmount + amt;
    await updateGoal(goal.id, { currentAmount: newAmount });
    toast.success(isWithdraw ? 'Withdrawn from goal' : 'Added to goal');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {goal?.icon} {goal?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Current: {formatCurrency(goal?.currentAmount || 0, symbol)}</Label>
          </div>
          <div>
            <Label>Amount</Label>
            <CurrencyInput
              value={amount}
              onChange={(raw) => setAmount(raw)}
              placeholder="0"
              className="mt-2"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleAdd(true)} disabled={!amount}>
            <Minus className="mr-1 h-4 w-4" />
            Withdraw
          </Button>
          <Button onClick={() => handleAdd(false)} disabled={!amount}>
            <Plus className="mr-1 h-4 w-4" />
            Add Funds
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
