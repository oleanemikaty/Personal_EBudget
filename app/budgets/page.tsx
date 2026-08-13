'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMonth } from '@/hooks/use-month';
import { useSettings } from '@/hooks/use-settings';
import { useGroups, useSubBudgetsByMonth, useTransactions } from '@/hooks/use-data';
import {
  createGroup,
  updateGroup,
  deleteGroup,
  duplicateGroup,
  reorderGroups,
  createSubBudget,
  updateSubBudget,
  deleteSubBudget,
  duplicateSubBudget,
  reorderSubBudgets,
  saveTemplateToMonth,
} from '@/lib/data';
import { getCurrencySymbol, formatCurrency } from '@/lib/format';
import { getColor, COLORS, colorStyle, isHexColor, normalizeHex } from '@/lib/colors';
import {
  computeSummary,
  getStatusBadgeClass,
  getStatusText,
  getProgressColor,
  getProgressGradient,
  getProgressLabel,
} from '@/lib/budget';
import type { BudgetGroup, SubBudget } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { MonthSelector } from '@/components/month-selector';
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
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  Save,
  Check,
  Palette,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CurrencyInput } from '@/components/currency-input';
import { GROUP_ICONS, SUB_ICONS } from '@/lib/icons';

export default function BudgetsPage() {
  const { currentMonth } = useMonth();
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);
  const groups = useGroups(currentMonth);
  const subBudgets = useSubBudgetsByMonth(currentMonth);
  const transactions = useTransactions(currentMonth);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupDialog, setGroupDialog] = useState<{
    open: boolean;
    editId?: string;
  }>({ open: false });
  const [subDialog, setSubDialog] = useState<{
    open: boolean;
    groupId?: string;
    editId?: string;
  }>({ open: false });

  const spendingMap = useMemo(() => {
    if (!transactions) return {};
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense' && t.subBudgetId) {
        map[t.subBudgetId] = (map[t.subBudgetId] || 0) + t.amount;
      }
    }
    return map;
  }, [transactions]);

  const groupSpending = useMemo(() => {
    if (!subBudgets || !transactions) return {};
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense' && t.groupId) {
        map[t.groupId] = (map[t.groupId] || 0) + t.amount;
      }
    }
    return map;
  }, [subBudgets, transactions]);

  if (!groups || !subBudgets) {
    return (
      <div>
        <PageHeader title="Budgets" right={<MonthSelector />} />
        <div className="px-5">
          <div className="glass-card h-20 animate-pulse" />
        </div>
      </div>
    );
  }

  const moveGroup = async (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= groups.length) return;
    const ordered = [...groups];
    [ordered[index], ordered[newIndex]] = [ordered[newIndex], ordered[index]];
    await reorderGroups(currentMonth, ordered.map((g) => g.id));
  };

  const moveSub = async (groupId: string, subs: SubBudget[], index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= subs.length) return;
    const ordered = [...subs];
    [ordered[index], ordered[newIndex]] = [ordered[newIndex], ordered[index]];
    await reorderSubBudgets(groupId, ordered.map((s) => s.id));
  };

  return (
    <div className="pb-4">
      <PageHeader
        title="Budgets"
        subtitle="Manage your budget groups and sub-budgets"
        right={<MonthSelector />}
      />

      <div className="px-5">
        <Button
          onClick={() => setGroupDialog({ open: true })}
          className="w-full"
          size="lg"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          New Budget Group
        </Button>
      </div>

      {/* Responsive grid: 1 col mobile, 2 col tablet, 3-4 col desktop */}
      <div className="mt-4 grid grid-cols-1 gap-3 px-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {groups.map((group, gi) => {
            const subs = subBudgets.filter((s) => s.groupId === group.id);
            const budget = subs.reduce((sum, s) => sum + s.budget, 0);
            const used = groupSpending[group.id] || 0;
            const summary = computeSummary(budget, used);
            const isExpanded = expandedGroup === group.id;
            const c = getColor(group.color);
            const isCustomColor = group.color.startsWith('#');
            const barStyle = colorStyle(group.color, 'bar');
            const iconBgStyle = isCustomColor ? colorStyle(group.color, 'bg') : undefined;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveGroup(gi, -1)}
                        disabled={gi === 0}
                        className="text-muted-foreground disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveGroup(gi, 1)}
                        disabled={gi === groups.length - 1}
                        className="text-muted-foreground disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl text-lg',
                        !isCustomColor && c.bg
                      )}
                      style={iconBgStyle}
                    >
                      {group.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(used, symbol)} / {formatCurrency(budget, symbol)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        getStatusBadgeClass(summary.status)
                      )}
                    >
                      {getStatusText(summary.status)}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className={cn('h-full rounded-full', !isCustomColor && c.bar)}
                      style={barStyle}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(summary.progress, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedGroup(isExpanded ? null : group.id)
                      }
                    >
                      {subs.length} sub-budgets
                      {isExpanded ? (
                        <ChevronUp className="ml-1 h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSubDialog({ open: true, groupId: group.id })
                      }
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add
                    </Button>
                    <div className="ml-auto flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setGroupDialog({ open: true, editId: group.id })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async () => {
                          await duplicateGroup(group.id, currentMonth);
                          toast.success('Budget group duplicated');
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-red-500"
                        onClick={async () => {
                          await deleteGroup(group.id);
                          toast.success('Budget group deleted');
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50"
                    >
                      {subs.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground">
                          No sub-budgets yet. Tap Add to create one.
                        </p>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {subs.map((sub, si) => {
                            const subUsed = spendingMap[sub.id] || 0;
                            const subSummary = computeSummary(sub.budget, subUsed);
                            const progressColor = getProgressColor(subSummary.progress);
                            return (
                              <div key={sub.id} className="px-4 py-3">
                                {/* Sub-budget header row */}
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => moveSub(group.id, subs, si, -1)}
                                      disabled={si === 0}
                                      className="text-muted-foreground disabled:opacity-30"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => moveSub(group.id, subs, si, 1)}
                                      disabled={si === subs.length - 1}
                                      className="text-muted-foreground disabled:opacity-30"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <span className="text-base">{sub.icon}</span>
                                  <p className="flex-1 text-sm font-medium">{sub.name}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      setSubDialog({
                                        open: true,
                                        groupId: group.id,
                                        editId: sub.id,
                                      })
                                    }
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:text-red-500"
                                    onClick={async () => {
                                      await deleteSubBudget(sub.id);
                                      toast.success('Sub-budget deleted');
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Budget / Used / Remaining grid */}
                                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                  <div className="rounded-lg bg-muted/50 py-1.5">
                                    <p className="text-[10px] text-muted-foreground">Budget</p>
                                    <p className="text-xs font-semibold">
                                      {formatCurrency(sub.budget, symbol)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 py-1.5">
                                    <p className="text-[10px] text-muted-foreground">Used</p>
                                    <p className="text-xs font-semibold">
                                      {formatCurrency(subUsed, symbol)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 py-1.5">
                                    <p className="text-[10px] text-muted-foreground">Remaining</p>
                                    <p
                                      className="text-xs font-semibold"
                                      style={{ color: progressColor }}
                                    >
                                      {formatCurrency(subSummary.remaining, symbol)}
                                    </p>
                                  </div>
                                </div>

                                {/* Progress bar with dynamic color */}
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{
                                        background: getProgressGradient(subSummary.progress),
                                      }}
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${Math.min(subSummary.progress, 100)}%`,
                                      }}
                                      transition={{ duration: 0.5 }}
                                    />
                                  </div>
                                  <span
                                    className="text-[10px] font-medium"
                                    style={{ color: progressColor }}
                                  >
                                    {getProgressLabel(subSummary.progress)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {groups.length === 0 && (
        <EmptyState
          icon={FolderPlus}
          title="No budget groups yet"
          description="Create your first budget group to start tracking spending."
        />
      )}

      {groups.length > 0 && (
        <div className="mt-6 px-5">
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await saveTemplateToMonth(currentMonth);
              toast.success('Budget saved as template for future months');
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Monthly Template
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            The template is used to create new months automatically
          </p>
        </div>
      )}

      <GroupDialog
        open={groupDialog.open}
        editId={groupDialog.editId}
        monthId={currentMonth}
        groups={groups}
        onClose={() => setGroupDialog({ open: false })}
      />

      <SubDialog
        open={subDialog.open}
        groupId={subDialog.groupId}
        editId={subDialog.editId}
        monthId={currentMonth}
        subBudgets={subBudgets}
        onClose={() => setSubDialog({ open: false })}
      />
    </div>
  );
}

function GroupDialog({
  open,
  editId,
  monthId,
  groups,
  onClose,
}: {
  open: boolean;
  editId?: string;
  monthId: string;
  groups: BudgetGroup[];
  onClose: () => void;
}) {
  const editing = editId ? groups.find((g) => g.id === editId) : undefined;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏠');
  const [color, setColor] = useState('blue');
  const [customColor, setCustomColor] = useState('#3b82f6');

  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setIcon(editing?.icon || '🏠');
      if (editing?.color.startsWith('#')) {
        setColor('custom');
        setCustomColor(editing.color);
      } else {
        setColor(editing?.color || 'blue');
      }
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim()) return;
    const colorValue = color === 'custom' ? customColor : color;
    if (editId) {
      await updateGroup(editId, { name, icon, color: colorValue });
      toast.success('Budget group updated');
    } else {
      await createGroup({
        monthId,
        name,
        icon,
        color: colorValue,
        order: groups.length,
      });
      toast.success('Budget group created');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit Budget Group' : 'New Budget Group'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Icon</Label>
            <div className="mt-2 grid grid-cols-7 gap-1.5 sm:grid-cols-8">
              {GROUP_ICONS.map((ic) => (
                <motion.button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors',
                    icon === ic
                      ? 'bg-primary/15 ring-2 ring-primary'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {ic}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label>Choose Color</Label>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-7">
              {COLORS.map((c) => {
                const selected = color === c.key;
                return (
                  <motion.button
                    key={c.key}
                    onClick={() => setColor(c.key)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-full transition-all',
                      selected && 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                    )}
                    style={colorStyle(c.key, 'solid')}
                    aria-label={c.label}
                  >
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
            {/* Custom color picker */}
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="relative h-9 w-9 shrink-0">
                <button
                  onClick={() => setColor('custom')}
                  className={cn(
                    'h-9 w-9 rounded-full transition-all ring-offset-2 ring-offset-background',
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
                  className="absolute inset-0 h-9 w-9 cursor-pointer opacity-0"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Custom Color</p>
                <p className="text-xs text-muted-foreground">Pick any color you want</p>
              </div>
              {color === 'custom' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Check className="h-5 w-5 text-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Label htmlFor="custom-hex" className="sr-only">Custom hex color</Label>
              <Input
                id="custom-hex"
                value={customColor}
                onChange={(event) => {
                  const value = event.target.value;
                  setCustomColor(value);
                  if (isHexColor(value)) setColor('custom');
                }}
                onBlur={() => setCustomColor(normalizeHex(customColor))}
                placeholder="#3b82f6"
                className="font-mono uppercase"
                maxLength={7}
              />
              <span className="shrink-0 text-xs text-muted-foreground">HEX</span>
            </div>
          </div>
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home Bills"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editId ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubDialog({
  open,
  groupId,
  editId,
  monthId,
  subBudgets,
  onClose,
}: {
  open: boolean;
  groupId?: string;
  editId?: string;
  monthId: string;
  subBudgets: SubBudget[];
  onClose: () => void;
}) {
  const editing = editId ? subBudgets.find((s) => s.id === editId) : undefined;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💡');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setIcon(editing?.icon || '💡');
      setBudget(editing?.budget ? String(editing.budget) : '');
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim() || !groupId) return;
    const budgetNum = parseInt(budget, 10) || 0;
    if (editId) {
      await updateSubBudget(editId, { name, icon, budget: budgetNum });
      toast.success('Sub-budget updated');
    } else {
      const existing = subBudgets.filter((s) => s.groupId === groupId);
      await createSubBudget({
        groupId,
        monthId,
        name,
        icon,
        order: existing.length,
        budget: budgetNum,
      });
      toast.success('Sub-budget created');
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit Sub-Budget' : 'New Sub-Budget'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Icon</Label>
            <div className="mt-2 grid grid-cols-7 gap-1.5 sm:grid-cols-8">
              {SUB_ICONS.map((ic) => (
                <motion.button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-colors',
                    icon === ic
                      ? 'bg-primary/15 ring-2 ring-primary'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {ic}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electricity"
              autoFocus
            />
          </div>
          <div>
            <Label>Monthly Budget</Label>
            <CurrencyInput
              value={budget}
              onChange={(raw) => setBudget(raw)}
              placeholder="0"
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editId ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
