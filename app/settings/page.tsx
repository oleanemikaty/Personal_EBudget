'use client';

import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { useMonth } from '@/hooks/use-month';
import {
  setSetting, exportAllData, importData, ensureMonth, listMonths,
  listIncomeCategories, listIncomeAccounts, createIncomeCategory, createIncomeAccount,
  deleteIncomeCategory, deleteIncomeAccount, clearTemplate,
} from '@/lib/data';
import { exportToExcel } from '@/lib/excel-export';
import { CURRENCIES, getCurrencySymbol, monthKey, nextMonthKey, monthLabel } from '@/lib/format';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Moon,
  Sun,
  Laptop,
  DollarSign,
  Download,
  Upload,
  Lock,
  Calendar,
  Globe,
  Palette,
  Database,
  ChevronRight,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { BudgetMonth } from '@/lib/types';

export default function SettingsPage() {
  const settings = useSettings();
  const { currentMonth } = useMonth();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [pinDialog, setPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [months, setMonths] = useState<BudgetMonth[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<{ id: string; name: string }[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<{ id: string; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [clearTemplateDialog, setClearTemplateDialog] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshIncomeOptions = async () => {
    const [categories, accounts] = await Promise.all([listIncomeCategories(), listIncomeAccounts()]);
    setIncomeCategories(categories);
    setIncomeAccounts(accounts);
  };

  useEffect(() => {
    setMounted(true);
    listMonths().then(setMonths);
    refreshIncomeOptions();
  }, []);

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name || incomeCategories.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    await createIncomeCategory({ name, icon: 'wallet', color: '#64748b', isCustom: true });
    setNewCategory('');
    await refreshIncomeOptions();
  };

  const addAccount = async () => {
    const name = newAccount.trim();
    if (!name || incomeAccounts.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    await createIncomeAccount({ name, icon: 'wallet', isCustom: true });
    setNewAccount('');
    await refreshIncomeOptions();
  };

  const handleCurrencyChange = async (value: string) => {
    await setSetting('currency', value);
    toast.success('Currency updated');
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    setSetting('theme', value);
  };

  const handlePinToggle = async (enabled: boolean) => {
    if (enabled) {
      setPinDialog(true);
    } else {
      await setSetting('pinEnabled', 'false');
      await setSetting('pin', '');
      toast.success('PIN lock disabled');
    }
  };

  const handleSavePin = async () => {
    if (pin.length < 4) return;
    await setSetting('pinEnabled', 'true');
    await setSetting('pin', pin);
    setPin('');
    setPinDialog(false);
    toast.success('PIN lock enabled');
  };

  const handleExport = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const handleExportExcel = async () => {
    try {
      const key = monthKey();
      await exportToExcel(key);
      toast.success('Excel report exported');
    } catch {
      toast.error('Failed to export Excel');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await importData(text);
      toast.success('Data imported successfully');
    } catch {
      toast.error('Failed to import data');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCreateNextMonth = async () => {
    const source = currentMonth || monthKey();
    const next = nextMonthKey(source);
    const existing = months.some((month) => month.id === next);
    await ensureMonth(next);
    setMonths(await listMonths());
    toast.success(existing ? `${monthLabel(next)} already exists` : `${monthLabel(next)} created from template`);
  };

  const handleClearTemplate = async () => {
    if (!window.confirm('Clear the monthly template? Existing months will not change.')) return;
    await clearTemplate();
    toast.success('Monthly template cleared');
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Laptop },
  ];

  return (
    <div className="pb-4">
      <PageHeader title="Settings" subtitle="Customize your budget manager" />

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <div className="px-4 py-3">
          <Label>Theme</Label>
          <div className="mt-2 flex gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 transition-all',
              mounted && theme === opt.value
                ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Currency & Language */}
      <Section title="Preferences" icon={Globe}>
        <div className="px-4 py-3">
          <Label>Currency</Label>
          <Select value={settings.currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="border-t border-border/50 px-4 py-3">
          <Label>Language</Label>
          <Select value={settings.language} onValueChange={(v) => setSetting('language', v)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Lock}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium">PIN Lock</p>
            <p className="text-xs text-muted-foreground">Require a PIN to open the app</p>
          </div>
          <Switch
            checked={settings.pinEnabled === 'true'}
            onCheckedChange={handlePinToggle}
          />
        </div>
        <div className="border-t border-border/50 px-4 py-3">
          <Label>Auto Lock (seconds)</Label>
          <Select
            value={settings.autoLock}
            onValueChange={(v) => setSetting('autoLock', v)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
              <SelectItem value="0">Never</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* Months */}
      <Section title="Budget Months" icon={Calendar}>
        <div className="px-4 py-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Each month keeps independent data. New months are created from your template.
          </p>
          <div className="space-y-1">
            {months.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="font-medium">{monthLabel(m.id)}</span>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleCreateNextMonth}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Create Next Month
            </Button>
            <Button variant="ghost" size="sm" className="mt-2 w-full text-destructive" onClick={handleClearTemplate}>
              Clear Monthly Template
            </Button>
          </div>
        </Section>

        {/* Income options */}
      <Section title="Income Options" icon={DollarSign}>
        <div className="flex flex-col gap-4 p-4">
          <OptionManager label="Categories" value={newCategory} onChange={setNewCategory} onAdd={addCategory} items={incomeCategories} onDelete={async (id) => { await deleteIncomeCategory(id); await refreshIncomeOptions(); }} />
          <OptionManager label="Accounts" value={newAccount} onChange={setNewAccount} onAdd={addAccount} items={incomeAccounts} onDelete={async (id) => { await deleteIncomeAccount(id); await refreshIncomeOptions(); }} />
        </div>
      </Section>

      {/* Data */}
      <Section title="Data Management" icon={Database}>
        <div className="space-y-2 p-4">
          <Button variant="outline" className="w-full justify-start" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export / Backup Data
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import / Restore Data
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </Section>

      <p className="mt-6 px-5 text-center text-xs text-muted-foreground">
        Budget — Personal Finance Manager
        <br />
        Your data is stored locally on this device.
      </p>

      {/* PIN Dialog */}
      <Dialog open={pinDialog} onOpenChange={(v) => !v && setPinDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set PIN Lock</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter a 4-digit PIN to protect your financial data.
            </p>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em]"
              maxLength={4}
              inputMode="numeric"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePin} disabled={pin.length < 4}>
              Save PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OptionManager({
  label, value, onChange, onAdd, items, onDelete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  items: { id: string; name: string }[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Add ${label === 'Categories' ? 'category' : 'account'}`} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAdd(); } }} />
        <Button type="button" onClick={onAdd} disabled={!value.trim()}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button key={item.id} type="button" className="rounded-full bg-muted px-3 py-1 text-xs" onClick={() => onDelete(item.id)} title={`Delete ${item.name}`}>
            {item.name} ×
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Moon;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 px-5"
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      </div>
      <div className="glass-card overflow-hidden">{children}</div>
    </motion.div>
  );
}
